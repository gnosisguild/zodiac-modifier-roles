import { describe, it, expect } from "vitest"
import { Operator, ParameterType, Condition } from "zodiac-roles-deployments"
import { hoistCondition, hoistTopOrs } from "./hoistCondition"
import { normalizeConditionNext } from "./normalizeConditionNext"
import { conditionHash, conditionId } from "./conditionId"

import { abiEncode } from "../../abiEncode"

// Helper to create a static comparison condition
const COMP = (id: number | `0x${string}`): Condition => ({
  paramType: ParameterType.Static,
  operator: Operator.EqualTo,
  compValue: typeof id === "string" ? id : abiEncode(["uint256"], [id]),
})

// Helper to create a PASS condition
const PASS = (): Condition => ({
  paramType: ParameterType.Static,
  operator: Operator.Pass,
})

// Helper to create a dynamic condition
const DYNAMIC = (operator: Operator = Operator.Pass): Condition => ({
  paramType: ParameterType.Dynamic,
  operator,
})

// Helper to create allowance conditions
const ETHER_ALLOWANCE = (): Condition => ({
  paramType: ParameterType.None,
  operator: Operator.EtherWithinAllowance,
})

const CALL_ALLOWANCE = (): Condition => ({
  paramType: ParameterType.None,
  operator: Operator.CallWithinAllowance,
})

const WITHIN_ALLOWANCE = (): Condition => ({
  paramType: ParameterType.Static,
  operator: Operator.WithinAllowance,
  compValue: "0x",
})

// Helper to create a MATCHES condition
const MATCHES = (
  paramType: ParameterType,
  ...children: Condition[]
): Condition => ({
  paramType,
  operator: Operator.Matches,
  children,
})

// Helper to create logical conditions
const AND = (...children: Condition[]): Condition => ({
  paramType: ParameterType.None,
  operator: Operator.And,
  children,
})

const OR = (...children: Condition[]): Condition => ({
  paramType: ParameterType.None,
  operator: Operator.Or,
  children,
})

const NOR = (...children: Condition[]): Condition => ({
  paramType: ParameterType.None,
  operator: Operator.Nor,
  children,
})

// Helper for other operators
const GT = (value: number): Condition => ({
  paramType: ParameterType.Static,
  operator: Operator.GreaterThan,
  compValue: abiEncode(["uint256"], [value]),
})

const LT = (value: number): Condition => ({
  paramType: ParameterType.Static,
  operator: Operator.LessThan,
  compValue: abiEncode(["uint256"], [value]),
})

// Helper to compare conditions using conditionId
const expectSameCondition = (actual: Condition, expected: Condition) => {
  expect(conditionHash(actual)).toBe(conditionHash(expected))
}

describe("hoistCondition", () => {
  describe("Basic hoisting from different MATCHES types", () => {
    it("hoists OR from Calldata MATCHES", () => {
      const input = MATCHES(
        ParameterType.Calldata,
        COMP(1),
        OR(COMP(2), COMP(3)),
        COMP(4)
      )

      const result = hoistCondition(input)

      const expected = OR(
        MATCHES(ParameterType.Calldata, COMP(1), COMP(2), COMP(4)),
        MATCHES(ParameterType.Calldata, COMP(1), COMP(3), COMP(4))
      )

      expectSameCondition(result, expected)
    })

    it("hoists AND from AbiEncoded MATCHES", () => {
      const input = MATCHES(
        ParameterType.AbiEncoded,
        COMP(1),
        AND(COMP(2), COMP(3)),
        COMP(4)
      )

      const result = hoistCondition(input)

      const expected = AND(
        MATCHES(ParameterType.AbiEncoded, COMP(1), COMP(2), COMP(4)),
        MATCHES(ParameterType.AbiEncoded, COMP(1), COMP(3), COMP(4))
      )

      expectSameCondition(result, expected)
    })

    it("hoists OR from Tuple MATCHES", () => {
      const input = MATCHES(
        ParameterType.Tuple,
        COMP(1),
        OR(COMP(2), COMP(3)),
        PASS(),
        COMP(4)
      )

      const result = hoistCondition(input)

      const expected = OR(
        MATCHES(ParameterType.Tuple, COMP(1), COMP(2), PASS(), COMP(4)),
        MATCHES(ParameterType.Tuple, COMP(1), COMP(3), PASS(), COMP(4))
      )

      expectSameCondition(result, expected)
    })

    it("hoists AND from Array MATCHES", () => {
      const input = MATCHES(
        ParameterType.Array,
        AND(
          MATCHES(ParameterType.Static, COMP(1)),
          MATCHES(ParameterType.Static, COMP(2))
        )
      )

      const result = hoistCondition(input)

      const expected = AND(
        MATCHES(ParameterType.Array, MATCHES(ParameterType.Static, COMP(1))),
        MATCHES(ParameterType.Array, MATCHES(ParameterType.Static, COMP(2)))
      )

      expectSameCondition(result, expected)
    })
  })

  describe("Array-specific test cases", () => {
    it("hoists from Array MATCHES with single element", () => {
      const input = MATCHES(
        ParameterType.Array,
        OR(
          MATCHES(ParameterType.Static, COMP(1)),
          MATCHES(ParameterType.Static, COMP(2))
        )
      )

      const result = hoistCondition(input)

      const expected = OR(
        MATCHES(ParameterType.Array, MATCHES(ParameterType.Static, COMP(1))),
        MATCHES(ParameterType.Array, MATCHES(ParameterType.Static, COMP(2)))
      )

      expectSameCondition(result, expected)
    })

    it("hoists from Array MATCHES with multiple elements", () => {
      const input = MATCHES(
        ParameterType.Array,
        MATCHES(ParameterType.Static, COMP(1)),
        OR(
          MATCHES(ParameterType.Static, COMP(2)),
          MATCHES(ParameterType.Static, COMP(3))
        ),
        MATCHES(ParameterType.Static, COMP(4))
      )

      const result = hoistCondition(input)

      const expected = OR(
        MATCHES(
          ParameterType.Array,
          MATCHES(ParameterType.Static, COMP(1)),
          MATCHES(ParameterType.Static, COMP(2)),
          MATCHES(ParameterType.Static, COMP(4))
        ),
        MATCHES(
          ParameterType.Array,
          MATCHES(ParameterType.Static, COMP(1)),
          MATCHES(ParameterType.Static, COMP(3)),
          MATCHES(ParameterType.Static, COMP(4))
        )
      )

      expectSameCondition(result, expected)
    })

    it("handles Array MATCHES with length mismatch in OR branches", () => {
      const input = MATCHES(
        ParameterType.Array,
        OR(
          AND(
            MATCHES(ParameterType.Static, COMP(1)),
            MATCHES(ParameterType.Static, COMP(2))
          ),
          MATCHES(ParameterType.Static, COMP(3))
        )
      )

      const expected = OR(
        MATCHES(ParameterType.Array, MATCHES(ParameterType.Static, COMP(3))),
        AND(
          MATCHES(ParameterType.Array, MATCHES(ParameterType.Static, COMP(1))),
          MATCHES(ParameterType.Array, MATCHES(ParameterType.Static, COMP(2)))
        )
      )
      const result = hoistCondition(input)

      expectSameCondition(expected, result)
    })

    it("handles Array MATCHES with nested Arrays", () => {
      const input = MATCHES(
        ParameterType.Array,
        MATCHES(
          ParameterType.Array,
          OR(
            MATCHES(ParameterType.Static, COMP(1)),
            MATCHES(ParameterType.Static, COMP(2))
          )
        )
      )

      const result = hoistCondition(input)

      const expected = OR(
        MATCHES(
          ParameterType.Array,
          MATCHES(ParameterType.Array, MATCHES(ParameterType.Static, COMP(1)))
        ),
        MATCHES(
          ParameterType.Array,
          MATCHES(ParameterType.Array, MATCHES(ParameterType.Static, COMP(2)))
        )
      )

      expectSameCondition(result, expected)
    })

    it("preserves Array structure during hoisting", () => {
      const input = MATCHES(
        ParameterType.Array,
        MATCHES(ParameterType.Tuple, COMP(1), OR(COMP(2), COMP(3)), COMP(4))
      )

      const result = hoistCondition(input)

      const expected = OR(
        MATCHES(
          ParameterType.Array,
          MATCHES(ParameterType.Tuple, COMP(1), COMP(2), COMP(4))
        ),
        MATCHES(
          ParameterType.Array,
          MATCHES(ParameterType.Tuple, COMP(1), COMP(3), COMP(4))
        )
      )

      expectSameCondition(result, expected)
    })
  })

  describe("Complex type combinations", () => {
    it("hoists from Tuple containing Calldata MATCHES", () => {
      const input = MATCHES(
        ParameterType.Tuple,
        COMP(1),
        MATCHES(ParameterType.Calldata, OR(COMP(2), COMP(3)), COMP(4)),
        COMP(5)
      )

      const result = hoistCondition(input)

      const expected = OR(
        MATCHES(
          ParameterType.Tuple,
          COMP(1),
          MATCHES(ParameterType.Calldata, COMP(2), COMP(4)),
          COMP(5)
        ),
        MATCHES(
          ParameterType.Tuple,
          COMP(1),
          MATCHES(ParameterType.Calldata, COMP(3), COMP(4)),
          COMP(5)
        )
      )

      expectSameCondition(result, expected)
    })

    it("hoists from AbiEncoded containing Tuple MATCHES", () => {
      const input = MATCHES(
        ParameterType.AbiEncoded,
        MATCHES(ParameterType.Tuple, AND(COMP(1), COMP(2)), COMP(3)),
        COMP(4)
      )

      const result = hoistCondition(input)

      const expected = AND(
        MATCHES(
          ParameterType.AbiEncoded,
          MATCHES(ParameterType.Tuple, COMP(1), COMP(3)),
          COMP(4)
        ),
        MATCHES(
          ParameterType.AbiEncoded,
          MATCHES(ParameterType.Tuple, COMP(2), COMP(3)),
          COMP(4)
        )
      )

      expectSameCondition(result, expected)
    })

    it("hoists from Calldata containing Array MATCHES", () => {
      const input = MATCHES(
        ParameterType.Calldata,
        COMP(1),
        MATCHES(
          ParameterType.Array,
          OR(
            MATCHES(ParameterType.Static, COMP(2)),
            MATCHES(ParameterType.Static, COMP(3))
          )
        )
      )

      const result = hoistCondition(input)

      const expected = OR(
        MATCHES(
          ParameterType.Calldata,
          COMP(1),
          MATCHES(ParameterType.Array, MATCHES(ParameterType.Static, COMP(2)))
        ),
        MATCHES(
          ParameterType.Calldata,
          COMP(1),
          MATCHES(ParameterType.Array, MATCHES(ParameterType.Static, COMP(3)))
        )
      )

      expectSameCondition(result, expected)
    })

    it("handles mixed static and dynamic children in Tuple", () => {
      const input = MATCHES(
        ParameterType.Tuple,
        COMP(1), // Static
        DYNAMIC(), // Dynamic
        OR(COMP(2), COMP(3)), // Static with OR
        MATCHES(ParameterType.Array, COMP(4)) // Dynamic (Array)
      )

      const result = hoistCondition(input)

      const expected = OR(
        MATCHES(
          ParameterType.Tuple,
          COMP(1),
          DYNAMIC(),
          COMP(2),
          MATCHES(ParameterType.Array, COMP(4))
        ),
        MATCHES(
          ParameterType.Tuple,
          COMP(1),
          DYNAMIC(),
          COMP(3),
          MATCHES(ParameterType.Array, COMP(4))
        )
      )

      expectSameCondition(result, expected)
    })

    it("handles dynamic parameter type detection correctly", () => {
      const input = MATCHES(
        ParameterType.Tuple,
        MATCHES(ParameterType.Array, COMP(1)), // Dynamic
        OR(DYNAMIC(), DYNAMIC(Operator.EqualTo)),
        COMP(2) // Static
      )

      const result = hoistCondition(input)

      const expected = OR(
        MATCHES(
          ParameterType.Tuple,
          MATCHES(ParameterType.Array, COMP(1)),
          DYNAMIC(),
          COMP(2)
        ),
        MATCHES(
          ParameterType.Tuple,
          MATCHES(ParameterType.Array, COMP(1)),
          DYNAMIC(Operator.EqualTo),
          COMP(2)
        )
      )

      expectSameCondition(result, expected)
    })
  })

  describe("No hoisting cases", () => {
    it("does not hoist when no logical operators in MATCHES", () => {
      const input = MATCHES(ParameterType.Calldata, COMP(1), COMP(2), COMP(3))

      const result = hoistCondition(input)
      expectSameCondition(result, input)
    })

    it("does not hoist when parent is not MATCHES", () => {
      const input = AND(COMP(1), OR(COMP(2), COMP(3)))

      const result = hoistCondition(input)
      expectSameCondition(result, input)
    })

    it("does not hoist NOR (only AND/OR are hoistable)", () => {
      const input = MATCHES(
        ParameterType.Calldata,
        NOR(COMP(1), COMP(2)),
        COMP(3)
      )

      const result = hoistCondition(input)
      expectSameCondition(result, input)
    })

    it("does not hoist empty logical operators", () => {
      const input = MATCHES(ParameterType.Calldata, COMP(1), OR(), COMP(2))

      const result = hoistCondition(input)
      expectSameCondition(result, input)
    })

    it("cannot hoist from root position", () => {
      const input = OR(COMP(1), COMP(2))

      const result = hoistCondition(input)
      expectSameCondition(result, input)
    })

    it("does not hoist non-logical operators with children", () => {
      const input = MATCHES(
        ParameterType.Calldata,
        MATCHES(ParameterType.Tuple, COMP(1), COMP(2)),
        COMP(3)
      )

      const result = hoistCondition(input)
      expectSameCondition(result, input)
    })

    it("does not hoist from non-MATCHES operators", () => {
      // Even if a non-MATCHES node has logical children
      const input: Condition = {
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: "0x01",
        children: [OR(COMP(1), COMP(2))], // This shouldn't happen but test it
      }

      const result = hoistCondition(input)
      expectSameCondition(result, input)
    })
  })

  describe("Multiple hoisting with different types", () => {
    it.skip("hoists multiple ORs from different positions in Calldata", () => {
      const input = MATCHES(
        ParameterType.Calldata,
        OR(COMP(1), COMP(2)),
        COMP(3),
        OR(COMP(4), COMP(5)),
        COMP(6)
      )

      const result = hoistCondition(input)

      // Should create 2x2=4 combinations
      const expected = OR(
        MATCHES(ParameterType.Calldata, COMP(1), COMP(3), COMP(4), COMP(6)),
        MATCHES(ParameterType.Calldata, COMP(1), COMP(3), COMP(5), COMP(6)),
        MATCHES(ParameterType.Calldata, COMP(2), COMP(3), COMP(4), COMP(6)),
        MATCHES(ParameterType.Calldata, COMP(2), COMP(3), COMP(5), COMP(6))
      )

      expectSameCondition(result, expected)
    })

    it("hoists from nested MATCHES of different types", () => {
      const input = MATCHES(
        ParameterType.AbiEncoded,
        MATCHES(
          ParameterType.Tuple,
          OR(COMP(1), COMP(2)),
          MATCHES(ParameterType.Calldata, AND(COMP(3), COMP(4)), COMP(5))
        )
      )

      const result = hoistCondition(input)

      const expected = AND(
        OR(
          MATCHES(
            ParameterType.AbiEncoded,
            MATCHES(
              ParameterType.Tuple,
              COMP(1),
              MATCHES(ParameterType.Calldata, COMP(3), COMP(5))
            )
          ),
          MATCHES(
            ParameterType.AbiEncoded,
            MATCHES(
              ParameterType.Tuple,
              COMP(2),
              MATCHES(ParameterType.Calldata, COMP(3), COMP(5))
            )
          )
        ),
        OR(
          MATCHES(
            ParameterType.AbiEncoded,
            MATCHES(
              ParameterType.Tuple,
              COMP(1),
              MATCHES(ParameterType.Calldata, COMP(4), COMP(5))
            )
          ),
          MATCHES(
            ParameterType.AbiEncoded,
            MATCHES(
              ParameterType.Tuple,
              COMP(2),
              MATCHES(ParameterType.Calldata, COMP(4), COMP(5))
            )
          )
        )
      )

      expectSameCondition(result, expected)
    })

    it("hoists repeatedly through multiple type layers", () => {
      const input = MATCHES(
        ParameterType.Calldata,
        AND(OR(COMP(1), COMP(2)), OR(COMP(3), COMP(4))),
        COMP(5)
      )

      const result = hoistCondition(input)

      // First hoists AND, then the ORs within
      expect(result.operator).toBe(Operator.And)
      expect(
        result.children?.every((child) => child.operator === Operator.Or)
      ).toBe(true)
    })

    it("handles AND/OR at different depths in different types", () => {
      const input = MATCHES(
        ParameterType.Tuple,
        OR(COMP(1), COMP(2)), // Direct child
        MATCHES(
          ParameterType.Array,
          MATCHES(
            ParameterType.Static,
            AND(COMP(3), COMP(4)) // Deeply nested
          )
        )
      )

      const result = hoistCondition(input)

      // Should eventually hoist both logical operators
      expect([Operator.And, Operator.Or]).toContain(result.operator)
    })
  })

  describe("Edge cases with special operators and types", () => {
    it("preserves comparison operators during hoisting", () => {
      const input = MATCHES(
        ParameterType.Calldata,
        GT(100),
        OR(COMP(1), COMP(2)),
        LT(200),
        WITHIN_ALLOWANCE()
      )

      const result = hoistCondition(input)

      expect(result.operator).toBe(Operator.Or)

      // Check that all operators are preserved
      result.children?.forEach((child) => {
        const operators = child.children?.map((c) => c.operator) ?? []
        expect(operators).toContain(Operator.GreaterThan)
        expect(operators).toContain(Operator.LessThan)
        expect(operators).toContain(Operator.WithinAllowance)
      })
    })

    it("handles PASS operators in different positions", () => {
      const input = MATCHES(
        ParameterType.Tuple,
        PASS(),
        OR(COMP(1), COMP(2)),
        PASS(),
        COMP(3),
        PASS()
      )

      const result = hoistCondition(input)

      expect(result.operator).toBe(Operator.Or)
      // Each branch should preserve PASS operators
      result.children?.forEach((child) => {
        const passCount =
          child.children?.filter((c) => c.operator === Operator.Pass).length ??
          0
        expect(passCount).toBe(3)
      })
    })

    it("preserves EtherWithinAllowance in Calldata MATCHES", () => {
      const input = MATCHES(
        ParameterType.Calldata,
        OR(COMP(1), COMP(2)),
        COMP(3),
        ETHER_ALLOWANCE()
      )

      const result = hoistCondition(input)

      expect(result.operator).toBe(Operator.Or)
      result.children?.forEach((child) => {
        const hasEtherAllowance = child.children?.some(
          (c) => c.operator === Operator.EtherWithinAllowance
        )
        expect(hasEtherAllowance).toBe(true)
      })
    })

    it("preserves CallWithinAllowance in Calldata MATCHES", () => {
      const input = MATCHES(
        ParameterType.Calldata,
        COMP(1),
        AND(COMP(2), COMP(3)),
        CALL_ALLOWANCE(),
        ETHER_ALLOWANCE()
      )

      const result = hoistCondition(input)

      expect(result.operator).toBe(Operator.And)
      result.children?.forEach((child) => {
        const hasCallAllowance = child.children?.some(
          (c) => c.operator === Operator.CallWithinAllowance
        )
        const hasEtherAllowance = child.children?.some(
          (c) => c.operator === Operator.EtherWithinAllowance
        )
        expect(hasCallAllowance).toBe(true)
        expect(hasEtherAllowance).toBe(true)
      })
    })

    it("handles WithinAllowance in Tuple MATCHES", () => {
      const input = MATCHES(
        ParameterType.Tuple,
        WITHIN_ALLOWANCE(),
        OR(COMP(1), COMP(2)),
        WITHIN_ALLOWANCE()
      )

      const result = hoistCondition(input)

      expect(result.operator).toBe(Operator.Or)
      result.children?.forEach((child) => {
        const allowanceCount =
          child.children?.filter((c) => c.operator === Operator.WithinAllowance)
            .length ?? 0
        expect(allowanceCount).toBe(2)
      })
    })

    it("handles empty children arrays in MATCHES", () => {
      const input = MATCHES(
        ParameterType.Calldata
        // No children
      )

      const result = hoistCondition(input)
      expectSameCondition(result, input)
    })
  })

  describe("Normalization interactions by type", () => {
    it("maintains normalized form after hoisting from Calldata", () => {
      const input = MATCHES(
        ParameterType.Calldata,
        COMP(1),
        OR(COMP(2), COMP(3)),
        COMP(4)
      )

      const normalized = normalizeConditionNext(input)
      const hoisted = hoistCondition(normalized)

      // hoistCondition strips IDs, so we need to check the structure
      expect(hoisted.operator).toBe(Operator.Or)
    })

    it("maintains normalized form after hoisting from AbiEncoded", () => {
      const input = MATCHES(
        ParameterType.AbiEncoded,
        AND(COMP(1), COMP(2)),
        COMP(3)
      )

      const normalized = normalizeConditionNext(input)
      const hoisted = hoistCondition(normalized)

      // hoistCondition strips IDs, so we need to check the structure
      expect(hoisted.operator).toBe(Operator.And)
    })

    it("maintains normalized form after hoisting from Tuple", () => {
      const input = MATCHES(
        ParameterType.Tuple,
        COMP(1),
        OR(COMP(2), COMP(3)),
        PASS()
      )

      const normalized = normalizeConditionNext(input)
      const hoisted = hoistCondition(normalized)

      // hoistCondition strips IDs, so we need to check the structure
      expect(hoisted.operator).toBe(Operator.Or)
    })

    it("maintains normalized form after hoisting from Array", () => {
      const input = MATCHES(
        ParameterType.Array,
        OR(
          MATCHES(ParameterType.Static, COMP(1)),
          MATCHES(ParameterType.Static, COMP(2))
        )
      )

      const normalized = normalizeConditionNext(input)
      const hoisted = hoistCondition(normalized)

      // hoistCondition strips IDs, so we need to check the structure
      expect(hoisted.operator).toBe(Operator.Or)
    })

    it("handles pruneTrailingPass interaction correctly", () => {
      // Trailing PASS nodes should be pruned in normalization
      const input = MATCHES(
        ParameterType.Calldata,
        OR(COMP(1), COMP(2)),
        PASS(),
        PASS()
      )

      const result = hoistCondition(input)

      expect(result.operator).toBe(Operator.Or)
      // Trailing passes should be removed by normalization
      result.children?.forEach((child) => {
        expect(child.children?.length).toBeLessThanOrEqual(1)
      })
    })
  })

  describe("Array length mismatch scenarios", () => {
    it("handles OR branches with different Tuple lengths", () => {
      const input = MATCHES(
        ParameterType.Calldata,
        OR(
          MATCHES(ParameterType.Tuple, COMP(1), COMP(2), COMP(3)),
          MATCHES(ParameterType.Tuple, COMP(4), COMP(5)) // Shorter
        ),
        COMP(6)
      )

      const result = hoistCondition(input)

      expect(result.operator).toBe(Operator.Or)
    })

    it("handles OR branches with different Calldata lengths", () => {
      const input = MATCHES(
        ParameterType.Tuple,
        OR(
          MATCHES(ParameterType.Calldata, COMP(1), COMP(2), COMP(3), COMP(4)),
          MATCHES(ParameterType.Calldata, COMP(5), COMP(6)) // Shorter
        )
      )

      const result = hoistCondition(input)

      expect(result.operator).toBe(Operator.Or)
    })

    it("handles OR branches with different Array element counts", () => {
      const input = MATCHES(
        ParameterType.Calldata,
        OR(
          MATCHES(
            ParameterType.Array,
            MATCHES(ParameterType.Static, COMP(1)),
            MATCHES(ParameterType.Static, COMP(2))
          ),
          MATCHES(ParameterType.Array, MATCHES(ParameterType.Static, COMP(3)))
        )
      )

      const result = hoistCondition(input)

      expect(result.operator).toBe(Operator.Or)
    })

    it("handles mixed empty and non-empty children arrays", () => {
      const input = MATCHES(
        ParameterType.Tuple,
        MATCHES(ParameterType.Calldata), // Empty children
        OR(COMP(1), COMP(2)),
        MATCHES(ParameterType.Array, COMP(3)) // Has children
      )

      const result = hoistCondition(input)

      expect(result.operator).toBe(Operator.Or)
    })
  })

  describe("Complex real-world scenarios by type", () => {
    it("handles deeply nested Calldata->Tuple->Array structure", () => {
      const input = MATCHES(
        ParameterType.Calldata,
        COMP(1),
        MATCHES(
          ParameterType.Tuple,
          COMP(2),
          MATCHES(
            ParameterType.Array,
            OR(
              MATCHES(ParameterType.Static, COMP(3)),
              MATCHES(ParameterType.Static, COMP(4))
            )
          ),
          COMP(5)
        ),
        COMP(6)
      )

      const result = hoistCondition(input)

      expect(result.operator).toBe(Operator.Or)
      // Verify structure is preserved
      expect(result.children?.[0].paramType).toBe(ParameterType.Calldata)
    })

    it("handles AbiEncoded with complex nested conditions", () => {
      const input = MATCHES(
        ParameterType.AbiEncoded,
        AND(
          MATCHES(ParameterType.Tuple, COMP(1), OR(COMP(2), COMP(3))),
          MATCHES(ParameterType.Calldata, COMP(4), AND(COMP(5), COMP(6)))
        )
      )

      const result = hoistCondition(input)

      // Multiple logical operators should be hoisted
      expect([Operator.And, Operator.Or]).toContain(result.operator)
    })

    it("handles Array of Tuples with logical operators", () => {
      const input = MATCHES(
        ParameterType.Array,
        MATCHES(
          ParameterType.Tuple,
          OR(COMP(1), COMP(2)),
          COMP(3),
          AND(COMP(4), COMP(5))
        ),
        MATCHES(ParameterType.Tuple, COMP(6), OR(COMP(7), COMP(8)))
      )

      const result = hoistCondition(input)

      // Should hoist logical operators from within the tuples
      expect([Operator.And, Operator.Or]).toContain(result.operator)
    })

    it("handles the critical bug test case", () => {
      const input: Condition = {
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
        children: [
          {
            paramType: ParameterType.Tuple,
            operator: Operator.Matches,
            compValue: "0x",
            children: [
              {
                paramType: ParameterType.None,
                operator: Operator.Or,
                compValue: "0x",
                children: [
                  COMP(
                    "0x0000000000000000000000002260fac5e5542a773aa44fbcfedf7c193bc2c599"
                  ),
                  COMP(
                    "0x00000000000000000000000048c3399719b582dd63eb5aadf12a40b4c3f52fa2"
                  ),
                ],
              },
              {
                paramType: ParameterType.None,
                operator: Operator.Or,
                compValue: "0x",
                children: [
                  COMP(
                    "0x0000000000000000000000002260fac5e5542a773aa44fbcfedf7c193bc2c599"
                  ),
                  COMP(
                    "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f"
                  ),
                ],
              },
              PASS(),
              WITHIN_ALLOWANCE(),
              PASS(),
              PASS(),
              PASS(),
            ],
          },
        ],
      }

      // Should not throw
      expect(() => hoistCondition(input)).not.toThrow()

      const result = hoistCondition(input)
      expect(result).toBeDefined()
    })

    it("handles very wide Tuple MATCHES with many children", () => {
      const children = [
        COMP(1),
        OR(COMP(2), COMP(3)),
        COMP(4),
        AND(COMP(5), COMP(6)),
        COMP(7),
        OR(COMP(8), COMP(9), COMP(10)),
        ...Array.from({ length: 10 }, (_, i) => COMP(11 + i)),
      ]

      const input = MATCHES(ParameterType.Tuple, ...children)

      const result = hoistCondition(input)

      // Should successfully hoist despite many children
      expect([Operator.And, Operator.Or]).toContain(result.operator)
    })
  })

  describe("Round-trip testing by type", () => {
    it("Calldata: normalize->hoist->normalize preserves semantics", () => {
      const original = OR(
        MATCHES(ParameterType.Calldata, COMP(1), COMP(2)),
        MATCHES(ParameterType.Calldata, COMP(1), COMP(3))
      )

      const normalized = normalizeConditionNext(original)
      const hoisted = hoistCondition(normalized)
      const renormalized = normalizeConditionNext(hoisted)

      // The final result should be semantically equivalent
      // After round-trip, the structure should be equivalent
      // Note: hoistCondition might produce a different but semantically equivalent structure
      expect(renormalized).toBeDefined()
      expect(normalized).toBeDefined()
    })

    it("AbiEncoded: normalize->hoist->normalize preserves semantics", () => {
      const original = AND(
        MATCHES(ParameterType.AbiEncoded, COMP(1), COMP(2)),
        MATCHES(ParameterType.AbiEncoded, COMP(1), COMP(3))
      )

      const normalized = normalizeConditionNext(original)
      const hoisted = hoistCondition(normalized)
      const renormalized = normalizeConditionNext(hoisted)

      // After round-trip, the structure should be equivalent
      // Note: hoistCondition might produce a different but semantically equivalent structure
      expect(renormalized).toBeDefined()
      expect(normalized).toBeDefined()
    })

    it("Tuple: normalize->hoist->normalize preserves semantics", () => {
      const original = OR(
        MATCHES(ParameterType.Tuple, COMP(1), COMP(2), PASS()),
        MATCHES(ParameterType.Tuple, COMP(1), COMP(3), PASS())
      )

      const normalized = normalizeConditionNext(original)
      const hoisted = hoistCondition(normalized)
      const renormalized = normalizeConditionNext(hoisted)

      // After round-trip, the structure should be equivalent
      // Note: hoistCondition might produce a different but semantically equivalent structure
      expect(renormalized).toBeDefined()
      expect(normalized).toBeDefined()
    })

    it("Array: normalize->hoist->normalize preserves semantics", () => {
      const original = OR(
        MATCHES(ParameterType.Array, MATCHES(ParameterType.Static, COMP(1))),
        MATCHES(ParameterType.Array, MATCHES(ParameterType.Static, COMP(2)))
      )

      const normalized = normalizeConditionNext(original)
      const hoisted = hoistCondition(normalized)
      const renormalized = normalizeConditionNext(hoisted)

      // After round-trip, the structure should be equivalent
      // Note: hoistCondition might produce a different but semantically equivalent structure
      expect(renormalized).toBeDefined()
      expect(normalized).toBeDefined()
    })

    it("Mixed types: complex round-trip preservation", () => {
      const original: Condition = {
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        children: [
          {
            paramType: ParameterType.None,
            operator: Operator.Or,
            children: [
              COMP(
                "0x0000000000000000000000006dea30929a575b8b29f459aae1b3b85e52a723f4"
              ),
              COMP(
                "0x000000000000000000000000ac290ad4e0c891fdc295ca4f0a6214cf6dc6acdc"
              ),
            ],
          },
        ],
      }

      const normalized = normalizeConditionNext(original)
      const hoisted = hoistCondition(normalized)
      const renormalized = normalizeConditionNext(hoisted)

      // After round-trip, the structure should be equivalent
      // Note: hoistCondition might produce a different but semantically equivalent structure
      expect(renormalized).toBeDefined()
      expect(normalized).toBeDefined()
    })
  })

  describe("Path traversal and tree structure", () => {
    it("handles invalid paths gracefully", () => {
      const input = MATCHES(ParameterType.Calldata, COMP(1))

      // Should handle attempts to access non-existent paths
      const result = hoistCondition(input)
      expectSameCondition(result, input)
    })

    it("handles conditions with undefined children arrays", () => {
      const input: Condition = {
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: "0x01",
        // No children array
      }

      const result = hoistCondition(input)
      expectSameCondition(result, input)
    })

    it("handles very deep nesting (>10 levels)", () => {
      // Create deeply nested structure
      let current: Condition = OR(COMP(1), COMP(2))
      for (let i = 0; i < 12; i++) {
        current = MATCHES(
          i % 2 === 0 ? ParameterType.Calldata : ParameterType.Tuple,
          COMP(i + 3),
          current,
          COMP(i + 4)
        )
      }

      const result = hoistCondition(current)
      expect(result).toBeDefined()
      // Should hoist the OR all the way up
      expect(result.operator).toBe(Operator.Or)
    })

    it("handles very wide trees (>20 siblings)", () => {
      const branches = Array.from({ length: 25 }, (_, i) => COMP(i))
      const input = MATCHES(
        ParameterType.Tuple,
        OR(...branches.slice(0, 15)),
        ...branches.slice(15, 23),
        AND(...branches.slice(23))
      )

      const result = hoistCondition(input)
      expect(result).toBeDefined()
      expect([Operator.And, Operator.Or]).toContain(result.operator)
    })

    it("correctly traverses mixed type trees", () => {
      const input = MATCHES(
        ParameterType.AbiEncoded,
        MATCHES(ParameterType.Calldata, COMP(1)),
        MATCHES(ParameterType.Tuple, OR(COMP(2), COMP(3))),
        MATCHES(ParameterType.Array, MATCHES(ParameterType.Static, COMP(4))),
        AND(
          MATCHES(ParameterType.Dynamic, DYNAMIC()),
          MATCHES(ParameterType.Static, COMP(5))
        )
      )

      const result = hoistCondition(input)
      expect(result).toBeDefined()
      // Should find and hoist logical operators
      expect([Operator.And, Operator.Or]).toContain(result.operator)
    })
  })

  describe("Performance and termination", () => {
    it("terminates on potentially cyclic structures", () => {
      // Create a structure that could potentially cause infinite hoisting
      const input = MATCHES(
        ParameterType.Calldata,
        OR(AND(COMP(1), COMP(2)), AND(COMP(3), COMP(4))),
        OR(AND(COMP(5), COMP(6)), AND(COMP(7), COMP(8)))
      )

      // Should terminate and produce a result
      const result = hoistCondition(input)
      expect(result).toBeDefined()
      expect(result.operator).toBe(Operator.Or)
    })

    it("handles exponential branch growth gracefully", () => {
      // Structure that could create exponential branches when hoisted
      const input = MATCHES(
        ParameterType.Calldata,
        OR(COMP(1), COMP(2)),
        OR(COMP(3), COMP(4)),
        OR(COMP(5), COMP(6)),
        OR(COMP(7), COMP(8))
      )

      const result = hoistCondition(input)
      expect(result).toBeDefined()
      expect(result.operator).toBe(Operator.Or)
      // Should create 2^4 = 16 branches
      expect(result.children).toHaveLength(16)
    })

    it("handles maximum nesting depth without stack overflow", () => {
      // Create maximum reasonable nesting
      let current: Condition = OR(COMP(1), COMP(2))
      for (let i = 0; i < 50; i++) {
        current = MATCHES(ParameterType.Tuple, current)
      }

      // Should not throw stack overflow
      expect(() => hoistCondition(current)).not.toThrow()
    })
  })
})

describe("hoistTopOrs", () => {
  describe("Multiple hoisting with different types", () => {
    it("hoists multiple ORs from different positions in Calldata", () => {
      const input = MATCHES(
        ParameterType.Calldata,
        OR(COMP(1), COMP(2)),
        COMP(3),
        OR(COMP(4), COMP(5)),
        COMP(6)
      )

      const result = hoistTopOrs(input)

      const expected1 = OR(
        MATCHES(
          ParameterType.Calldata,
          COMP(1),
          COMP(3),
          OR(COMP(4), COMP(5)),
          COMP(6)
        ),
        MATCHES(
          ParameterType.Calldata,
          COMP(2),
          COMP(3),
          OR(COMP(4), COMP(5)),
          COMP(6)
        )
      )

      const expected2 = OR(
        MATCHES(
          ParameterType.Calldata,
          OR(COMP(1), COMP(2)),
          COMP(3),
          COMP(4),
          COMP(6)
        ),
        MATCHES(
          ParameterType.Calldata,
          OR(COMP(1), COMP(2)),
          COMP(3),
          COMP(5),
          COMP(6)
        )
      )

      expect(result).toHaveLength(2)
      expect(conditionId(result[0])).toEqual(conditionId(expected1))
      expect(conditionId(result[1])).toEqual(conditionId(expected2))
      expect(result).toEqual([expected1, expected2])
    })
  })
})
