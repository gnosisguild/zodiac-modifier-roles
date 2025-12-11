import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { AbiCoder } from "ethers";

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

import { setupOneParamArrayOfStaticTuple } from "../setup";
import {
  Encoding,
  BYTES32_ZERO,
  Operator,
  PermissionCheckerStatus,
} from "../utils";

describe("Operator - ArraySome", async () => {
  it("evaluates operator ArraySome", async () => {
    const { roles, invoke, scopeFunction } = await loadFixture(
      setupOneParamArrayOfStaticTuple,
    );

    scopeFunction([
      {
        parent: 0,
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: Encoding.Array,
        operator: Operator.ArraySome,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: Encoding.Tuple,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 2,
        paramType: Encoding.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [1234]),
      },
      {
        parent: 2,
        paramType: Encoding.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["bool"], [true]),
      },
    ]);

    await expect(invoke([])).to.be.reverted;
    await expect(invoke([{ a: 1234, b: true }])).to.not.be.reverted;
    await expect(
      invoke([
        { a: 1234, b: true },
        { a: 1234, b: false },
      ]),
    ).to.not.be.reverted;

    await expect(invoke([{ a: 1234, b: false }]))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.NoArrayElementPasses, BYTES32_ZERO);
  });
});
