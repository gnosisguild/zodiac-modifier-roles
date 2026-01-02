import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { Encoding, Operator } from "../utils";
import { deployRolesMod } from "../setup";

describe("Integrity", () => {
  async function setup() {
    const [owner] = await hre.ethers.getSigners();

    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();
    const avatarAddress = await avatar.getAddress();

    const roles = await deployRolesMod(
      hre,
      owner.address,
      avatarAddress,
      avatarAddress,
    );

    const ROLE_KEY = hre.ethers.id("TEST_ROLE");
    const TARGET = "0x000000000000000000000000000000000000000f";
    const SELECTOR = "0x12345678";

    const allowFunction = (conditions: any[]) =>
      roles
        .connect(owner)
        .allowFunction(ROLE_KEY, TARGET, SELECTOR, conditions, 0);

    return { roles, owner, allowFunction };
  }

  describe("Root node validation", () => {
    it.skip("reverts UnsuitableRootNode when conditions array is empty");

    it.skip("reverts UnsuitableRootNode when first node parent is not 0");

    it.skip(
      "reverts UnsuitableRootNode when multiple nodes claim to be root (parent == index)",
    );

    it.skip("reverts UnsuitableRootNode when no node is a root");

    it.skip("succeeds with single-node tree where parent == 0");

    it.skip(
      "succeeds when only first node is root and all others have different parents",
    );
  });

  describe("BFS ordering", () => {
    it.skip(
      "reverts NotBFS when parent index decreases (parent[i-1] > parent[i])",
    );

    it.skip(
      "reverts NotBFS when parent index exceeds current index (forward reference)",
    );

    it.skip("succeeds with valid BFS ordering");

    it.skip("succeeds with deeply nested valid BFS tree");
  });

  describe("Operator.Pass validation", () => {
    it.skip("reverts UnsuitableCompValue when Pass has non-empty compValue");

    it.skip("succeeds when Pass has empty compValue");
  });

  describe("Operator.And validation", () => {
    it.skip("reverts UnsuitableParameterType when And has paramType != None");

    it.skip("reverts UnsuitableCompValue when And has non-empty compValue");

    it.skip("reverts UnsuitableChildCount when And has zero children");

    it.skip(
      "succeeds when And has None paramType, empty compValue, and children",
    );
  });

  describe("Operator.Or validation", () => {
    it.skip("reverts UnsuitableParameterType when Or has paramType != None");

    it.skip("reverts UnsuitableCompValue when Or has non-empty compValue");

    it.skip("reverts UnsuitableChildCount when Or has zero children");

    it.skip(
      "succeeds when Or has None paramType, empty compValue, and children",
    );
  });

  describe("Operator.Empty validation", () => {
    it.skip("reverts UnsuitableParameterType when Empty has paramType != None");

    it.skip("reverts UnsuitableCompValue when Empty has non-empty compValue");

    it.skip("reverts UnsuitableChildCount when Empty has children");

    it.skip("reverts UnsuitableParent when Empty has non-logical parent chain");

    it.skip(
      "succeeds when Empty has None paramType, no children, and logical-only parent chain",
    );
  });

  describe("Operator.Matches validation", () => {
    describe("with Tuple encoding", () => {
      it.skip(
        "reverts UnsuitableCompValue when Tuple Matches has non-empty compValue",
      );

      it.skip(
        "reverts UnsuitableChildCount when Tuple Matches has no structural children",
      );

      it.skip(
        "succeeds when Tuple Matches has empty compValue and structural children",
      );
    });

    describe("with Array encoding", () => {
      it.skip(
        "reverts UnsuitableCompValue when Array Matches has non-empty compValue",
      );

      it.skip(
        "reverts UnsuitableChildCount when Array Matches has no structural children",
      );

      it.skip(
        "succeeds when Array Matches has empty compValue and structural children",
      );
    });

    describe("with AbiEncoded encoding", () => {
      it.skip(
        "succeeds when AbiEncoded Matches has empty compValue (defaults to 4)",
      );

      it.skip(
        "succeeds when AbiEncoded Matches has 2-byte compValue (leadingBytes only)",
      );

      it.skip(
        "succeeds when AbiEncoded Matches has 2 + N bytes where N equals leadingBytes and N <= 32",
      );

      it.skip("reverts UnsuitableCompValue when leadingBytes > 32");

      it.skip(
        "reverts UnsuitableCompValue when compValue length != 2 + leadingBytes",
      );

      it.skip(
        "reverts UnsuitableChildCount when AbiEncoded Matches has no children",
      );
    });

    describe("with unsupported encodings", () => {
      it.skip(
        "reverts UnsuitableParameterType when Matches has Static encoding",
      );

      it.skip(
        "reverts UnsuitableParameterType when Matches has Dynamic encoding",
      );

      it.skip("reverts UnsuitableParameterType when Matches has None encoding");

      it.skip(
        "reverts UnsuitableParameterType when Matches has EtherValue encoding",
      );
    });
  });

  describe("Operator.ArraySome validation", () => {
    it.skip(
      "reverts UnsuitableParameterType when ArraySome has non-Array encoding",
    );

    it.skip(
      "reverts UnsuitableCompValue when ArraySome has non-empty compValue",
    );

    it.skip("reverts UnsuitableChildCount when ArraySome has zero children");

    it.skip(
      "reverts UnsuitableChildCount when ArraySome has more than one child",
    );

    it.skip(
      "reverts UnsuitableChildCount when ArraySome has non-structural children",
    );

    it.skip(
      "succeeds when ArraySome has Array encoding, empty compValue, and exactly one structural child",
    );
  });

  describe("Operator.ArrayEvery validation", () => {
    it.skip(
      "reverts UnsuitableParameterType when ArrayEvery has non-Array encoding",
    );

    it.skip(
      "reverts UnsuitableCompValue when ArrayEvery has non-empty compValue",
    );

    it.skip("reverts UnsuitableChildCount when ArrayEvery has zero children");

    it.skip(
      "reverts UnsuitableChildCount when ArrayEvery has more than one child",
    );

    it.skip(
      "reverts UnsuitableChildCount when ArrayEvery has non-structural children",
    );

    it.skip(
      "succeeds when ArrayEvery has Array encoding, empty compValue, and exactly one structural child",
    );
  });

  describe("Operator.ArrayTailMatches validation", () => {
    it.skip(
      "reverts UnsuitableParameterType when ArrayTailMatches has non-Array encoding",
    );

    it.skip(
      "reverts UnsuitableCompValue when ArrayTailMatches has non-empty compValue",
    );

    it.skip(
      "reverts UnsuitableChildCount when ArrayTailMatches has non-structural children",
    );

    it.skip(
      "succeeds when ArrayTailMatches has Array encoding, empty compValue, and structural children only",
    );
  });

  describe("Operator.Slice validation", () => {
    it.skip(
      "reverts UnsuitableParameterType when Slice has non-Static/Dynamic encoding",
    );

    it.skip("reverts UnsuitableCompValue when Slice compValue length != 3");

    it.skip("reverts UnsuitableCompValue when Slice size (3rd byte) is 0");

    it.skip("reverts UnsuitableCompValue when Slice size (3rd byte) > 32");

    it.skip("reverts UnsuitableChildCount when Slice has more than one child");

    it.skip(
      "reverts SliceChildNotStatic when Slice child does not resolve to Static",
    );

    it.skip(
      "succeeds when Slice has Static encoding, valid compValue, and Static child",
    );

    it.skip(
      "succeeds when Slice has Dynamic encoding, valid compValue, and Static child",
    );

    it.skip("succeeds when Slice has no children (allowed)");
  });

  describe("Operator.Pluck validation", () => {
    it.skip(
      "reverts UnsuitableParameterType when Pluck has non-Static/EtherValue encoding",
    );

    it.skip("reverts UnsuitableCompValue when Pluck compValue length != 1");

    it.skip("succeeds when Pluck has Static encoding and 1-byte compValue");

    it.skip("succeeds when Pluck has EtherValue encoding and 1-byte compValue");
  });

  describe("Operator.EqualToAvatar validation", () => {
    it.skip(
      "reverts UnsuitableParameterType when EqualToAvatar has non-Static encoding",
    );

    it.skip(
      "reverts UnsuitableCompValue when EqualToAvatar has non-empty compValue",
    );

    it.skip(
      "succeeds when EqualToAvatar has Static encoding and empty compValue",
    );
  });

  describe("Operator.EqualTo validation", () => {
    describe("with Static encoding", () => {
      it.skip("reverts UnsuitableCompValue when compValue length != 32");

      it.skip("succeeds when compValue is exactly 32 bytes");
    });

    describe("with Dynamic encoding", () => {
      it.skip("reverts UnsuitableCompValue when compValue is empty");

      it.skip("succeeds when compValue is non-empty");
    });

    describe("with Tuple encoding", () => {
      it.skip("reverts UnsuitableCompValue when compValue < 32 bytes");

      it.skip("succeeds when compValue >= 32 bytes");
    });

    describe("with Array encoding", () => {
      it.skip("reverts UnsuitableCompValue when compValue < 32 bytes");

      it.skip("succeeds when compValue >= 32 bytes");
    });

    describe("with EtherValue encoding", () => {
      it.skip("reverts UnsuitableCompValue when compValue length != 32");

      it.skip("succeeds when compValue is exactly 32 bytes");
    });

    describe("with unsupported encodings", () => {
      it.skip("reverts UnsuitableParameterType when EqualTo has None encoding");

      it.skip(
        "reverts UnsuitableParameterType when EqualTo has AbiEncoded encoding",
      );
    });
  });

  describe("Operator.GreaterThan validation", () => {
    it.skip(
      "reverts UnsuitableParameterType when GreaterThan has non-Static/EtherValue encoding",
    );

    it.skip("reverts UnsuitableCompValue when compValue length != 32");

    it.skip(
      "succeeds when GreaterThan has Static encoding and 32-byte compValue",
    );

    it.skip(
      "succeeds when GreaterThan has EtherValue encoding and 32-byte compValue",
    );
  });

  describe("Operator.LessThan validation", () => {
    it.skip(
      "reverts UnsuitableParameterType when LessThan has non-Static/EtherValue encoding",
    );

    it.skip("reverts UnsuitableCompValue when compValue length != 32");

    it.skip("succeeds when LessThan has Static encoding and 32-byte compValue");

    it.skip(
      "succeeds when LessThan has EtherValue encoding and 32-byte compValue",
    );
  });

  describe("Operator.SignedIntGreaterThan validation", () => {
    it.skip(
      "reverts UnsuitableParameterType when SignedIntGreaterThan has non-Static/EtherValue encoding",
    );

    it.skip("reverts UnsuitableCompValue when compValue length != 32");

    it.skip(
      "succeeds when SignedIntGreaterThan has Static encoding and 32-byte compValue",
    );
  });

  describe("Operator.SignedIntLessThan validation", () => {
    it.skip(
      "reverts UnsuitableParameterType when SignedIntLessThan has non-Static/EtherValue encoding",
    );

    it.skip("reverts UnsuitableCompValue when compValue length != 32");

    it.skip(
      "succeeds when SignedIntLessThan has Static encoding and 32-byte compValue",
    );
  });

  describe("Operator.Bitmask validation", () => {
    it.skip(
      "reverts UnsuitableParameterType when Bitmask has non-Static/Dynamic encoding",
    );

    it.skip("reverts UnsuitableCompValue when compValue length < 4");

    it.skip("reverts UnsuitableCompValue when (compValue.length - 2) is odd");

    it.skip(
      "succeeds when Bitmask has Static encoding and valid compValue (2 + 2N bytes)",
    );

    it.skip(
      "succeeds when Bitmask has Dynamic encoding and valid compValue (2 + 2N bytes)",
    );
  });

  describe("Operator.Custom validation", () => {
    it.skip(
      "reverts UnsuitableCompValue when compValue < 20 bytes (no address)",
    );

    it.skip("succeeds when compValue >= 20 bytes (includes adapter address)");
  });

  describe("Operator.WithinAllowance validation", () => {
    it.skip(
      "reverts UnsuitableParameterType when WithinAllowance has non-Static/EtherValue encoding",
    );

    it.skip(
      "reverts UnsuitableCompValue when compValue length is not 32 or 54",
    );

    it.skip(
      "reverts AllowanceDecimalsExceedMax when accrueDecimals > 18 (at index 52)",
    );

    it.skip(
      "reverts AllowanceDecimalsExceedMax when paramDecimals > 18 (at index 53)",
    );

    it.skip("succeeds when compValue is 32 bytes (legacy format)");

    it.skip("succeeds when compValue is 54 bytes with valid decimals");
  });

  describe("Operator.CallWithinAllowance validation", () => {
    it.skip(
      "reverts UnsuitableParameterType when CallWithinAllowance has paramType != None",
    );

    it.skip("reverts UnsuitableCompValue when compValue length != 32");

    it.skip(
      "reverts UnsuitableChildCount when CallWithinAllowance has children",
    );

    it.skip(
      "reverts UnsuitableParent when CallWithinAllowance has non-logical parent chain with other nodes",
    );

    it.skip("succeeds when CallWithinAllowance is root (parent == index)");

    it.skip("succeeds when CallWithinAllowance has logical-only parent chain");
  });

  describe("Operator.WithinRatio validation", () => {
    it.skip(
      "reverts UnsuitableParameterType when WithinRatio has paramType != None",
    );

    it.skip("reverts UnsuitableCompValue when compValue length < 32");

    it.skip("reverts UnsuitableCompValue when compValue length > 52");

    it.skip("reverts UnsuitableChildCount when WithinRatio has children");

    it.skip(
      "reverts UnsuitableParent when WithinRatio is root (parent == index)",
    );

    it.skip(
      "reverts WithinRatioNoRatioProvided when both minRatio and maxRatio are 0",
    );

    it.skip(
      "reverts PluckNotVisitedBeforeRef when referenceIndex pluck not visited before",
    );

    it.skip(
      "reverts PluckNotVisitedBeforeRef when relativeIndex pluck not visited before",
    );

    it.skip(
      "succeeds when WithinRatio has valid compValue and plucks are visited first",
    );

    it.skip("succeeds when only minRatio is provided (maxRatio = 0)");

    it.skip("succeeds when only maxRatio is provided (minRatio = 0)");
  });

  describe("Unsupported operator", () => {
    it.skip("reverts UnsupportedOperator for invalid operator value");
  });

  describe("Parent validation", () => {
    describe("CallWithinAllowance parent rules", () => {
      it.skip(
        "reverts UnsuitableParent when CallWithinAllowance has non-logical ancestors with other node types",
      );

      it.skip("succeeds when CallWithinAllowance has only And/Or ancestors");
    });

    describe("Empty parent rules", () => {
      it.skip("reverts UnsuitableParent when Empty has AbiEncoded ancestor");

      it.skip(
        "reverts UnsuitableParent when Empty has non-logical, non-AbiEncoded ancestor",
      );

      it.skip("succeeds when Empty has only And/Or ancestors");
    });

    describe("WithinRatio parent rules", () => {
      it.skip("reverts UnsuitableParent when WithinRatio is root node");

      it.skip("succeeds when WithinRatio is nested under any other node");
    });
  });

  describe("Child count validation", () => {
    describe("None encoding", () => {
      it.skip(
        "reverts UnsuitableChildCount when CallWithinAllowance has children",
      );

      it.skip("reverts UnsuitableChildCount when WithinRatio has children");

      it.skip("reverts UnsuitableChildCount when Empty has children");

      it.skip("reverts UnsuitableChildCount when And has zero children");

      it.skip("reverts UnsuitableChildCount when Or has zero children");
    });

    describe("Static encoding", () => {
      it.skip(
        "reverts UnsuitableChildCount when non-Slice Static node has children",
      );

      it.skip(
        "reverts UnsuitableChildCount when Slice Static has more than one child",
      );

      it.skip("succeeds when Slice Static has zero or one child");
    });

    describe("Dynamic encoding", () => {
      it.skip(
        "reverts UnsuitableChildCount when non-Slice Dynamic node has children",
      );

      it.skip(
        "reverts UnsuitableChildCount when Slice Dynamic has more than one child",
      );

      it.skip("succeeds when Slice Dynamic has zero or one child");
    });

    describe("Tuple encoding", () => {
      it.skip(
        "reverts UnsuitableChildCount when Tuple has zero structural children",
      );

      it.skip("succeeds when Tuple has at least one structural child");
    });

    describe("AbiEncoded encoding", () => {
      it.skip("reverts UnsuitableChildCount when AbiEncoded has zero children");

      it.skip("succeeds when AbiEncoded has at least one child");
    });

    describe("Array encoding", () => {
      it.skip(
        "reverts UnsuitableChildCount when Array has zero structural children",
      );

      it.skip(
        "reverts UnsuitableChildCount when ArraySome has non-structural children",
      );

      it.skip(
        "reverts UnsuitableChildCount when ArrayEvery has non-structural children",
      );

      it.skip(
        "reverts UnsuitableChildCount when ArrayTailMatches has non-structural children",
      );

      it.skip("reverts UnsuitableChildCount when ArraySome has != 1 child");

      it.skip("reverts UnsuitableChildCount when ArrayEvery has != 1 child");
    });

    describe("EtherValue encoding", () => {
      it.skip("reverts UnsuitableChildCount when EtherValue node has children");
    });
  });

  describe("Non-structural ordering", () => {
    it.skip(
      "reverts NonStructuralChildrenMustComeLast when structural child follows non-structural",
    );

    it.skip(
      "succeeds when all structural children come before non-structural children",
    );

    it.skip("succeeds when all children are structural");

    it.skip("succeeds when all children are non-structural");
  });

  describe("Type tree validation", () => {
    describe("And/Or type tree matching", () => {
      it.skip(
        "reverts UnsuitableChildTypeTree when And children have mismatched type trees and are not all Dynamic/AbiEncoded",
      );

      it.skip(
        "reverts UnsuitableChildTypeTree when Or children have mismatched type trees and are not all Dynamic/AbiEncoded",
      );

      it.skip("succeeds when And children have identical type trees");

      it.skip("succeeds when Or children have identical type trees");

      it.skip("succeeds when And has single child (always matches)");

      it.skip(
        "succeeds when all children are Dynamic encoding (type equivalence)",
      );

      it.skip(
        "succeeds when all children are AbiEncoded encoding (type equivalence)",
      );

      it.skip(
        "succeeds when children mix Dynamic and AbiEncoded (both are equivalence types)",
      );
    });

    describe("Array type tree matching", () => {
      it.skip(
        "reverts UnsuitableChildTypeTree when Array structural children have mismatched type trees",
      );

      it.skip("succeeds when Array has single structural child");

      it.skip(
        "succeeds when all Array structural children have identical type trees",
      );
    });
  });

  describe("Pluck order validation", () => {
    it.skip(
      "reverts PluckNotVisitedBeforeRef when WithinRatio references pluck not yet visited in DFS",
    );

    it.skip("succeeds when Pluck is visited before WithinRatio references it");

    it.skip(
      "succeeds when Pluck and WithinRatio are in same subtree with correct ordering",
    );

    it.skip(
      "succeeds when multiple Plucks are visited before being referenced",
    );
  });
});
