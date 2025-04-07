import { expect } from "chai";
import hre from "hardhat";
import {
  BYTES32_ZERO,
  ExecutionOptions,
  Operator,
  ParameterType,
  PermissionCheckerStatus,
  encodeMultisendPayload,
  flattenCondition,
} from "./utils";
import { AbiCoder, BigNumberish } from "ethers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  deployRolesMod,
  setupAvatarAndRoles,
  setupFnThatMaybeReturns,
  setupOneParamArrayOfDynamicTuple,
  setupOneParamStaticTuple,
  setupTwoParamsStatic,
} from "./setup";

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

describe("Allowance", async () => {
  it("unexistent allowance produces error", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupTwoParamsStatic
    );

    const allowanceKey =
      "0x123000000000000000000000000000000000000000000000000000000000000f";

    await scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Static,
        operator: Operator.WithinAllowance,
        compValue: allowanceKey,
      },
      {
        parent: 0,
        paramType: ParameterType.Static,
        operator: Operator.Pass,
        compValue: "0x",
      },
    ]);

    await expect(invoke(100, 100))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.AllowanceExceeded, allowanceKey);
  });
  it("raises ConsumeAllowance event", async () => {
    const { roles, scopeFunction, invoke, owner } = await loadFixture(
      setupFnThatMaybeReturns
    );

    const allowanceKey =
      "0x000000000000000000000000000000000000000000000000000000000000000f";
    await roles.connect(owner).setAllowance(allowanceKey, 1000, 0, 0, 0, 0);

    const conditionsFlat = flattenCondition({
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      compValue: "0x",
      children: [
        {
          paramType: ParameterType.Static,
          operator: Operator.WithinAllowance,
          compValue: allowanceKey,
        },
        {
          paramType: ParameterType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ],
    });
    await scopeFunction(conditionsFlat);
    const maybe = false;

    expect((await roles.allowances(allowanceKey)).balance).to.equal(1000);

    await expect(invoke(100, maybe)).to.emit(roles, "ConsumeAllowance");

    expect((await roles.allowances(allowanceKey)).balance).to.equal(900);
  });
  it("does not raise ConsumeAllowance, when inner transaction reverts, shouldRevert=false", async () => {
    const { roles, scopeFunction, invoke, owner } = await loadFixture(
      setupFnThatMaybeReturns
    );

    const allowanceKey =
      "0x000000000000000000000000000000000000000000000000000000000000000f";
    await roles.connect(owner).setAllowance(allowanceKey, 1000, 0, 0, 0, 0);

    const conditionsFlat = flattenCondition({
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      compValue: "0x",
      children: [
        {
          paramType: ParameterType.Static,
          operator: Operator.WithinAllowance,
          compValue: allowanceKey,
        },
        {
          paramType: ParameterType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ],
    });
    await scopeFunction(conditionsFlat);

    expect((await roles.allowances(allowanceKey)).balance).to.equal(1000);

    await expect(invoke(100, true)).to.not.emit(roles, "ConsumeAllowance");

    expect((await roles.allowances(allowanceKey)).balance).to.equal(1000);
  });
  it("consumption in truthy And branch bleeds to other branches", async () => {
    const { roles, scopeFunction, invoke, owner } = await loadFixture(
      setupTwoParamsStatic
    );

    const allowanceKey =
      "0x000000000000000000000000000000000000000000000000000000000000000f";
    await roles.connect(owner).setAllowance(allowanceKey, 300, 0, 0, 0, 0);

    await scopeFunction([
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
        operator: Operator.WithinAllowance,
        compValue: allowanceKey,
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.WithinAllowance,
        compValue: allowanceKey,
      },
    ]);

    expect((await roles.allowances(allowanceKey)).balance).to.equal(300);

    await expect(invoke(100, 100)).to.not.be.reverted;

    expect((await roles.allowances(allowanceKey)).balance).to.equal(100);
    await expect(invoke(100, 1))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.AllowanceExceeded, allowanceKey);

    expect((await roles.allowances(allowanceKey)).balance).to.equal(100);
  });
  it("consumption in falsy Or branch gets discarded", async () => {
    const { roles, scopeFunction, invoke, owner } = await loadFixture(
      setupTwoParamsStatic
    );

    const allowanceKey =
      "0x000000000000000000000000000000000000000000000000000000000000000f";
    await roles.connect(owner).setAllowance(allowanceKey, 1000, 0, 0, 0, 0);

    await scopeFunction(
      flattenCondition({
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
        children: [
          {
            paramType: ParameterType.None,
            operator: Operator.Or,
            compValue: "0x",
            children: [
              {
                paramType: ParameterType.None,
                operator: Operator.And,
                compValue: "0x",
                children: [
                  {
                    paramType: ParameterType.Static,
                    operator: Operator.WithinAllowance,
                    compValue: allowanceKey,
                  },
                  {
                    paramType: ParameterType.Static,
                    operator: Operator.LessThan,
                    compValue: defaultAbiCoder.encode(["uint256"], [1]),
                  },
                ],
              },
              {
                paramType: ParameterType.None,
                operator: Operator.And,
                compValue: "0x",
                children: [
                  {
                    paramType: ParameterType.Static,
                    operator: Operator.WithinAllowance,
                    compValue: allowanceKey,
                  },
                  {
                    paramType: ParameterType.Static,
                    operator: Operator.GreaterThan,
                    compValue: defaultAbiCoder.encode(["uint256"], [1]),
                  },
                ],
              },
            ],
          },
        ],
      })
    );

    expect((await roles.allowances(allowanceKey)).balance).to.equal(1000);

    await expect(invoke(501, 1)).to.not.be.reverted;

    expect((await roles.allowances(allowanceKey)).balance).to.equal(499);
  });
  it("consumption in ArraySome gets counted once", async () => {
    const { roles, scopeFunction, invoke, owner } = await loadFixture(
      setupOneParamArrayOfDynamicTuple
    );

    const allowanceKey =
      "0x000000000000000000000000000000000000000000000000000000000000000f";
    await roles.connect(owner).setAllowance(allowanceKey, 1000, 0, 0, 0, 0);

    const conditionsFlat = flattenCondition({
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      compValue: "0x",
      children: [
        {
          paramType: ParameterType.Array,
          operator: Operator.ArraySome,
          compValue: "0x",
          children: [
            {
              paramType: ParameterType.Tuple,
              operator: Operator.Matches,
              compValue: "0x",
              children: [
                {
                  paramType: ParameterType.Static,
                  operator: Operator.WithinAllowance,
                  compValue: allowanceKey,
                },
                {
                  paramType: ParameterType.Dynamic,
                  operator: Operator.EqualTo,
                  compValue: defaultAbiCoder.encode(["bytes"], ["0xbadfed"]),
                },
              ],
            },
          ],
        },
      ],
    });
    await scopeFunction(conditionsFlat);

    expect((await roles.allowances(allowanceKey)).balance).to.equal(1000);

    await expect(invoke([{ a: 100, b: "0xdeadbeef" }]))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.NoArrayElementPasses, BYTES32_ZERO);

    expect((await roles.allowances(allowanceKey)).balance).to.equal(1000);

    await expect(invoke([{ a: 100, b: "0xbadfed" }])).to.not.be.reverted;
    expect((await roles.allowances(allowanceKey)).balance).to.equal(900);

    await expect(
      invoke([
        { a: 100, b: "0xbadfed" },
        { a: 900, b: "0xbadfed" },
        { a: 1234, b: "0xbadfed" },
      ])
    ).to.not.be.reverted;

    expect((await roles.allowances(allowanceKey)).balance).to.equal(800);
  });
  it("consumption in ArrayEvery gets counted for all elements", async () => {
    const { roles, scopeFunction, invoke, owner } = await loadFixture(
      setupOneParamArrayOfDynamicTuple
    );

    const allowanceKey =
      "0x000000000000000000000000000000000000000000000000000000000000000f";
    await roles.connect(owner).setAllowance(allowanceKey, 1000, 0, 0, 0, 0);

    const conditionsFlat = flattenCondition({
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      compValue: "0x",
      children: [
        {
          paramType: ParameterType.Array,
          operator: Operator.ArrayEvery,
          compValue: "0x",
          children: [
            {
              paramType: ParameterType.Tuple,
              operator: Operator.Matches,
              compValue: "0x",
              children: [
                {
                  paramType: ParameterType.Static,
                  operator: Operator.WithinAllowance,
                  compValue: allowanceKey,
                },
                {
                  paramType: ParameterType.Dynamic,
                  operator: Operator.EqualTo,
                  compValue: defaultAbiCoder.encode(["bytes"], ["0xbadfed"]),
                },
              ],
            },
          ],
        },
      ],
    });
    await scopeFunction(conditionsFlat);

    expect((await roles.allowances(allowanceKey)).balance).to.equal(1000);

    await expect(invoke([{ a: 100, b: "0xdeadbeef" }]))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.NotEveryArrayElementPasses,
        BYTES32_ZERO
      );

    expect((await roles.allowances(allowanceKey)).balance).to.equal(1000);

    await expect(
      invoke([
        { a: 123, b: "0xbadfed" },
        { a: 200, b: "0xbadfed" },
      ])
    ).to.not.be.reverted;

    expect((await roles.allowances(allowanceKey)).balance).to.equal(
      1000 - (123 + 200)
    );
  });
  it("consumption in ArraySubset gets counted in hits", async () => {
    const { roles, scopeFunction, invoke, owner } = await loadFixture(
      setupOneParamArrayOfDynamicTuple
    );

    const allowanceKey1 =
      "0x00000000000000000000000000000000000000000000000000000000000000f1";
    await roles.connect(owner).setAllowance(allowanceKey1, 100, 0, 0, 0, 0);

    const allowanceKey2 =
      "0x00000000000000000000000000000000000000000000000000000000000000f2";
    await roles.connect(owner).setAllowance(allowanceKey2, 100, 0, 0, 0, 0);

    const allowanceKey3 =
      "0x00000000000000000000000000000000000000000000000000000000000000f3";
    await roles.connect(owner).setAllowance(allowanceKey3, 100, 0, 0, 0, 0);

    const conditionsFlat = flattenCondition({
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      compValue: "0x",
      children: [
        {
          paramType: ParameterType.Array,
          operator: Operator.ArraySubset,
          compValue: "0x",
          children: [
            {
              paramType: ParameterType.Tuple,
              operator: Operator.Matches,
              compValue: "0x",
              children: [
                {
                  paramType: ParameterType.Static,
                  operator: Operator.WithinAllowance,
                  compValue: allowanceKey1,
                },
                {
                  paramType: ParameterType.Dynamic,
                  operator: Operator.EqualTo,
                  compValue: defaultAbiCoder.encode(["bytes"], ["0xbadfed"]),
                },
              ],
            },
            {
              paramType: ParameterType.Tuple,
              operator: Operator.Matches,
              compValue: "0x",
              children: [
                {
                  paramType: ParameterType.Static,
                  operator: Operator.WithinAllowance,
                  compValue: allowanceKey2,
                },
                {
                  paramType: ParameterType.Dynamic,
                  operator: Operator.EqualTo,
                  compValue: defaultAbiCoder.encode(["bytes"], ["0xdeadbeef"]),
                },
              ],
            },
            {
              paramType: ParameterType.Tuple,
              operator: Operator.Matches,
              compValue: "0x",
              children: [
                {
                  paramType: ParameterType.Static,
                  operator: Operator.WithinAllowance,
                  compValue: allowanceKey3,
                },
                {
                  paramType: ParameterType.Dynamic,
                  operator: Operator.EqualTo,
                  compValue: defaultAbiCoder.encode(["bytes"], ["0xbad0beef"]),
                },
              ],
            },
          ],
        },
      ],
    });
    await scopeFunction(conditionsFlat);

    expect((await roles.allowances(allowanceKey1)).balance).to.equal(100);
    expect((await roles.allowances(allowanceKey2)).balance).to.equal(100);
    expect((await roles.allowances(allowanceKey3)).balance).to.equal(100);

    await expect(
      invoke([
        { a: 20, b: "0xdeadbeef" },
        { a: 30, b: "0xbad0beef" },
      ])
    ).to.not.be.reverted;

    expect((await roles.allowances(allowanceKey1)).balance).to.equal(100);
    expect((await roles.allowances(allowanceKey2)).balance).to.equal(80);
    expect((await roles.allowances(allowanceKey3)).balance).to.equal(70);
  });
  it("failing And returns unchanged in memory consumptions", async () => {
    const {
      owner,
      roles,
      testContract,
      scopeFunction,
      execTransactionFromModule,
    } = await loadFixture(setupAvatarAndRoles);

    const allowanceKey1 =
      "0x00000000000000000000000000000000000000000000000000000000000000f1";
    await roles.connect(owner).setAllowance(allowanceKey1, 100, 0, 0, 0, 0);

    const allowanceKey2 =
      "0x00000000000000000000000000000000000000000000000000000000000000f2";
    await roles.connect(owner).setAllowance(allowanceKey2, 100, 0, 0, 0, 0);

    const conditionsFlat = flattenCondition({
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      compValue: "0x",
      children: [
        {
          paramType: ParameterType.None,
          operator: Operator.Or,
          compValue: "0x",
          children: [
            {
              paramType: ParameterType.None,
              operator: Operator.And,
              compValue: "0x",
              children: [
                {
                  paramType: ParameterType.Static,
                  operator: Operator.WithinAllowance,
                  compValue: allowanceKey1,
                },
                {
                  paramType: ParameterType.Static,
                  operator: Operator.LessThan,
                  compValue: defaultAbiCoder.encode(["uint256"], [50]),
                },
              ],
            },
            {
              paramType: ParameterType.Static,
              operator: Operator.WithinAllowance,
              compValue: allowanceKey2,
            },
          ],
        },
      ],
    });

    const { selector } = testContract.interface.getFunction("oneParamStatic");
    await scopeFunction(selector, conditionsFlat);

    const invoke = async (a: number) => {
      const { data } = await testContract.oneParamStatic.populateTransaction(a);
      return execTransactionFromModule({ data });
    };

    expect((await roles.allowances(allowanceKey1)).balance).to.equal(100);
    expect((await roles.allowances(allowanceKey2)).balance).to.equal(100);

    await expect(invoke(51)).to.not.be.reverted;

    expect((await roles.allowances(allowanceKey1)).balance).to.equal(100);
    expect((await roles.allowances(allowanceKey2)).balance).to.equal(49);
  });
  it("failing OR returns unchanged in memory consumptions", async () => {
    const {
      owner,
      roles,
      testContract,
      scopeFunction,
      execTransactionFromModule,
    } = await loadFixture(setupAvatarAndRoles);

    const allowanceKey1 =
      "0x00000000000000000000000000000000000000000000000000000000000000f1";
    await roles.connect(owner).setAllowance(allowanceKey1, 100, 0, 0, 0, 0);

    const allowanceKey2 =
      "0x00000000000000000000000000000000000000000000000000000000000000f2";
    await roles.connect(owner).setAllowance(allowanceKey2, 100, 0, 0, 0, 0);

    const conditionsFlat = flattenCondition({
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      compValue: "0x",
      children: [
        {
          paramType: ParameterType.None,
          operator: Operator.Or,
          compValue: "0x",
          children: [
            {
              paramType: ParameterType.None,
              operator: Operator.Or,
              compValue: "0x",
              children: [
                {
                  paramType: ParameterType.None,
                  operator: Operator.And,
                  compValue: "0x",
                  children: [
                    {
                      paramType: ParameterType.Static,
                      operator: Operator.WithinAllowance,
                      compValue: allowanceKey1,
                    },
                    {
                      paramType: ParameterType.Static,
                      operator: Operator.LessThan,
                      compValue: defaultAbiCoder.encode(["uint256"], [50]),
                    },
                  ],
                },
              ],
            },
            {
              paramType: ParameterType.Static,
              operator: Operator.WithinAllowance,
              compValue: allowanceKey2,
            },
          ],
        },
      ],
    });

    const { selector } = testContract.interface.getFunction("oneParamStatic");
    await scopeFunction(selector, conditionsFlat);

    const invoke = async (a: number) => {
      const { data } = await testContract.oneParamStatic.populateTransaction(a);
      return execTransactionFromModule({ data });
    };

    expect((await roles.allowances(allowanceKey1)).balance).to.equal(100);
    expect((await roles.allowances(allowanceKey2)).balance).to.equal(100);

    await expect(invoke(51)).to.not.be.reverted;

    expect((await roles.allowances(allowanceKey1)).balance).to.equal(100);
    expect((await roles.allowances(allowanceKey2)).balance).to.equal(49);
  });
  it("failing Matches returns unchanged in memory consumptions", async () => {
    const { roles, scopeFunction, invoke, owner } = await loadFixture(
      setupOneParamStaticTuple
    );

    const allowanceKey1 =
      "0x00000000000000000000000000000000000000000000000000000000000000f1";
    await roles.connect(owner).setAllowance(allowanceKey1, 100, 0, 0, 0, 0);

    const allowanceKey2 =
      "0x00000000000000000000000000000000000000000000000000000000000000f2";
    await roles.connect(owner).setAllowance(allowanceKey2, 100, 0, 0, 0, 0);

    const conditionsFlat = flattenCondition({
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      compValue: "0x",
      children: [
        {
          paramType: ParameterType.None,
          operator: Operator.Or,
          compValue: "0x",
          children: [
            {
              paramType: ParameterType.Tuple,
              operator: Operator.Matches,
              compValue: "0x",
              children: [
                {
                  paramType: ParameterType.Static,
                  operator: Operator.WithinAllowance,
                  compValue: allowanceKey1,
                },
                {
                  paramType: ParameterType.Static,
                  operator: Operator.EqualTo,
                  compValue: defaultAbiCoder.encode(["bool"], [true]),
                },
              ],
            },
            {
              paramType: ParameterType.Tuple,
              operator: Operator.Matches,
              compValue: "0x",
              children: [
                {
                  paramType: ParameterType.Static,
                  operator: Operator.WithinAllowance,
                  compValue: allowanceKey2,
                },
                {
                  paramType: ParameterType.Static,
                  operator: Operator.Pass,
                  compValue: "0x",
                },
              ],
            },
          ],
        },
      ],
    });

    await scopeFunction(conditionsFlat);

    expect((await roles.allowances(allowanceKey1)).balance).to.equal(100);
    expect((await roles.allowances(allowanceKey2)).balance).to.equal(100);

    await expect(invoke({ a: 65, b: false })).to.not.be.reverted;

    expect((await roles.allowances(allowanceKey1)).balance).to.equal(100);
    expect((await roles.allowances(allowanceKey2)).balance).to.equal(35);
  });
  it("balance above maxRefill gets consumed", async () => {
    const { roles, scopeFunction, invoke, owner } = await loadFixture(
      setupFnThatMaybeReturns
    );

    const allowanceKey =
      "0x000000000000000000000000000000000000000000000000000000000000000f";
    await roles
      .connect(owner)
      .setAllowance(allowanceKey, 1300, 1000, 100, 0, 0);

    const conditionsFlat = flattenCondition({
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      compValue: "0x",
      children: [
        {
          paramType: ParameterType.Static,
          operator: Operator.WithinAllowance,
          compValue: allowanceKey,
        },
        {
          paramType: ParameterType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
      ],
    });
    await scopeFunction(conditionsFlat);
    const maybe = false;

    expect((await roles.allowances(allowanceKey)).balance).to.equal(1300);

    await expect(invoke(1200, maybe)).to.emit(roles, "ConsumeAllowance");

    expect((await roles.allowances(allowanceKey)).balance).to.equal(100);
  });

  describe("multiEntrypoint", async () => {
    async function setup() {
      const ROLE_KEY =
        "0x000000000000000000000000000000000000000000000000000000000000000f";
      const Avatar = await hre.ethers.getContractFactory("TestAvatar");
      const avatar = await Avatar.deploy();

      const TestContract = await hre.ethers.getContractFactory("TestContract");
      const testContract = await TestContract.deploy();

      const TestEncoder = await hre.ethers.getContractFactory("TestEncoder");
      const testEncoder = await TestEncoder.deploy();

      const [owner, invoker] = await hre.ethers.getSigners();

      const avatarAddress = await avatar.getAddress();
      const testContractAddress = await testContract.getAddress();
      const testEncoderAddress = await testEncoder.getAddress();
      const roles = await deployRolesMod(
        hre,
        owner.address,
        avatarAddress,
        avatarAddress
      );
      await roles.enableModule(invoker.address);

      await roles
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_KEY], [true]);
      await roles.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);
      await roles.connect(owner).scopeTarget(ROLE_KEY, testContractAddress);
      await roles.connect(owner).scopeTarget(ROLE_KEY, testEncoderAddress);

      const MultiSend = await hre.ethers.getContractFactory("MultiSend");
      const multisend = await MultiSend.deploy();
      const multisendAddress = await multisend.getAddress();

      const MultiSendUnwrapper = await hre.ethers.getContractFactory(
        "MultiSendUnwrapper"
      );
      const adapter = await MultiSendUnwrapper.deploy();
      const adapterAddress = await adapter.getAddress();

      await roles
        .connect(owner)
        .setTransactionUnwrapper(
          multisendAddress,
          multisend.interface.getFunction("multiSend").selector,
          adapterAddress
        );

      async function setAllowance(allowanceKey: string, balance: BigNumberish) {
        await roles
          .connect(owner)
          .setAllowance(allowanceKey, balance, 0, 0, 0, 0);
      }

      return {
        roleKey: ROLE_KEY,
        adapter,
        multisend,
        testContract,
        testEncoder,
        roles,
        setAllowance,
        owner,
        invoker,
      };
    }

    it("consumptions without overlap across entrypoints get flushed", async () => {
      const {
        roleKey,
        multisend,
        roles,
        testContract,
        setAllowance,
        owner,
        invoker,
      } = await loadFixture(setup);

      const allowanceKey1 =
        "0x00000000000000000000000000000000000000000000000000000000000000f1";

      const allowanceKey2 =
        "0x00000000000000000000000000000000000000000000000000000000000000f2";

      const balance1 = 123;
      const balance2 = 9876;
      const value1 = 45;
      const value2 = 1234;

      await setAllowance(allowanceKey1, balance1);
      await setAllowance(allowanceKey2, balance2);
      await roles.connect(owner).scopeFunction(
        roleKey,
        await testContract.getAddress(),
        testContract.interface.getFunction("oneParamStatic").selector,
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
            operator: Operator.WithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey1]),
          },
        ],
        ExecutionOptions.None
      );

      await roles.connect(owner).scopeFunction(
        roleKey,
        await testContract.getAddress(),
        testContract.interface.getFunction("twoParamsStatic").selector,
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
            paramType: ParameterType.Static,
            operator: Operator.WithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey2]),
          },
        ],
        ExecutionOptions.None
      );

      const testContractAddress = await testContract.getAddress();
      const multisendCalldata = (
        await multisend.multiSend.populateTransaction(
          encodeMultisendPayload([
            {
              to: testContractAddress,
              value: 0,
              data: (
                await testContract.oneParamStatic.populateTransaction(value1)
              ).data as string,
              operation: 0,
            },
            {
              to: testContractAddress,
              value: 0,
              data: (
                await testContract.twoParamsStatic.populateTransaction(
                  0,
                  value2
                )
              ).data as string,
              operation: 0,
            },
          ])
        )
      ).data as string;

      expect((await roles.allowances(allowanceKey1)).balance).to.equal(
        balance1
      );
      expect((await roles.allowances(allowanceKey2)).balance).to.equal(
        balance2
      );

      await expect(
        roles
          .connect(invoker)
          .execTransactionFromModule(
            await multisend.getAddress(),
            0,
            multisendCalldata,
            1
          )
      ).to.emit(roles, "ConsumeAllowance");

      expect((await roles.allowances(allowanceKey1)).balance).to.equal(
        balance1 - value1
      );
      expect((await roles.allowances(allowanceKey2)).balance).to.equal(
        balance2 - value2
      );
    });
    it("consumptions with overlap get flushed", async () => {
      const {
        roleKey,
        multisend,
        roles,
        testContract,
        setAllowance,
        owner,
        invoker,
      } = await loadFixture(setup);

      const allowanceKey1 =
        "0x00000000000000000000000000000000000000000000000000000000000000f1";

      const allowanceKey2 =
        "0x00000000000000000000000000000000000000000000000000000000000000f2";

      const balance1 = 123;
      const balance2 = 9876;
      const value11 = 45;
      const value12 = 30;
      const value2 = 1234;

      await setAllowance(allowanceKey1, balance1);
      await setAllowance(allowanceKey2, balance2);

      await roles.connect(owner).scopeFunction(
        roleKey,
        await testContract.getAddress(),
        testContract.interface.getFunction("oneParamStatic").selector,
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
            operator: Operator.WithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey1]),
          },
        ],
        ExecutionOptions.None
      );

      await roles.connect(owner).scopeFunction(
        roleKey,
        await testContract.getAddress(),
        testContract.interface.getFunction("twoParamsStatic").selector,
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
            operator: Operator.WithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey1]),
          },
          {
            parent: 0,
            paramType: ParameterType.Static,
            operator: Operator.WithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey2]),
          },
        ],
        ExecutionOptions.None
      );

      const multisendCalldata = (
        await multisend.multiSend.populateTransaction(
          encodeMultisendPayload([
            {
              to: await testContract.getAddress(),
              value: 0,
              data: (
                await testContract.oneParamStatic.populateTransaction(value11)
              ).data as string,
              operation: 0,
            },
            {
              to: await testContract.getAddress(),
              value: 0,
              data: (
                await testContract.twoParamsStatic.populateTransaction(
                  value12,
                  value2
                )
              ).data as string,
              operation: 0,
            },
          ])
        )
      ).data as string;

      expect((await roles.allowances(allowanceKey1)).balance).to.equal(
        balance1
      );
      expect((await roles.allowances(allowanceKey2)).balance).to.equal(
        balance2
      );

      await expect(
        roles
          .connect(invoker)
          .execTransactionFromModule(
            await multisend.getAddress(),
            0,
            multisendCalldata,
            1
          )
      ).to.emit(roles, "ConsumeAllowance");

      expect((await roles.allowances(allowanceKey1)).balance).to.equal(
        balance1 - (value11 + value12)
      );
      expect((await roles.allowances(allowanceKey2)).balance).to.equal(
        balance2 - value2
      );
    });
    it("consumptions with overlap overspend", async () => {
      const { roleKey, multisend, roles, testContract, owner, invoker } =
        await loadFixture(setup);

      const allowanceKey = "0x01".padEnd(66, "0");

      const balance = 75;
      const value1 = 40;
      const value2 = 40;
      const testContractAddress = await testContract.getAddress();
      await roles
        .connect(owner)
        .setAllowance(allowanceKey, balance, 0, 0, 0, 0);

      await roles.connect(owner).scopeFunction(
        roleKey,
        testContractAddress,
        testContract.interface.getFunction("oneParamStatic").selector,
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
            operator: Operator.WithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
          },
        ],
        ExecutionOptions.None
      );

      await roles.connect(owner).scopeFunction(
        roleKey,
        testContractAddress,
        testContract.interface.getFunction("twoParamsStatic").selector,
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
            operator: Operator.WithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
          },
          {
            parent: 0,
            paramType: ParameterType.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
        ],
        ExecutionOptions.None
      );

      const multisendCalldata = (
        await multisend.multiSend.populateTransaction(
          encodeMultisendPayload([
            {
              to: testContractAddress,
              value: 0,
              data: (
                await testContract.oneParamStatic.populateTransaction(value1)
              ).data as string,
              operation: 0,
            },
            {
              to: testContractAddress,
              value: 0,
              data: (
                await testContract.twoParamsStatic.populateTransaction(
                  value2,
                  999999
                )
              ).data as string,
              operation: 0,
            },
          ])
        )
      ).data as string;

      expect((await roles.allowances(allowanceKey)).balance).to.equal(balance);

      await expect(
        roles
          .connect(invoker)
          .execTransactionFromModule(
            await multisend.getAddress(),
            0,
            multisendCalldata,
            1
          )
      )
        .to.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.AllowanceExceeded, allowanceKey);

      expect((await roles.allowances(allowanceKey)).balance).to.equal(balance);
    });
    it("middle entrypoint allowed with no consumptions carries and flushes", async () => {
      const {
        roleKey,
        multisend,
        roles,
        testContract,
        setAllowance,
        owner,
        invoker,
      } = await loadFixture(setup);

      const allowanceKey1 =
        "0x00000000000000000000000000000000000000000000000000000000000000f1";

      const allowanceKey2 =
        "0x00000000000000000000000000000000000000000000000000000000000000f2";

      const balance1 = 123;
      const balance2 = 9876;
      const value11 = 45;
      const value12 = 30;
      const value2 = 1234;

      await setAllowance(allowanceKey1, balance1);
      await setAllowance(allowanceKey2, balance2);
      const testContractAddress = await testContract.getAddress();
      await roles.connect(owner).scopeFunction(
        roleKey,
        testContractAddress,
        testContract.interface.getFunction("oneParamStatic").selector,
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
            operator: Operator.WithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey1]),
          },
        ],
        ExecutionOptions.None
      );

      await roles
        .connect(owner)
        .allowFunction(
          roleKey,
          testContractAddress,
          testContract.interface.getFunction("doNothing").selector,
          ExecutionOptions.None
        );

      await roles.connect(owner).scopeFunction(
        roleKey,
        testContractAddress,
        testContract.interface.getFunction("twoParamsStatic").selector,
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
            operator: Operator.WithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey1]),
          },
          {
            parent: 0,
            paramType: ParameterType.Static,
            operator: Operator.WithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey2]),
          },
        ],
        ExecutionOptions.None
      );

      const multisendCalldata = (
        await multisend.multiSend.populateTransaction(
          encodeMultisendPayload([
            {
              to: testContractAddress,
              value: 0,
              data: (
                await testContract.oneParamStatic.populateTransaction(value11)
              ).data as string,
              operation: 0,
            },
            {
              to: testContractAddress,
              value: 0,
              data: (
                await testContract.doNothing.populateTransaction()
              ).data as string,
              operation: 0,
            },
            {
              to: testContractAddress,
              value: 0,
              data: (
                await testContract.twoParamsStatic.populateTransaction(
                  value12,
                  value2
                )
              ).data as string,
              operation: 0,
            },
          ])
        )
      ).data as string;

      expect((await roles.allowances(allowanceKey1)).balance).to.equal(
        balance1
      );
      expect((await roles.allowances(allowanceKey2)).balance).to.equal(
        balance2
      );

      await expect(
        roles
          .connect(invoker)
          .execTransactionFromModule(
            await multisend.getAddress(),
            0,
            multisendCalldata,
            1
          )
      ).to.emit(roles, "ConsumeAllowance");

      expect((await roles.allowances(allowanceKey1)).balance).to.equal(
        balance1 - (value11 + value12)
      );
      expect((await roles.allowances(allowanceKey2)).balance).to.equal(
        balance2 - value2
      );
    });
    it("middle entrypoint scoped with no consumptions carries and flushes", async () => {
      const {
        roleKey,
        multisend,
        roles,
        testContract,
        testEncoder,
        setAllowance,
        owner,
        invoker,
      } = await loadFixture(setup);

      const allowanceKey1 =
        "0x00000000000000000000000000000000000000000000000000000000000000f1";

      const allowanceKey2 =
        "0x00000000000000000000000000000000000000000000000000000000000000f2";

      const balance1 = 123;
      const balance2 = 9876;
      const value11 = 45;
      const value12 = 30;
      const value2 = 1234;

      await setAllowance(allowanceKey1, balance1);
      await setAllowance(allowanceKey2, balance2);
      const testContractAddress = await testContract.getAddress();
      await roles.connect(owner).scopeFunction(
        roleKey,
        testContractAddress,
        testContract.interface.getFunction("oneParamStatic").selector,
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
            operator: Operator.WithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey1]),
          },
        ],
        ExecutionOptions.None
      );
      const testEncoderAddress = await testEncoder.getAddress();
      await roles.connect(owner).scopeFunction(
        roleKey,
        testEncoderAddress,
        testEncoder.interface.getFunction("simple").selector,
        [
          {
            parent: 0,
            paramType: ParameterType.Calldata,
            operator: Operator.Pass,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["uint256"], [1]),
          },
        ],
        ExecutionOptions.None
      );

      await roles.connect(owner).scopeFunction(
        roleKey,
        testContractAddress,

        testContract.interface.getFunction("twoParamsStatic").selector,

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
            operator: Operator.WithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey1]),
          },
          {
            parent: 0,
            paramType: ParameterType.Static,
            operator: Operator.WithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey2]),
          },
        ],
        ExecutionOptions.None
      );

      const multisendCalldata = (
        await multisend.multiSend.populateTransaction(
          encodeMultisendPayload([
            {
              to: testContractAddress,
              value: 0,
              data: (
                await testContract.oneParamStatic.populateTransaction(value11)
              ).data as string,
              operation: 0,
            },
            {
              to: testEncoderAddress,
              value: 0,
              data: (
                await testEncoder.simple.populateTransaction(1)
              ).data as string,
              operation: 0,
            },
            {
              to: testContractAddress,
              value: 0,
              data: (
                await testContract.twoParamsStatic.populateTransaction(
                  value12,
                  value2
                )
              ).data as string,
              operation: 0,
            },
          ])
        )
      ).data as string;

      expect((await roles.allowances(allowanceKey1)).balance).to.equal(
        balance1
      );
      expect((await roles.allowances(allowanceKey2)).balance).to.equal(
        balance2
      );

      await expect(
        roles
          .connect(invoker)
          .execTransactionFromModule(
            await multisend.getAddress(),
            0,
            multisendCalldata,
            1
          )
      ).to.emit(roles, "ConsumeAllowance");

      expect((await roles.allowances(allowanceKey1)).balance).to.equal(
        balance1 - (value11 + value12)
      );
      expect((await roles.allowances(allowanceKey2)).balance).to.equal(
        balance2 - value2
      );
    });
  });
});
