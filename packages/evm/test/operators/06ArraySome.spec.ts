import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { defaultAbiCoder } from "ethers/lib/utils";

import {
  setupOneParamArrayOfStatic,
  setupOneParamArrayOfStaticTuple,
  setupOneParamStaticTuple,
  setupTwoParamsStatic,
} from "./setup";
import { Operator, ParameterType } from "../utils";

describe("Operator - ArraySome", async () => {
  it("can't set up several child rules for ArraySome", async () => {
    const { scopeFunction } = await loadFixture(
      setupOneParamArrayOfStaticTuple
    );

    await expect(
      scopeFunction([
        {
          parent: 0,
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: ParameterType.Array,
          operator: Operator.ArraySome,
          compValue: "0x",
        },
        {
          parent: 1,
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
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
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 2,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["bool"], [true]),
        },
        {
          parent: 3,
          paramType: ParameterType.Static,
          operator: Operator.Pass,
          compValue: "0x",
        },
        {
          parent: 3,
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: defaultAbiCoder.encode(["bool"], [true]),
        },
      ])
    ).to.be.reverted;
  });
  it("evaluates ArraySome", async () => {
    const { roles, invoke, scopeFunction } = await loadFixture(
      setupOneParamArrayOfStaticTuple
    );

    scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Array,
        operator: Operator.ArraySome,
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
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["uint256"], [1234]),
      },
      {
        parent: 2,
        paramType: ParameterType.Static,
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
      ])
    ).to.not.be.reverted;

    await expect(invoke([{ a: 1234, b: false }])).to.be.revertedWithCustomError(
      roles,
      "NoArrayElementPasses"
    );
  });

  it("evaluates a Matches for Tuple", async () => {
    // ..
    const { roles, invoke, scopeFunction } = await loadFixture(
      setupOneParamStaticTuple
    );

    await scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Tuple,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.GreaterThan,
        compValue: defaultAbiCoder.encode(["uint256"], [100]),
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.Pass,
        compValue: "0x",
      },
    ]);

    await expect(invoke({ a: 101, b: false })).to.not.be.reverted;
    await expect(invoke({ a: 101, b: true })).to.not.be.reverted;
    await expect(invoke({ a: 100, b: true })).to.be.revertedWithCustomError(
      roles,
      "ParameterLessThanAllowed"
    );
  });

  it("evaluates a Matches for Array", async () => {
    const { invoke, scopeFunction } = await loadFixture(
      setupOneParamArrayOfStatic
    );

    await scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Array,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.Pass,
        compValue: "0x",
      },
      {
        parent: 1,
        paramType: ParameterType.Static,
        operator: Operator.LessThan,
        compValue: defaultAbiCoder.encode(["uint256"], [100]),
      },
    ]);

    await expect(invoke([1111, 99])).to.not.be.reverted;
  });

  it("evaluates a Matches for AbiEncoded", async () => {
    const { roles, invoke, scopeFunction } = await loadFixture(
      setupTwoParamsStatic
    );

    await scopeFunction([
      {
        parent: 0,
        paramType: ParameterType.AbiEncoded,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Static,
        operator: Operator.Pass,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Static,
        operator: Operator.GreaterThan,
        compValue: defaultAbiCoder.encode(["uint256"], [100]),
      },
    ]);

    await expect(invoke(2222, 100)).to.be.revertedWithCustomError(
      roles,
      "ParameterLessThanAllowed"
    );

    await expect(invoke(2222, 101)).to.not.be.reverted;
  });

  it.skip("Tracks the resulting trace");
});
