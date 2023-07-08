import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { defaultAbiCoder } from "ethers/lib/utils";

import {
  setupOneParamArrayOfStatic,
  setupOneParamArrayOfStaticTuple,
} from "./setup";
import {
  BYTES32_ZERO,
  Operator,
  ParameterType,
  PermissionCheckerStatus,
} from "../utils";

describe("Operator - ArrayEvery", async () => {
  it("evaluates Operator ArrayEvery", async () => {
    const { roles, invoke, scopeFunction } = await loadFixture(
      setupOneParamArrayOfStaticTuple
    );

    await scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Array,
        operator: Operator.ArrayEvery,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: ParameterType.Tuple,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 2,
        paramType: ParameterType.Static,
        operator: Operator.LessThan,
        compValue: defaultAbiCoder.encode(["uint256"], [1000]),
      },
      {
        parent: 2,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["bool"], [true]),
      },
    ]);

    await expect(invoke([])).to.not.be.reverted;
    await expect(invoke([{ a: 999, b: true }])).to.not.be.reverted;
    await expect(
      invoke([
        { a: 999, b: true },
        { a: 100, b: true },
      ])
    ).to.not.be.reverted;

    await expect(
      invoke([
        { a: 999, b: false },
        { a: 100, b: true },
      ])
    )
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.NotEveryArrayElementPasses,
        BYTES32_ZERO
      );

    await expect(
      invoke([
        { a: 999, b: true },
        { a: 1000, b: true },
      ])
    )
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.NotEveryArrayElementPasses,
        BYTES32_ZERO
      );
  });
  it("evaluates Operator ArrayEvery - empty input", async () => {
    const { roles, invoke, scopeFunction } = await loadFixture(
      setupOneParamArrayOfStatic
    );

    await scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Array,
        operator: Operator.ArrayEvery,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [1234]),
      },
    ]);

    await expect(invoke([])).to.not.be.reverted;
    await expect(invoke([1234])).to.not.be.reverted;
    await expect(invoke([1234, 1234])).to.not.be.reverted;

    await expect(invoke([1234, 1233, 1234]))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(
        PermissionCheckerStatus.NotEveryArrayElementPasses,
        BYTES32_ZERO
      );
  });
});
