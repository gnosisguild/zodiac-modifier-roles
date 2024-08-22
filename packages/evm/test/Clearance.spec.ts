import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import {
  BYTES32_ZERO,
  deployRolesMod,
  ExecutionOptions,
  PermissionCheckerStatus,
} from "./utils";

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
    const avatarAddress = await avatar.getAddress();
    const modifier = await deployRolesMod(
      hre,
      owner.address,
      avatarAddress,
      avatarAddress
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

    const { data } = await testContract.doNothing.populateTransaction();
    const testContractAddress = await testContract.getAddress();
    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContractAddress, 0, data as string, 0)
    )
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.TargetAddressNotAllowed, BYTES32_ZERO);

    await modifier
      .connect(owner)
      .allowTarget(ROLE_KEY, testContractAddress, ExecutionOptions.None);

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContractAddress, 0, data as string, 0)
    ).to.not.be.reverted;

    await modifier.connect(owner).revokeTarget(ROLE_KEY, testContractAddress);

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContractAddress, 0, data as string, 0)
    )
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.TargetAddressNotAllowed, BYTES32_ZERO);
  });

  it("allowing a target does not allow other targets", async () => {
    const { modifier, testContract, testContractClone, owner, invoker } =
      await loadFixture(setup);
    const testContractAddress = await testContract.getAddress();
    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_KEY], [true]);

    await modifier
      .connect(owner)
      .allowTarget(ROLE_KEY, testContractAddress, ExecutionOptions.None);

    const { data } = await testContract.doNothing.populateTransaction();

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContractAddress, 0, data as string, 0)
    ).to.not.be.reverted;

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          await testContractClone.getAddress(),
          0,
          data as string,
          0
        )
    )
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.TargetAddressNotAllowed, BYTES32_ZERO);
  });

  it("allows and then disallows a function", async () => {
    const { modifier, testContract, owner, invoker } = await loadFixture(setup);
    const testContractAddress = await testContract.getAddress();
    const SELECTOR = testContract.interface.getFunction("doNothing").selector;

    await modifier.connect(owner).scopeTarget(ROLE_KEY, testContractAddress);

    await modifier
      .connect(owner)
      .allowFunction(
        ROLE_KEY,
        testContractAddress,
        SELECTOR,
        ExecutionOptions.None
      );

    const { data } = await testContract.doNothing.populateTransaction();

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContractAddress, 0, data as string, 0)
    ).to.not.be.reverted;

    await modifier
      .connect(owner)
      .revokeFunction(ROLE_KEY, testContractAddress, SELECTOR);

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContractAddress, 0, data as string, 0)
    )
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.FunctionNotAllowed,
        SELECTOR.padEnd(66, "0")
      );
  });
  it("allowing function on a target does not allow same function on diff target", async () => {
    const { modifier, testContract, testContractClone, owner, invoker } =
      await loadFixture(setup);
    const testContractAddress = await testContract.getAddress();
    const SELECTOR = testContract.interface.getFunction("doNothing").selector;

    await modifier.connect(owner).scopeTarget(ROLE_KEY, testContractAddress);

    await modifier
      .connect(owner)
      .allowFunction(
        ROLE_KEY,
        testContractAddress,
        SELECTOR,
        ExecutionOptions.None
      );

    const { data } = await testContract.doNothing.populateTransaction();

    // should work on testContract
    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContractAddress, 0, data as string, 0)
    ).to.not.be.reverted;

    // but fail on the clone
    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          await testContractClone.getAddress(),
          0,
          data as string,
          0
        )
    )
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.TargetAddressNotAllowed, BYTES32_ZERO);
  });
  it("allowing a function tightens a previously allowed target", async () => {
    const { modifier, testContract, owner, invoker } = await loadFixture(setup);
    const testContractAddress = await testContract.getAddress();
    const selectorDoNothing =
      testContract.interface.getFunction("doNothing").selector;
    const selectorDoEvenLess =
      testContract.interface.getFunction("doEvenLess").selector;

    await modifier
      .connect(owner)
      .allowTarget(ROLE_KEY, testContractAddress, ExecutionOptions.None);

    const { data: dataDoNothing } =
      await testContract.doNothing.populateTransaction();
    const { data: dataDoEvenLess } =
      await testContract.doEvenLess.populateTransaction();

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContractAddress,
          0,
          dataDoEvenLess as string,
          0
        )
    ).to.not.be.reverted;

    await modifier.connect(owner).scopeTarget(ROLE_KEY, testContractAddress);

    await modifier
      .connect(owner)
      .allowFunction(
        ROLE_KEY,
        testContractAddress,
        selectorDoNothing,
        ExecutionOptions.None
      );

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContractAddress,
          0,
          dataDoNothing as string,
          0
        )
    ).to.not.be.reverted;

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContractAddress,
          0,
          dataDoEvenLess as string,
          0
        )
    )
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.FunctionNotAllowed,
        selectorDoEvenLess.padEnd(66, "0")
      );
  });

  it("allowing a target loosens a previously allowed function", async () => {
    const { modifier, testContract, owner, invoker } = await loadFixture(setup);
    const testContractAddress = await testContract.getAddress();
    const SELECTOR1 = testContract.interface.getFunction("doNothing").selector;

    const SELECTOR2 = testContract.interface.getFunction("doEvenLess").selector;

    const { data: dataDoNothing } =
      await testContract.doNothing.populateTransaction();
    const { data: dataDoEvenLess } =
      await testContract.doEvenLess.populateTransaction();

    await modifier.connect(owner).scopeTarget(ROLE_KEY, testContractAddress);

    await modifier
      .connect(owner)
      .allowFunction(
        ROLE_KEY,
        testContractAddress,
        SELECTOR1,
        ExecutionOptions.None
      );

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContractAddress,
          0,
          dataDoNothing as string,
          0
        )
    ).to.not.be.reverted;

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContractAddress,
          0,
          dataDoEvenLess as string,
          0
        )
    )
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.FunctionNotAllowed,
        SELECTOR2.padEnd(66, "0")
      );

    await modifier
      .connect(owner)
      .allowTarget(ROLE_KEY, testContractAddress, ExecutionOptions.None);

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContractAddress,
          0,
          dataDoEvenLess as string,
          0
        )
    ).to.emit(testContract, "DoEvenLess");
  });

  it("disallowing one function does not impact other function allowances", async () => {
    const { modifier, testContract, owner, invoker } = await loadFixture(setup);
    const testContractAddress = await testContract.getAddress();
    const selector1 = testContract.interface.getFunction("doNothing").selector;
    const selector2 = testContract.interface.getFunction("doEvenLess").selector;
    const { data: dataDoNothing } =
      await testContract.doNothing.populateTransaction();
    const { data: dataDoEvenLess } =
      await testContract.doEvenLess.populateTransaction();

    await modifier.connect(owner).scopeTarget(ROLE_KEY, testContractAddress);

    await modifier
      .connect(owner)
      .allowFunction(
        ROLE_KEY,
        testContractAddress,
        selector1,
        ExecutionOptions.None
      );

    await modifier
      .connect(owner)
      .allowFunction(
        ROLE_KEY,
        testContractAddress,
        selector2,
        ExecutionOptions.None
      );

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContractAddress,
          0,
          dataDoNothing as string,
          0
        )
    ).to.not.be.reverted;

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContractAddress,
          0,
          dataDoEvenLess as string,
          0
        )
    ).to.not.be.reverted;

    await modifier
      .connect(owner)
      .revokeFunction(ROLE_KEY, testContractAddress, selector2);

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContractAddress,
          0,
          dataDoNothing as string,
          0
        )
    ).to.not.be.reverted;

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContractAddress,
          0,
          dataDoEvenLess as string,
          0
        )
    )
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.FunctionNotAllowed,
        selector2.padEnd(66, "0")
      );
  });
});
