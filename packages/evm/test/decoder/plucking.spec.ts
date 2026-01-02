import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { Encoding, Operator } from "../utils";

describe("AbiDecoder - Plucking", () => {
  async function setup() {
    const MockDecoder = await hre.ethers.getContractFactory("MockDecoder");
    const decoder = await MockDecoder.deploy();

    return { decoder };
  }

  describe("Payload location extraction", () => {
    describe("static types", () => {
      it.skip("extracts correct location for first static parameter");

      it.skip("extracts correct location for second static parameter");

      it.skip("extracts correct location for nth static parameter");

      it.skip("reports size = 32 for static types");
    });

    describe("dynamic types", () => {
      it.skip(
        "extracts correct location for dynamic parameter (points to length)",
      );

      it.skip("extracts correct size for dynamic parameter");

      it.skip("handles bytes type");

      it.skip("handles string type");
    });

    describe("tuple types", () => {
      it.skip("extracts correct location for tuple start");

      it.skip("extracts correct locations for tuple fields");

      it.skip("handles nested tuple field locations");

      it.skip("handles inlined vs non-inlined tuples");
    });

    describe("array types", () => {
      it.skip("extracts correct location for array start (length field)");

      it.skip("extracts correct locations for array elements");

      it.skip("handles array of static types");

      it.skip("handles array of dynamic types");

      it.skip("handles array of tuples");
    });
  });

  describe("AbiEncoded parameter extraction", () => {
    describe("leading bytes", () => {
      it.skip("skips selector (4 bytes) by default");

      it.skip("respects custom leadingBytes value");

      it.skip("handles leadingBytes = 0 (no skip)");
    });

    describe("parameter order", () => {
      it.skip("extracts parameters in declaration order");

      it.skip("handles mixed static and dynamic parameters");

      it.skip("handles complex parameter signatures");
    });
  });

  describe("Inlined flag", () => {
    it.skip("marks static types as inlined");

    it.skip("marks static tuples as inlined");

    it.skip("marks dynamic types as not inlined");

    it.skip("marks arrays as not inlined");

    it.skip("marks tuples with dynamic children as not inlined");
  });

  describe("Variant handling", () => {
    describe("Or branches", () => {
      it.skip("creates variant payload for Or with different child types");

      it.skip("extracts all branches for variant");

      it.skip("marks variant flag on parent payload");
    });

    describe("type equivalence", () => {
      it.skip("treats Dynamic and AbiEncoded as equivalent");

      it.skip("does not create variant for equivalent types");
    });
  });

  describe("Complex structures", () => {
    describe("tuple with nested types", () => {
      it.skip("correctly extracts nested static tuple fields");

      it.skip("correctly extracts nested dynamic tuple fields");

      it.skip("correctly extracts tuple containing array");
    });

    describe("array with complex elements", () => {
      it.skip("correctly extracts array of static tuples");

      it.skip("correctly extracts array of dynamic tuples");

      it.skip("correctly handles varying element sizes");
    });

    describe("deeply nested structures", () => {
      it.skip("handles tuple within tuple within tuple");

      it.skip("handles array within tuple within array");

      it.skip("maintains correct location offsets at all levels");
    });
  });

  describe("Size calculation", () => {
    it.skip("reports 32 for word-sized static types");

    it.skip("reports actual byte length for dynamic types");

    it.skip("reports full tuple size for inlined tuples");

    it.skip("reports 0 for EtherValue (context.value)");
  });

  describe("Edge cases", () => {
    it.skip("handles empty function (no parameters)");

    it.skip("handles single parameter");

    it.skip("handles maximum parameter count");

    it.skip("handles zero-length dynamic data");
  });
});
