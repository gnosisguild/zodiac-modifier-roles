import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { defaultAbiCoder } from "ethers/lib/utils";

import {
  Operator,
  ExecutionOptions,
  ParameterType,
  deployRolesMod,
  PermissionCheckerStatus,
  BYTES32_ZERO,
} from "./utils";

describe("Operator", async () => {
  const ROLE_KEY =
    "0x0000000000000000000000000000000000000000000000000000000000000001";

  async function setup() {
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();

    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();

    const TestEncoder = await hre.ethers.getContractFactory("TestEncoder");
    const testEncoder = await TestEncoder.deploy();

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
      avatar,
      testContract,
      testEncoder,
      modifier,
      owner,
      invoker,
    };
  }

  it("checks operator Or over Static", async () => {
    const { modifier, testContract, owner, invoker } = await loadFixture(setup);

    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithSingleParam")
    );

    const invoke = async (a: number) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (await testContract.populateTransaction.fnWithSingleParam(a))
            .data as string,
          0
        );

    // set it to true
    await modifier.connect(owner).scopeTarget(ROLE_KEY, testContract.address);

    await modifier.connect(owner).scopeFunction(
      ROLE_KEY,
      testContract.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.Calldata,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.None,
          operator: Operator.Or,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["uint256"], [11]),
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["uint256"], [22]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke(11)).to.not.be.reverted;
    await expect(invoke(22)).to.not.be.reverted;
    await expect(invoke(33))
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.OrViolation, BYTES32_ZERO);
  });

  it("checks operator And over Calldata", async () => {
    const { modifier, testContract, owner, invoker } = await loadFixture(setup);

    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithSingleParam")
    );

    const invoke = async (a: number) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (await testContract.populateTransaction.fnWithSingleParam(a))
            .data as string,
          0
        );

    // set it to true
    await modifier.connect(owner).scopeTarget(ROLE_KEY, testContract.address);
    await modifier.connect(owner).scopeFunction(
      ROLE_KEY,
      testContract.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.None,
          operator: Operator.And,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Calldata,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Calldata,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.LessThan,
          compValue: defaultAbiCoder.encode(["uint256"], [50000]),
        },
        {
          parent: 2,
          paramType: ParameterType.Static,
          operator: Operator.GreaterThan,
          compValue: defaultAbiCoder.encode(["uint256"], [40000]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke(60000))
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.ParameterGreaterThanAllowed,
        BYTES32_ZERO
      );

    await expect(invoke(30000))
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, BYTES32_ZERO);

    await expect(invoke(45000)).to.not.be.reverted;
  });

  it("checks operator And over Static", async () => {
    const { modifier, testContract, owner, invoker } = await loadFixture(setup);

    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithSingleParam")
    );

    const invoke = async (a: number) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (await testContract.populateTransaction.fnWithSingleParam(a))
            .data as string,
          0
        );

    // set it to true
    await modifier.connect(owner).scopeTarget(ROLE_KEY, testContract.address);
    await modifier.connect(owner).scopeFunction(
      ROLE_KEY,
      testContract.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.Calldata,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.None,
          operator: Operator.And,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.LessThan,
          compValue: defaultAbiCoder.encode(["uint256"], [50000]),
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.GreaterThan,
          compValue: defaultAbiCoder.encode(["uint256"], [40000]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke(60000))
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.ParameterGreaterThanAllowed,
        BYTES32_ZERO
      );

    await expect(invoke(30000))
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, BYTES32_ZERO);

    await expect(invoke(45000)).to.not.be.reverted;
  });

  it("checks operator Or over Dynamic", async () => {
    const { modifier, testContract, owner, invoker } = await loadFixture(setup);

    const SELECTOR = testContract.interface.getSighash(
      testContract.interface.getFunction("fnWithTwoMixedParams")
    );

    const invoke = async (a: boolean, b: string) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testContract.address,
          0,
          (await testContract.populateTransaction.fnWithTwoMixedParams(a, b))
            .data as string,
          0
        );

    // set it to true
    await modifier.connect(owner).scopeTarget(ROLE_KEY, testContract.address);
    await modifier.connect(owner).scopeFunction(
      ROLE_KEY,
      testContract.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.Calldata,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.None,
          operator: Operator.Or,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: ParameterType.Dynamic,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["string"], ["First String"]),
        },
        {
          parent: 2,
          paramType: ParameterType.Dynamic,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["string"], ["Good Morning!"]),
        },
        {
          parent: 2,
          paramType: ParameterType.Dynamic,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["string"], ["Third String"]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke(true, "First String")).to.not.be.reverted;
    await expect(invoke(false, "First String")).to.not.be.reverted;
    await expect(invoke(true, "Good Morning!")).to.not.be.reverted;
    await expect(invoke(false, "Good Morning!")).to.not.be.reverted;
    await expect(invoke(true, "Third String")).to.not.be.reverted;
    await expect(invoke(false, "Third String")).to.not.be.reverted;

    await expect(invoke(false, "Something else"))
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.OrViolation, BYTES32_ZERO);
  });

  it("checks operator Or over Tuple", async () => {
    const { modifier, testEncoder, owner, invoker } = await loadFixture(setup);

    const addressOne = "0x0000000000000000000000000000000000000123";
    const addressTwo = "0x0000000000000000000000000000000000000cda";

    const SELECTOR = testEncoder.interface.getSighash(
      testEncoder.interface.getFunction("staticTuple")
    );

    const invoke = async (s: any) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testEncoder.address,
          0,
          (await testEncoder.populateTransaction.staticTuple(s, 100))
            .data as string,
          0
        );

    // set it to true
    await modifier.connect(owner).scopeTarget(ROLE_KEY, testEncoder.address);
    await modifier.connect(owner).scopeFunction(
      ROLE_KEY,
      testEncoder.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.Calldata,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.None,
          operator: Operator.Or,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        // first tuple variant
        {
          parent: 2,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["uint256"], [1111]),
        },
        {
          parent: 2,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["address"], [addressOne]),
        },
        // second tuple variant
        {
          parent: 3,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["uint256"], [22222]),
        },
        {
          parent: 3,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["address"], [addressTwo]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke({ a: 1111, b: addressOne })).to.not.be.reverted;

    await expect(invoke({ a: 22222, b: addressTwo })).to.not.be.reverted;

    await expect(invoke({ a: 22222, b: addressOne }))
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.OrViolation, BYTES32_ZERO);

    await expect(
      invoke({ a: 111, b: "0x0000000000000000000000000000000000000000" })
    )
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.OrViolation, BYTES32_ZERO);
  });

  it("checks operator Or over Array", async () => {
    const address1 = "0x0000000000000000000000000000000000000fff";
    const address2 = "0x0000000000000000000000000000000000000123";
    const address3 = "0x0000000000000000000000000000000000000cda";

    const { modifier, testEncoder, owner, invoker } = await loadFixture(setup);
    const SELECTOR = testEncoder.interface.getSighash(
      testEncoder.interface.getFunction("arrayStaticTupleItems")
    );
    const invoke = async (a: any[]) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testEncoder.address,
          0,
          (await testEncoder.populateTransaction.arrayStaticTupleItems(a))
            .data as string,
          0
        );

    // set it to true
    await modifier.connect(owner).scopeTarget(ROLE_KEY, testEncoder.address);
    await modifier.connect(owner).scopeFunction(
      ROLE_KEY,
      testEncoder.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.Calldata,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.None,
          operator: Operator.Or,
          compValue: "0x",
        },
        // first Array 1
        {
          parent: 1,
          paramType: ParameterType.Array,
          operator: Operator.Matches,
          compValue: "0x",
        },
        // second Array 2
        {
          parent: 1,
          paramType: ParameterType.Array,
          operator: Operator.Matches,
          compValue: "0x",
        },
        // first array first element 3
        {
          parent: 2,
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        // first array second element 4
        {
          parent: 2,
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        // second array first element 5
        {
          parent: 3,
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        // tuple first
        {
          parent: 4,
          paramType: ParameterType.Static,
          operator: 0,
          compValue: "0x",
        },
        {
          parent: 4,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["address"], [address1]),
        },
        // tuple second 8
        {
          parent: 5,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["uint256"], [334455]),
        },
        {
          parent: 5,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["address"], [address2]),
        },
        // tuple third 9
        {
          parent: 6,
          paramType: ParameterType.Static,
          operator: 0,
          compValue: "0x",
        },
        {
          parent: 6,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["address"], [address3]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(
      invoke([
        { a: 123, b: address1 },
        { a: 334455, b: address2 },
      ])
    ).to.not.be.reverted;

    await expect(
      invoke([
        { a: 123456, b: address1 },
        { a: 334455, b: address2 },
      ])
    ).to.not.be.reverted;

    await expect(
      invoke([
        { a: 123456, b: address1 },
        { a: 111111, b: address2 },
      ])
    )
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.OrViolation, BYTES32_ZERO);

    await expect(invoke([{ a: 123121212, b: address3 }])).to.not.be.reverted;

    await expect(invoke([]))
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.OrViolation, BYTES32_ZERO);
  });

  it("checks operator Or over static Tuple", async () => {
    const { modifier, testEncoder, owner, invoker } = await loadFixture(setup);

    const addressOne = "0x0000000000000000000000000000000000000123";
    const addressTwo = "0x0000000000000000000000000000000000000cda";

    const SELECTOR = testEncoder.interface.getSighash(
      testEncoder.interface.getFunction("staticTuple")
    );

    const invoke = async (s: any) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testEncoder.address,
          0,
          (await testEncoder.populateTransaction.staticTuple(s, 100))
            .data as string,
          0
        );

    // set it to true
    await modifier.connect(owner).scopeTarget(ROLE_KEY, testEncoder.address);
    await modifier.connect(owner).scopeFunction(
      ROLE_KEY,
      testEncoder.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.Calldata,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.None,
          operator: Operator.Or,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        // first tuple variant
        {
          parent: 2,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["uint256"], [1111]),
        },
        {
          parent: 2,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["address"], [addressOne]),
        },
        // second tuple variant
        {
          parent: 3,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["uint256"], [22222]),
        },
        {
          parent: 3,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["address"], [addressTwo]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke({ a: 1111, b: addressOne })).to.not.be.reverted;

    await expect(invoke({ a: 22222, b: addressTwo })).to.not.be.reverted;

    await expect(invoke({ a: 22222, b: addressOne }))
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.OrViolation, BYTES32_ZERO);

    await expect(
      invoke({ a: 111, b: "0x0000000000000000000000000000000000000000" })
    )
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.OrViolation, BYTES32_ZERO);
  });

  it("checks a static Tuple comparison", async () => {
    const { modifier, testEncoder, owner, invoker } = await loadFixture(setup);

    const addressOk = "0x0000000000000000000000000000000000000123";
    const addressNok = "0x0000000000000000000000000000000000000cda";

    const SELECTOR = testEncoder.interface.getSighash(
      testEncoder.interface.getFunction("staticTuple")
    );

    const invoke = async (s: any) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testEncoder.address,
          0,
          (await testEncoder.populateTransaction.staticTuple(s, 100))
            .data as string,
          0
        );

    // set it to true
    await modifier.connect(owner).scopeTarget(ROLE_KEY, testEncoder.address);
    await modifier.connect(owner).scopeFunction(
      ROLE_KEY,
      testEncoder.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.Calldata,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["uint256"], [345]),
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["address"], [addressOk]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke({ a: 345, b: addressNok }))
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);

    await expect(invoke({ a: 345, b: addressOk })).to.not.be;
  });

  it("checks a dynamic Tuple comparison", async () => {
    const { modifier, testEncoder, owner, invoker } = await loadFixture(setup);

    const SELECTOR = testEncoder.interface.getSighash(
      testEncoder.interface.getFunction("dynamicTuple")
    );

    const invoke = async (s: any) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testEncoder.address,
          0,
          (await testEncoder.populateTransaction.dynamicTuple(s))
            .data as string,
          0
        );

    // set it to true
    await modifier.connect(owner).scopeTarget(ROLE_KEY, testEncoder.address);
    await modifier.connect(owner).scopeFunction(
      ROLE_KEY,
      testEncoder.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.Calldata,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: ParameterType.Dynamic,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["bytes"], ["0xabcdef"]),
        },
        {
          parent: 1,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["uint256"], [1998]),
        },
        {
          parent: 1,
          paramType: ParameterType.Array,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 4,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["uint256"], [7]),
        },
        {
          parent: 4,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["uint256"], [88]),
        },
        {
          parent: 4,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["uint256"], [99]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(invoke({ dynamic: "0xabcdef", _static: 1998, dynamic32: [7] }))
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAMatch, BYTES32_ZERO);

    await expect(
      invoke({ dynamic: "0xabcdef", _static: 1998, dynamic32: [7, 88, 99] })
    ).to.not.be.reverted;
  });

  it("checks operator Matches for Array", async () => {
    const address1 = "0x0000000000000000000000000000000000000fff";
    const address2 = "0x0000000000000000000000000000000000000123";
    const address3 = "0x0000000000000000000000000000000000000cda";

    const { modifier, testEncoder, owner, invoker } = await loadFixture(setup);
    const SELECTOR = testEncoder.interface.getSighash(
      testEncoder.interface.getFunction("arrayStaticTupleItems")
    );
    const invoke = async (a: any[]) =>
      modifier
        .connect(invoker)
        .execTransactionFromModule(
          testEncoder.address,
          0,
          (await testEncoder.populateTransaction.arrayStaticTupleItems(a))
            .data as string,
          0
        );

    // set it to true
    await modifier.connect(owner).scopeTarget(ROLE_KEY, testEncoder.address);
    await modifier.connect(owner).scopeFunction(
      ROLE_KEY,
      testEncoder.address,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: ParameterType.Calldata,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Array,
          operator: Operator.Matches,
          compValue: "0x",
        },
        // tuple first
        {
          parent: 1,
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        // tuple second
        {
          parent: 1,
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        // tuple third
        {
          parent: 1,
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: ParameterType.Static,
          operator: 0,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["address"], [address1]),
        },
        {
          parent: 3,
          paramType: ParameterType.Static,
          operator: 0,
          compValue: "0x",
        },
        {
          parent: 3,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["address"], [address2]),
        },
        {
          parent: 4,
          paramType: ParameterType.Static,
          operator: 0,
          compValue: "0x",
        },
        {
          parent: 4,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["address"], [address3]),
        },
      ],
      ExecutionOptions.None
    );

    await expect(
      invoke([
        { a: 123, b: address1 },
        { a: 333, b: address2 },
        { a: 233, b: address3 },
      ])
    ).to.not.be.reverted;
    await expect(invoke([]))
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAMatch, BYTES32_ZERO);
    await expect(
      invoke([
        { a: 123, b: address1 },
        { a: 333, b: address2 },
      ])
    )
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAMatch, BYTES32_ZERO);

    await expect(
      invoke([
        { a: 123, b: address1 },
        { a: 333, b: address2 },
        { a: 233, b: address2 },
      ])
    )
      .to.be.revertedWithCustomError(modifier, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
  });

  describe("Variants", async () => {
    it("checks a simple 3 way variant", async () => {
      const { modifier, testContract, owner, invoker } = await loadFixture(
        setup
      );

      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("fnWithTwoMixedParams")
      );

      const invoke = async (a: boolean, b: string) =>
        modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            0,
            (await testContract.populateTransaction.fnWithTwoMixedParams(a, b))
              .data as string,
            0
          );

      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_KEY], [true]);

      // set it to true
      await modifier.connect(owner).scopeTarget(ROLE_KEY, testContract.address);
      await modifier.connect(owner).scopeFunction(
        ROLE_KEY,
        testContract.address,
        SELECTOR,
        [
          {
            parent: 0,
            paramType: ParameterType.None,
            operator: Operator.Or,
            compValue: "0x",
          },
          // 1
          {
            parent: 0,
            paramType: ParameterType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          // 2
          {
            parent: 0,
            paramType: ParameterType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          // 3
          {
            parent: 0,
            paramType: ParameterType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          // first variant
          {
            parent: 1,
            paramType: ParameterType.Static,
            operator: 0,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: ParameterType.Dynamic,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["string"], ["First String"]),
          },
          // second variant
          {
            parent: 2,
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["bool"], [true]),
          },
          {
            parent: 2,
            paramType: ParameterType.Dynamic,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["string"], ["Good Morning!"]),
          },
          // third variant
          {
            parent: 3,

            paramType: ParameterType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 3,
            paramType: ParameterType.Dynamic,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["string"], ["Third String"]),
          },
        ],
        ExecutionOptions.None
      );

      await expect(invoke(true, "First String")).to.not.be.reverted;
      // wrong first argument
      await expect(invoke(false, "Good Morning!"))
        .to.be.revertedWithCustomError(modifier, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.OrViolation, BYTES32_ZERO);

      // fixing the first argument
      await expect(invoke(true, "Good Morning!")).to.not.be.reverted;
      await expect(invoke(true, "Third String")).to.not.be.reverted;

      await expect(invoke(false, "Something else"))
        .to.be.revertedWithCustomError(modifier, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.OrViolation, BYTES32_ZERO);
    });
  });
});
