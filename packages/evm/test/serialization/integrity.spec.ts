import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { hexlify, randomBytes } from "ethers";

import { Encoding, Operator, flattenCondition, packConditions } from "../utils";
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

    // For testing validation errors, we call packConditions directly
    // since validation now happens during packing
    const pack = (conditions: any[]) => packConditions(roles, conditions);

    // For testing successful cases
    const allowTarget = async (conditions: any[]) => {
      const packed = await packConditions(roles, conditions);
      return roles.connect(owner).allowTarget(roleKey, TARGET, packed, 0);
    };

    return { roles, owner, pack, allowTarget };
  }

  // 1. TREE STRUCTURE
  describe("tree structure", () => {
    describe("root node", () => {
      it("reverts UnsuitableRootNode when no root exists", async () => {
        const { roles, pack } = await loadFixture(setup);

        // All nodes have parent != self index
        await expect(
          pack([
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
        const { roles, pack } = await loadFixture(setup);

        // Two nodes with parent == self
        await expect(
          pack([
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
        const { roles, pack } = await loadFixture(setup);

        // Root at index 1 instead of 0
        await expect(
          pack([
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
        const { roles, pack } = await loadFixture(setup);

        await expect(
          pack([
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
        const { roles, pack } = await loadFixture(setup);

        await expect(
          pack([
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
        const { roles, pack } = await loadFixture(setup);

        const allowanceKey = hexlify(randomBytes(32));

        // Tuple with only a non-structural child (no structural children)
        await expect(
          pack([
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
        const { roles, pack } = await loadFixture(setup);

        const allowanceKey = hexlify(randomBytes(32));

        // Array with only a non-structural child (no structural children)
        await expect(
          pack([
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
        const { roles, pack } = await loadFixture(setup);

        await expect(
          pack([
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
        const { roles, pack } = await loadFixture(setup);

        await expect(
          pack([
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
        const { roles, pack } = await loadFixture(setup);

        await expect(
          pack([
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
      it("reverts UnsuitableChildCount when Matches has non-structural children", async () => {
        const { roles, pack } = await loadFixture(setup);
        const allowanceKey = hexlify(randomBytes(32));

        // Matches now requires ALL children to be structural.
        // Non-structural children (like CallWithinAllowance) must be moved
        // outside Matches into an And wrapper.
        // This test validates that non-structural children in Matches are rejected.

        await expect(
          pack(
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
                      // Non-structural in Matches -> VIOLATION
                      paramType: Encoding.None,
                      operator: Operator.CallWithinAllowance,
                      compValue: allowanceKey,
                    },
                    {
                      paramType: Encoding.Static,
                      operator: Operator.Pass,
                    },
                  ],
                },
              ],
            }),
          ),
        ).to.be.revertedWithCustomError(roles, "UnsuitableChildCount");
      });

      it("accepts And with Matches, WithinRatio and CallWithinAllowance inside Tuple", async () => {
        const { allowTarget } = await loadFixture(setup);
        const allowanceKey = hexlify(randomBytes(32));

        const withinRatioCompValue =
          "0x" +
          "00" + // referenceIndex = 0
          "00" + // referenceDecimals = 0
          "01" + // relativeIndex = 1
          "00" + // relativeDecimals = 0
          "00002328" + // minRatio = 9000
          "00002af8"; // maxRatio = 11000

        // Structure: Tuple/Matches containing an And with:
        // - Inner Tuple/Matches (structural, with Pluck nodes)
        // - WithinRatio (non-structural)
        // - CallWithinAllowance (non-structural)
        // This tests that multiple non-structural operators work together.

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
                  // And wraps structural Matches + non-structural operators
                  paramType: Encoding.None,
                  operator: Operator.And,
                  children: [
                    {
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
                      paramType: Encoding.None,
                      operator: Operator.WithinRatio,
                      compValue: withinRatioCompValue,
                    },
                    {
                      paramType: Encoding.None,
                      operator: Operator.CallWithinAllowance,
                      compValue: allowanceKey,
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

  // 3. TYPE TREE CONSISTENCY
  describe("type tree", () => {
    describe("branching nodes require matching children", () => {
      it("reverts UnsuitableChildTypeTree for And with mismatched children", async () => {
        const { roles, pack } = await loadFixture(setup);

        await expect(
          pack([
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
        const { roles, pack } = await loadFixture(setup);

        await expect(
          pack([
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
        const { roles, pack } = await loadFixture(setup);

        await expect(
          pack([
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

    describe("EqualTo compValue constraints", () => {
      it("reverts UnsuitableCompValue for Tuple EqualTo with short compValue", async () => {
        const { roles, pack } = await loadFixture(setup);

        await expect(
          pack(
            flattenCondition({
              paramType: Encoding.Tuple,
              operator: Operator.EqualTo,
              compValue: "0x1234",
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.Pass,
                },
              ],
            }),
          ),
        ).to.be.revertedWithCustomError(roles, "UnsuitableCompValue");
      });

      it("reverts UnsuitableCompValue for Array EqualTo with short compValue", async () => {
        const { roles, pack } = await loadFixture(setup);

        await expect(
          pack(
            flattenCondition({
              paramType: Encoding.Array,
              operator: Operator.EqualTo,
              compValue: "0xab",
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.Pass,
                },
              ],
            }),
          ),
        ).to.be.revertedWithCustomError(roles, "UnsuitableCompValue");
      });
    });

    describe("Slice child constraint", () => {
      it("reverts SliceChildNotStatic when child does not resolve to Static", async () => {
        const { roles, pack } = await loadFixture(setup);

        await expect(
          pack([
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
      const { roles, pack } = await loadFixture(setup);

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
        pack([
          {
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.And,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.WithinRatio,
            compValue: withinRatioCompValue,
          },
          {
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
        ]),
      ).to.be.revertedWithCustomError(roles, "PluckNotVisitedBeforeRef");
    });

    it("reverts PluckNotVisitedBeforeRef when WithinRatio before Matches in And (DFS order)", async () => {
      const { roles, pack } = await loadFixture(setup);

      // WithinRatio placed before Matches in And.
      // In DFS order, WithinRatio is visited before Pluck nodes,
      // which violates the pluck order constraint.

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

      await expect(
        pack(
          flattenCondition({
            paramType: Encoding.None,
            operator: Operator.And,
            children: [
              {
                // WithinRatio first - visited before Pluck in DFS
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue: withinRatioCompValue,
              },
              {
                paramType: Encoding.AbiEncoded,
                operator: Operator.Matches,
                children: [
                  {
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
                ],
              },
            ],
          }),
        ),
      ).to.be.revertedWithCustomError(roles, "PluckNotVisitedBeforeRef");
    });

    it("accepts WithinRatio when Pluck nodes are visited before in DFS order (flat)", async () => {
      const { allowTarget } = await loadFixture(setup);

      // WithinRatio must be outside Matches (wrapped in And)
      // DFS visits all children of And: Matches subtree first, then WithinRatio
      // Pluck nodes are visited in Matches subtree before WithinRatio

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

      // DFS order: And(0) -> Matches(1) -> Pass -> Pass -> Pluck -> Pluck -> WithinRatio(2)
      // Pluck nodes visited in Matches subtree; WithinRatio visited after - VALID!
      await expect(
        allowTarget(
          flattenCondition({
            paramType: Encoding.None,
            operator: Operator.And,
            children: [
              {
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
                ],
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

      await expect(
        allowTarget(
          flattenCondition({
            paramType: Encoding.None,
            operator: Operator.And,
            children: [
              {
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
                    // Tuple B - just structural children now
                    paramType: Encoding.Tuple,
                    operator: Operator.Matches,
                    children: [
                      {
                        paramType: Encoding.Static,
                        operator: Operator.Pass,
                      },
                    ],
                  },
                ],
              },
              {
                // WithinRatio after Pluck in DFS - VALID!
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue: withinRatioCompValue,
              },
            ],
          }),
        ),
      ).to.not.be.reverted;
    });
  });
});
