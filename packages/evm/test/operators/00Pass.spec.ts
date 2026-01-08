import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { setup } from "../setup";
import {
  Operator,
  Encoding,
  ExecutionOptions,
  flattenCondition,
} from "../utils";

describe("Operator - Pass", () => {
  describe("core behavior", () => {
    it("allows any parameter value", async () => {
      const { roles, member, testContract, roleKey } = await loadFixture(setup);

      const address = await testContract.getAddress();
      const selector =
        testContract.interface.getFunction("oneParamStatic").selector;

      await roles.allowFunction(
        roleKey,
        address,
        selector,
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
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            address,
            0,
            (await testContract.oneParamStatic.populateTransaction(0)).data,
            0,
          ),
      ).to.not.be.reverted;

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            address,
            0,
            (await testContract.oneParamStatic.populateTransaction(999)).data,
            0,
          ),
      ).to.not.be.reverted;
    });
  });
});
