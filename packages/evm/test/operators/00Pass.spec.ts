import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Interface } from "ethers";

import { setupFallbacker } from "../setup";
import {
  Operator,
  Encoding,
  ExecutionOptions,
  flattenCondition,
} from "../utils";

describe("Operator - Pass", () => {
  async function setup() {
    const iface = new Interface(["function fn(uint256)"]);
    const fn = iface.getFunction("fn")!;
    const { roles, member, fallbackerAddress, roleKey } =
      await setupFallbacker();

    const invoke = (a: bigint | number) =>
      roles
        .connect(member)
        .execTransactionFromModule(
          fallbackerAddress,
          0,
          iface.encodeFunctionData(fn, [a]),
          0,
        );

    return { roles, member, fallbackerAddress, roleKey, fn, invoke };
  }

  describe("core behavior", () => {
    it("allows any parameter value", async () => {
      const { roles, fallbackerAddress, roleKey, fn, invoke } =
        await loadFixture(setup);

      await roles.allowFunction(
        roleKey,
        fallbackerAddress,
        fn.selector,
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
});
