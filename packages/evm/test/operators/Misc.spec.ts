import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import {
  BYTES32_ZERO,
  Operator,
  ParameterType,
  PermissionCheckerStatus,
} from "../utils";
import { setupOneParamBytes } from "./setup";
import { Interface, AbiCoder } from "ethers";

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

describe("Operator - Misc", async () => {
  it("evaluates operator Bitmask and EqualsTo with type equivalent tree", async () => {
    const { roles, scopeFunction, invoke } = await loadFixture(
      setupOneParamBytes
    );

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
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.None,
        operator: Operator.And,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: ParameterType.None,
        operator: Operator.Or,
        compValue: "0x",
      },
      {
        parent: 2,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [123456]),
      },

      {
        parent: 3,
        paramType: ParameterType.Dynamic,
        operator: Operator.Bitmask,
        compValue: maskCompValue(fnAllowed1.selector),
      },
      {
        parent: 3,
        paramType: ParameterType.Dynamic,
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

  it("Cannot setup sibling TypeEquivalence when the first element is Dynamic", async () => {
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
          paramType: ParameterType.Calldata,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.None,
          operator: Operator.And,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: ParameterType.None,
          operator: Operator.Or,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: ParameterType.Calldata,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: ParameterType.Dynamic,
          operator: Operator.Bitmask,
          compValue: maskCompValue(fnAllowed1.selector),
        },
        {
          parent: 2,
          paramType: ParameterType.Dynamic,
          operator: Operator.Bitmask,
          compValue: maskCompValue(fnAllowed2.selector),
        },
        {
          parent: 3,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["uint256"], [123456]),
        },
      ])
    ).to.be.reverted;
  });
});
