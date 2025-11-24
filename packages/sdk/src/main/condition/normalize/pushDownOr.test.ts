import { describe, it, expect } from "vitest"
import { Encoding, Condition, Operator } from "zodiac-roles-deployments"

import { pushDownOr } from "./pushDownOr"
import { abiEncode } from "../../abiEncode"
import { normalizeCondition } from "."

// Helper functions
const COMP = (id: number): Condition => ({
  paramType: Encoding.Static,
  operator: Operator.EqualTo,
  compValue: abiEncode(["uint256"], [id]),
})

const PASS = (paramType: Encoding = Encoding.Static): Condition => ({
  paramType,
  operator: Operator.Pass,
})

const OR = (...children: Condition[]): Condition => ({
  paramType: Encoding.None,
  operator: Operator.Or,
  children,
})

const AND = (...children: Condition[]): Condition => ({
  paramType: Encoding.None,
  operator: Operator.And,
  children,
})

const MATCHES = (paramType: Encoding, ...children: Condition[]): Condition => ({
  paramType,
  operator: Operator.Matches,
  children,
})

describe("pushDownOr", () => {
  describe("core functionality", () => {
    it("returns unchanged when not an OR", () => {
      const input = AND(COMP(1), COMP(2))
      const result = pushDownOr(input)
      expect(result).toBe(input)
    })

    it("throws on single branch OR", () => {
      const input = OR(MATCHES(Encoding.Calldata, COMP(1)))
      expect(() => pushDownOr(input)).toThrow("Invariant")
    })

    it("returns unchanged with mixed operators", () => {
      const input = OR(
        MATCHES(Encoding.Calldata, COMP(1)),
        AND(COMP(2), COMP(3))
      )
      const result = pushDownOr(input)
      expect(result).toBe(input)
    })

    it("rejects mixed AND and MATCHES operators", () => {
      const input = OR(
        AND(COMP(1), COMP(2)),
        MATCHES(Encoding.Calldata, COMP(3), COMP(4))
      )
      const result = pushDownOr(input)
      expect(result).toBe(input) // unchanged
    })

    it("rejects AND/MATCHES mixed with other operators", () => {
      const input = OR(
        AND(COMP(1), COMP(2)),
        AND(COMP(3), COMP(4)),
        COMP(5) // Not AND or MATCHES
      )
      const result = pushDownOr(input)
      expect(result).toBe(input) // unchanged
    })
  })

  describe("MATCHES push down (positional semantics)", () => {
    describe("basic cases", () => {
      it("pushes OR down to single differing position", () => {
        const input = OR(
          MATCHES(Encoding.Calldata, COMP(1), COMP(2)),
          MATCHES(Encoding.Calldata, COMP(1), COMP(3))
        )

        const result = pushDownOr(input)

        expect(result).toEqual(
          MATCHES(Encoding.Calldata, COMP(1), OR(COMP(2), COMP(3)))
        )
      })

      it("finds hinge at first position", () => {
        const input = OR(
          MATCHES(Encoding.Calldata, COMP(1), COMP(10), COMP(20)),
          MATCHES(Encoding.Calldata, COMP(2), COMP(10), COMP(20))
        )

        const result = pushDownOr(input)

        expect(result).toEqual(
          MATCHES(Encoding.Calldata, OR(COMP(1), COMP(2)), COMP(10), COMP(20))
        )
      })

      it("finds hinge at middle position", () => {
        const input = OR(
          MATCHES(Encoding.Calldata, COMP(1), COMP(2), COMP(5)),
          MATCHES(Encoding.Calldata, COMP(1), COMP(3), COMP(5)),
          MATCHES(Encoding.Calldata, COMP(1), COMP(4), COMP(5))
        )

        const result = pushDownOr(input)

        expect(result).toEqual(
          MATCHES(
            Encoding.Calldata,
            COMP(1),
            OR(COMP(2), COMP(3), COMP(4)),
            COMP(5)
          )
        )
      })

      it("finds hinge at last position", () => {
        const input = OR(
          MATCHES(Encoding.Calldata, COMP(10), COMP(20), COMP(1)),
          MATCHES(Encoding.Calldata, COMP(10), COMP(20), COMP(2))
        )

        const result = pushDownOr(input)

        expect(result).toEqual(
          MATCHES(Encoding.Calldata, COMP(10), COMP(20), OR(COMP(1), COMP(2)))
        )
      })
    })

    describe("noop cases", () => {
      it("noop when differences in multiple positions", () => {
        const input = OR(
          MATCHES(Encoding.Calldata, COMP(1), COMP(2)),
          MATCHES(Encoding.Calldata, COMP(3), COMP(4)) // Both positions differ
        )

        const result = pushDownOr(input)
        expect(result).toBe(input)
      })

      it("throws on empty children", () => {
        const input = OR(
          MATCHES(Encoding.Calldata),
          MATCHES(Encoding.Calldata, COMP(1))
        )

        expect(() => pushDownOr(input)).toThrow("Invariant")
      })
    })

    describe("order matters", () => {
      it("fails with reordered elements even if logically equivalent", () => {
        const input = OR(
          MATCHES(Encoding.Calldata, COMP(1), COMP(2), COMP(3)),
          MATCHES(Encoding.Calldata, COMP(3), COMP(10), COMP(1)) // Same elements, wrong positions
        )

        const result = pushDownOr(input)
        expect(result).toBe(input) // unchanged - order matters
      })

      it("fails with scrambled positions", () => {
        const input = OR(
          MATCHES(Encoding.Calldata, COMP(5), COMP(10), COMP(15)),
          MATCHES(Encoding.Calldata, COMP(15), COMP(5), COMP(10)) // All positions different
        )

        const result = pushDownOr(input)
        expect(result).toBe(input) // unchanged
      })

      it("requires exact positional matching", () => {
        const input = OR(
          MATCHES(Encoding.Calldata, COMP(1), COMP(2)),
          MATCHES(Encoding.Calldata, COMP(2), COMP(1)) // Simple swap
        )

        const result = pushDownOr(input)
        expect(result).toBe(input) // unchanged
      })
    })

    describe("parameters types", () => {
      it("works with AbiEncoded type", () => {
        const input = OR(
          MATCHES(Encoding.AbiEncoded, PASS(), COMP(1)),
          MATCHES(Encoding.AbiEncoded, PASS(), COMP(2))
        )

        const result = pushDownOr(input)

        expect(result).toEqual(
          MATCHES(Encoding.AbiEncoded, PASS(), OR(COMP(1), COMP(2)))
        )
      })

      it("works with Tuple type", () => {
        const input = OR(
          MATCHES(Encoding.Tuple, COMP(1), COMP(2), COMP(10)),
          MATCHES(Encoding.Tuple, COMP(1), COMP(3), COMP(10))
        )

        const result = pushDownOr(input)

        expect(result).toEqual(
          MATCHES(Encoding.Tuple, COMP(1), OR(COMP(2), COMP(3)), COMP(10))
        )
      })

      it("noop for with Array type", () => {
        const input = OR(
          MATCHES(Encoding.Array, COMP(1)),
          MATCHES(Encoding.Array, COMP(2))
        )

        const result = pushDownOr(input)
        expect(result).toBe(input)
      })
    })
  })

  describe("AND push down (set-based semantics)", () => {
    describe("basic cases", () => {
      it("pushes OR down with same order", () => {
        const input = OR(
          AND(COMP(1), COMP(2), COMP(3)),
          AND(COMP(1), COMP(10), COMP(3)) // Only middle element differs
        )

        const result = pushDownOr(input)

        expect(result).toEqual(AND(COMP(1), OR(COMP(2), COMP(10)), COMP(3)))
      })

      it("finds hinge at first position", () => {
        const input = OR(
          AND(COMP(1), COMP(10), COMP(20)),
          AND(COMP(2), COMP(10), COMP(20))
        )

        const result = pushDownOr(input)

        expect(result).toEqual(AND(OR(COMP(1), COMP(2)), COMP(10), COMP(20)))
      })

      it("finds hinge at last position", () => {
        const input = OR(
          AND(COMP(10), COMP(20), COMP(1)),
          AND(COMP(10), COMP(20), COMP(2))
        )

        const result = pushDownOr(input)

        expect(result).toEqual(AND(COMP(10), COMP(20), OR(COMP(1), COMP(2))))
      })

      it("handles multiple branches", () => {
        const input = OR(
          AND(COMP(1), COMP(2), COMP(5)),
          AND(COMP(1), COMP(3), COMP(5)),
          AND(COMP(1), COMP(4), COMP(5))
        )

        const result = pushDownOr(input)

        expect(result).toEqual(
          AND(COMP(1), OR(COMP(2), COMP(3), COMP(4)), COMP(5))
        )
      })
    })

    describe("noop cases", () => {
      it("fails with multiple differences regardless of order", () => {
        const input = OR(
          AND(COMP(1), COMP(2), COMP(3)),
          AND(COMP(4), COMP(99), COMP(88)) // Multiple differences
        )

        const result = pushDownOr(input)
        expect(result).toBe(input) // Should remain unchanged
      })

      it("fails when no common elements", () => {
        const input = OR(
          AND(COMP(1), COMP(2), COMP(3)),
          AND(COMP(4), COMP(5), COMP(6)) // Completely different
        )

        const result = pushDownOr(input)
        expect(result).toBe(input) // Should remain unchanged
      })

      it("fails when differences exceed single hinge", () => {
        const input = OR(
          AND(COMP(1), COMP(2)),
          AND(COMP(3), COMP(4)) // Both elements different
        )

        const result = pushDownOr(input)
        expect(result).toBe(input) // unchanged
      })
    })

    describe("boundary conditions - single hinge principle violations", () => {
      it("fails when first condition is subset of second (0 vs 1 unique)", () => {
        const input = OR(
          AND(COMP(1), COMP(2), COMP(3)), // 0 unique elements (all in second)
          AND(COMP(1), COMP(2), COMP(3), COMP(4)) // 1 unique element (COMP(4))
        )

        const result = pushDownOr(input)
        expect(result).toBe(input) // unchanged - violates single hinge principle
      })

      it("fails when second condition is subset of first (1 vs 0 unique)", () => {
        const input = OR(
          AND(COMP(1), COMP(2), COMP(3), COMP(4)), // 1 unique element (COMP(4))
          AND(COMP(1), COMP(2), COMP(3)) // 0 unique elements (all in first)
        )

        const result = pushDownOr(input)
        expect(result).toBe(input) // unchanged - violates single hinge principle
      })

      it("fails when asymmetric unique counts (1 vs 2 unique)", () => {
        const input = OR(
          AND(COMP(1), COMP(2), COMP(10)), // 1 unique element (COMP(10))
          AND(COMP(1), COMP(20), COMP(30)) // 2 unique elements (COMP(20), COMP(30))
        )

        const result = pushDownOr(input)
        expect(result).toBe(input) // unchanged - violates single hinge principle
      })

      it("fails when both conditions have multiple unique elements (2 vs 2)", () => {
        const input = OR(
          AND(COMP(1), COMP(10), COMP(20)), // 2 unique elements (COMP(10), COMP(20))
          AND(COMP(1), COMP(30), COMP(40)) // 2 unique elements (COMP(30), COMP(40))
        )

        const result = pushDownOr(input)
        expect(result).toBe(input) // unchanged - violates single hinge principle
      })

      it("fails with three conditions where not all have single unique element", () => {
        const input = OR(
          AND(COMP(1), COMP(2)), // 1 unique element (COMP(2))
          AND(COMP(1), COMP(3)), // 1 unique element (COMP(3))
          AND(COMP(1), COMP(4), COMP(5)) // 2 unique elements (COMP(4), COMP(5))
        )

        const result = pushDownOr(input)
        expect(result).toBe(input) // unchanged - third condition violates principle
      })

      it("succeeds only when all conditions have exactly one unique element", () => {
        const input = OR(
          AND(COMP(1), COMP(2), COMP(10)), // 1 unique element (COMP(2))
          AND(COMP(1), COMP(3), COMP(10)), // 1 unique element (COMP(3))
          AND(COMP(1), COMP(4), COMP(10)) // 1 unique element (COMP(4))
        )

        const result = pushDownOr(input)

        // Should successfully transform - all conditions have exactly 1 unique element
        expect(result).toEqual(
          AND(COMP(1), OR(COMP(2), COMP(3), COMP(4)), COMP(10))
        )
      })
    })

    describe("order does not matter", () => {
      it("handles reordered elements with single difference", () => {
        const input = OR(
          AND(COMP(1), COMP(2), COMP(3)),
          AND(COMP(3), COMP(10), COMP(1)) // Same elements except COMP(2) → COMP(10), reordered
        )

        const result = pushDownOr(input)

        // Should successfully push down to the differing element position
        expect(result).toEqual(AND(COMP(1), OR(COMP(2), COMP(10)), COMP(3)))
      })

      it("handles completely scrambled order", () => {
        const input = OR(
          AND(COMP(5), COMP(10), COMP(15), COMP(20)),
          AND(COMP(20), COMP(99), COMP(5), COMP(15)) // COMP(10) → COMP(99), completely reordered
        )

        const result = pushDownOr(input)

        // Should find the single differing element and push down
        expect(result).toEqual(
          AND(COMP(5), OR(COMP(10), COMP(99)), COMP(15), COMP(20))
        )
      })

      it("works with partial reordering", () => {
        const input = OR(
          AND(COMP(1), COMP(2), COMP(3), COMP(4)),
          AND(COMP(4), COMP(2), COMP(99), COMP(1)) // COMP(3) → COMP(99), elements reordered
        )

        const result = pushDownOr(input)

        // Should successfully push down regardless of order
        expect(result).toEqual(
          AND(COMP(1), COMP(2), OR(COMP(3), COMP(99)), COMP(4))
        )
      })
    })

    describe("Complex nested scenarios", () => {
      it("handles nested AND at hinge position", () => {
        const nested1 = AND(COMP(1), COMP(2))
        const nested2 = AND(COMP(3), COMP(4))

        const input = OR(AND(COMP(10), nested1), AND(COMP(10), nested2))

        const result = pushDownOr(input)

        expect(result).toEqual(AND(COMP(10), OR(nested1, nested2)))
      })

      it("preserves MATCHES conditions at hinge", () => {
        const input = OR(
          AND(COMP(1), MATCHES(Encoding.Calldata, COMP(2), COMP(3))),
          AND(COMP(1), MATCHES(Encoding.Calldata, COMP(4), COMP(5)))
        )

        const result = pushDownOr(input)

        expect(result).toEqual(
          AND(
            COMP(1),
            OR(
              MATCHES(Encoding.Calldata, COMP(2), COMP(3)),
              MATCHES(Encoding.Calldata, COMP(4), COMP(5))
            )
          )
        )
      })
    })
  })

  describe("comparing - AND vs MATCHES", () => {
    it("AND succeeds where MATCHES fails due to order sensitivity", () => {
      // Same logical structure, different order
      const andInput = OR(
        AND(COMP(1), COMP(2), COMP(3)),
        AND(COMP(3), COMP(10), COMP(1)) // Reordered
      )

      const matchesInput = OR(
        MATCHES(Encoding.Calldata, COMP(1), COMP(2), COMP(3)),
        MATCHES(Encoding.Calldata, COMP(3), COMP(10), COMP(1)) // Same reordering
      )

      const andResult = pushDownOr(andInput)
      const matchesResult = pushDownOr(matchesInput)

      // AND should transform (order doesn't matter)
      expect(andResult).toEqual(AND(COMP(1), OR(COMP(2), COMP(10)), COMP(3)))

      // MATCHES should not transform (order matters)
      expect(matchesResult).toBe(matchesInput)
    })

    it("both succeed with identical positional structure", () => {
      const andInput = OR(
        AND(COMP(1), COMP(2), COMP(3)),
        AND(COMP(1), COMP(10), COMP(3)) // Same positions, only middle differs
      )

      const matchesInput = OR(
        MATCHES(Encoding.Calldata, COMP(1), COMP(2), COMP(3)),
        MATCHES(Encoding.Calldata, COMP(1), COMP(10), COMP(3)) // Same positions, only middle differs
      )

      const andResult = pushDownOr(andInput)
      const matchesResult = pushDownOr(matchesInput)

      // Both should transform successfully
      expect(andResult).toEqual(AND(COMP(1), OR(COMP(2), COMP(10)), COMP(3)))
      expect(matchesResult).toEqual(
        MATCHES(Encoding.Calldata, COMP(1), OR(COMP(2), COMP(10)), COMP(3))
      )
    })

    it("both fail with multiple differences", () => {
      const andInput = OR(
        AND(COMP(1), COMP(2)),
        AND(COMP(3), COMP(4)) // Multiple differences
      )

      const matchesInput = OR(
        MATCHES(Encoding.Calldata, COMP(1), COMP(2)),
        MATCHES(Encoding.Calldata, COMP(3), COMP(4)) // Multiple differences
      )

      expect(pushDownOr(andInput)).toBe(andInput)
      expect(pushDownOr(matchesInput)).toBe(matchesInput)
    })

    it("demonstrates semantic differences clearly", () => {
      // Case where AND logic works but MATCHES logic fails
      const sameElements = [COMP(1), COMP(2), COMP(3)]
      const differentOrder = [COMP(3), COMP(1), COMP(10)] // Same except COMP(2) → COMP(10)

      const andCase = OR(AND(...sameElements), AND(...differentOrder))
      const matchesCase = OR(
        MATCHES(Encoding.Calldata, ...sameElements),
        MATCHES(Encoding.Calldata, ...differentOrder)
      )

      // AND should handle the reordering
      expect(pushDownOr(andCase)).toEqual(
        AND(COMP(1), OR(COMP(2), COMP(10)), COMP(3))
      )

      // MATCHES should reject due to positional mismatch
      expect(pushDownOr(matchesCase)).toBe(matchesCase)
    })
  })

  describe("calls normalizeCondition callback on chnages", () => {
    it("recursively normalizes MATCHES after push down", () => {
      const input = OR(
        MATCHES(Encoding.Calldata, COMP(1), OR(COMP(2))),
        MATCHES(Encoding.Calldata, COMP(1), OR(COMP(3)))
      )

      const result = pushDownOr(input, normalizeCondition)

      expect(result).toEqual(
        MATCHES(Encoding.Calldata, COMP(1), OR(COMP(2), COMP(3)))
      )
    })

    it("recursively normalizes AND after push down", () => {
      const input = OR(AND(COMP(1), OR(COMP(2))), AND(COMP(1), OR(COMP(3))))

      const result = pushDownOr(input, normalizeCondition)

      expect(result).toEqual(AND(COMP(1), OR(COMP(2), COMP(3))))
    })

    it("handles deep normalization with nested structures", () => {
      const input = OR(
        MATCHES(Encoding.Calldata, COMP(1), OR(OR(COMP(2), COMP(3)))),
        MATCHES(Encoding.Calldata, COMP(1), OR(COMP(4)))
      )

      const result = pushDownOr(input, normalizeCondition)

      // Should flatten and unwrap nested ORs
      expect(result).toEqual(
        MATCHES(Encoding.Calldata, COMP(1), OR(COMP(2), COMP(3), COMP(4)))
      )
    })

    it("preserves complex nested structures", () => {
      const nested1 = MATCHES(Encoding.Tuple, COMP(1), COMP(2))
      const nested2 = MATCHES(Encoding.Tuple, COMP(3), COMP(4))

      const input = OR(
        MATCHES(Encoding.Calldata, COMP(10), nested1),
        MATCHES(Encoding.Calldata, COMP(10), nested2)
      )

      const result = pushDownOr(input)

      expect(result).toEqual(
        MATCHES(Encoding.Calldata, COMP(10), OR(nested1, nested2))
      )
    })

    it("handles mixed nested operators with deep normalization", () => {
      const input = OR(
        AND(COMP(1), OR(AND(COMP(2), COMP(3)))),
        AND(COMP(1), OR(AND(COMP(4), COMP(5))))
      )

      const result = pushDownOr(input, normalizeCondition)

      // Should push down the OR and normalize the nested structure
      expect(result).toEqual(
        AND(COMP(1), OR(AND(COMP(2), COMP(3)), AND(COMP(4), COMP(5))))
      )
    })
  })

  describe("MISC", () => {
    it("AND and MATCHES behave identically when positions match", () => {
      const andInput = OR(
        AND(COMP(1), COMP(2), COMP(3)),
        AND(COMP(1), COMP(10), COMP(3))
      )

      const matchesInput = OR(
        MATCHES(Encoding.Calldata, COMP(1), COMP(2), COMP(3)),
        MATCHES(Encoding.Calldata, COMP(1), COMP(10), COMP(3))
      )

      const andResult = pushDownOr(andInput)
      const matchesResult = pushDownOr(matchesInput)

      // Both should produce identical structure (just different operators)
      expect(andResult).toEqual(AND(COMP(1), OR(COMP(2), COMP(10)), COMP(3)))
      expect(matchesResult).toEqual(
        MATCHES(Encoding.Calldata, COMP(1), OR(COMP(2), COMP(10)), COMP(3))
      )
    })

    it("single vs multiple hinge differences consistency", () => {
      // Single hinge - should work for both
      const andSingle = OR(
        AND(COMP(1), COMP(2), COMP(10)),
        AND(COMP(1), COMP(3), COMP(10))
      )
      const matchesSingle = OR(
        MATCHES(Encoding.Calldata, COMP(1), COMP(2), COMP(10)),
        MATCHES(Encoding.Calldata, COMP(1), COMP(3), COMP(10))
      )

      expect(pushDownOr(andSingle)).toEqual(
        AND(COMP(1), OR(COMP(2), COMP(3)), COMP(10))
      )
      expect(pushDownOr(matchesSingle)).toEqual(
        MATCHES(Encoding.Calldata, COMP(1), OR(COMP(2), COMP(3)), COMP(10))
      )

      // Multiple hinges - should fail for both
      const andMultiple = OR(
        AND(COMP(1), COMP(2), COMP(10)),
        AND(COMP(1), COMP(3), COMP(20)) // Different at positions 1 and 2
      )
      const matchesMultiple = OR(
        MATCHES(Encoding.Calldata, COMP(1), COMP(2), COMP(10)),
        MATCHES(Encoding.Calldata, COMP(1), COMP(3), COMP(20)) // Different at positions 1 and 2
      )

      expect(pushDownOr(andMultiple)).toBe(andMultiple) // unchanged
      expect(pushDownOr(matchesMultiple)).toBe(matchesMultiple) // unchanged
    })

    it("throws errors", () => {
      const singleBranch = OR(MATCHES(Encoding.Calldata, COMP(1)))

      // Check for exact error message
      expect(() => pushDownOr(singleBranch)).toThrow("Invariant")

      const emptyChildren = OR(
        MATCHES(Encoding.Calldata),
        MATCHES(Encoding.Calldata, COMP(1))
      )

      expect(() => pushDownOr(emptyChildren)).toThrow("Invariant")
    })

    it("handles Pass nodes correctly", () => {
      const input = OR(
        MATCHES(Encoding.Calldata, PASS(), COMP(1)),
        MATCHES(Encoding.Calldata, PASS(), COMP(2))
      )

      const result = pushDownOr(input)

      expect(result).toEqual(
        MATCHES(Encoding.Calldata, PASS(), OR(COMP(1), COMP(2)))
      )
    })

    it("preserves logical conditions at hinge", () => {
      const input = OR(
        MATCHES(Encoding.Calldata, COMP(1), AND(COMP(2), COMP(3))),
        MATCHES(Encoding.Calldata, COMP(1), AND(COMP(4), COMP(5)))
      )

      const result = pushDownOr(input)

      expect(result).toEqual(
        MATCHES(
          Encoding.Calldata,
          COMP(1),
          OR(AND(COMP(2), COMP(3)), AND(COMP(4), COMP(5)))
        )
      )
    })
    it("regression: fails when some conditions have no unique elements", () => {
      // This test exposes the bug that was fixed in findAndHingeIndices
      // The old logic: if (uniqueChildrenIds.some((ids) => ids.length > 1)) return null
      // Would incorrectly pass this case because no condition has >1 unique elements
      // But condition 1 has 0 unique elements, which should also fail
      const input = OR(
        AND(COMP(1), COMP(2), COMP(3)), // Has unique element: none (all are in condition 2)
        AND(COMP(1), COMP(2), COMP(3), COMP(4)) // Has unique element: COMP(4)
      )

      const result = pushDownOr(input)

      // Should remain unchanged because first condition has 0 unique elements
      // while second condition has 1 unique element (violates single hinge principle)
      expect(result).toBe(input) // unchanged
    })
  })
})
