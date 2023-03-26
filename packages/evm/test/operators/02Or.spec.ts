import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { defaultAbiCoder } from "ethers/lib/utils";

import { Operator, ParameterType } from "../utils";
import { setupOneParamStatic } from "./setup";

describe("Operator - Or", async () => {
  it("cannot set up an empty Or", async () => {
    const { scopeFunction } = await loadFixture(setupOneParamStatic);

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
          paramType: ParameterType.None,
          operator: Operator.Or,
          compValue: "0x",
        },
      ])
    ).to.be.reverted;
  });

  it("evaluates an Or with a single child", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamStatic
    );

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
        operator: Operator.Or,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [1]),
      },
    ]);

    await expect(invoke(1)).to.not.be.reverted;

    await expect(invoke(2)).to.be.revertedWithCustomError(roles, "OrViolation");
  });

  it("evaluates an Or with multiple children", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamStatic
    );

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
        operator: Operator.Or,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [15]),
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [30]),
      },
    ]);

    await expect(invoke(1)).to.be.revertedWithCustomError(roles, "OrViolation");

    await expect(invoke(15)).to.not.be.reverted;

    await expect(invoke(20)).to.be.revertedWithCustomError(
      roles,
      "OrViolation"
    );

    await expect(invoke(30)).to.not.be.reverted;

    await expect(invoke(100)).to.be.revertedWithCustomError(
      roles,
      "OrViolation"
    );
  });

  it.skip("Tracks the resulting trace");
});
