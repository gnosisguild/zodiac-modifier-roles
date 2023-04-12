import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { BigNumberish } from "ethers";

import {
  BYTES32_ZERO,
  deployRolesMod,
  encodeMultisendPayload,
  ExecutionOptions,
  PermissionCheckerStatus,
} from "./utils";

enum Operation {
  Call = 0,
  DelegateCall,
}

const ROLE_KEY =
  "0x00000000000000000000000000000000000000000000000000000000000012ff";

const NEXT_STORAGE_VALUE = 9876;

async function setup() {
  const Avatar = await hre.ethers.getContractFactory("TestAvatar");
  const avatar = await Avatar.deploy();

  const TestContract = await hre.ethers.getContractFactory("TestContract");
  const testContract = await TestContract.deploy();

  const [owner, invoker] = await hre.ethers.getSigners();

  const roles = await deployRolesMod(
    hre,
    owner.address,
    avatar.address,
    avatar.address
  );

  const MultiSend = await hre.ethers.getContractFactory("MultiSend");
  const multisend = await MultiSend.deploy();

  const MultiSendUnwrapper = await hre.ethers.getContractFactory(
    "MultiSendUnwrapper"
  );
  const adapter = await MultiSendUnwrapper.deploy();

  await roles
    .connect(owner)
    .setTransactionUnwrapper(multisend.address, "0x8d80ff0a", adapter.address);

  await roles.enableModule(invoker.address);

  await roles.connect(owner).assignRoles(invoker.address, [ROLE_KEY], [true]);
  await roles.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);

  const multisendCallData = (
    await multisend.populateTransaction.multiSend(
      encodeMultisendPayload([
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
}

describe("Multi Entrypoint", async () => {
  it("reverts immediately if unwrapper reverts", async () => {
    const { invoker, roles, multisend } = await loadFixture(setup);

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
    ).to.be.revertedWithCustomError(roles, "MalformedMultiEntrypoint");
  });

  it("reverts if first transaction check is not authorized", async () => {
    const {
      owner,
      invoker,
      roles,
      multisend,
      testContract,
      multisendCallData,
    } = await loadFixture(setup);

    const selector = testContract.interface.getSighash(
      testContract.interface.getFunction("doNothing")
    );

    await roles.connect(owner).scopeTarget(ROLE_KEY, testContract.address);
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
    )
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.FunctionNotAllowed,
        selector.padEnd(66, "0")
      );
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
    } = await loadFixture(setup);

    await roles.connect(owner).scopeTarget(ROLE_KEY, testContract.address);

    await roles
      .connect(owner)
      .allowFunction(
        ROLE_KEY,
        testContract.address,
        testContract.interface.getSighash(
          testContract.interface.getFunction("doNothing")
        ),
        ExecutionOptions.None
      );

    await roles
      .connect(owner)
      .allowFunction(
        ROLE_KEY,
        testContract.address,
        testContract.interface.getSighash(
          testContract.interface.getFunction("doEvenLess")
        ),
        ExecutionOptions.None
      );

    const selector = testContract.interface.getSighash(
      testContract.interface.getFunction("setAStorageNumber")
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
    )
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.FunctionNotAllowed,
        selector.padEnd(66, "0")
      );
    expect(await testContract.aStorageNumber()).to.equal(0);
  });

  it("succeeds for one transaction", async () => {
    const { owner, invoker, roles, multisend, testContract } =
      await loadFixture(setup);

    await roles.connect(owner).scopeTarget(ROLE_KEY, testContract.address);

    await roles
      .connect(owner)
      .allowFunction(
        ROLE_KEY,
        testContract.address,
        testContract.interface.getSighash(
          testContract.interface.getFunction("setAStorageNumber")
        ),
        ExecutionOptions.None
      );

    const multisendCallData = (
      await multisend.populateTransaction.multiSend(
        encodeMultisendPayload([
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
    )
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.TargetAddressNotAllowed, BYTES32_ZERO);
  });

  it("succeeds for multiple transactions", async () => {
    const {
      owner,
      invoker,
      roles,
      multisend,
      testContract,
      multisendCallData,
    } = await loadFixture(setup);

    await roles.connect(owner).scopeTarget(ROLE_KEY, testContract.address);

    await roles
      .connect(owner)
      .allowFunction(
        ROLE_KEY,
        testContract.address,
        testContract.interface.getSighash(
          testContract.interface.getFunction("doNothing")
        ),
        ExecutionOptions.None
      );

    await roles
      .connect(owner)
      .allowFunction(
        ROLE_KEY,
        testContract.address,
        testContract.interface.getSighash(
          testContract.interface.getFunction("doEvenLess")
        ),
        ExecutionOptions.None
      );

    await roles
      .connect(owner)
      .allowFunction(
        ROLE_KEY,
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
