import { expect } from "chai";
import { hexlify, randomBytes } from "ethers";
import { network } from "hardhat";

import {
  Encoding,
  Operator,
  flattenCondition,
  packConditions,
} from "../utils.js";
import { createSetup } from "../setup.js";

const connection = await network.create();
const { ethers, networkHelpers } = connection;
const { loadFixture } = networkHelpers;
const { deployRolesMod } = createSetup(connection);
const oversizedCompValue = "0x" + "00".repeat(65536);

describe("Integrity", () => {
  after(async () => {
    await connection.close();
  });

  async function setup() {
    const [owner] = await ethers.getSigners();

    const Avatar = await ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();
    const avatarAddress = await avatar.getAddress();

    const roles = await deployRolesMod(
      owner.address,
      avatarAddress,
      avatarAddress,
    );

    const roleKey = hexlify(randomBytes(32));
    const TARGET = "0x000000000000000000000000000000000000000f";

    // For testing validation errors, we call packConditions directly
    // since validation now happens during packing
    const pack = (conditions: any[]) => packConditions(roles, conditions);

    // Exercise validation and packing through the checked setup entrypoint.
    const allowTarget = (conditions: any[]) =>
      roles.connect(owner).allowTarget(roleKey, TARGET, conditions, 0);

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
              compValue: "0x" + "00".repeat(64),
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
          "00" + // referencePluckIndex = 0
          "00" + // referenceDecimals = 0
          "01" + // relativePluckIndex = 1
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
        ).to.not.be.revert(ethers);
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
        ).to.not.be.revert(ethers);
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

      for (const encoding of [Encoding.Tuple, Encoding.Array]) {
        it(`reverts UnsuitableCompValue for ${Encoding[encoding]} EqualTo when compValue exceeds 65535 bytes`, async () => {
          const { roles, pack } = await loadFixture(setup);

          await expect(
            pack(
              flattenCondition({
                paramType: encoding,
                operator: Operator.EqualTo,
                compValue: oversizedCompValue,
                children: [
                  {
                    paramType: Encoding.Static,
                    operator: Operator.Pass,
                  },
                ],
              }),
            ),
          )
            .to.be.revertedWithCustomError(roles, "UnsuitableCompValue")
            .withArgs(0);
        });
      }
    });

    describe("maximum compValue length", () => {
      for (const [name, paramType, operator] of [
        ["Bitmask", Encoding.Static, Operator.Bitmask],
        ["Custom", Encoding.Static, Operator.Custom],
        ["WithinAllowance", Encoding.Static, Operator.WithinAllowance],
        ["WithinRatio", Encoding.None, Operator.WithinRatio],
        ["Dynamic EqualTo", Encoding.Dynamic, Operator.EqualTo],
      ] as const) {
        it(`reverts UnsuitableCompValue for ${name} when compValue exceeds 65535 bytes`, async () => {
          const { roles, pack } = await loadFixture(setup);

          await expect(
            pack([
              {
                parent: 0,
                paramType,
                operator,
                compValue: oversizedCompValue,
              },
            ]),
          )
            .to.be.revertedWithCustomError(roles, "UnsuitableCompValue")
            .withArgs(0);
        });
      }
    });

    describe("packed field widths", () => {
      it("reverts when a node has more than 1023 children", async () => {
        const { roles, pack } = await loadFixture(setup);

        await expect(
          pack(
            flattenCondition({
              paramType: Encoding.None,
              operator: Operator.And,
              children: Array.from({ length: 1024 }, () => ({
                paramType: Encoding.Static,
                operator: Operator.Pass,
              })),
            }),
          ),
        )
          .to.be.revertedWithCustomError(roles, "ConditionChildCountExceedsMax")
          .withArgs(0);
      });
    });

    describe("additional operator constraints", () => {
      it("reverts Dynamic EqualTo with less than one ABI head and tail word", async () => {
        const { roles, pack } = await loadFixture(setup);

        await expect(
          pack([
            {
              parent: 0,
              paramType: Encoding.Dynamic,
              operator: Operator.EqualTo,
              compValue: "0x" + "00".repeat(32),
            },
          ]),
        )
          .to.be.revertedWithCustomError(roles, "UnsuitableCompValue")
          .withArgs(0);
      });

      it("reverts WithinRatio references to an Array Pluck", async () => {
        const { roles, pack } = await loadFixture(setup);

        await expect(
          pack(
            flattenCondition({
              paramType: Encoding.None,
              operator: Operator.And,
              children: [
                {
                  paramType: Encoding.Array,
                  operator: Operator.Pluck,
                  compValue: "0x00",
                  children: [
                    {
                      paramType: Encoding.Static,
                      operator: Operator.Pass,
                    },
                  ],
                },
                {
                  paramType: Encoding.None,
                  operator: Operator.WithinRatio,
                  compValue: "0x000000000000232800002af8",
                },
              ],
            }),
          ),
        )
          .to.be.revertedWithCustomError(roles, "WithinRatioTargetNotStatic")
          .withArgs(2);
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
  describe("pluck definite assignment", () => {
    it("reverts PluckNotVisitedBeforeRef when WithinRatio references unvisited pluck index", async () => {
      const { roles, pack } = await loadFixture(setup);

      // WithinRatio compValue: referencePluckIndex(1) + referenceDecimals(1) + relativePluckIndex(1) + relativeDecimals(1) + minRatio(4) + maxRatio(4) = 12 bytes minimum
      // Reference index 5, relative index 7 - but no Pluck nodes visited before
      const withinRatioCompValue =
        "0x" +
        "05" + // referencePluckIndex = 5 (not visited)
        "00" + // referenceDecimals = 0
        "07" + // relativePluckIndex = 7
        "00" + // relativeDecimals = 0
        "00002328" + // minRatio = 9000
        "00002af8" + // maxRatio = 11000
        "14" + // refBlobLen = 20 (address only, no params)
        "0000000000000000000000000000000000000000" + // referenceAdapter
        "14" + // relBlobLen = 20 (address only, no params)
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
        "00" + // referencePluckIndex = 0 (first pluck)
        "12" + // referenceDecimals = 18
        "01" + // relativePluckIndex = 1 (second pluck)
        "12" + // relativeDecimals = 18
        "00002328" + // minRatio = 9000 (90%)
        "00002af8" + // maxRatio = 11000 (110%)
        "14" + // refBlobLen = 20 (address only, no params)
        "0000000000000000000000000000000000000000" + // referenceAdapter
        "14" + // relBlobLen = 20 (address only, no params)
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
        "00" + // referencePluckIndex = 0 (first pluck - amountIn)
        "12" + // referenceDecimals = 18
        "01" + // relativePluckIndex = 1 (second pluck - amountOutMin)
        "12" + // relativeDecimals = 18
        "00002328" + // minRatio = 9000 (90%)
        "00002af8" + // maxRatio = 11000 (110%)
        "14" + // refBlobLen = 20 (address only, no params)
        "0000000000000000000000000000000000000000" + // referenceAdapter
        "14" + // relBlobLen = 20 (address only, no params)
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
      ).to.not.be.revert(ethers);
    });

    it("accepts WithinRatio when Pluck in earlier sibling subtree (DFS)", async () => {
      const { allowTarget } = await loadFixture(setup);

      const withinRatioCompValue =
        "0x" +
        "00" + // referencePluckIndex = 0
        "12" + // referenceDecimals = 18
        "01" + // relativePluckIndex = 1
        "12" + // relativeDecimals = 18
        "00002328" + // minRatio = 9000 (90%)
        "00002af8" + // maxRatio = 11000 (110%)
        "14" + // refBlobLen = 20 (address only, no params)
        "0000000000000000000000000000000000000000" + // referenceAdapter
        "14" + // relBlobLen = 20 (address only, no params)
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
      ).to.not.be.revert(ethers);
    });

    it("rejects Plucks hidden below Pass", async () => {
      const { roles, pack } = await loadFixture(setup);

      await expect(
        pack(
          flattenCondition({
            paramType: Encoding.None,
            operator: Operator.And,
            children: [
              {
                paramType: Encoding.Tuple,
                operator: Operator.Pass,
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
                compValue: "0x000001000000232800002af8",
              },
            ],
          }),
        ),
      )
        .to.be.revertedWithCustomError(roles, "PluckNotVisitedBeforeRef")
        .withArgs(2, 0);
    });

    it("intersects Pluck assignments across Or branches", async () => {
      const { roles, pack } = await loadFixture(setup);

      await expect(
        pack(
          flattenCondition({
            paramType: Encoding.None,
            operator: Operator.And,
            children: [
              {
                paramType: Encoding.Static,
                operator: Operator.Pluck,
                compValue: "0x01",
              },
              {
                paramType: Encoding.None,
                operator: Operator.Or,
                children: [
                  {
                    paramType: Encoding.Static,
                    operator: Operator.Pluck,
                    compValue: "0x00",
                  },
                  {
                    paramType: Encoding.Static,
                    operator: Operator.Pass,
                  },
                ],
              },
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue: "0x000001000000232800002af8",
              },
            ],
          }),
        ),
      )
        .to.be.revertedWithCustomError(roles, "PluckNotVisitedBeforeRef")
        .withArgs(3, 0);
    });

    it("does not export Pluck assignments from ArrayEvery", async () => {
      const { roles, pack } = await loadFixture(setup);

      await expect(
        pack(
          flattenCondition({
            paramType: Encoding.None,
            operator: Operator.And,
            children: [
              {
                paramType: Encoding.Array,
                operator: Operator.ArrayEvery,
                children: [
                  {
                    paramType: Encoding.None,
                    operator: Operator.And,
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
              {
                paramType: Encoding.None,
                operator: Operator.WithinRatio,
                compValue: "0x000001000000232800002af8",
              },
            ],
          }),
        ),
      )
        .to.be.revertedWithCustomError(roles, "PluckNotVisitedBeforeRef")
        .withArgs(2, 0);
    });

    it("rejects duplicate Pluck definitions", async () => {
      const { roles, pack } = await loadFixture(setup);

      await expect(
        pack(
          flattenCondition({
            paramType: Encoding.None,
            operator: Operator.And,
            children: [
              {
                paramType: Encoding.Static,
                operator: Operator.Pluck,
                compValue: "0x00",
              },
              {
                paramType: Encoding.Static,
                operator: Operator.Pluck,
                compValue: "0x00",
              },
            ],
          }),
        ),
      )
        .to.be.revertedWithCustomError(roles, "DuplicatePluckIndex")
        .withArgs(2, 0);
    });

    it("does not visit Plucks below an Array Pluck", async () => {
      const { roles, pack } = await loadFixture(setup);

      await expect(
        pack(
          flattenCondition({
            paramType: Encoding.None,
            operator: Operator.And,
            children: [
              {
                paramType: Encoding.Array,
                operator: Operator.Pluck,
                compValue: "0x00",
                children: [
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
                compValue: "0x010001000000232800002af8",
              },
            ],
          }),
        ),
      )
        .to.be.revertedWithCustomError(roles, "PluckNotVisitedBeforeRef")
        .withArgs(2, 1);
    });
  });
});
