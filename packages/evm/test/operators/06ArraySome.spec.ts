import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { defaultAbiCoder } from "ethers/lib/utils";

import { setupOneParamArrayOfStaticTuple } from "./setup";
import { Operator, ParameterType, PermissionCheckerStatus } from "../utils";

describe("Operator - ArraySome", async () => {
  it("can't set more than one child rules for ArraySome", async () => {
    const { scopeFunction } = await loadFixture(
      setupOneParamArrayOfStaticTuple
    );

    await expect(
      scopeFunction([
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Array,
          operator: Operator.ArraySome,
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
        {
          parent: 2,
          paramType: ParameterType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["bool"], [true]),
        },
        {
          parent: 3,
          paramType: ParameterType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 3,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["bool"], [true]),
        },
      ])
    ).to.be.reverted;
  });

  it("evaluates an ArraySome condition", async () => {
    const { roles, invoke, scopeFunction } = await loadFixture(
      setupOneParamArrayOfStaticTuple
    );

    scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Array,
        operator: Operator.ArraySome,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: ParameterType.Tuple,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 2,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [1234]),
      },
      {
        parent: 2,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["bool"], [true]),
      },
    ]);

    await expect(invoke([])).to.be.reverted;
    await expect(invoke([{ a: 1234, b: true }])).to.not.be.reverted;
    await expect(
      invoke([
        { a: 1234, b: true },
        { a: 1234, b: false },
      ])
    ).to.not.be.reverted;

    await expect(invoke([{ a: 1234, b: false }]))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.NoArrayElementPasses);
  });
});
