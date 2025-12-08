import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder, ZeroHash } from "ethers";

import {
  Encoding,
  ExecutionOptions,
  Operator,
  PermissionCheckerStatus,
} from "./utils";
import { deployRolesMod } from "./setup";

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

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
      avatarAddress,
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
        .execTransactionFromModule(testContractAddress, 0, data as string, 0),
    )
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.TargetAddressNotAllowed, ZeroHash);

    await modifier
      .connect(owner)
      .allowTarget(ROLE_KEY, testContractAddress, [], ExecutionOptions.None);

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContractAddress, 0, data as string, 0),
    ).to.not.be.reverted;

    await modifier.connect(owner).revokeTarget(ROLE_KEY, testContractAddress);

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContractAddress, 0, data as string, 0),
    )
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.TargetAddressNotAllowed, ZeroHash);
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
      .allowTarget(ROLE_KEY, testContractAddress, [], ExecutionOptions.None);

    const { data } = await testContract.doNothing.populateTransaction();

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContractAddress, 0, data as string, 0),
    ).to.not.be.reverted;

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          await testContractClone.getAddress(),
          0,
          data as string,
          0,
        ),
    )
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.TargetAddressNotAllowed, ZeroHash);
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
        ExecutionOptions.None,
      );

    const { data } = await testContract.doNothing.populateTransaction();

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContractAddress, 0, data as string, 0),
    ).to.not.be.reverted;

    await modifier
      .connect(owner)
      .revokeFunction(ROLE_KEY, testContractAddress, SELECTOR);

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContractAddress, 0, data as string, 0),
    )
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.FunctionNotAllowed,
        SELECTOR.padEnd(66, "0"),
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
        ExecutionOptions.None,
      );

    const { data } = await testContract.doNothing.populateTransaction();

    // should work on testContract
    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(testContractAddress, 0, data as string, 0),
    ).to.not.be.reverted;

    // but fail on the clone
    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          await testContractClone.getAddress(),
          0,
          data as string,
          0,
        ),
    )
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.TargetAddressNotAllowed, ZeroHash);
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
      .allowTarget(ROLE_KEY, testContractAddress, [], ExecutionOptions.None);

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
          0,
        ),
    ).to.not.be.reverted;

    await modifier.connect(owner).scopeTarget(ROLE_KEY, testContractAddress);

    await modifier
      .connect(owner)
      .allowFunction(
        ROLE_KEY,
        testContractAddress,
        selectorDoNothing,
        ExecutionOptions.None,
      );

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContractAddress,
          0,
          dataDoNothing as string,
          0,
        ),
    ).to.not.be.reverted;

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContractAddress,
          0,
          dataDoEvenLess as string,
          0,
        ),
    )
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.FunctionNotAllowed,
        selectorDoEvenLess.padEnd(66, "0"),
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
        ExecutionOptions.None,
      );

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContractAddress,
          0,
          dataDoNothing as string,
          0,
        ),
    ).to.not.be.reverted;

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContractAddress,
          0,
          dataDoEvenLess as string,
          0,
        ),
    )
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.FunctionNotAllowed,
        SELECTOR2.padEnd(66, "0"),
      );

    await modifier
      .connect(owner)
      .allowTarget(ROLE_KEY, testContractAddress, [], ExecutionOptions.None);

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContractAddress,
          0,
          dataDoEvenLess as string,
          0,
        ),
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
        ExecutionOptions.None,
      );

    await modifier
      .connect(owner)
      .allowFunction(
        ROLE_KEY,
        testContractAddress,
        selector2,
        ExecutionOptions.None,
      );

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContractAddress,
          0,
          dataDoNothing as string,
          0,
        ),
    ).to.not.be.reverted;

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContractAddress,
          0,
          dataDoEvenLess as string,
          0,
        ),
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
          0,
        ),
    ).to.not.be.reverted;

    await expect(
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContractAddress,
          0,
          dataDoEvenLess as string,
          0,
        ),
    )
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.FunctionNotAllowed,
        selector2.padEnd(66, "0"),
      );
  });

  describe("Clearance.Target with conditions", () => {
    it("allows target with conditions that pass", async () => {
      const { modifier, testContract, invoker, owner } =
        await loadFixture(setup);
      const testContractAddress = await testContract.getAddress();

      // Allow target with a condition: first param must equal 123
      await modifier.connect(owner).allowTarget(
        ROLE_KEY,
        testContractAddress,
        [
          {
            parent: 0,
            paramType: Encoding.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["uint256"], [123]),
          },
        ],
        ExecutionOptions.None,
      );

      const { data: dataPass } =
        await testContract.oneParamStatic.populateTransaction(123);
      const { data: dataFail } =
        await testContract.oneParamStatic.populateTransaction(456);

      // Should pass with correct param
      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContractAddress,
            0,
            dataPass as string,
            0,
          ),
      ).to.not.be.reverted;

      // Should fail with wrong param
      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContractAddress,
            0,
            dataFail as string,
            0,
          ),
      )
        .to.be.revertedWithCustomError(modifier, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.ParameterNotAllowed, ZeroHash);
    });

    it("target conditions apply to all functions", async () => {
      const { modifier, testContract, invoker, owner } =
        await loadFixture(setup);
      const testContractAddress = await testContract.getAddress();

      // Allow target with a condition: first param must equal 123
      await modifier.connect(owner).allowTarget(
        ROLE_KEY,
        testContractAddress,
        [
          {
            parent: 0,
            paramType: Encoding.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["uint256"], [123]),
          },
        ],
        ExecutionOptions.None,
      );

      // Both functions should work with param=123
      const { data: dataOneParam } =
        await testContract.oneParamStatic.populateTransaction(123);
      const { data: dataTwoParams } =
        await testContract.twoParamsStatic.populateTransaction(123, 999);

      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContractAddress,
            0,
            dataOneParam as string,
            0,
          ),
      ).to.not.be.reverted;

      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContractAddress,
            0,
            dataTwoParams as string,
            0,
          ),
      ).to.not.be.reverted;
    });

    it("emits AllowTarget event with conditions", async () => {
      const { modifier, testContract, owner } = await loadFixture(setup);
      const testContractAddress = await testContract.getAddress();

      const conditions = [
        {
          parent: 0,
          paramType: Encoding.Calldata,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["uint256"], [123]),
        },
      ];

      await expect(
        modifier
          .connect(owner)
          .allowTarget(
            ROLE_KEY,
            testContractAddress,
            conditions,
            ExecutionOptions.None,
          ),
      ).to.emit(modifier, "AllowTarget");
    });
  });
});
