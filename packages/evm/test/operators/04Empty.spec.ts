import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ZeroHash } from "ethers";

import { setupFallbacker } from "../setup";
import {
  Encoding,
  Operator,
  ExecutionOptions,
  ConditionViolationStatus,
  flattenCondition,
} from "../utils";

describe("Operator - Empty", () => {
  describe("core behavior", () => {
    it("passes when calldata is empty", async () => {
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupFallbacker);

      await roles.allowTarget(
        roleKey,
        testContractAddress,
        flattenCondition({
          paramType: Encoding.None,
          operator: Operator.Empty,
        }),
        ExecutionOptions.Both,
      );

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, "0x", 0),
      ).to.not.be.reverted;
    });

    it("fails when calldata is not empty", async () => {
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupFallbacker);

      await roles.allowTarget(
        roleKey,
        testContractAddress,
        flattenCondition({
          paramType: Encoding.None,
          operator: Operator.Empty,
        }),
        ExecutionOptions.Both,
      );

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, "0xdeadbeef", 0),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.CalldataNotEmpty, ZeroHash);
    });
  });
});
