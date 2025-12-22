import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { AbiCoder, ZeroHash } from "ethers";

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

import {
  setupOneParamArrayOfStatic,
  setupOneParamStaticTuple,
  setupTwoParamsStatic,
} from "../setup";
import { Encoding, Operator, PermissionCheckerStatus } from "../utils";

describe("Operator - Matches", async () => {
  it("throws on children length mismatch", async () => {
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
        operator: Operator.Matches,
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
        operator: Operator.Pass,
        compValue: "0x",
      },
    ]);

    await expect(invoke([100, 2, 3]))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAMatch, ZeroHash);

    await expect(invoke([100, 8888])).to.not.be.reverted;

    await expect(invoke([100]))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAMatch, ZeroHash);
  });

  it("evaluates operator Matches for Tuple", async () => {
    const { roles, invoke, allowFunction } = await loadFixture(
      setupOneParamStaticTuple,
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
        paramType: Encoding.Tuple,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: Encoding.Static,
        operator: Operator.GreaterThan,
        compValue: defaultAbiCoder.encode(["uint256"], [100]),
      },
      {
        parent: 1,
        paramType: Encoding.Static,
        operator: Operator.Pass,
        compValue: "0x",
      },
    ]);

    await expect(invoke({ a: 101, b: false })).to.not.be.reverted;
    await expect(invoke({ a: 101, b: true })).to.not.be.reverted;
    await expect(invoke({ a: 100, b: true }))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, ZeroHash);
  });

  it("evaluates operator Matches for Array", async () => {
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
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: Encoding.Static,
        operator: Operator.Pass,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: Encoding.Static,
        operator: Operator.LessThan,
        compValue: defaultAbiCoder.encode(["uint256"], [100]),
      },
    ]);

    await expect(invoke([1111, 99])).to.not.be.reverted;
    await expect(invoke([1111, 99, 100]))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterNotAMatch, ZeroHash);

    await expect(invoke([1111, 100]))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterGreaterThanAllowed, ZeroHash);
  });

  it("evaluates operator Matches for Array - empty", async () => {
    const { allowFunction } = await loadFixture(setupOneParamArrayOfStatic);

    await expect(
      allowFunction([
        {
          parent: 0,
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.Array,
          operator: Operator.Matches,
          compValue: "0x",
        },
      ]),
    ).to.be.reverted; // "UnsuitableChildrenCount"
  });

  it("evaluates operator Matches for AbiEncoded", async () => {
    const { roles, invoke, allowFunction } =
      await loadFixture(setupTwoParamsStatic);

    await allowFunction([
      {
        parent: 0,
        paramType: Encoding.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: Encoding.Static,
        operator: Operator.Pass,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: Encoding.Static,
        operator: Operator.GreaterThan,
        compValue: defaultAbiCoder.encode(["uint256"], [100]),
      },
    ]);

    await expect(invoke(2222, 100))
      .to.be.revertedWithCustomError(roles, "ConditionViolation")
      .withArgs(PermissionCheckerStatus.ParameterLessThanAllowed, ZeroHash);

    await expect(invoke(2222, 101)).to.not.be.reverted;
  });

  it.skip("Tracks the resulting consumption");
});
