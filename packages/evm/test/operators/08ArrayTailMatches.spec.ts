import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { AbiCoder, ZeroHash } from "ethers";

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

import {
  setupOneParamArrayOfStatic,
  setupOneParamArrayOfStaticTuple,
} from "../setup";
import { Encoding, Operator, PermissionCheckerStatus } from "../utils";

describe("Operator - ArrayTailMatches", async () => {
  it("passes when all tail element checks pass", async () => {
    const { invoke, allowFunction } = await loadFixture(
      setupOneParamArrayOfStatic,
    );

    await allowFunction([
      {
        parent: 0,
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: Encoding.Array,
        operator: Operator.ArrayTailMatches,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: Encoding.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [100]),
      },
      {
        parent: 1,
        paramType: Encoding.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [200]),
      },
    ]);

    await expect(invoke([1, 2, 100, 200])).to.not.be.reverted;
    await expect(invoke([1, 2, 3, 100, 200])).to.not.be.reverted;
    await expect(invoke([1, 2, 3, 100, 200, 1])).to.be.reverted;
  });

  it("fails when one of the tail element checks fails", async () => {
    const { roles, invoke, allowFunction } = await loadFixture(
      setupOneParamArrayOfStatic,
    );

    await allowFunction([
      {
        parent: 0,
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: Encoding.Array,
        operator: Operator.ArrayTailMatches,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: Encoding.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [100]),
      },
      {
        parent: 1,
        paramType: Encoding.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [200]),
      },
    ]);

    await expect(invoke([1, 2, 100, 999]))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, ZeroHash);
  });

  it("fails when array is shorter than required tail length", async () => {
    const { roles, invoke, allowFunction } = await loadFixture(
      setupOneParamArrayOfStatic,
    );

    await allowFunction([
      {
        parent: 0,
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: Encoding.Array,
        operator: Operator.ArrayTailMatches,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: Encoding.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [100]),
      },
      {
        parent: 1,
        paramType: Encoding.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [200]),
      },
    ]);

    await expect(invoke([100]))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAMatch, ZeroHash);

    await expect(invoke([]))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAMatch, ZeroHash);
  });

  it("passes when array length equals tail length", async () => {
    const { invoke, allowFunction } = await loadFixture(
      setupOneParamArrayOfStatic,
    );

    await allowFunction([
      {
        parent: 0,
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: Encoding.Array,
        operator: Operator.ArrayTailMatches,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: Encoding.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [123]),
      },
      {
        parent: 1,
        paramType: Encoding.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [456]),
      },
    ]);

    await expect(invoke([123, 456])).to.not.be.reverted;
  });

  it("passes when array is longer than tail length", async () => {
    const { invoke, allowFunction } = await loadFixture(
      setupOneParamArrayOfStatic,
    );

    await allowFunction([
      {
        parent: 0,
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: Encoding.Array,
        operator: Operator.ArrayTailMatches,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: Encoding.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [100]),
      },
      {
        parent: 1,
        paramType: Encoding.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [200]),
      },
    ]);

    // Leading elements can be anything
    await expect(invoke([999, 888, 777, 100, 200])).to.not.be.reverted;
  });

  it("works with complex children like tuples", async () => {
    const { roles, invoke, allowFunction } = await loadFixture(
      setupOneParamArrayOfStaticTuple,
    );

    await allowFunction([
      {
        parent: 0,
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: Encoding.Array,
        operator: Operator.ArrayTailMatches,
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
        compValue: defaultAbiCoder.encode(["uint256"], [100]),
      },
      {
        parent: 2,
        paramType: Encoding.Static,
        operator: Operator.Pass,
        compValue: "0x",
      },
    ]);

    await expect(
      invoke([
        { a: 9999, b: false },
        { a: 100, b: true },
      ]),
    ).to.not.be.reverted;

    await expect(
      invoke([
        { a: 9999, b: false },
        { a: 999, b: true },
      ]),
    )
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAllowed, ZeroHash);
  });
});
