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

function zipEvery(indexA: number, indexB: number) {
  return {
    paramType: Encoding.None,
    operator: Operator.ZipEvery,
    compValue:
      "0x" +
      indexA.toString(16).padStart(2, "0") +
      indexB.toString(16).padStart(2, "0"),
  };
}

describe("Operator - ZipEvery", () => {
  describe("basic matching", () => {
    it("passes when all zipped pairs match", async () => {
      const { allowFunction, invoke } = await loadFixture(setupTwoArrayParams);

      // ZipEvery: all pairs must satisfy the condition (tuple[1] > tuple[0])
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            pluckArray(0), // arr1 → pluckedPayloads[0]
            pluckArray(1), // arr2 → pluckedPayloads[1]
            {
              ...zipEvery(0, 1),
              children: [
                {
                  paramType: Encoding.Tuple,
                  operator: Operator.Matches,
                  children: [
                    {
                      paramType: Encoding.Static,
                      operator: Operator.Pass,
                    },
                    {
                      paramType: Encoding.Static,
                      operator: Operator.GreaterThan,
                      compValue: abiCoder.encode(["uint256"], [50]),
                    },
                  ],
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // All pairs have tuple[1] > 50: (1, 100), (2, 200), (3, 300)
      await expect(invoke([1, 2, 3], [100, 200, 300])).to.not.be.reverted;
    });

    it("fails when any zipped pair does not match", async () => {
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
              ...zipEvery(0, 1),
              children: [
                {
                  paramType: Encoding.Tuple,
                  operator: Operator.Matches,
                  children: [
                    {
                      paramType: Encoding.Static,
                      operator: Operator.Pass,
                    },
                    {
                      paramType: Encoding.Static,
                      operator: Operator.GreaterThan,
                      compValue: abiCoder.encode(["uint256"], [50]),
                    },
                  ],
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Pair (2, 30) fails: 30 !> 50
      await expect(invoke([1, 2, 3], [100, 30, 300]))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.NotEveryZippedElementPasses,
          anyValue,
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
              ...zipEvery(0, 1),
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
          anyValue,
          anyValue,
          anyValue,
        );
    });

    it("passes when both arrays are empty (vacuously true)", async () => {
      const { allowFunction, invoke } = await loadFixture(setupTwoArrayParams);

      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            pluckArray(0),
            pluckArray(1),
            {
              ...zipEvery(0, 1),
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

      // Empty arrays - vacuously true (all zero elements pass)
      await expect(invoke([], [])).to.not.be.reverted;
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
              ...zipEvery(0, 1),
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
    it("AND child - both tuple elements must satisfy their conditions for all pairs", async () => {
      const { roles, allowFunction, invoke } =
        await loadFixture(setupTwoArrayParams);

      // Check that for ALL pairs: tuple[0] > 10 AND tuple[1] < 500
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            pluckArray(0),
            pluckArray(1),
            {
              ...zipEvery(0, 1),
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
                          compValue: abiCoder.encode(["uint256"], [500]),
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

      // All pairs satisfy: (20, 100), (30, 200), (40, 300)
      await expect(invoke([20, 30, 40], [100, 200, 300])).to.not.be.reverted;

      // One pair fails: (5, 100) → 5 !> 10
      await expect(invoke([5, 30, 40], [100, 200, 300]))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.NotEveryZippedElementPasses,
          anyValue,
          anyValue,
          anyValue,
        );
    });

    it("OR child - either tuple element can satisfy for each pair", async () => {
      const { allowFunction, invoke } = await loadFixture(setupTwoArrayParams);

      // Check that for ALL pairs: tuple[0] == 42 OR tuple[1] == 99
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            pluckArray(0),
            pluckArray(1),
            {
              ...zipEvery(0, 1),
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

      // All pairs pass: (42, 10) → first branch, (1, 99) → second branch, (42, 99) → both
      await expect(invoke([42, 1, 42], [10, 99, 99])).to.not.be.reverted;
    });

    it("OR child - fails when any pair satisfies neither branch", async () => {
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
              ...zipEvery(0, 1),
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

      // Second pair (1, 50) fails: 1 != 42 AND 50 != 99
      await expect(invoke([42, 1], [10, 50]))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.NotEveryZippedElementPasses,
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

      // Each array element is (uint256, uint256)
      // Check that for ALL pairs: left.field0 + right.field0 > 100
      // We check left.field0 > 50 AND right.field0 > 50 as proxy
      await allowFunction(
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
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
              ...zipEvery(0, 1),
              children: [
                {
                  paramType: Encoding.None,
                  operator: Operator.And,
                  children: [
                    {
                      // Check left tuple's first field > 50
                      paramType: Encoding.Tuple,
                      operator: Operator.Matches,
                      children: [
                        {
                          paramType: Encoding.Tuple,
                          operator: Operator.Matches,
                          children: [
                            {
                              paramType: Encoding.Static,
                              operator: Operator.GreaterThan,
                              compValue: abiCoder.encode(["uint256"], [50]),
                            },
                            {
                              paramType: Encoding.Static,
                              operator: Operator.Pass,
                            },
                          ],
                        },
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
                    {
                      // Check right tuple's first field > 50
                      paramType: Encoding.Tuple,
                      operator: Operator.Matches,
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
                        {
                          paramType: Encoding.Tuple,
                          operator: Operator.Matches,
                          children: [
                            {
                              paramType: Encoding.Static,
                              operator: Operator.GreaterThan,
                              compValue: abiCoder.encode(["uint256"], [50]),
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
        }),
        ExecutionOptions.Both,
      );

      // All pairs have both fields > 50
      await expect(
        invoke(
          [
            [60, 1],
            [70, 2],
          ],
          [
            [80, 3],
            [90, 4],
          ],
        ),
      ).to.not.be.reverted;
    });
  });

  describe("integrity", () => {
    describe("ZipEvery compValue validation", () => {
      it("reverts UnsuitableCompValue when compValue is not 2 bytes", async () => {
        const { roles } = await loadFixture(setupTestContract);

        // compValue with 3 bytes instead of 2
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
                  operator: Operator.ZipEvery,
                  compValue: "0x000102", // 3 bytes - invalid
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
                  operator: Operator.ZipEvery,
                  compValue: "0x", // empty - invalid
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

    describe("ZipEvery child structure", () => {
      it("reverts UnsuitableChildCount when ZipEvery has no children", async () => {
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
                  operator: Operator.ZipEvery,
                  compValue: "0x0001",
                  children: [], // No children - invalid
                },
              ],
            }),
          ),
        ).to.be.revertedWithCustomError(roles, "UnsuitableChildCount");
      });

      it("reverts UnsuitableChildCount when ZipEvery has more than one child", async () => {
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
                  operator: Operator.ZipEvery,
                  compValue: "0x0001",
                  children: [
                    // Two children for ZipEvery - not allowed
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

      it("reverts UnsuitableChildTypeTree when ZipEvery child Tuple has wrong arity", async () => {
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
                  operator: Operator.ZipEvery,
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

    describe("ZipEvery type matching", () => {
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
                  operator: Operator.ZipEvery,
                  compValue: "0x0001",
                  children: [
                    {
                      paramType: Encoding.Tuple,
                      operator: Operator.Pass,
                      children: [
                        // Dynamic instead of Static - type mismatch
                        { paramType: Encoding.Dynamic, operator: Operator.Pass },
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
                  operator: Operator.ZipEvery,
                  compValue: "0x0001",
                  children: [
                    {
                      paramType: Encoding.Tuple,
                      operator: Operator.Pass,
                      children: [
                        { paramType: Encoding.Static, operator: Operator.Pass },
                        // Dynamic instead of Static - type mismatch
                        { paramType: Encoding.Dynamic, operator: Operator.Pass },
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

        // Both arrays have Static elements, Tuple has matching Static fields
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
                  { paramType: Encoding.Static, operator: Operator.Pass },
                ],
              },
              {
                paramType: Encoding.None,
                operator: Operator.ZipEvery,
                compValue: "0x0001",
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
        );
        // No error means success
      });
    });

    describe("ZipEvery child operator restrictions", () => {
      it("reverts UnsupportedOperator when ZipEvery descendant uses Pluck", async () => {
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
                  operator: Operator.ZipEvery,
                  compValue: "0x0001",
                  children: [
                    {
                      paramType: Encoding.Tuple,
                      operator: Operator.Matches,
                      children: [
                        // Pluck inside ZipEvery - not allowed
                        {
                          paramType: Encoding.Static,
                          operator: Operator.Pluck,
                          compValue: "0x02",
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

      it("reverts UnsupportedOperator when ZipEvery descendant uses ZipSome (nested)", async () => {
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
                  operator: Operator.ZipEvery,
                  compValue: "0x0001",
                  children: [
                    {
                      // Wrap nested ZipSome in And to make it non-structural
                      paramType: Encoding.None,
                      operator: Operator.And,
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
                        {
                          // Nested ZipSome - not allowed
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
            }),
          ),
        ).to.be.revertedWithCustomError(roles, "UnsupportedOperator");
      });

      it("reverts UnsupportedOperator when ZipEvery descendant uses ZipEvery (nested)", async () => {
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
                  operator: Operator.ZipEvery,
                  compValue: "0x0001",
                  children: [
                    {
                      // Wrap nested ZipEvery in And to make it non-structural
                      paramType: Encoding.None,
                      operator: Operator.And,
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
                        {
                          // Nested ZipEvery - not allowed
                          paramType: Encoding.None,
                          operator: Operator.ZipEvery,
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
            }),
          ),
        ).to.be.revertedWithCustomError(roles, "UnsupportedOperator");
      });
    });
  });
});
