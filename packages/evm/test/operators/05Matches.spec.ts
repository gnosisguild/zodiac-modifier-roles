import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { AbiCoder } from "ethers";

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

import {
  setupOneParamArrayOfStatic,
  setupOneParamStaticTuple,
  setupTwoParamsStatic,
} from "../setup";
import {
  AbiType,
  BYTES32_ZERO,
  Operator,
  PermissionCheckerStatus,
} from "../utils";

describe("Operator - Matches", async () => {
  it("throws on children length mismatch", async () => {
    const { roles, invoke, scopeFunction } = await loadFixture(
      setupOneParamArrayOfStatic,
    );

    await scopeFunction([
      {
        parent: 0,
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: AbiType.Array,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: AbiType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [100]),
      },
      {
        parent: 1,
        paramType: AbiType.Static,
        operator: Operator.Pass,
        compValue: "0x",
      },
    ]);

    await expect(invoke([100, 2, 3]))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAMatch, BYTES32_ZERO);

    await expect(invoke([100, 8888])).to.not.be.reverted;

    await expect(invoke([100]))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAMatch, BYTES32_ZERO);
  });

  it("evaluates operator Matches for Tuple", async () => {
    const { roles, invoke, scopeFunction } = await loadFixture(
      setupOneParamStaticTuple,
    );

    await scopeFunction([
      {
        parent: 0,
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: AbiType.Tuple,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: AbiType.Static,
        operator: Operator.GreaterThan,
        compValue: defaultAbiCoder.encode(["uint256"], [100]),
      },
      {
        parent: 1,
        paramType: AbiType.Static,
        operator: Operator.Pass,
        compValue: "0x",
      },
    ]);

    await expect(invoke({ a: 101, b: false })).to.not.be.reverted;
    await expect(invoke({ a: 101, b: true })).to.not.be.reverted;
    await expect(invoke({ a: 100, b: true }))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, BYTES32_ZERO);
  });

  it("evaluates operator Matches for Array", async () => {
    const { roles, invoke, scopeFunction } = await loadFixture(
      setupOneParamArrayOfStatic,
    );

    await scopeFunction([
      {
        parent: 0,
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: AbiType.Array,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: AbiType.Static,
        operator: Operator.Pass,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: AbiType.Static,
        operator: Operator.LessThan,
        compValue: defaultAbiCoder.encode(["uint256"], [100]),
      },
    ]);

    await expect(invoke([1111, 99])).to.not.be.reverted;
    await expect(invoke([1111, 99, 100]))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAMatch, BYTES32_ZERO);

    await expect(invoke([1111, 100]))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.ParameterGreaterThanAllowed,
        BYTES32_ZERO,
      );
  });

  it("evaluates operator Matches for Array - empty", async () => {
    const { scopeFunction } = await loadFixture(setupOneParamArrayOfStatic);

    await expect(
      scopeFunction([
        {
          parent: 0,
          paramType: AbiType.Calldata,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: AbiType.Array,
          operator: Operator.Matches,
          compValue: "0x",
        },
      ]),
    ).to.be.reverted; // "UnsuitableChildrenCount"
  });

  it("evaluates operator Matches for Calldata", async () => {
    const { roles, invoke, scopeFunction } =
      await loadFixture(setupTwoParamsStatic);

    await scopeFunction([
      {
        parent: 0,
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: AbiType.Static,
        operator: Operator.Pass,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: AbiType.Static,
        operator: Operator.GreaterThan,
        compValue: defaultAbiCoder.encode(["uint256"], [100]),
      },
    ]);

    await expect(invoke(2222, 100))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, BYTES32_ZERO);

    await expect(invoke(2222, 101)).to.not.be.reverted;
  });

  it.skip("Tracks the resulting consumption");
});
