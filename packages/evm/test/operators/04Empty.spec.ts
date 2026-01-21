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
  packConditions,
} from "../utils";
import { ConditionFlatStruct } from "../../typechain-types/contracts/Roles";

describe("Operator - Empty", () => {
  async function setup() {
    const { roles, member, testContractAddress, roleKey } =
      await setupTestContract();

    const allowTarget = async (
      conditions: ConditionFlatStruct[],
      options = ExecutionOptions.None,
    ) => {
      const packed = await packConditions(roles, conditions);
      return roles.allowTarget(roleKey, testContractAddress, packed, options);
    };

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

  describe("integrity", () => {
    it("reverts UnsuitableParameterType for invalid encodings", async () => {
      const { roles } = await loadFixture(setupTestContract);

      for (const encoding of [
        Encoding.Static,
        Encoding.Dynamic,
        Encoding.Tuple,
        Encoding.Array,
        Encoding.AbiEncoded,
        Encoding.EtherValue,
      ]) {
        await expect(
          packConditions(roles, [
            {
              parent: 0,
              paramType: Encoding.None,
              operator: Operator.Or,
              compValue: "0x",
            },
            {
              parent: 0,
              paramType: encoding,
              operator: Operator.Empty,
              compValue: "0x",
            },
          ]),
        ).to.be.revertedWithCustomError(roles, "UnsuitableParameterType");
      }
    });

    it("reverts UnsuitableCompValue when compValue is not empty", async () => {
      const { roles } = await loadFixture(setupTestContract);

      await expect(
        packConditions(roles, [
          {
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.Or,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.Empty,
            compValue: "0x01",
          },
        ]),
      ).to.be.revertedWithCustomError(roles, "UnsuitableCompValue");
    });

    it("reverts LeafNodeCannotHaveChildren when Empty has children", async () => {
      const { roles } = await loadFixture(setupTestContract);

      await expect(
        packConditions(roles, [
          {
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.Or,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.Empty,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
        ]),
      ).to.be.revertedWithCustomError(roles, "LeafNodeCannotHaveChildren");
    });
  });
});
