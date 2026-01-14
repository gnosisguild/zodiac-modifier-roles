import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { setupTestContract } from "../setup";
import { Encoding, Operator } from "../utils";

describe("Operator - Pluck", () => {
  describe("integrity", () => {
    it("reverts UnsuitableParameterType for invalid encodings", async () => {
      const { roles, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      for (const encoding of [
        Encoding.None,
        Encoding.AbiEncoded,
        Encoding.Tuple,
        Encoding.Array,
        Encoding.Dynamic,
      ]) {
        await expect(
          roles.allowTarget(
            roleKey,
            testContractAddress,
            [
              {
                parent: 0,
                paramType: encoding,
                operator: Operator.Pluck,
                compValue: "0x00",
              },
            ],
            0,
          ),
        ).to.be.revertedWithCustomError(roles, "UnsuitableParameterType");
      }
    });

    describe("compValue", () => {
      it("reverts UnsuitableCompValue when compValue is not 1 byte", async () => {
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
                operator: Operator.Pluck,
                compValue: "0x0000", // 2 bytes instead of 1
              },
            ],
            0,
          ),
        ).to.be.revertedWithCustomError(roles, "UnsuitableCompValue");
      });

      it("reverts UnsuitableCompValue when index is 255 (reserved)", async () => {
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
                operator: Operator.Pluck,
                compValue: "0xff", // index 255 is reserved
              },
            ],
            0,
          ),
        ).to.be.revertedWithCustomError(roles, "UnsuitableCompValue");
      });
    });

    it("reverts LeafNodeCannotHaveChildren when Pluck has children", async () => {
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
              operator: Operator.Pluck,
              compValue: "0x00",
            },
            {
              parent: 0,
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
          ],
          0,
        ),
      ).to.be.revertedWithCustomError(roles, "LeafNodeCannotHaveChildren");
    });
  });
});
