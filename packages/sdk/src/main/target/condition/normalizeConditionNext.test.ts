import { describe, it, expect } from "vitest"
import { Operator, ParameterType, Condition } from "zodiac-roles-deployments"
import {
  normalizeConditionNext,
  copyStructure,
  NormalizedCondition,
} from "./normalizeConditionNext"
import { abiEncode } from "../../abiEncode"
import { conditionHash, conditionId, stripIds } from "./conditionId"

// Helper to create a static comparison condition
const COMP = (id: number | `0x${string}`): Condition => ({
  paramType: ParameterType.Static,
  operator: Operator.EqualTo,
  compValue: typeof id === "string" ? id : abiEncode(["uint256"], [id]),
})

// Helper to create a PASS condition
const PASS = (paramType: ParameterType = ParameterType.Static): Condition => ({
  paramType,
  operator: Operator.Pass,
})

// Helper to create dynamic conditions
const DYNAMIC = (operator: Operator = Operator.Pass): Condition => ({
  paramType: ParameterType.Dynamic,
  operator,
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

// Helper to compare conditions using conditionId for semantic equality
const expectSameCondition = (actual: Condition, expected: Condition) => {
  expect(conditionId(stripIds(actual as NormalizedCondition))).toBe(
    conditionId(expected)
  )
}

describe("normalizeConditionNext", () => {
  describe("Core normalization steps", () => {
    describe("pruneTrailingPass", () => {
      it("prunes trailing Pass nodes from Calldata MATCHES", () => {
        const input = MATCHES(ParameterType.Calldata, COMP(1), PASS(), PASS())

        const result = normalizeConditionNext(input)

        expect(stripIds(result)).toEqual({
          paramType: ParameterType.Calldata,
          operator: Operator.Matches,
          children: [COMP(1)],
        })
      })

      it("prunes trailing Pass nodes from AbiEncoded MATCHES", () => {
        const input = MATCHES(ParameterType.AbiEncoded, COMP(1), PASS(), PASS())

        const result = normalizeConditionNext(input)

        expect(stripIds(result)).toEqual({
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          children: [COMP(1)],
        })
      })

      it("prunes trailing Pass nodes from dynamic tuples", () => {
        const input = MATCHES(
          ParameterType.Tuple,
          DYNAMIC(Operator.EqualToAvatar),
          PASS(),
          PASS()
        )

        const result = normalizeConditionNext(input)

        expect(stripIds(result)).toEqual({
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          children: [DYNAMIC(Operator.EqualToAvatar)],
        })
      })

      it("does NOT prune trailing Pass nodes from static tuples", () => {
        const input = MATCHES(ParameterType.Tuple, COMP(1), PASS(), PASS())

        const result = normalizeConditionNext(input)

        expect(stripIds(result)).toEqual({
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          children: [COMP(1), PASS(), PASS()],
        })
      })

      it("keeps allowance conditions while pruning Pass nodes", () => {
        const input = MATCHES(
          ParameterType.Calldata,
          ETHER_ALLOWANCE(),
          PASS(),
          PASS()
        )

        const result = normalizeConditionNext(input)

        expect(stripIds(result)).toEqual({
          paramType: ParameterType.Calldata,
          operator: Operator.Matches,
          children: [PASS(), ETHER_ALLOWANCE()],
        })
      })

      it("preserves first child even if it's Pass", () => {
        const input = MATCHES(ParameterType.Calldata, PASS(), PASS(), PASS())

        const result = normalizeConditionNext(input)

        expect(stripIds(result)).toEqual({
          paramType: ParameterType.Calldata,
          operator: Operator.Matches,
          children: [PASS()],
        })
      })
    })

    describe("flattenNestedLogicalConditions", () => {
      it("flattens nested AND conditions", () => {
        const input = AND(COMP(1), AND(COMP(2), COMP(3)), COMP(4))

        const result = normalizeConditionNext(input)

        expect(stripIds(result)).toEqual({
          paramType: ParameterType.None,
          operator: Operator.And,
          children: [COMP(1), COMP(4), COMP(3), COMP(2)],
        })
      })

      it("flattens nested OR conditions", () => {
        const input = OR(COMP(1), OR(COMP(2), COMP(3)), COMP(4))

        const result = normalizeConditionNext(input)

        expect(stripIds(result)).toEqual({
          paramType: ParameterType.None,
          operator: Operator.Or,
          children: [COMP(1), COMP(4), COMP(3), COMP(2)],
        })
      })

      it("does NOT flatten different logical operators", () => {
        const input = AND(COMP(1), OR(COMP(2), COMP(3)), COMP(4))

        const result = normalizeConditionNext(input)

        expect(stripIds(result)).toEqual({
          paramType: ParameterType.None,
          operator: Operator.And,
          children: [
            COMP(1),
            COMP(4),
            {
              paramType: ParameterType.None,
              operator: Operator.Or,
              children: [COMP(3), COMP(2)],
            },
          ],
        })
      })

      it("does NOT flatten NOR conditions", () => {
        const input = NOR(COMP(1), NOR(COMP(2), COMP(3)), COMP(4))

        const result = normalizeConditionNext(input)

        expect(stripIds(result)).toEqual({
          paramType: ParameterType.None,
          operator: Operator.Nor,
          children: [
            COMP(1),
            COMP(4),
            {
              paramType: ParameterType.None,
              operator: Operator.Nor,
              children: [COMP(3), COMP(2)],
            },
          ],
        })
      })
    })

    describe("dedupeBranches", () => {
      it("removes duplicate children in AND conditions", () => {
        const input = AND(COMP(1), COMP(2), COMP(1), COMP(3))

        const result = normalizeConditionNext(input)

        expect(stripIds(result)).toEqual({
          paramType: ParameterType.None,
          operator: Operator.And,
          children: [COMP(1), COMP(3), COMP(2)],
        })
      })

      it("removes duplicate children in OR conditions", () => {
        const input = OR(COMP(1), COMP(2), COMP(1), COMP(3))

        const result = normalizeConditionNext(input)

        expect(stripIds(result)).toEqual({
          paramType: ParameterType.None,
          operator: Operator.Or,
          children: [COMP(1), COMP(3), COMP(2)],
        })
      })

      it("removes duplicate children in NOR conditions", () => {
        const input = NOR(COMP(1), COMP(2), COMP(1), COMP(3))

        const result = normalizeConditionNext(input)

        expect(stripIds(result)).toEqual({
          paramType: ParameterType.None,
          operator: Operator.Nor,
          children: [COMP(1), COMP(3), COMP(2)],
        })
      })

      it("handles complex nested duplicates", () => {
        const branch1 = AND(COMP(1), COMP(2))
        const branch2 = AND(COMP(1), COMP(2)) // Semantically identical
        const input = OR(branch1, COMP(3), branch2)

        const result = normalizeConditionNext(input)

        const normalized = stripIds(result)
        expect(normalized.children).toHaveLength(2)

        expect(stripIds(result)).toEqual(OR(COMP(3), branch1))
      })
    })

    describe("unwrapSingleBranches", () => {
      it("unwraps AND with single child", () => {
        const input = AND(COMP(1))

        const result = normalizeConditionNext(input)

        expect(stripIds(result)).toEqual(COMP(1))
      })

      it("unwraps OR with single child", () => {
        const input = OR(COMP(1))

        const result = normalizeConditionNext(input)

        expect(stripIds(result)).toEqual(COMP(1))
      })

      it("does NOT unwrap NOR with single child", () => {
        const input = NOR(COMP(1))

        const result = normalizeConditionNext(input)

        expect(stripIds(result)).toEqual({
          paramType: ParameterType.None,
          operator: Operator.Nor,
          children: [COMP(1)],
        })
      })

      it("handles unwrapping after deduplication", () => {
        const input = AND(COMP(1), COMP(1)) // Duplicates will be removed, leaving single child

        const result = normalizeConditionNext(input)

        expect(stripIds(result)).toEqual(COMP(1))
      })
    })

    describe("normalizeChildrenOrder", () => {
      it("sorts children by their condition IDs in AND", () => {
        const input = AND(COMP(3), COMP(1), COMP(2))

        const result = normalizeConditionNext(input)

        expect(stripIds(result)).toEqual(AND(COMP(1), COMP(3), COMP(2)))
      })

      it("moves Calldata/AbiEncoded children to front regardless of ID order", () => {
        const calldataChild = MATCHES(ParameterType.Calldata, COMP(1))
        const staticChild = COMP(2)
        const abiEncodedChild = MATCHES(ParameterType.AbiEncoded, COMP(3))

        const input = OR(staticChild, calldataChild, abiEncodedChild)

        const result = normalizeConditionNext(input)
        expect(stripIds(result)).toEqual(
          OR(abiEncodedChild, calldataChild, staticChild)
        )
      })
    })

    describe("deleteUndefinedFields", () => {
      it("removes undefined children field", () => {
        const condition: Condition = {
          paramType: ParameterType.Static,
          operator: Operator.Pass,
          children: undefined,
        }

        const result = normalizeConditionNext(condition)

        expect(stripIds(result)).not.toHaveProperty("children")
      })

      it("removes undefined compValue field", () => {
        const condition: Condition = {
          paramType: ParameterType.Static,
          operator: Operator.Pass,
          compValue: undefined,
        }

        const result = normalizeConditionNext(condition)

        expect(stripIds(result)).not.toHaveProperty("compValue")
      })

      it("preserves defined fields", () => {
        const condition: Condition = {
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: "0x01",
          children: [COMP(1)],
        }

        const result = normalizeConditionNext(condition)

        const normalized = stripIds(result)
        expect(normalized).toHaveProperty("compValue", "0x01")
        expect(normalized).toHaveProperty("children")
      })
    })
  })

  describe("Integration tests", () => {
    it("combines multiple normalization steps correctly", () => {
      // Complex condition that exercises multiple normalization steps
      const input = OR(
        AND(COMP(1), COMP(1)), // Duplicate -> single child -> unwrap
        AND(COMP(2), COMP(3)), // Normal case
        MATCHES(ParameterType.Calldata, COMP(4), PASS(), PASS()) // Prune trailing Pass
      )

      const result = normalizeConditionNext(input)

      expect(stripIds(result)).toEqual(
        OR(
          MATCHES(ParameterType.Calldata, COMP(4)),
          COMP(1),
          AND(COMP(3), COMP(2))
        )
      )
    })

    it("handles deep nesting with multiple normalization steps", () => {
      const input = AND(
        OR(AND(COMP(1), COMP(1)), COMP(2)), // Nested logic with dedup/unwrap
        MATCHES(ParameterType.AbiEncoded, COMP(3), PASS()) // Prune Pass
      )

      const result = normalizeConditionNext(input)

      expect(stripIds(result)).toEqual(
        AND(MATCHES(ParameterType.AbiEncoded, COMP(3)), OR(COMP(1), COMP(2)))
      )
    })

    it.skip("preserves semantics through complex transformations", () => {
      // Test case that should exercise branch type compatibility
      const input = OR(
        MATCHES(ParameterType.Tuple, COMP(1)),
        MATCHES(ParameterType.Tuple, COMP(2), COMP(3), COMP(4))
      )

      const result = normalizeConditionNext(input)

      // Should pad the first branch to match the second
      expect(stripIds(result)).toEqual(
        OR(
          MATCHES(ParameterType.Tuple, COMP(1), PASS(0), PASS(0)),
          MATCHES(ParameterType.Tuple, COMP(2), COMP(3), COMP(4))
        )
      )
    })
  })

  describe("Edge cases", () => {
    it("handles empty OR condition", () => {
      const input: Condition = {
        paramType: ParameterType.None,
        operator: Operator.Or,
        children: [],
      }

      expect(() => normalizeConditionNext(input)).not.toThrow()
    })

    it("handles conditions without children", () => {
      const input = COMP(1)

      const result = normalizeConditionNext(input)

      expect(stripIds(result)).toEqual(COMP(1))
    })

    it("handles conditions with allowance operators", () => {
      const input = MATCHES(
        ParameterType.Calldata,
        ETHER_ALLOWANCE(),
        CALL_ALLOWANCE(),
        PASS()
      )

      const result = normalizeConditionNext(input)

      expect(stripIds(result)).toEqual({
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        children: [PASS(), ETHER_ALLOWANCE(), CALL_ALLOWANCE()],
      })
    })
  })

  describe("ID management", () => {
    it("assigns $$id to normalized conditions", () => {
      const input = COMP(1)

      const result = normalizeConditionNext(input)

      expect(result.$$id).toBeDefined()
      expect(typeof result.$$id).toBe("string")
      expect(result.$$id.length).toBeGreaterThan(0)
    })

    it("assigns $$id to all child conditions recursively", () => {
      const input = AND(COMP(1), OR(COMP(2), COMP(3)))

      const result = normalizeConditionNext(input)

      expect(result.$$id).toBeDefined()
      expect(result.children![0].$$id).toBeDefined()
      expect(result.children![1].$$id).toBeDefined()
      expect(
        (result.children![1] as NormalizedCondition).children![0].$$id
      ).toBeDefined()
    })

    it("stripIds removes all $$id fields", () => {
      const input = AND(COMP(1), OR(COMP(2), COMP(3)))

      const result = normalizeConditionNext(input)
      const stripped = stripIds(result)

      expect(stripped).not.toHaveProperty("$$id")
      expect(stripped.children![0]).not.toHaveProperty("$$id")
      expect(stripped.children![1]).not.toHaveProperty("$$id")
      expect(stripped.children![1].children![0]).not.toHaveProperty("$$id")
    })

    it("produces stable IDs for semantically identical conditions", () => {
      const condition1 = AND(COMP(1), COMP(2))
      const condition2 = AND(COMP(2), COMP(1)) // Different order

      const result1 = normalizeConditionNext(condition1)
      const result2 = normalizeConditionNext(condition2)

      expect(result1.$$id).toBe(result2.$$id)
      expect(conditionHash(result1)).toBe(conditionHash(result2))
    })
  })

  describe("Regression and idempotency", () => {
    it("is idempotent - normalize(normalize(x)) === normalize(x)", () => {
      const input = OR(
        AND(COMP(1), COMP(1)),
        MATCHES(ParameterType.Calldata, COMP(2), PASS()),
        NOR(COMP(3))
      )

      const result1 = normalizeConditionNext(input)
      const result2 = normalizeConditionNext(result1)

      expect(result1.$$id).toBe(result2.$$id)
      expect(stripIds(result1)).toEqual(stripIds(result2))
    })

    it("produces consistent results across multiple calls", () => {
      const input = AND(
        OR(COMP(1), COMP(2)),
        MATCHES(ParameterType.AbiEncoded, COMP(3), PASS(), PASS())
      )

      const results = Array.from({ length: 5 }, () =>
        normalizeConditionNext(input)
      )

      const firstId = results[0].$$id
      results.forEach((result) => {
        expect(result.$$id).toBe(firstId)
      })
    })

    it("handles performance with large condition trees", () => {
      // Create a large OR condition with many branches
      const largeBranches = Array.from({ length: 100 }, (_, i) => COMP(i))
      const largeCondition = OR(...largeBranches)

      const start = performance.now()
      const result = normalizeConditionNext(largeCondition)
      const end = performance.now()

      expect(result.$$id).toBeDefined()
      expect(end - start).toBeLessThan(50) // Should complete in under 50 ms
    })
  })

  describe("copyStructure utility", () => {
    it("creates Pass structure matching input condition structure", () => {
      const input = MATCHES(
        ParameterType.Tuple,
        COMP(1),
        MATCHES(ParameterType.Array, COMP(2))
      )

      const structure = copyStructure(input)

      expect(structure).toEqual({
        paramType: ParameterType.Tuple,
        operator: Operator.Pass,
        children: [
          PASS(),
          {
            paramType: ParameterType.Array,
            operator: Operator.Pass,
            children: [PASS()],
          },
        ],
      })
    })

    it("skips over logical conditions", () => {
      const input = OR(COMP(1), COMP(2))

      const structure = copyStructure(input)

      expect(structure).toEqual(PASS())
    })

    it("handles array conditions", () => {
      const input = MATCHES(ParameterType.Array, COMP(1), COMP(2))

      const structure = copyStructure(input)

      expect(structure).toEqual({
        paramType: ParameterType.Array,
        operator: Operator.Pass,
        children: [PASS()],
      })
    })

    it("throws on logical condition without children", () => {
      const input: Condition = {
        paramType: ParameterType.None,
        operator: Operator.Or,
        children: [],
      }

      expect(() => copyStructure(input)).toThrow(
        "Logical condition must have at least one child"
      )
    })

    it("throws on array condition without children", () => {
      const input: Condition = {
        paramType: ParameterType.Array,
        operator: Operator.Matches,
        children: [],
      }

      expect(() => copyStructure(input)).toThrow(
        "Array condition must have at least one child"
      )
    })
  })
})
