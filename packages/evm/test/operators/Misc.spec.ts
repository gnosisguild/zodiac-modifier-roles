import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import {
  AbiType,
  BYTES32_ZERO,
  flattenCondition,
  Operator,
  PermissionCheckerStatus,
} from "../utils";
import { setupOneParamArrayOfBytes, setupOneParamBytes } from "../setup";
import { Interface, AbiCoder, ZeroHash } from "ethers";

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

describe("Operator - Misc", async () => {
  it("evaluates operator Bitmask and EqualsTo with type equivalent tree", async () => {
    const { roles, scopeFunction, invoke } =
      await loadFixture(setupOneParamBytes);

    const maskCompValue = (selector: string) => {
      const shift = "0000";
      const mask = "ffffffff".padEnd(30, "0");
      const expected = selector.slice(2).padEnd(30, "0");
      return `0x${shift}${mask}${expected}`;
    };

    const iface = new Interface([
      "function fnOut(bytes a)",
      "function fnAllowed1(uint256 a)",
      "function fnAllowed2(uint256 a)",
      "function fnOther(uint256 a)",
    ]);
    const fnAllowed1 = iface.getFunction("fnAllowed1");
    const fnAllowed2 = iface.getFunction("fnAllowed2");
    if (!fnAllowed1 || !fnAllowed2) return;

    await scopeFunction([
      {
        parent: 0,
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: AbiType.None,
        operator: Operator.And,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: AbiType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: AbiType.None,
        operator: Operator.Or,
        compValue: "0x",
      },
      {
        parent: 2,
        paramType: AbiType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [123456]),
      },

      {
        parent: 3,
        paramType: AbiType.Dynamic,
        operator: Operator.Bitmask,
        compValue: maskCompValue(fnAllowed1.selector),
      },
      {
        parent: 3,
        paramType: AbiType.Dynamic,
        operator: Operator.Bitmask,
        compValue: maskCompValue(fnAllowed2.selector),
      },
    ]);

    await expect(invoke(iface.encodeFunctionData("fnAllowed1", [123456]))).to
      .not.be.reverted;

    await expect(invoke(iface.encodeFunctionData("fnAllowed2", [123456]))).to
      .not.be.reverted;

    await expect(invoke(iface.encodeFunctionData("fnOther", [123456])))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.OrViolation, BYTES32_ZERO);

    await expect(invoke(iface.encodeFunctionData("fnAllowed1", [1])))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
  });

  it("It is possible to setup sibling TypeEquivalence when the first element is Dynamic, and others are Dynamic or AbiEncoded or Calldata", async () => {
    const { scopeFunction } = await loadFixture(setupOneParamBytes);

    const maskCompValue = (selector: string) => {
      const shift = "0000";
      const mask = "ffffffff".padEnd(30, "0");
      const expected = selector.slice(2).padEnd(30, "0");
      return `0x${shift}${mask}${expected}`;
    };

    const iface = new Interface([
      "function fnOut(bytes a)",
      "function fnAllowed1(uint256 a)",
      "function fnAllowed2(uint256 a)",
      "function fnOther(uint256 a)",
    ]);
    const fnAllowed1 = iface.getFunction("fnAllowed1");
    const fnAllowed2 = iface.getFunction("fnAllowed2");
    if (!fnAllowed1 || !fnAllowed2) return;
    await expect(
      scopeFunction([
        {
          parent: 0,
          paramType: AbiType.Calldata,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: AbiType.None,
          operator: Operator.And,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: AbiType.None,
          operator: Operator.Or,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: AbiType.Calldata,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: AbiType.Dynamic,
          operator: Operator.Bitmask,
          compValue: maskCompValue(fnAllowed1.selector),
        },
        {
          parent: 2,
          paramType: AbiType.Dynamic,
          operator: Operator.Bitmask,
          compValue: maskCompValue(fnAllowed2.selector),
        },
        {
          parent: 3,
          paramType: AbiType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["uint256"], [123456]),
        },
      ]),
    ).to.not.be.reverted;
  });

  it("evalutes array.every(OR())", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamArrayOfBytes,
    );

    const conditions = flattenCondition({
      paramType: AbiType.Calldata,
      operator: Operator.Matches,
      children: [
        {
          paramType: AbiType.Array,
          operator: Operator.ArrayEvery,
          children: [
            {
              paramType: AbiType.None,
              operator: Operator.Or,
              children: [
                // Variant 1: AbiEncoded with single uint256
                {
                  paramType: AbiType.AbiEncoded,
                  operator: Operator.Matches,
                  children: [
                    {
                      paramType: AbiType.Static,
                      operator: Operator.GreaterThan,
                      compValue: defaultAbiCoder.encode(["uint256"], [100]),
                    },
                  ],
                },
                // Variant 2: AbiEncoded with tuple(uint256, bytes)
                {
                  paramType: AbiType.AbiEncoded,
                  operator: Operator.Matches,
                  children: [
                    {
                      paramType: AbiType.Tuple,
                      operator: Operator.Matches,
                      children: [
                        {
                          paramType: AbiType.Static,
                          operator: Operator.EqualTo,
                          compValue: defaultAbiCoder.encode(["uint256"], [25]),
                        },
                        {
                          paramType: AbiType.Dynamic,
                          operator: Operator.EqualTo,
                          compValue: encode(["bytes"], ["0xaabbcc"]),
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    await scopeFunction(conditions);

    // Test data - each entry must match one of the variants
    const validArray = [
      encode(["uint256"], [150]), // Variant 1: 150 > 100 ✓
      encode(["tuple(uint256,bytes)"], [[25, "0xaabbcc"]]), // Variant 2: 25 < 50 ✓
      encode(["uint256"], [200]), // Variant 1: 200 > 100 ✓
    ];

    const invalidArray = [
      encode(["uint256"], [150]), // Variant 1: 150 > 100 ✓
      encode(["uint256"], [50]), // Variant 1: 50 < 100 ✗, would need to be Variant 2 but overflow
      encode(["uint256"], [200]), // Variant 1: 200 > 100 ✓
    ];

    await expect(invoke(validArray)).to.not.be.reverted;
    await expect(invoke(invalidArray))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.NotEveryArrayElementPasses, ZeroHash);
  });
});

function encode(types: any, values: any, removeOffset = false) {
  const result = defaultAbiCoder.encode(types, values);
  return removeOffset ? `0x${result.slice(66)}` : result;
}
