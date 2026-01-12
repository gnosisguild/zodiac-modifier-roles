import { expect } from "chai";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ZeroHash } from "ethers";

import { setupTestContract } from "../setup";
import {
  Encoding,
  Operator,
  ExecutionOptions,
  ConditionViolationStatus,
  flattenCondition,
} from "../utils";
import { ConditionFlatStruct } from "../../typechain-types/contracts/Roles";

describe("Operator - Empty", () => {
  async function setup() {
    const { roles, member, testContractAddress, roleKey } =
      await setupTestContract();

    const allowTarget = (
      conditions: ConditionFlatStruct[],
      options = ExecutionOptions.None,
    ) => roles.allowTarget(roleKey, testContractAddress, conditions, options);

    const invoke = (
      data: string,
      options?: { value?: bigint | number; operation?: number },
    ) =>
      roles
        .connect(member)
        .execTransactionFromModule(
          testContractAddress,
          options?.value ?? 0,
          data,
          options?.operation ?? 0,
        );

    return { roles, allowTarget, invoke };
  }

  describe("core behavior", () => {
    it("passes when calldata is empty", async () => {
      const { allowTarget, invoke } = await loadFixture(setup);

      await allowTarget(
        flattenCondition({
          paramType: Encoding.None,
          operator: Operator.Empty,
        }),
        ExecutionOptions.Both,
      );

      await expect(invoke("0x")).to.not.be.reverted;
    });

    it("fails when calldata is not empty", async () => {
      const { roles, allowTarget, invoke } = await loadFixture(setup);

      await allowTarget(
        flattenCondition({
          paramType: Encoding.None,
          operator: Operator.Empty,
        }),
        ExecutionOptions.Both,
      );

      await expect(invoke("0xdeadbeef"))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.CalldataNotEmpty,
          0, // Empty node
          anyValue,
          anyValue,
        );
    });
  });

  describe("violation context", () => {
    it("reports the violating node index", async () => {
      const { roles, allowTarget, invoke } = await loadFixture(setup);

      await allowTarget(
        flattenCondition({
          paramType: Encoding.None,
          operator: Operator.Empty,
        }),
      );

      await expect(invoke("0xdeadbeef"))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.CalldataNotEmpty,
          0, // Empty node at BFS index 0
          anyValue,
          anyValue,
        );
    });

    it("reports the calldata range of the violation", async () => {
      const { roles, allowTarget, invoke } = await loadFixture(setup);

      await allowTarget(
        flattenCondition({
          paramType: Encoding.None,
          operator: Operator.Empty,
        }),
      );

      await expect(invoke("0xdeadbeef"))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.CalldataNotEmpty,
          anyValue,
          0, // payloadLocation: Empty checks entire calldata
          0, // payloadSize: Empty node has no specific size
        );
    });
  });
});
