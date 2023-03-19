import "@nomiclabs/hardhat-ethers";

import { expect } from "chai";
import { BigNumberish } from "ethers";
import { solidityPack } from "ethers/lib/utils";
import hre, { deployments, waffle } from "hardhat";

import { ExecutionOptions } from "./utils";

enum Operation {
  Call = 0,
  DelegateCall,
}

describe("Multi Entrypoint", async () => {
  const NEXT_STORAGE_VALUE = 9876;
  const ROLE_ID = 2345;

  const setup = deployments.createFixture(async () => {
    await deployments.fixture();
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();

    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();

    const [owner, invoker] = waffle.provider.getWallets();

    const Roles = await hre.ethers.getContractFactory("Roles");
    const roles = await Roles.deploy(
      owner.address,
      avatar.address,
      avatar.address
    );

    const MultiSend = await hre.ethers.getContractFactory("MultiSend");
    const multisend = await MultiSend.deploy();

    const MultiSendAdapter = await hre.ethers.getContractFactory(
      "MultiSendAdapter"
    );
    const adapter = await MultiSendAdapter.deploy();

    await roles
      .connect(owner)
      .setTransactionUnwrapper(
        multisend.address,
        "0x8d80ff0a",
        adapter.address
      );

    await roles.enableModule(invoker.address);

    await roles.connect(owner).assignRoles(invoker.address, [ROLE_ID], [true]);
    await roles.connect(owner).setDefaultRole(invoker.address, ROLE_ID);

    const multisendCallData = (
      await multisend.populateTransaction.multiSend(
        multisendPayload([
          {
            to: testContract.address,
            value: 0,
            data: (
              await testContract.populateTransaction.doNothing()
            ).data as string,
            operation: Operation.Call,
          },
          {
            to: testContract.address,
            value: 0,
            data: (
              await testContract.populateTransaction.doEvenLess()
            ).data as string,
            operation: Operation.Call,
          },
          {
            to: testContract.address,
            value: 0,
            data: (
              await testContract.populateTransaction.setAStorageNumber(
                NEXT_STORAGE_VALUE
              )
            ).data as string,
            operation: Operation.Call,
          },
        ])
      )
    ).data as string;

    return {
      adapter,
      multisend,
      testContract,
      roles,
      owner,
      invoker,
      multisendCallData,
    };
  });

  it("reverts immediately if unwrapper reverts", async () => {
    const { invoker, roles, multisend } = await setup();

    const { data } = await multisend.populateTransaction.multiSend("0x");

    await expect(
      roles
        .connect(invoker)
        .execTransactionFromModule(
          multisend.address,
          0,
          data as string,
          Operation.DelegateCall
        )
    ).to.be.revertedWith("MalformedMultiEntrypoint()");
  });

  it("reverts if first transaction check is not authorized", async () => {
    const {
      owner,
      invoker,
      roles,
      multisend,
      testContract,
      multisendCallData,
    } = await setup();

    await roles.connect(owner).scopeTarget(ROLE_ID, testContract.address);

    expect(await testContract.aStorageNumber()).to.equal(0);
    await expect(
      roles
        .connect(invoker)
        .execTransactionFromModule(
          multisend.address,
          0,
          multisendCallData,
          Operation.DelegateCall
        )
    ).to.be.revertedWith("FunctionNotAllowed()");
    expect(await testContract.aStorageNumber()).to.equal(0);
  });

  it("reverts if last transaction check is not authorized", async () => {
    const {
      owner,
      invoker,
      roles,
      multisend,
      testContract,
      multisendCallData,
    } = await setup();

    await roles.connect(owner).scopeTarget(ROLE_ID, testContract.address);

    await roles
      .connect(owner)
      .allowFunction(
        ROLE_ID,
        testContract.address,
        testContract.interface.getSighash(
          testContract.interface.getFunction("doNothing")
        ),
        ExecutionOptions.None
      );

    await roles
      .connect(owner)
      .allowFunction(
        ROLE_ID,
        testContract.address,
        testContract.interface.getSighash(
          testContract.interface.getFunction("doEvenLess")
        ),
        ExecutionOptions.None
      );

    expect(await testContract.aStorageNumber()).to.equal(0);
    await expect(
      roles
        .connect(invoker)
        .execTransactionFromModule(
          multisend.address,
          0,
          multisendCallData,
          Operation.DelegateCall
        )
    ).to.be.revertedWith("FunctionNotAllowed()");
    expect(await testContract.aStorageNumber()).to.equal(0);
  });

  it("succeeds for one transaction", async () => {
    const { owner, invoker, roles, multisend, testContract } = await setup();

    await roles.connect(owner).scopeTarget(ROLE_ID, testContract.address);

    await roles
      .connect(owner)
      .allowFunction(
        ROLE_ID,
        testContract.address,
        testContract.interface.getSighash(
          testContract.interface.getFunction("setAStorageNumber")
        ),
        ExecutionOptions.None
      );

    const multisendCallData = (
      await multisend.populateTransaction.multiSend(
        multisendPayload([
          {
            to: testContract.address,
            value: 0,
            data: (
              await testContract.populateTransaction.setAStorageNumber(
                NEXT_STORAGE_VALUE
              )
            ).data as string,
            operation: Operation.Call,
          },
        ])
      )
    ).data as string;

    expect(await testContract.aStorageNumber()).to.equal(0);
    await expect(
      roles
        .connect(invoker)
        .execTransactionFromModule(
          multisend.address,
          0,
          multisendCallData,
          Operation.DelegateCall
        )
    ).to.not.be.reverted;
    expect(await testContract.aStorageNumber()).to.equal(NEXT_STORAGE_VALUE);

    // removing the unwrap adapter should result in address not Authorized
    await roles
      .connect(owner)
      .setTransactionUnwrapper(
        multisend.address,
        "0x8d80ff0a",
        "0x0000000000000000000000000000000000000000"
      );
    await expect(
      roles
        .connect(invoker)
        .execTransactionFromModule(
          multisend.address,
          0,
          multisendCallData,
          Operation.DelegateCall
        )
    ).to.be.revertedWith("TargetAddressNotAllowed()");
  });

  it("succeeds for multiple transactions", async () => {
    const {
      owner,
      invoker,
      roles,
      multisend,
      testContract,
      multisendCallData,
    } = await setup();

    await roles.connect(owner).scopeTarget(ROLE_ID, testContract.address);

    await roles
      .connect(owner)
      .allowFunction(
        ROLE_ID,
        testContract.address,
        testContract.interface.getSighash(
          testContract.interface.getFunction("doNothing")
        ),
        ExecutionOptions.None
      );

    await roles
      .connect(owner)
      .allowFunction(
        ROLE_ID,
        testContract.address,
        testContract.interface.getSighash(
          testContract.interface.getFunction("doEvenLess")
        ),
        ExecutionOptions.None
      );

    await roles
      .connect(owner)
      .allowFunction(
        ROLE_ID,
        testContract.address,
        testContract.interface.getSighash(
          testContract.interface.getFunction("setAStorageNumber")
        ),
        ExecutionOptions.None
      );

    expect(await testContract.aStorageNumber()).to.equal(0);
    await expect(
      roles
        .connect(invoker)
        .execTransactionFromModule(
          multisend.address,
          0,
          multisendCallData,
          Operation.DelegateCall
        )
    ).to.not.be.reverted;
    expect(await testContract.aStorageNumber()).to.equal(NEXT_STORAGE_VALUE);
  });
});

interface MetaTransaction {
  to: string;
  value: BigNumberish;
  data: string;
  operation: number;
}

const multisendPayload = (txs: MetaTransaction[]): string => {
  return (
    "0x" +
    txs
      .map((tx) =>
        solidityPack(
          ["uint8", "address", "uint256", "uint256", "bytes"],
          [tx.operation, tx.to, tx.value, (tx.data.length - 2) / 2, tx.data]
        ).slice(2)
      )
      .join("")
  );
};
