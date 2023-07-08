import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Operator, ParameterType } from "../utils";
import { setupOneParamStatic } from "./setup";

describe("Operator - Pass", async () => {
  it("evaluates a Pass", async () => {
    const { scopeFunction, invoke } = await loadFixture(setupOneParamStatic);

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
        operator: Operator.Pass,
        compValue: "0x",
      },
    ]);

    await expect(invoke(1)).to.not.be.reverted;
  });
});
