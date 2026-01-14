import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { setupTestContract, setupOneParam } from "../setup";
import {
  Operator,
  Encoding,
  ExecutionOptions,
  flattenCondition,
} from "../utils";

describe("Operator - Pass", () => {
  describe("core behavior", () => {
    it("allows any parameter value", async () => {
      const { allowFunction, invoke } = await loadFixture(setupOneParam);

      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Static,
              operator: Operator.Pass,
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Any value passes - the operator performs no validation
      await expect(invoke(0)).to.not.be.reverted;
      await expect(invoke(999)).to.not.be.reverted;
    });
  });

  describe("integrity", () => {
    it("reverts UnsuitableCompValue when compValue is not empty", async () => {
      const { roles, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      await expect(
        roles.allowTarget(
          roleKey,
          testContractAddress,
          [
            {
              parent: 0,
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x".padEnd(66, "0"),
            },
          ],
          0,
        ),
      ).to.be.revertedWithCustomError(roles, "UnsuitableCompValue");
    });
  });
});
