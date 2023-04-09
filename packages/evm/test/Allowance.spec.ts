import { defaultAbiCoder } from "@ethersproject/abi";
import { expect } from "chai";
import hre from "hardhat";
import {
  BYTES32_ZERO,
  deployRolesMod,
  ExecutionOptions,
  multisendPayload,
  Operator,
  ParameterType,
  PermissionCheckerStatus,
  toConditionsFlat,
} from "./utils";
import { BigNumberish } from "ethers";
import { ConditionFlatStruct } from "../typechain-types/contracts/Integrity";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  setupOneParamArrayOfDynamicTuple,
  setupOneParamArrayOfStatic,
} from "./operators/setup";

const ROLE_KEY =
  "0x000000000000000000000000000000000000000000000000000000000000000f";

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
    .setTransactionUnwrapper(
      multisend.address,
      multisend.interface.getSighash(
        multisend.interface.getFunction("multiSend")
      ),
      adapter.address
    );

  await roles.enableModule(invoker.address);

  await roles.connect(owner).assignRoles(invoker.address, [ROLE_KEY], [true]);
  await roles.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);
  await roles.connect(owner).scopeTarget(ROLE_KEY, testContract.address);

  async function setAllowance(allowanceKey: string, balance: BigNumberish) {
    await roles.connect(owner).setAllowance(allowanceKey, balance, 0, 0, 0, 0);
  }

  function scopeFunction(conditions: ConditionFlatStruct[]) {
    return roles
      .connect(owner)
      .scopeFunction(
        ROLE_KEY,
        testContract.address,
        testContract.interface.getSighash(
          testContract.interface.getFunction("twoParamsStatic")
        ),
        conditions,
        ExecutionOptions.None
      );
  }

  async function invoke(a: BigNumberish, b: BigNumberish) {
    return roles
      .connect(invoker)
      .execTransactionFromModule(
        testContract.address,
        0,
        (await testContract.populateTransaction.twoParamsStatic(a, b))
          .data as string,
        0
      );
  }

  return {
    adapter,
    multisend,
    testContract,
    roles,
    owner,
    invoker,
    setAllowance,
    scopeFunction,
    invoke,
  };
}

describe("Flushing", async () => {
  describe("singleEntrypoint", async () => {
    it("consumption in truthy And branch influences other branches", async () => {
      const { roles, setAllowance, scopeFunction, invoke } = await loadFixture(
        setup
      );

      const allowanceKey =
        "0x000000000000000000000000000000000000000000000000000000000000000f";
      await setAllowance(allowanceKey, 300);

      await scopeFunction([
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
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
      const { roles, setAllowance, scopeFunction, invoke } = await loadFixture(
        setup
      );

      const allowanceKey =
        "0x000000000000000000000000000000000000000000000000000000000000000f";
      await setAllowance(allowanceKey, 1000);

      const conditionsFlat = toConditionsFlat({
        paramType: ParameterType.AbiEncoded,
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
      });

      await scopeFunction(conditionsFlat);

      expect((await roles.allowances(allowanceKey)).balance).to.equal(1000);

      await expect(invoke(501, 1)).to.not.be.reverted;

      expect((await roles.allowances(allowanceKey)).balance).to.equal(499);
    });
    it("consumption in falsy Xor branch gets discarded", async () => {
      const { roles, setAllowance, scopeFunction, invoke } = await loadFixture(
        setup
      );

      const allowanceKey =
        "0x000000000000000000000000000000000000000000000000000000000000000f";
      await setAllowance(allowanceKey, 1000);

      const conditionsFlat = toConditionsFlat({
        paramType: ParameterType.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x",
        children: [
          {
            paramType: ParameterType.None,
            operator: Operator.Xor,
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
      });

      await scopeFunction(conditionsFlat);

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

      const conditionsFlat = toConditionsFlat({
        paramType: ParameterType.AbiEncoded,
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

      const conditionsFlat = toConditionsFlat({
        paramType: ParameterType.AbiEncoded,
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

      const conditionsFlat = toConditionsFlat({
        paramType: ParameterType.AbiEncoded,
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
                    compValue: defaultAbiCoder.encode(
                      ["bytes"],
                      ["0xdeadbeef"]
                    ),
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
                    compValue: defaultAbiCoder.encode(
                      ["bytes"],
                      ["0xbad0beef"]
                    ),
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

    it("failing And returns unchanged consumptions");
    it.skip("failing OR returns unchanged consumptions");
    it.skip("failing XOR returns unchanged consumptions");
    it.skip("failing Matches returns unchanged consumptions");
  });

  describe("multiEntrypoint", async () => {
    it.skip("consumptions without overlap across entrypoints get flushed");
    it.skip("consumptions with overlap across entrypoints overspend", async () => {
      const { multisend, roles, testContract, owner, invoker } = await setup();

      const allowanceKey = "0x01".padEnd(66, "0");

      const balance = 100;
      const value1 = 10;
      const value2 = 20;

      await roles
        .connect(owner)
        .setAllowance(allowanceKey, balance, 0, 0, 0, 0);

      await roles.connect(owner).scopeFunction(
        ROLE_KEY,
        testContract.address,
        testContract.interface.getSighash(
          testContract.interface.getFunction("oneParamStatic")
        ),
        [
          {
            parent: 0,
            paramType: ParameterType.AbiEncoded,
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
        ROLE_KEY,
        testContract.address,
        testContract.interface.getSighash(
          testContract.interface.getFunction("twoParamsStatic")
        ),
        [
          {
            parent: 0,
            paramType: ParameterType.AbiEncoded,
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

      const multisendCallData = (
        await multisend.populateTransaction.multiSend(
          multisendPayload([
            {
              to: testContract.address,
              value: 0,
              data: (
                await testContract.populateTransaction.oneParamStatic(value1)
              ).data as string,
              operation: 0,
            },
            {
              to: testContract.address,
              value: 0,
              data: (
                await testContract.populateTransaction.twoParamsStatic(
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
          .execTransactionFromModule(multisend.address, 0, multisendCallData, 1)
      ).to.emit(roles, "ConsumeAllowance");

      // fails here as expected
      expect((await roles.allowances(allowanceKey)).balance).to.equal(
        balance - (value1 + value2)
      );
    });
    it.skip("several entrypoints with consumptions and overlap get flushed");
    it.skip("middle entrypoint with no consumptions accounts and flushes");
  });
});
