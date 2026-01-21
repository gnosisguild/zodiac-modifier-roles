import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Interface } from "ethers";
import { setupTestContract } from "../setup";
import {
  Encoding,
  ExecutionOptions,
  Operator,
  flattenCondition,
  packConditions,
} from "../utils";
import { bigConditionCandidates } from "./big_condition_candidates";

describe("Big Condition Scenario", () => {
  // skip because this breaks the coverage report
  it.skip("should store a ~750-node condition with a big OR on fn(bytes, uint256, address)", async () => {
    const iface = new Interface(["function fn(bytes,uint256,address)"]);
    const fn = iface.getFunction("fn")!;
    const { roles, testContractAddress, roleKey } =
      await loadFixture(setupTestContract);

    const allowFunction = async (conditions: any[]) => {
      const packed = await packConditions(roles, conditions);
      return roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
        packed,
        ExecutionOptions.Both,
      );
    };

    // The first parameter is a bytes payload. We interpret it as ABI-encoded data
    // (leadingBytes = 0) and apply a large OR over production-derived conditions.
    // Other parameters are left unconstrained (Pass).
    const rootCondition = {
      paramType: Encoding.AbiEncoded,
      operator: Operator.Matches,
      children: [
        {
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x0000",
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.Or,
              children: bigConditionCandidates as any[],
            },
          ],
        },
        { paramType: Encoding.Static, operator: Operator.Pass },
        { paramType: Encoding.Static, operator: Operator.Pass },
      ],
    };

    const flat = flattenCondition(rootCondition);

    console.log(`Testing with ${bigConditionCandidates.length} candidates.`);
    console.log(`Flattens to ${flat.length} condition nodes.`);

    await allowFunction(flat);
  });
});
