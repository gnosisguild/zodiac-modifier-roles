import { expect } from "chai";
import { network } from "hardhat";

import { Operator } from "../utils.js";

const connection = await network.create();
const { ethers } = connection;

describe("ConditionEvaluator dispatch", () => {
  after(async () => {
    await connection.close();
  });

  it("fails closed for unsupported operators", async () => {
    const Evaluator = await ethers.getContractFactory(
      "MockConditionEvaluator",
      {
        libraries: {
          WithinRatioChecker: "0x0000000000000000000000000000000000000001",
          CustomConditionChecker: "0x0000000000000000000000000000000000000001",
        },
      },
    );
    const evaluator = await Evaluator.deploy();

    for (const op of [
      Operator._Placeholder03,
      Operator._Placeholder24,
      Operator._Placeholder31,
    ]) {
      await expect(evaluator.evaluate("0x", op))
        .to.be.revertedWithCustomError(evaluator, "UnsupportedOperator")
        .withArgs(7);
    }
  });
});
