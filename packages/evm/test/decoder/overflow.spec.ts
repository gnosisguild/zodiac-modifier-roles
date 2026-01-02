import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { Encoding, Operator } from "../utils";

describe("AbiDecoder - Overflow", () => {
  async function setup() {
    const MockDecoder = await hre.ethers.getContractFactory("MockDecoder");
    const decoder = await MockDecoder.deploy();

    return { decoder };
  }

  describe("Basic cases", () => {
    describe("empty/minimal calldata", () => {
      it.skip("overflows on empty calldata");

      it.skip("overflows on calldata with only selector");
    });

    describe("static types", () => {
      it.skip("overflows when static type is missing");

      it.skip("overflows when static type is too short (partial word)");

      it.skip("does not overflow with complete static type");
    });

    describe("dynamic types", () => {
      it.skip("overflows when dynamic type head (offset) is missing");

      it.skip("overflows when dynamic type head is too short");

      it.skip("overflows when dynamic type tail (data) is missing");

      it.skip("overflows when dynamic type tail is too short");

      it.skip(
        "overflows when dynamic type tail is not padded to word boundary",
      );

      it.skip("does not overflow with complete dynamic type");
    });
  });

  describe("Tuple (struct) types", () => {
    describe("static tuple", () => {
      it.skip("overflows when static field is missing");

      it.skip("overflows when static field is missing after multi-chunk block");

      it.skip("does not overflow with all static fields present");
    });

    describe("dynamic tuple", () => {
      it.skip("overflows when dynamic field head is missing");

      it.skip("overflows when dynamic field tail is missing");

      it.skip(
        "overflows when dynamic field head is missing after static block",
      );

      it.skip("does not overflow with complete dynamic tuple");
    });

    describe("offset validation", () => {
      it.skip("overflows when offset points within head bounds (circular)");

      it.skip("overflows when offset is self-referential");

      it.skip("overflows when offset points outside calldata bounds");

      it.skip("overflows when offset is just one byte too long");
    });
  });

  describe("Array types", () => {
    it.skip("overflows when array element count is incorrect");

    it.skip("overflows when array has length but no body");

    it.skip("overflows when array elements are partially present");

    it.skip("does not overflow with complete array");

    it.skip("does not overflow with empty array (length = 0)");
  });

  describe("Variant (Or) types", () => {
    it.skip(
      "does not overflow when at least one variant branch does not overflow",
    );

    it.skip("overflows when all variant branches overflow");

    it.skip("correctly marks individual branches as overflowed");

    it.skip("sets variant flag to true on variant nodes");
  });

  describe("Nested structures", () => {
    it.skip("overflows on deeply nested tuple with missing inner field");

    it.skip("overflows on array of tuples with incomplete element");

    it.skip("overflows on tuple containing array with insufficient elements");
  });

  describe("Edge cases", () => {
    it.skip("handles large arrays");

    it.skip("handles zero-length dynamic types");
  });
});
