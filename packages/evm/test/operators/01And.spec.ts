import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder, ZeroHash } from "ethers";

import {
  AbiType,
  flattenCondition,
  Operator,
  PermissionCheckerStatus,
} from "../utils";
import { setupOneParamStatic, setupTwoParamsStaticDynamic } from "../setup";

import { ConditionFlatStruct } from "../../typechain-types/contracts/Integrity";

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

describe("Operator - And", async () => {
  it("evaluates operator And with a single child", async () => {
    const { roles, invoke, scopeFunction } =
      await loadFixture(setupOneParamStatic);

    const conditions = [
      {
        parent: 0,
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: AbiType.None,
        operator: Operator.And,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: AbiType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [1]),
      },
    ];

    await scopeFunction(conditions);

    await expect(invoke(2))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, ZeroHash);
  });
  it("evaluates operator And with multiple children", async () => {
    const { roles, scopeFunction, invoke } =
      await loadFixture(setupOneParamStatic);

    const conditions = [
      {
        parent: 0,
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: AbiType.None,
        operator: Operator.And,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: AbiType.Static,
        operator: Operator.GreaterThan,
        compValue: defaultAbiCoder.encode(["uint256"], [15]),
      },
      {
        parent: 1,
        paramType: AbiType.Static,
        operator: Operator.LessThan,
        compValue: defaultAbiCoder.encode(["uint256"], [30]),
      },
    ];
    await scopeFunction(conditions);

    await expect(invoke(1))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, ZeroHash);
    await expect(invoke(15))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, ZeroHash);

    await expect(invoke(30))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterGreaterThanAllowed, ZeroHash);

    await expect(invoke(100))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterGreaterThanAllowed, ZeroHash);

    await expect(invoke(20)).to.not.be.reverted;
  });
  it("evaluates operator And, with type equivalent siblings children", async () => {
    const {
      roles,
      scopeFunction,
      testContract,
      invoke: _invoke,
    } = await loadFixture(setupTwoParamsStaticDynamic);

    const conditions = flattenCondition({
      paramType: AbiType.Calldata,
      operator: Operator.Matches,
      children: [
        {
          paramType: AbiType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["uint256"], [987]),
        },
        {
          paramType: AbiType.None,
          operator: Operator.And,
          children: [
            {
              paramType: AbiType.AbiEncoded,
              operator: Operator.Matches,
              children: [
                {
                  paramType: AbiType.Static,
                  operator: Operator.GreaterThan,
                  compValue: defaultAbiCoder.encode(["uint256"], [10]),
                },
              ],
            },
            {
              paramType: AbiType.AbiEncoded,
              operator: Operator.Matches,
              children: [
                {
                  paramType: AbiType.Static,
                  operator: Operator.LessThan,
                  compValue: defaultAbiCoder.encode(["uint256"], [20]),
                },
              ],
            },
          ],
        },
      ],
    }) as ConditionFlatStruct[];

    await scopeFunction(conditions);

    const invoke = (a: number, b: number) => {
      const embedded = defaultAbiCoder.encode(["uint256"], [b]);
      return _invoke(a, embedded);
    };

    await expect(invoke(987, 11)).to.not.be.reverted;
    await expect(invoke(987, 19)).to.not.be.reverted;

    await expect(invoke(987, 10))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, ZeroHash);
    await expect(invoke(987, 20))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterGreaterThanAllowed, ZeroHash);
  });
  it("evaluates operator And, with variant children", async () => {
    const {
      roles,
      scopeFunction,
      invoke: _invoke,
    } = await loadFixture(setupTwoParamsStaticDynamic);

    const conditions = flattenCondition({
      paramType: AbiType.Calldata,
      operator: Operator.Matches,
      children: [
        {
          paramType: AbiType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["uint256"], [987]),
        },
        {
          paramType: AbiType.None,
          operator: Operator.And,
          children: [
            {
              paramType: AbiType.AbiEncoded,
              operator: Operator.Matches,
              children: [
                {
                  paramType: AbiType.Static,
                  operator: Operator.EqualTo,
                  compValue: defaultAbiCoder.encode(["uint256"], [1]),
                },
                {
                  paramType: AbiType.Static,
                  operator: Operator.EqualTo,
                  compValue: defaultAbiCoder.encode(["uint256"], [2]),
                },
              ],
            },
            {
              paramType: AbiType.AbiEncoded,
              operator: Operator.Matches,
              children: [
                {
                  paramType: AbiType.Static,
                  operator: Operator.EqualTo,
                  compValue: defaultAbiCoder.encode(["uint256"], [1]),
                },
                {
                  paramType: AbiType.Static,
                  operator: Operator.EqualTo,
                  compValue: defaultAbiCoder.encode(["uint256"], [2]),
                },
                {
                  paramType: AbiType.Static,
                  operator: Operator.EqualTo,
                  compValue: defaultAbiCoder.encode(["uint256"], [3]),
                },
              ],
            },
          ],
        },
      ],
    }) as ConditionFlatStruct[];

    await scopeFunction(conditions);

    const invoke = (a: number, b: number[]) => {
      const embedded =
        b.length > 2
          ? defaultAbiCoder.encode(
              ["uint256", "uint256", "uint256"],
              [b[0], b[1], b[2]],
            )
          : defaultAbiCoder.encode(["uint256", "uint256"], [b[0], b[1]]);
      return _invoke(a, embedded);
    };

    await expect(invoke(987, [1, 2, 3])).to.not.be.reverted;
    await expect(invoke(999, [1, 2, 3])).to.be.reverted;
    await expect(invoke(987, [1, 2]))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.CalldataOverflow,
        "0x0000000000000000000000000000000000000000000000000000000000000064",
      );
    await expect(invoke(999, [1, 2, 5]))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, ZeroHash);
  });

  it.skip("Tracks the resulting consumption");
});
