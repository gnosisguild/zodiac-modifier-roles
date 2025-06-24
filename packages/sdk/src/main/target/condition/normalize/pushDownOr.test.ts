import { describe, it, expect } from "vitest"
import { Condition, Operator, ParameterType } from "zodiac-roles-deployments"

import { pushDownOr } from "./pushDownOr"
import { abiEncode } from "../../../abiEncode"
import { normalizeCondition } from "."

// Helper functions
const COMP = (id: number): Condition => ({
  paramType: ParameterType.Static,
  operator: Operator.EqualTo,
  compValue: abiEncode(["uint256"], [id]),
})

const PASS = (paramType: ParameterType = ParameterType.Static): Condition => ({
  paramType,
  operator: Operator.Pass,
})

const OR = (...children: Condition[]): Condition => ({
  paramType: ParameterType.None,
  operator: Operator.Or,
  children,
})

const AND = (...children: Condition[]): Condition => ({
  paramType: ParameterType.None,
  operator: Operator.And,
  children,
})

const MATCHES = (
  paramType: ParameterType,
  ...children: Condition[]
): Condition => ({
  paramType,
  operator: Operator.Matches,
  children,
})

describe("pushDownOrs", () => {
  describe("Basic push down scenarios", () => {
    it("pushes OR down to single differing position", () => {
      const input = OR(
        MATCHES(ParameterType.Calldata, COMP(1), COMP(2)),
        MATCHES(ParameterType.Calldata, COMP(1), COMP(3))
      )

      const result = pushDownOr(input)

      expect(result).toEqual(
        MATCHES(ParameterType.Calldata, COMP(1), OR(COMP(2), COMP(3)))
      )
    })

    it("pushes OR down with multiple branches", () => {
      const input = OR(
        MATCHES(ParameterType.Calldata, COMP(1), COMP(2), COMP(5)),
        MATCHES(ParameterType.Calldata, COMP(1), COMP(3), COMP(5)),
        MATCHES(ParameterType.Calldata, COMP(1), COMP(4), COMP(5))
      )

      const result = pushDownOr(input)

      expect(result).toEqual(
        MATCHES(
          ParameterType.Calldata,
          COMP(1),
          OR(COMP(2), COMP(3), COMP(4)),
          COMP(5)
        )
      )
    })

    it("handles different parameter types", () => {
      const input = OR(
        MATCHES(ParameterType.AbiEncoded, PASS(), COMP(1)),
        MATCHES(ParameterType.AbiEncoded, PASS(), COMP(2))
      )

      const result = pushDownOr(input)

      expect(result).toEqual(
        MATCHES(ParameterType.AbiEncoded, PASS(), OR(COMP(1), COMP(2)))
      )
    })

    it("works with Tuple type", () => {
      const input = OR(
        MATCHES(ParameterType.Tuple, COMP(1), COMP(2), COMP(10)),
        MATCHES(ParameterType.Tuple, COMP(1), COMP(3), COMP(10))
      )

      const result = pushDownOr(input)

      expect(result).toEqual(
        MATCHES(ParameterType.Tuple, COMP(1), OR(COMP(2), COMP(3)), COMP(10))
      )
    })
  })

  describe("Non-applicable scenarios", () => {
    it("returns unchanged when not an OR", () => {
      const input = AND(
        MATCHES(ParameterType.Calldata, COMP(1)),
        MATCHES(ParameterType.Calldata, COMP(2))
      )

      const result = pushDownOr(input)

      expect(result).toEqual(input)
    })

    it("returns unchanged with mixed operators", () => {
      const input = OR(
        MATCHES(ParameterType.Calldata, COMP(1)),
        COMP(2) // Not a MATCHES
      )

      const result = pushDownOr(input)

      expect(result).toEqual(input)
    })

    it("returns unchanged when differences in multiple positions", () => {
      const input = OR(
        MATCHES(ParameterType.Calldata, COMP(1), COMP(2)),
        MATCHES(ParameterType.Calldata, COMP(3), COMP(4)) // Differs in both positions
      )

      const result = pushDownOr(input)

      expect(result).toEqual(input)
    })

    it("returns unchanged with Array type", () => {
      const input = OR(
        MATCHES(ParameterType.Array, COMP(1)),
        MATCHES(ParameterType.Array, COMP(2))
      )

      const result = pushDownOr(input)

      expect(result).toEqual(input)
    })

    it("returns unchanged when no hinge found", () => {
      const input = OR(
        MATCHES(ParameterType.Calldata, COMP(1), COMP(2), COMP(3)),
        MATCHES(ParameterType.Calldata, COMP(4), COMP(5), COMP(6))
      )

      const result = pushDownOr(input)

      expect(result).toEqual(input)
    })
  })

  describe("Edge cases", () => {
    it("throws on single branch OR", () => {
      const input = OR(MATCHES(ParameterType.Calldata, COMP(1)))

      expect(() => pushDownOr(input)).toThrow("invariant violation")
    })

    it("throws on empty children in MATCHES", () => {
      const input = OR(
        MATCHES(ParameterType.Calldata),
        MATCHES(ParameterType.Calldata, COMP(1))
      )

      expect(() => pushDownOr(input)).toThrow("empty children")
    })
  })

  describe("Complex nested scenarios", () => {
    it("handles nested structures at hinge position", () => {
      const tuple1 = MATCHES(ParameterType.Tuple, COMP(1), COMP(2))
      const tuple2 = MATCHES(ParameterType.Tuple, COMP(3), COMP(4))

      const input = OR(
        MATCHES(ParameterType.Calldata, COMP(10), tuple1),
        MATCHES(ParameterType.Calldata, COMP(10), tuple2)
      )

      const result = pushDownOr(input)

      expect(result).toEqual(
        MATCHES(ParameterType.Calldata, COMP(10), OR(tuple1, tuple2))
      )
    })

    it("preserves logical conditions at hinge", () => {
      const input = OR(
        MATCHES(ParameterType.Calldata, COMP(1), AND(COMP(2), COMP(3))),
        MATCHES(ParameterType.Calldata, COMP(1), AND(COMP(4), COMP(5)))
      )

      const result = pushDownOr(input)

      expect(result).toEqual(
        MATCHES(
          ParameterType.Calldata,
          COMP(1),
          OR(AND(COMP(2), COMP(3)), AND(COMP(4), COMP(5)))
        )
      )
    })
  })

  describe("Integration with normalizeCondition", () => {
    it("recursively normalizes after push down", () => {
      const input = OR(
        MATCHES(ParameterType.Calldata, COMP(1), OR(COMP(2))),
        MATCHES(ParameterType.Calldata, COMP(1), OR(COMP(3)))
      )

      const result = pushDownOr(input, normalizeCondition)

      expect(result).toEqual(
        MATCHES(ParameterType.Calldata, COMP(1), OR(COMP(2), COMP(3)))
      )
    })

    it("handles deep normalization", () => {
      const input = OR(
        MATCHES(ParameterType.Calldata, COMP(1), OR(OR(COMP(2), COMP(3)))),
        MATCHES(ParameterType.Calldata, COMP(1), OR(COMP(4)))
      )

      const result = pushDownOr(input, normalizeCondition)

      // Should flatten and unwrap nested ORs
      expect(result).toEqual(
        MATCHES(ParameterType.Calldata, COMP(1), OR(COMP(2), COMP(3), COMP(4)))
      )
    })
  })

  describe("Hinge detection edge cases", () => {
    it("finds hinge at first position", () => {
      const input = OR(
        MATCHES(ParameterType.Calldata, COMP(1), COMP(10), COMP(20)),
        MATCHES(ParameterType.Calldata, COMP(2), COMP(10), COMP(20))
      )

      const result = pushDownOr(input)

      expect(result).toEqual(
        MATCHES(
          ParameterType.Calldata,
          OR(COMP(1), COMP(2)),
          COMP(10),
          COMP(20)
        )
      )
    })

    it("finds hinge at last position", () => {
      const input = OR(
        MATCHES(ParameterType.Calldata, COMP(10), COMP(20), COMP(1)),
        MATCHES(ParameterType.Calldata, COMP(10), COMP(20), COMP(2))
      )

      const result = pushDownOr(input)

      expect(result).toEqual(
        MATCHES(
          ParameterType.Calldata,
          COMP(10),
          COMP(20),
          OR(COMP(1), COMP(2))
        )
      )
    })

    it("handles Pass nodes correctly", () => {
      const input = OR(
        MATCHES(ParameterType.Calldata, PASS(), COMP(1)),
        MATCHES(ParameterType.Calldata, PASS(), COMP(2))
      )

      const result = pushDownOr(input)

      expect(result).toEqual(
        MATCHES(ParameterType.Calldata, PASS(), OR(COMP(1), COMP(2)))
      )
    })
  })
})
