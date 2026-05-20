import { expect } from "chai";
import { network } from "hardhat";

import { createSetup } from "../setup.js";
import { Encoding, Operator, packConditions } from "../utils.js";

const connection = await network.create();
const { networkHelpers } = connection;
const { loadFixture } = networkHelpers;
const { setupTestContract } = createSetup(connection);

describe("Operator - Pluck", () => {
  after(async () => {
    await connection.close();
  });

  describe("integrity", () => {
    it("reverts UnsuitableParameterType for invalid encodings", async () => {
      const { roles } = await loadFixture(setupTestContract);

      // Note: Array is now allowed for Pluck (used by Zip operators)

      await expect(
        packConditions(roles, [
          {
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.Pluck,
            compValue: "0x00",
          },
        ]),
      ).to.be.revertedWithCustomError(roles, "UnsuitableParameterType");
    });

    describe("compValue", () => {
      it("reverts UnsuitableCompValue when compValue is not 1 byte", async () => {
        const { roles } = await loadFixture(setupTestContract);

        await expect(
          packConditions(roles, [
            {
              parent: 0,
              paramType: Encoding.Static,
              operator: Operator.Pluck,
              compValue: "0x0000", // 2 bytes instead of 1
            },
          ]),
        ).to.be.revertedWithCustomError(roles, "UnsuitableCompValue");
      });

      it("reverts UnsuitableCompValue when index is 255 (reserved)", async () => {
        const { roles } = await loadFixture(setupTestContract);

        await expect(
          packConditions(roles, [
            {
              parent: 0,
              paramType: Encoding.Static,
              operator: Operator.Pluck,
              compValue: "0xff", // index 255 is reserved
            },
          ]),
        ).to.be.revertedWithCustomError(roles, "UnsuitableCompValue");
      });
    });

    it("reverts LeafNodeCannotHaveChildren when Pluck has children", async () => {
      const { roles } = await loadFixture(setupTestContract);

      await expect(
        packConditions(roles, [
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
        ]),
      ).to.be.revertedWithCustomError(roles, "LeafNodeCannotHaveChildren");
    });
  });
});
