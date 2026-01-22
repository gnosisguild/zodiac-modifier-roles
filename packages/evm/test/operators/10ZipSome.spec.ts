import { expect } from "chai";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder } from "ethers";

import {
  setupTwoArrayParams,
  setupTwoTupleArrayParams,
  setupTestContract,
} from "../setup";
import {
  Encoding,
  Operator,
  ExecutionOptions,
  ConditionViolationStatus,
  flattenCondition,
  packConditions,
} from "../utils";

const abiCoder = AbiCoder.defaultAbiCoder();

function pluckArray(index: number) {
  return {
    paramType: Encoding.Array,
    operator: Operator.Pluck,
    compValue: "0x" + index.toString(16).padStart(2, "0"),
    children: [
      {
        paramType: Encoding.Static,
        operator: Operator.Pass,
      },
    ],
  };
}

function zipSome(indexA: number, indexB: number) {
  return {
    paramType: Encoding.None,
    operator: Operator.ZipSome,
    compValue:
      "0x" +
      indexA.toString(16).padStart(2, "0") +
      indexB.toString(16).padStart(2, "0"),
  };
}

describe("Operator - ZipSome", () => {
  describe("sanity check", () => {
    it("array decoding works with ArraySome", async () => {
      const { allowFunction, invoke } = await loadFixture(setupTwoArrayParams);

      // Simple test: first array must have an element equal to 2
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Array,
              operator: Operator.ArraySome,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: abiCoder.encode(["uint256"], [2]),
                },
              ],
            },
            {
              paramType: Encoding.Array,
              operator: Operator.Pass,
              children: [
                { paramType: Encoding.Static, operator: Operator.Pass },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      await expect(invoke([1, 2, 3], [10, 100, 30])).to.not.be.reverted;
    });

    it("pluck with array encoding works", async () => {
      const { allowFunction, invoke } = await loadFixture(setupTwoArrayParams);

      // Pluck the arrays and just pass
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [pluckArray(0), pluckArray(1)],
        }),
        ExecutionOptions.Both,
      );

      await expect(invoke([1, 2, 3], [10, 100, 30])).to.not.be.reverted;
    });

    it("pluck + zipsome (minimal)", async () => {
      const { allowFunction, invoke } = await loadFixture(setupTwoArrayParams);

      // Pluck arrays and add ZipSome with Pass child
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            pluckArray(0),
            pluckArray(1),
            {
              ...zipSome(0, 1),
              children: [
                {
                  paramType: Encoding.Tuple,
                  operator: Operator.Pass,
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      await expect(invoke([1, 2, 3], [10, 100, 30])).to.not.be.reverted;
    });
  });

  describe("basic matching", () => {
    it("passes when at least one zipped pair matches", async () => {
      const { allowFunction, invoke } = await loadFixture(setupTwoArrayParams);

      // ZipSome: zip two arrays, check if any pair has equal elements
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            pluckArray(0), // arr1 → pluckedPayloads[0]
            pluckArray(1), // arr2 → pluckedPayloads[1]
            {
              ...zipSome(0, 1),
              children: [
                {
                  // Tuple check: tuple[0] == tuple[1]
                  paramType: Encoding.Tuple,
                  operator: Operator.Matches,
                  children: [
                    {
                      paramType: Encoding.Static,
                      operator: Operator.Pass,
                    },
                    {
                      paramType: Encoding.Static,
                      operator: Operator.EqualTo,
                      compValue: abiCoder.encode(["uint256"], [100]),
                    },
                  ],
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Arrays [1, 2, 3] and [10, 100, 30] - pair (2, 100) at index 1 passes
      await expect(invoke([1, 2, 3], [10, 100, 30])).to.not.be.reverted;
    });

    it("fails when no zipped pair matches", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupTwoArrayParams);

      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            pluckArray(0),
            pluckArray(1),
            {
              ...zipSome(0, 1),
              children: [
                {
                  paramType: Encoding.Tuple,
                  operator: Operator.Matches,
                  children: [
                    {
                      paramType: Encoding.Static,
                      operator: Operator.EqualTo,
                      compValue: abiCoder.encode(["uint256"], [999]),
                    },
                    {
                      paramType: Encoding.Static,
                      operator: Operator.Pass,
                    },
                  ],
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // No element in arr1 equals 999
      await expect(invoke([1, 2, 3], [10, 20, 30]))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.NoZippedElementPasses,
          3, // ZipSome node
          anyValue,
          anyValue,
        );
    });

    it("fails when arrays have different lengths", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupTwoArrayParams);

      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            pluckArray(0),
            pluckArray(1),
            {
              ...zipSome(0, 1),
              children: [
                {
                  paramType: Encoding.Tuple,
                  operator: Operator.Matches,
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Arrays have different lengths: 3 vs 2
      await expect(invoke([1, 2, 3], [10, 20]))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.ZippedArrayLengthMismatch,
          3, // ZipSome node
          anyValue,
          anyValue,
        );
    });

    it("fails when both arrays are empty", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupTwoArrayParams);

      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            pluckArray(0),
            pluckArray(1),
            {
              ...zipSome(0, 1),
              children: [
                {
                  paramType: Encoding.Tuple,
                  operator: Operator.Matches,
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Empty arrays - no pair can match
      await expect(invoke([], []))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.NoZippedElementPasses,
          3, // ZipSome node
          anyValue,
          anyValue,
        );
    });

    it("passes with single element arrays when pair matches", async () => {
      const { allowFunction, invoke } = await loadFixture(setupTwoArrayParams);

      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            pluckArray(0),
            pluckArray(1),
            {
              ...zipSome(0, 1),
              children: [
                {
                  paramType: Encoding.Tuple,
                  operator: Operator.Matches,
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Single element arrays that pass
      await expect(invoke([42], [100])).to.not.be.reverted;
    });
  });

  describe("logical operators as child", () => {
    it("AND child - both tuple elements must satisfy their conditions", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupTwoArrayParams);

      // Check that tuple[0] > 10 AND tuple[1] < 50
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            pluckArray(0),
            pluckArray(1),
            {
              ...zipSome(0, 1),
              children: [
                {
                  paramType: Encoding.None,
                  operator: Operator.And,
                  children: [
                    {
                      paramType: Encoding.Tuple,
                      operator: Operator.Matches,
                      children: [
                        {
                          paramType: Encoding.Static,
                          operator: Operator.GreaterThan,
                          compValue: abiCoder.encode(["uint256"], [10]),
                        },
                        { paramType: Encoding.Static, operator: Operator.Pass },
                      ],
                    },
                    {
                      paramType: Encoding.Tuple,
                      operator: Operator.Matches,
                      children: [
                        { paramType: Encoding.Static, operator: Operator.Pass },
                        {
                          paramType: Encoding.Static,
                          operator: Operator.LessThan,
                          compValue: abiCoder.encode(["uint256"], [50]),
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Pair (20, 30): 20 > 10 AND 30 < 50 → pass
      await expect(invoke([5, 20, 8], [100, 30, 60])).to.not.be.reverted;

      // No pair satisfies both: (5, 100) fails first, (20, 30) passes
      // Wait, (20, 30) should pass. Let me test failure case:
      // All pairs fail: (5, 100) → 5 !> 10, (8, 60) → 60 !< 50
      await expect(invoke([5, 8], [100, 60]))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.NoZippedElementPasses,
          anyValue,
          anyValue,
          anyValue,
        );
    });

    it("OR child - either tuple element can satisfy", async () => {
      const { allowFunction, invoke } = await loadFixture(setupTwoArrayParams);

      // Check that tuple[0] == 42 OR tuple[1] == 99
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            pluckArray(0),
            pluckArray(1),
            {
              ...zipSome(0, 1),
              children: [
                {
                  paramType: Encoding.None,
                  operator: Operator.Or,
                  children: [
                    {
                      paramType: Encoding.Tuple,
                      operator: Operator.Matches,
                      children: [
                        {
                          paramType: Encoding.Static,
                          operator: Operator.EqualTo,
                          compValue: abiCoder.encode(["uint256"], [42]),
                        },
                        { paramType: Encoding.Static, operator: Operator.Pass },
                      ],
                    },
                    {
                      paramType: Encoding.Tuple,
                      operator: Operator.Matches,
                      children: [
                        { paramType: Encoding.Static, operator: Operator.Pass },
                        {
                          paramType: Encoding.Static,
                          operator: Operator.EqualTo,
                          compValue: abiCoder.encode(["uint256"], [99]),
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Pair (1, 99): tuple[1] == 99 → pass via OR
      await expect(invoke([1, 2], [99, 50])).to.not.be.reverted;

      // Pair (42, 1): tuple[0] == 42 → pass via OR
      await expect(invoke([42, 2], [1, 50])).to.not.be.reverted;
    });

    it("OR child - fails when neither branch satisfies", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupTwoArrayParams);

      // Check that tuple[0] == 42 OR tuple[1] == 99
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            pluckArray(0),
            pluckArray(1),
            {
              ...zipSome(0, 1),
              children: [
                {
                  paramType: Encoding.None,
                  operator: Operator.Or,
                  children: [
                    {
                      paramType: Encoding.Tuple,
                      operator: Operator.Matches,
                      children: [
                        {
                          paramType: Encoding.Static,
                          operator: Operator.EqualTo,
                          compValue: abiCoder.encode(["uint256"], [42]),
                        },
                        { paramType: Encoding.Static, operator: Operator.Pass },
                      ],
                    },
                    {
                      paramType: Encoding.Tuple,
                      operator: Operator.Matches,
                      children: [
                        { paramType: Encoding.Static, operator: Operator.Pass },
                        {
                          paramType: Encoding.Static,
                          operator: Operator.EqualTo,
                          compValue: abiCoder.encode(["uint256"], [99]),
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // No pair satisfies: (1, 50) → 1 != 42 AND 50 != 99, (2, 60) → 2 != 42 AND 60 != 99
      await expect(invoke([1, 2], [50, 60]))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.NoZippedElementPasses,
          anyValue,
          anyValue,
          anyValue,
        );
    });
  });

  describe("complex tuple entries", () => {
    it("handles arrays of tuples with nested navigation", async () => {
      const { allowFunction, invoke } = await loadFixture(
        setupTwoTupleArrayParams,
      );

      // Arrays of (uint256, uint256) tuples
      // ZipSome creates tuple of two tuples: ((a0, a1), (b0, b1))
      // Check if any pair has a0 == b1
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              // First array of tuples
              paramType: Encoding.Array,
              operator: Operator.Pluck,
              compValue: "0x00",
              children: [
                {
                  paramType: Encoding.Tuple,
                  operator: Operator.Pass,
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
              ],
            },
            {
              // Second array of tuples
              paramType: Encoding.Array,
              operator: Operator.Pluck,
              compValue: "0x01",
              children: [
                {
                  paramType: Encoding.Tuple,
                  operator: Operator.Pass,
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
              ],
            },
            {
              ...zipSome(0, 1),
              children: [
                {
                  // Outer tuple: (tupleA, tupleB)
                  paramType: Encoding.Tuple,
                  operator: Operator.Matches,
                  children: [
                    {
                      // tupleA: check first element > 100
                      paramType: Encoding.Tuple,
                      operator: Operator.Matches,
                      children: [
                        {
                          paramType: Encoding.Static,
                          operator: Operator.GreaterThan,
                          compValue: abiCoder.encode(["uint256"], [100]),
                        },
                        { paramType: Encoding.Static, operator: Operator.Pass },
                      ],
                    },
                    {
                      // tupleB: check second element < 50
                      paramType: Encoding.Tuple,
                      operator: Operator.Matches,
                      children: [
                        { paramType: Encoding.Static, operator: Operator.Pass },
                        {
                          paramType: Encoding.Static,
                          operator: Operator.LessThan,
                          compValue: abiCoder.encode(["uint256"], [50]),
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // arr1: [(50, 1), (200, 2)], arr2: [(10, 100), (20, 30)]
      // Pair 0: tupleA=(50,1), tupleB=(10,100) → 50 !> 100 → fail
      // Pair 1: tupleA=(200,2), tupleB=(20,30) → 200 > 100 AND 30 < 50 → pass
      await expect(
        invoke(
          [
            [50, 1],
            [200, 2],
          ],
          [
            [10, 100],
            [20, 30],
          ],
        ),
      ).to.not.be.reverted;
    });
  });

  describe("integrity", () => {
    describe("ZipSome compValue validation", () => {
      it("reverts UnsuitableCompValue when compValue is not 2 bytes", async () => {
        const { roles } = await loadFixture(setupTestContract);

        await expect(
          packConditions(
            roles,
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.Array,
                  operator: Operator.Pluck,
                  compValue: "0x00",
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
                {
                  paramType: Encoding.Array,
                  operator: Operator.Pluck,
                  compValue: "0x01",
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
                {
                  paramType: Encoding.None,
                  operator: Operator.ZipSome,
                  compValue: "0x00", // Only 1 byte instead of 2
                  children: [
                    {
                      paramType: Encoding.Tuple,
                      operator: Operator.Pass,
                      children: [
                        { paramType: Encoding.Static, operator: Operator.Pass },
                        { paramType: Encoding.Static, operator: Operator.Pass },
                      ],
                    },
                  ],
                },
              ],
            }),
          ),
        ).to.be.revertedWithCustomError(roles, "UnsuitableCompValue");
      });

      it("reverts UnsuitableCompValue when compValue is empty", async () => {
        const { roles } = await loadFixture(setupTestContract);

        await expect(
          packConditions(
            roles,
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.Array,
                  operator: Operator.Pluck,
                  compValue: "0x00",
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
                {
                  paramType: Encoding.Array,
                  operator: Operator.Pluck,
                  compValue: "0x01",
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
                {
                  paramType: Encoding.None,
                  operator: Operator.ZipSome,
                  compValue: "0x", // Empty
                  children: [
                    {
                      paramType: Encoding.Tuple,
                      operator: Operator.Pass,
                      children: [
                        { paramType: Encoding.Static, operator: Operator.Pass },
                        { paramType: Encoding.Static, operator: Operator.Pass },
                      ],
                    },
                  ],
                },
              ],
            }),
          ),
        ).to.be.revertedWithCustomError(roles, "UnsuitableCompValue");
      });
    });

    describe("ZipSome child structure", () => {
      it("reverts UnsuitableChildCount when ZipSome has no children", async () => {
        const { roles } = await loadFixture(setupTestContract);

        await expect(
          packConditions(
            roles,
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.Array,
                  operator: Operator.Pluck,
                  compValue: "0x00",
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
                {
                  paramType: Encoding.Array,
                  operator: Operator.Pluck,
                  compValue: "0x01",
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
                {
                  paramType: Encoding.None,
                  operator: Operator.ZipSome,
                  compValue: "0x0001",
                  // No children!
                },
              ],
            }),
          ),
        ).to.be.revertedWithCustomError(roles, "UnsuitableChildCount");
      });

      it("reverts UnsuitableChildCount when ZipSome has more than one child", async () => {
        const { roles } = await loadFixture(setupTestContract);

        await expect(
          packConditions(
            roles,
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.Array,
                  operator: Operator.Pluck,
                  compValue: "0x00",
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
                {
                  paramType: Encoding.Array,
                  operator: Operator.Pluck,
                  compValue: "0x01",
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
                {
                  paramType: Encoding.None,
                  operator: Operator.ZipSome,
                  compValue: "0x0001",
                  children: [
                    // Two children for ZipSome - not allowed
                    {
                      paramType: Encoding.Tuple,
                      operator: Operator.Pass,
                      children: [
                        { paramType: Encoding.Static, operator: Operator.Pass },
                        { paramType: Encoding.Static, operator: Operator.Pass },
                      ],
                    },
                    {
                      paramType: Encoding.Tuple,
                      operator: Operator.Pass,
                      children: [
                        { paramType: Encoding.Static, operator: Operator.Pass },
                        { paramType: Encoding.Static, operator: Operator.Pass },
                      ],
                    },
                  ],
                },
              ],
            }),
          ),
        ).to.be.revertedWithCustomError(roles, "UnsuitableChildCount");
      });

      it("reverts UnsuitableChildTypeTree when ZipSome child Tuple has wrong arity", async () => {
        const { roles } = await loadFixture(setupTestContract);

        // Tuple with 3 children instead of 2 - typeHash won't match
        await expect(
          packConditions(
            roles,
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.Array,
                  operator: Operator.Pluck,
                  compValue: "0x00",
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
                {
                  paramType: Encoding.Array,
                  operator: Operator.Pluck,
                  compValue: "0x01",
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
                {
                  paramType: Encoding.None,
                  operator: Operator.ZipSome,
                  compValue: "0x0001",
                  children: [
                    {
                      paramType: Encoding.Tuple,
                      operator: Operator.Pass,
                      children: [
                        // 3 children instead of 2
                        { paramType: Encoding.Static, operator: Operator.Pass },
                        { paramType: Encoding.Static, operator: Operator.Pass },
                        { paramType: Encoding.Static, operator: Operator.Pass },
                      ],
                    },
                  ],
                },
              ],
            }),
          ),
        ).to.be.revertedWithCustomError(roles, "UnsuitableChildTypeTree");
      });
    });

    describe("ZipSome type matching", () => {
      it("reverts when Tuple field 1 type doesn't match first array element type", async () => {
        const { roles } = await loadFixture(setupTestContract);

        // First array has Static elements, but Tuple field 1 is Dynamic
        await expect(
          packConditions(
            roles,
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.Array,
                  operator: Operator.Pluck,
                  compValue: "0x00",
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
                {
                  paramType: Encoding.Array,
                  operator: Operator.Pluck,
                  compValue: "0x01",
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
                {
                  paramType: Encoding.None,
                  operator: Operator.ZipSome,
                  compValue: "0x0001",
                  children: [
                    {
                      paramType: Encoding.Tuple,
                      operator: Operator.Pass,
                      children: [
                        {
                          paramType: Encoding.Dynamic, // Doesn't match first array's Static
                          operator: Operator.Pass,
                        },
                        { paramType: Encoding.Static, operator: Operator.Pass },
                      ],
                    },
                  ],
                },
              ],
            }),
          ),
        ).to.be.revertedWithCustomError(roles, "UnsuitableChildTypeTree");
      });

      it("reverts when Tuple field 2 type doesn't match second array element type", async () => {
        const { roles } = await loadFixture(setupTestContract);

        // Second array has Static elements, but Tuple field 2 is Dynamic
        await expect(
          packConditions(
            roles,
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.Array,
                  operator: Operator.Pluck,
                  compValue: "0x00",
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
                {
                  paramType: Encoding.Array,
                  operator: Operator.Pluck,
                  compValue: "0x01",
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
                {
                  paramType: Encoding.None,
                  operator: Operator.ZipSome,
                  compValue: "0x0001",
                  children: [
                    {
                      paramType: Encoding.Tuple,
                      operator: Operator.Pass,
                      children: [
                        { paramType: Encoding.Static, operator: Operator.Pass },
                        {
                          paramType: Encoding.Dynamic, // Doesn't match second array's Static
                          operator: Operator.Pass,
                        },
                      ],
                    },
                  ],
                },
              ],
            }),
          ),
        ).to.be.revertedWithCustomError(roles, "UnsuitableChildTypeTree");
      });

      it("allows when Tuple fields match respective array element types", async () => {
        const { roles } = await loadFixture(setupTestContract);

        await packConditions(
          roles,
          flattenCondition({
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            children: [
              {
                paramType: Encoding.Array,
                operator: Operator.Pluck,
                compValue: "0x00",
                children: [
                  { paramType: Encoding.Static, operator: Operator.Pass },
                ],
              },
              {
                paramType: Encoding.Array,
                operator: Operator.Pluck,
                compValue: "0x01",
                children: [
                  { paramType: Encoding.Dynamic, operator: Operator.Pass },
                ],
              },
              {
                paramType: Encoding.None,
                operator: Operator.ZipSome,
                compValue: "0x0001",
                children: [
                  {
                    paramType: Encoding.Tuple,
                    operator: Operator.Pass,
                    children: [
                      {
                        paramType: Encoding.Static, // Matches first array
                        operator: Operator.Pass,
                      },
                      {
                        paramType: Encoding.Dynamic, // Matches second array
                        operator: Operator.Pass,
                      },
                    ],
                  },
                ],
              },
            ],
          }),
        );
        // No error means success
      });
    });

    describe("ZipSome child operator restrictions", () => {
      it("reverts UnsupportedOperator when ZipSome descendant uses Pluck", async () => {
        const { roles } = await loadFixture(setupTestContract);

        await expect(
          packConditions(
            roles,
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.Array,
                  operator: Operator.Pluck,
                  compValue: "0x00",
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
                {
                  paramType: Encoding.Array,
                  operator: Operator.Pluck,
                  compValue: "0x01",
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
                {
                  paramType: Encoding.None,
                  operator: Operator.ZipSome,
                  compValue: "0x0001",
                  children: [
                    {
                      paramType: Encoding.Tuple,
                      operator: Operator.Pass,
                      children: [
                        {
                          paramType: Encoding.Static,
                          operator: Operator.Pluck, // Not allowed inside ZipSome!
                          compValue: "0x00",
                        },
                        { paramType: Encoding.Static, operator: Operator.Pass },
                      ],
                    },
                  ],
                },
              ],
            }),
          ),
        ).to.be.revertedWithCustomError(roles, "UnsupportedOperator");
      });

      it("reverts UnsupportedOperator when ZipSome descendant uses ZipSome (nested)", async () => {
        const { roles } = await loadFixture(setupTestContract);

        // Nested ZipSome is wrapped in an And so the outer Tuple has valid structure
        await expect(
          packConditions(
            roles,
            flattenCondition({
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.Array,
                  operator: Operator.Pluck,
                  compValue: "0x00",
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
                {
                  paramType: Encoding.Array,
                  operator: Operator.Pluck,
                  compValue: "0x01",
                  children: [
                    { paramType: Encoding.Static, operator: Operator.Pass },
                  ],
                },
                {
                  paramType: Encoding.None,
                  operator: Operator.ZipSome,
                  compValue: "0x0001",
                  children: [
                    {
                      paramType: Encoding.Tuple,
                      operator: Operator.Pass,
                      children: [
                        { paramType: Encoding.Static, operator: Operator.Pass },
                        {
                          // Wrap field 2 in And, with nested ZipSome as extra child
                          paramType: Encoding.None,
                          operator: Operator.And,
                          children: [
                            {
                              paramType: Encoding.Static,
                              operator: Operator.Pass,
                            },
                            {
                              paramType: Encoding.None,
                              operator: Operator.ZipSome, // Nested ZipSome not allowed!
                              compValue: "0x0001",
                              children: [
                                {
                                  paramType: Encoding.Tuple,
                                  operator: Operator.Pass,
                                  children: [
                                    {
                                      paramType: Encoding.Static,
                                      operator: Operator.Pass,
                                    },
                                    {
                                      paramType: Encoding.Static,
                                      operator: Operator.Pass,
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            }),
          ),
        ).to.be.revertedWithCustomError(roles, "UnsupportedOperator");
      });
    });
  });
});
