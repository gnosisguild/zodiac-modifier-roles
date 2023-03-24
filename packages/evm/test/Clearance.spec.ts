import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { ExecutionOptions } from "./utils";

describe("Clearance", async () => {
  const ROLE_KEY =
    "0x0000000000000000000000000000000000000000000000000000000000000001";

  async function setup() {
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();
    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();
    const testContractClone = await TestContract.deploy();

    const [owner, invoker] = await hre.ethers.getSigners();

    const Modifier = await hre.ethers.getContractFactory("Roles");
    const modifier = await Modifier.deploy(
      owner.address,
      avatar.address,
      avatar.address
    );

    await modifier.enableModule(invoker.address);

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_KEY], [true]);
    await modifier.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);

    return {
      testContract,
      testContractClone,
      modifier,
      owner,
      invoker,
    };
  }

  it("allows and then disallows a target", async () => {
    const { modifier, testContract, invoker, owner } = await loadFixture(setup);

    const { data } = await testContract.populateTransaction.doNothing();

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContract.address, 0, data as string, 0)
    ).to.be.revertedWithCustomError(modifier, "TargetAddressNotAllowed");

    await modifier
      .connect(owner)
      .allowTarget(ROLE_KEY, testContract.address, ExecutionOptions.None);

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContract.address, 0, data as string, 0)
    ).to.not.be.reverted;

    await modifier.connect(owner).revokeTarget(ROLE_KEY, testContract.address);

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContract.address, 0, data as string, 0)
    ).to.be.revertedWithCustomError(modifier, "TargetAddressNotAllowed");
  });

  it("allowing a target does not allow other targets", async () => {
    const { modifier, testContract, testContractClone, owner, invoker } =
      await loadFixture(setup);

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_KEY], [true]);

    await modifier
      .connect(owner)
      .allowTarget(ROLE_KEY, testContract.address, ExecutionOptions.None);

    const { data } = await testContract.populateTransaction.doNothing();

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContract.address, 0, data as string, 0)
    ).to.not.be.reverted;

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContractClone.address,
          0,
          data as string,
          0
        )
    ).to.be.revertedWithCustomError(modifier, "TargetAddressNotAllowed");
  });

  it("allows and then disallows a function", async () => {
    const { modifier, testContract, owner, invoker } = await loadFixture(setup);

    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("doNothing")
    );

    await modifier.connect(owner).scopeTarget(ROLE_KEY, testContract.address);

    await modifier
      .connect(owner)
      .allowFunction(
        ROLE_KEY,
        testContract.address,
        SELECTOR,
        ExecutionOptions.None
      );

    const { data } = await testContract.populateTransaction.doNothing();

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContract.address, 0, data as string, 0)
    ).to.not.be.reverted;

    await modifier
      .connect(owner)
      .revokeFunction(ROLE_KEY, testContract.address, SELECTOR);

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContract.address, 0, data as string, 0)
    ).to.be.revertedWithCustomError(modifier, "FunctionNotAllowed");
  });
  it("allowing function on a target does not allow same function on diff target", async () => {
    const { modifier, testContract, testContractClone, owner, invoker } =
      await loadFixture(setup);

    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("doNothing")
    );

    await modifier.connect(owner).scopeTarget(ROLE_KEY, testContract.address);

    await modifier
      .connect(owner)
      .allowFunction(
        ROLE_KEY,
        testContract.address,
        SELECTOR,
        ExecutionOptions.None
      );

    const { data } = await testContract.populateTransaction.doNothing();

    // should work on testContract
    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContract.address, 0, data as string, 0)
    ).to.not.be.reverted;

    // but fail on the clone
    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContractClone.address,
          0,
          data as string,
          0
        )
    ).to.be.revertedWithCustomError(modifier, "TargetAddressNotAllowed");
  });
  it("allowing a function tightens a previously allowed target", async () => {
    const { modifier, testContract, owner, invoker } = await loadFixture(setup);

    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("doNothing")
    );

    await modifier
      .connect(owner)
      .allowTarget(ROLE_KEY, testContract.address, ExecutionOptions.None);

    const { data: dataDoNothing } =
      await testContract.populateTransaction.doNothing();
    const { data: dataDoEvenLess } =
      await testContract.populateTransaction.doEvenLess();

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          dataDoEvenLess as string,
          0
        )
    ).to.not.be.reverted;

    await modifier.connect(owner).scopeTarget(ROLE_KEY, testContract.address);

    await modifier
      .connect(owner)
      .allowFunction(
        ROLE_KEY,
        testContract.address,
        SELECTOR,
        ExecutionOptions.None
      );

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          dataDoNothing as string,
          0
        )
    ).to.not.be.reverted;

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          dataDoEvenLess as string,
          0
        )
    ).to.be.revertedWithCustomError(modifier, "FunctionNotAllowed");
  });

  it("allowing a target loosens a previously allowed function", async () => {
    const { modifier, testContract, owner, invoker } = await loadFixture(setup);

    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("doNothing")
    );
    const { data: dataDoNothing } =
      await testContract.populateTransaction.doNothing();
    const { data: dataDoEvenLess } =
      await testContract.populateTransaction.doEvenLess();

    await modifier.connect(owner).scopeTarget(ROLE_KEY, testContract.address);

    await modifier
      .connect(owner)
      .allowFunction(
        ROLE_KEY,
        testContract.address,
        SELECTOR,
        ExecutionOptions.None
      );

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          dataDoNothing as string,
          0
        )
    ).to.not.be.reverted;

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          dataDoEvenLess as string,
          0
        )
    ).to.be.revertedWithCustomError(modifier, "FunctionNotAllowed");

    await modifier
      .connect(owner)
      .allowTarget(ROLE_KEY, testContract.address, ExecutionOptions.None);

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          dataDoEvenLess as string,
          0
        )
    ).to.emit(testContract, "DoEvenLess");
  });

  it("disallowing one function does not impact other function allowances", async () => {
    const { modifier, testContract, owner, invoker } = await loadFixture(setup);

    const SEL_DONOTHING = testContract.interface.getSighash(
      testContract.interface.getFunction("doNothing")
    );
    const SEL_DOEVENLESS = testContract.interface.getSighash(
      testContract.interface.getFunction("doEvenLess")
    );
    const { data: dataDoNothing } =
      await testContract.populateTransaction.doNothing();
    const { data: dataDoEvenLess } =
      await testContract.populateTransaction.doEvenLess();

    await modifier.connect(owner).scopeTarget(ROLE_KEY, testContract.address);

    await modifier
      .connect(owner)
      .allowFunction(
        ROLE_KEY,
        testContract.address,
        SEL_DONOTHING,
        ExecutionOptions.None
      );

    await modifier
      .connect(owner)
      .allowFunction(
        ROLE_KEY,
        testContract.address,
        SEL_DOEVENLESS,
        ExecutionOptions.None
      );

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          dataDoNothing as string,
          0
        )
    ).to.not.be.reverted;

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          dataDoEvenLess as string,
          0
        )
    ).to.not.be.reverted;

    await modifier
      .connect(owner)
      .revokeFunction(ROLE_KEY, testContract.address, SEL_DOEVENLESS);

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          dataDoNothing as string,
          0
        )
    ).to.not.be.reverted;

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          dataDoEvenLess as string,
          0
        )
    ).to.be.revertedWithCustomError(modifier, "FunctionNotAllowed");
  });
});
