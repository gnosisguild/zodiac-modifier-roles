import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { defaultAbiCoder } from "ethers/lib/utils";

import { setupOneParamArrayOfStaticTuple } from "./setup";
import { Operator, ParameterType, PermissionCheckerStatus } from "../utils";

describe("Operator - ArrayEvery", async () => {
  it("can't set up more than one child rule for ArrayEvery", async () => {
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
          operator: Operator.ArrayEvery,
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

  it("evaluates an ArrayEvery condition", async () => {
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
        operator: Operator.ArrayEvery,
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
        operator: Operator.LessThan,
        compValue: defaultAbiCoder.encode(["uint256"], [1000]),
      },
      {
        parent: 2,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["bool"], [true]),
      },
    ]);

    await expect(invoke([])).to.not.be.reverted;
    await expect(invoke([{ a: 999, b: true }])).to.not.be.reverted;
    await expect(
      invoke([
        { a: 999, b: true },
        { a: 100, b: true },
      ])
    ).to.not.be.reverted;

    await expect(
      invoke([
        { a: 999, b: false },
        { a: 100, b: true },
      ])
    )
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.NotEveryArrayElementPasses);

    await expect(
      invoke([
        { a: 999, b: true },
        { a: 1000, b: true },
      ])
    )
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.NotEveryArrayElementPasses);
  });
});
