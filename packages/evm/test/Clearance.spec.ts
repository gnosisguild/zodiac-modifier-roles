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

    const modifier = await deployRolesMod(
      hre,
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
    )
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.TargetAddressNotAllowed, BYTES32_ZERO);

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
    )
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.TargetAddressNotAllowed, BYTES32_ZERO);
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
    )
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.TargetAddressNotAllowed, BYTES32_ZERO);
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
    )
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.TargetAddressNotAllowed, BYTES32_ZERO);
  });
  it("allowing a function tightens a previously allowed target", async () => {
    const { modifier, testContract, owner, invoker } = await loadFixture(setup);

    const selectorDoNothing = testContract.interface.getSighash(
      testContract.interface.getFunction("doNothing")
    );
    const selectorDoEvenLess = testContract.interface.getSighash(
      testContract.interface.getFunction("doEvenLess")
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
        selectorDoNothing,
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
    )
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.FunctionNotAllowed,
        selectorDoEvenLess.padEnd(66, "0")
      );
  });

  it("allowing a target loosens a previously allowed function", async () => {
    const { modifier, testContract, owner, invoker } = await loadFixture(setup);

    const SELECTOR1 = testContract.interface.getSighash(
      testContract.interface.getFunction("doNothing")
    );
    const SELECTOR2 = testContract.interface.getSighash(
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
        SELECTOR1,
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
    )
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.FunctionNotAllowed,
        SELECTOR2.padEnd(66, "0")
      );

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

    const selector1 = testContract.interface.getSighash(
      testContract.interface.getFunction("doNothing")
    );
    const selector2 = testContract.interface.getSighash(
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
        selector1,
        ExecutionOptions.None
      );

    await modifier
      .connect(owner)
      .allowFunction(
        ROLE_KEY,
        testContract.address,
        selector2,
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
      .revokeFunction(ROLE_KEY, testContract.address, selector2);

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
    )
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.FunctionNotAllowed,
        selector2.padEnd(66, "0")
      );
  });
});
