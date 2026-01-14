import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { hexlify, randomBytes } from "ethers";

import { Encoding, Operator, flattenCondition } from "../utils";
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

    const roleKey = hexlify(randomBytes(32));
    const TARGET = "0x000000000000000000000000000000000000000f";

    const allowTarget = (conditions: any[]) =>
      roles.connect(owner).allowTarget(roleKey, TARGET, conditions, 0);

    return { roles, owner, allowTarget };
  }

  // 1. TREE STRUCTURE
  describe("tree structure", () => {
    describe("root node", () => {
      it("reverts UnsuitableRootNode when no root exists", async () => {
        const { roles, allowTarget } = await loadFixture(setup);

        // All nodes have parent != self index
        await expect(
          allowTarget([
            {
              parent: 1,
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
            {
              parent: 0,
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
          ]),
        ).to.be.revertedWithCustomError(roles, "UnsuitableRootNode");
      });

      it("reverts UnsuitableRootNode when multiple roots exist", async () => {
        const { roles, allowTarget } = await loadFixture(setup);

        // Two nodes with parent == self
        await expect(
          allowTarget([
            {
              parent: 0,
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
            {
              parent: 1,
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
          ]),
        ).to.be.revertedWithCustomError(roles, "UnsuitableRootNode");
      });

      it("reverts UnsuitableRootNode when root is not at index 0", async () => {
        const { roles, allowTarget } = await loadFixture(setup);

        // Root at index 1 instead of 0
        await expect(
          allowTarget([
            {
              parent: 1,
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
            {
              parent: 1,
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
          ]),
        ).to.be.revertedWithCustomError(roles, "UnsuitableRootNode");
      });
    });

    describe("BFS ordering", () => {
      it("reverts NotBFS when parent index exceeds current index", async () => {
        const { roles, allowTarget } = await loadFixture(setup);

        await expect(
          allowTarget([
            {
              parent: 0,
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              compValue: "0x",
            },
            {
              parent: 5, // Forward reference - parent doesn't exist yet
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
          ]),
        ).to.be.revertedWithCustomError(roles, "NotBFS");
      });

      it("reverts NotBFS when parent indices are not non-decreasing", async () => {
        const { roles, allowTarget } = await loadFixture(setup);

        await expect(
          allowTarget([
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
              parent: 1, // Child of node 1
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
            {
              parent: 0, // Back to node 0 - not non-decreasing!
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
          ]),
        ).to.be.revertedWithCustomError(roles, "NotBFS");
      });
    });
  });

  // 2. CHILD CONSTRAINTS (by encoding type)
  describe("child constraints", () => {
    describe("container types require structural children", () => {
      it("reverts UnsuitableChildCount for Tuple with no structural children", async () => {
        const { roles, allowTarget } = await loadFixture(setup);

        const allowanceKey = hexlify(randomBytes(32));

        // Tuple with only a non-structural child (no structural children)
        await expect(
          allowTarget([
            {
              parent: 0,
              paramType: Encoding.Tuple,
              operator: Operator.Matches,
              compValue: "0x",
            },
            {
              parent: 0,
              paramType: Encoding.None,
              operator: Operator.CallWithinAllowance,
              compValue: allowanceKey,
            },
          ]),
        ).to.be.revertedWithCustomError(roles, "UnsuitableChildCount");
      });

      it("reverts UnsuitableChildCount for Array with no structural children", async () => {
        const { roles, allowTarget } = await loadFixture(setup);

        const allowanceKey = hexlify(randomBytes(32));

        // Array with only a non-structural child (no structural children)
        await expect(
          allowTarget([
            {
              parent: 0,
              paramType: Encoding.Array,
              operator: Operator.Matches,
              compValue: "0x",
            },
            {
              parent: 0,
              paramType: Encoding.None,
              operator: Operator.CallWithinAllowance,
              compValue: allowanceKey,
            },
          ]),
        ).to.be.revertedWithCustomError(roles, "UnsuitableChildCount");
      });
    });

    describe("leaf types forbid children", () => {
      it("reverts LeafNodeCannotHaveChildren for Static with children", async () => {
        const { roles, allowTarget } = await loadFixture(setup);

        await expect(
          allowTarget([
            {
              parent: 0,
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
            {
              parent: 0,
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
          ]),
        ).to.be.revertedWithCustomError(roles, "LeafNodeCannotHaveChildren");
      });

      it("reverts LeafNodeCannotHaveChildren for Dynamic with children", async () => {
        const { roles, allowTarget } = await loadFixture(setup);

        await expect(
          allowTarget([
            {
              parent: 0,
              paramType: Encoding.Dynamic,
              operator: Operator.EqualTo,
              compValue: hre.ethers.keccak256("0xaabbccdd"),
            },
            {
              parent: 0,
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
          ]),
        ).to.be.revertedWithCustomError(roles, "LeafNodeCannotHaveChildren");
      });

      it("reverts LeafNodeCannotHaveChildren for EtherValue with children", async () => {
        const { roles, allowTarget } = await loadFixture(setup);

        await expect(
          allowTarget([
            {
              parent: 0,
              paramType: Encoding.EtherValue,
              operator: Operator.Pass,
              compValue: "0x",
            },
            {
              parent: 0,
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
          ]),
        ).to.be.revertedWithCustomError(roles, "LeafNodeCannotHaveChildren");
      });
    });

    describe("structural ordering", () => {
      it("reverts NonStructuralChildrenMustComeLast when structural children follow non-structural ones (validates iteration logic)", async () => {
        const { roles, allowTarget } = await loadFixture(setup);
        const allowanceKey = hexlify(randomBytes(32));

        // Tree structure designed to catch iteration bugs (e.g., return vs continue on leaf):
        // Root (Tuple)
        // ├── Leaf (Static) -> Valid. Loop must continue.
        // └── Parent (Tuple) -> Contains Ordering Violation
        //     ├── Non-structural (CallWithinAllowance)
        //     └── Structural (Static) -> Violation! Structural after Non-structural

        await expect(
          allowTarget(
            flattenCondition({
              paramType: Encoding.Tuple,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.Pass,
                },
                {
                  paramType: Encoding.Tuple,
                  operator: Operator.Matches,
                  children: [
                    {
                      paramType: Encoding.None,
                      operator: Operator.CallWithinAllowance,
                      compValue: allowanceKey,
                    },
                    {
                      // Structural (Child of Parent) -> VIOLATION
                      paramType: Encoding.Static,
                      operator: Operator.Pass,
                    },
                  ],
                },
              ],
            }),
          ),
        ).to.be.revertedWithCustomError(
          roles,
          "NonStructuralChildrenMustComeLast",
        );
      });
    });
  });

  // 3. TYPE TREE CONSISTENCY
  describe("type tree", () => {
    describe("branching nodes require matching children", () => {
      it("reverts UnsuitableChildTypeTree for And with mismatched children", async () => {
        const { roles, allowTarget } = await loadFixture(setup);

        await expect(
          allowTarget([
            {
              parent: 0,
              paramType: Encoding.None,
              operator: Operator.And,
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
              paramType: Encoding.Tuple, // Different type tree than Static
              operator: Operator.Matches,
              compValue: "0x",
            },
            {
              parent: 2,
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
          ]),
        ).to.be.revertedWithCustomError(roles, "UnsuitableChildTypeTree");
      });

      it("reverts UnsuitableChildTypeTree for Or with mismatched children", async () => {
        const { roles, allowTarget } = await loadFixture(setup);

        await expect(
          allowTarget([
            {
              parent: 0,
              paramType: Encoding.None,
              operator: Operator.Or,
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
              paramType: Encoding.Tuple, // Different type tree than Static
              operator: Operator.Matches,
              compValue: "0x",
            },
            {
              parent: 2,
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
          ]),
        ).to.be.revertedWithCustomError(roles, "UnsuitableChildTypeTree");
      });

      it("reverts UnsuitableChildTypeTree for Array with mismatched children", async () => {
        const { roles, allowTarget } = await loadFixture(setup);

        await expect(
          allowTarget([
            {
              parent: 0,
              paramType: Encoding.Array,
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
              paramType: Encoding.Tuple, // Different type tree than Static
              operator: Operator.Matches,
              compValue: "0x",
            },
            {
              parent: 2,
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
          ]),
        ).to.be.revertedWithCustomError(roles, "UnsuitableChildTypeTree");
      });

      it("accepts Dynamic/AbiEncoded equivalence", async () => {
        const { allowTarget } = await loadFixture(setup);

        // Dynamic and AbiEncoded are considered equivalent for type tree matching
        await expect(
          allowTarget([
            {
              parent: 0,
              paramType: Encoding.None,
              operator: Operator.Or,
              compValue: "0x",
            },
            {
              parent: 0,
              paramType: Encoding.Dynamic,
              operator: Operator.Pass,
              compValue: "0x",
            },
            {
              parent: 0,
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              compValue: "0x",
            },
            {
              parent: 2,
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
          ]),
        ).to.not.be.reverted;
      });
    });

    describe("Slice child constraint", () => {
      it("reverts SliceChildNotStatic when child does not resolve to Static", async () => {
        const { roles, allowTarget } = await loadFixture(setup);

        await expect(
          allowTarget([
            {
              parent: 0,
              paramType: Encoding.Static,
              operator: Operator.Slice,
              compValue: "0x000020", // shift=0, size=32
            },
            {
              parent: 0,
              paramType: Encoding.Dynamic, // Must be Static!
              operator: Operator.Pass,
              compValue: "0x",
            },
          ]),
        ).to.be.revertedWithCustomError(roles, "SliceChildNotStatic");
      });
    });
  });

  // 4. CROSS-NODE DEPENDENCIES
  describe("pluck order", () => {
    it("reverts PluckNotVisitedBeforeRef when WithinRatio references unvisited pluck index", async () => {
      const { roles, allowTarget } = await loadFixture(setup);

      // WithinRatio compValue: referenceIndex(1) + referenceDecimals(1) + relativeIndex(1) + relativeDecimals(1) + minRatio(4) + maxRatio(4) = 12 bytes minimum
      // Reference index 5, relative index 7 - but no Pluck nodes visited before
      const withinRatioCompValue =
        "0x" +
        "05" + // referenceIndex = 5 (not visited)
        "00" + // referenceDecimals = 0
        "07" + // relativeIndex = 7
        "00" + // relativeDecimals = 0
        "00002328" + // minRatio = 9000
        "00002af8" + // maxRatio = 11000
        "0000000000000000000000000000000000000000" + // referenceAdapter
        "0000000000000000000000000000000000000000"; // relativeAdapter

      await expect(
        allowTarget([
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
            paramType: Encoding.None,
            operator: Operator.WithinRatio,
            compValue: withinRatioCompValue,
          },
        ]),
      ).to.be.revertedWithCustomError(roles, "PluckNotVisitedBeforeRef");
    });

    it("reverts PluckNotVisitedBeforeRef when Pluck in later sibling subtree", async () => {
      const { roles, allowTarget } = await loadFixture(setup);

      // Scenario: Two sibling Tuples where first contains WithinRatio,
      // second contains the Pluck nodes it references.
      // In DFS order: TupleA's subtree (including WithinRatio) is fully visited
      // before TupleB's subtree (containing Pluck).

      const withinRatioCompValue =
        "0x" +
        "00" + // referenceIndex = 0 (first pluck)
        "12" + // referenceDecimals = 18
        "01" + // relativeIndex = 1 (second pluck)
        "12" + // relativeDecimals = 18
        "00002328" + // minRatio = 9000 (90%)
        "00002af8" + // maxRatio = 11000 (110%)
        "0000000000000000000000000000000000000000" + // referenceAdapter
        "0000000000000000000000000000000000000000"; // relativeAdapter

      // Tree structure:
      //
      // AbiEncoded (0)
      // ├── Tuple A (1) [structural, visited first in DFS]
      // │   ├── Pass (structural child of A)
      // │   └── WithinRatio (non-structural child of A, refs pluck 0,1)
      // └── Tuple B (2) [structural, visited second in DFS]
      //     ├── Pluck index 0 (in B's subtree)
      //     └── Pluck index 1 (in B's subtree)
      //
      // DFS order: 0 -> 1 -> (A's children: Pass, WithinRatio) -> 2 -> (B's children: Pluck, Pluck)
      // WithinRatio is visited BEFORE Pluck nodes!

      await expect(
        allowTarget(
          flattenCondition({
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              {
                // Tuple A - visited first in DFS
                paramType: Encoding.Tuple,
                operator: Operator.Matches,
                children: [
                  {
                    paramType: Encoding.Static,
                    operator: Operator.Pass,
                  },
                  {
                    // WithinRatio in A's subtree - references pluck 0,1
                    paramType: Encoding.None,
                    operator: Operator.WithinRatio,
                    compValue: withinRatioCompValue,
                  },
                ],
              },
              {
                // Tuple B - visited second in DFS
                paramType: Encoding.Tuple,
                operator: Operator.Matches,
                children: [
                  {
                    // Pluck index 0 - in B's subtree, visited AFTER WithinRatio
                    paramType: Encoding.Static,
                    operator: Operator.Pluck,
                    compValue: "0x00",
                  },
                  {
                    // Pluck index 1 - in B's subtree, visited AFTER WithinRatio
                    paramType: Encoding.Static,
                    operator: Operator.Pluck,
                    compValue: "0x01",
                  },
                ],
              },
            ],
          }),
        ),
      ).to.be.revertedWithCustomError(roles, "PluckNotVisitedBeforeRef");
    });

    it("accepts WithinRatio when Pluck nodes are visited before in DFS order (flat)", async () => {
      const { allowTarget } = await loadFixture(setup);

      // Flat structure: all children of AbiEncoded
      // Structural children (Pass, Pluck) come before non-structural (WithinRatio)
      // DFS visits children in order, so Pluck nodes are visited before WithinRatio

      const withinRatioCompValue =
        "0x" +
        "00" + // referenceIndex = 0 (first pluck - amountIn)
        "12" + // referenceDecimals = 18
        "01" + // relativeIndex = 1 (second pluck - amountOutMin)
        "12" + // relativeDecimals = 18
        "00002328" + // minRatio = 9000 (90%)
        "00002af8" + // maxRatio = 11000 (110%)
        "0000000000000000000000000000000000000000" + // referenceAdapter
        "0000000000000000000000000000000000000000"; // relativeAdapter

      // DFS order: AbiEncoded(0) -> Pass(1) -> Pass(2) -> Pluck(3) -> Pluck(4) -> WithinRatio(5)
      // Pluck nodes visited at steps 3,4; WithinRatio at step 5 - VALID!
      await expect(
        allowTarget(
          flattenCondition({
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              {
                // param 0: tokenIn (ignored)
                paramType: Encoding.Static,
                operator: Operator.Pass,
              },
              {
                // param 1: tokenOut (ignored)
                paramType: Encoding.Static,
                operator: Operator.Pass,
              },
              {
                // param 2: amountIn - Pluck index 0
                paramType: Encoding.Static,
                operator: Operator.Pluck,
                compValue: "0x00",
              },
              {
                // param 3: amountOutMin - Pluck index 1
                paramType: Encoding.Static,
                operator: Operator.Pluck,
                compValue: "0x01",
              },
              {
                // Non-structural: WithinRatio AFTER Pluck in DFS - VALID!
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue: withinRatioCompValue,
              },
            ],
          }),
        ),
      ).to.not.be.reverted;
    });

    it("accepts WithinRatio when Pluck in earlier sibling subtree (DFS)", async () => {
      const { allowTarget } = await loadFixture(setup);

      // Nested structure: Pluck in first Tuple, WithinRatio in second Tuple
      // DFS visits first Tuple's entire subtree before second Tuple's subtree
      // So Pluck is visited before WithinRatio

      const withinRatioCompValue =
        "0x" +
        "00" + // referenceIndex = 0
        "12" + // referenceDecimals = 18
        "01" + // relativeIndex = 1
        "12" + // relativeDecimals = 18
        "00002328" + // minRatio = 9000 (90%)
        "00002af8" + // maxRatio = 11000 (110%)
        "0000000000000000000000000000000000000000" + // referenceAdapter
        "0000000000000000000000000000000000000000"; // relativeAdapter

      // Tree structure:
      //
      // AbiEncoded (0)
      // ├── Tuple A (1) [visited first in DFS]
      // │   ├── Pluck index 0
      // │   └── Pluck index 1
      // └── Tuple B (2) [visited second in DFS]
      //     ├── Pass (structural)
      //     └── WithinRatio (non-structural, refs pluck 0,1)
      //
      // DFS: 0 -> 1 -> Pluck0 -> Pluck1 -> 2 -> Pass -> WithinRatio
      // Pluck nodes visited BEFORE WithinRatio - VALID!

      await expect(
        allowTarget(
          flattenCondition({
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              {
                // Tuple A - contains Pluck nodes, visited first
                paramType: Encoding.Tuple,
                operator: Operator.Matches,
                children: [
                  {
                    paramType: Encoding.Static,
                    operator: Operator.Pluck,
                    compValue: "0x00",
                  },
                  {
                    paramType: Encoding.Static,
                    operator: Operator.Pluck,
                    compValue: "0x01",
                  },
                ],
              },
              {
                // Tuple B - contains WithinRatio, visited second
                paramType: Encoding.Tuple,
                operator: Operator.Matches,
                children: [
                  {
                    paramType: Encoding.Static,
                    operator: Operator.Pass,
                  },
                  {
                    // WithinRatio after Pluck in DFS - VALID!
                    paramType: Encoding.None,
                    operator: Operator.WithinRatio,
                    compValue: withinRatioCompValue,
                  },
                ],
              },
            ],
          }),
        ),
      ).to.not.be.reverted;
    });
  });
});
