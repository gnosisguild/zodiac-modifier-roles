import { describe, it, expect } from "vitest"
import { Condition, Operator, ParameterType } from "zodiac-roles-deployments"
import { abiEncode } from "../../../abiEncode"

import { normalizeCondition } from "."
import { padToMatchTypeTree } from "./padToMatchTypeTree"

// Helper to create test conditions
const COMP = (id: number): Condition => ({
  paramType: ParameterType.Static,
  operator: Operator.EqualTo,
  compValue: abiEncode(["uint256"], [id]),
})

const PASS = (paramType: ParameterType = ParameterType.Static): Condition => ({
  paramType,
  operator: Operator.Pass,
})

const PASS_ = (
  paramType: ParameterType,
  ...children: Condition[]
): Condition => ({
  paramType,
  operator: Operator.Pass,
  children,
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

describe("padToMatchTypeTree", () => {
  describe("Basic padding scenarios", () => {
    it("pads shorter Calldata branch to match longer one", () => {
      const input = OR(
        MATCHES(ParameterType.Calldata, COMP(1)), // 1 child
        MATCHES(ParameterType.Calldata, COMP(2), COMP(3)) // 2 children
      )

      const result = normalizeCondition(input)

      // Should return OR with both branches having 2 children
      expect(result).toEqual(
        OR(
          MATCHES(ParameterType.Calldata, COMP(1), PASS()), // 1 child
          MATCHES(ParameterType.Calldata, COMP(2), COMP(3)) // 2 children
        )
      )
    })

    it("pads multiple shorter branches to match the longest", () => {
      const input = OR(
        MATCHES(ParameterType.Calldata, COMP(4), COMP(5), COMP(6)),
        MATCHES(ParameterType.Calldata, COMP(1)),
        MATCHES(ParameterType.Calldata, COMP(2), COMP(3))
      )

      const result = normalizeCondition(input)

      expect(result).toEqual(
        OR(
          MATCHES(ParameterType.Calldata, COMP(1), PASS(), PASS()),
          MATCHES(ParameterType.Calldata, COMP(2), COMP(3), PASS()),
          MATCHES(ParameterType.Calldata, COMP(4), COMP(5), COMP(6))
        )
      )
    })

    it("does not pad when all branches have same length", () => {
      const input = OR(
        MATCHES(ParameterType.Calldata, COMP(1), COMP(2)),
        MATCHES(ParameterType.Calldata, COMP(3), COMP(4))
      )

      const expected = OR(
        MATCHES(ParameterType.Calldata, COMP(1), COMP(2)),
        MATCHES(ParameterType.Calldata, COMP(3), COMP(4))
      )

      expect(padToMatchTypeTree(input)).toEqual(expected)
      expect(normalizeCondition(input)).toEqual(expected)
    })

    it("preserves Dynamic nodes when copying structure", () => {
      const dynamic = {
        paramType: ParameterType.Dynamic,
        operator: Operator.EqualTo,
        compValue: abiEncode(["string"], ["Hello World"]),
      }

      const input = OR(
        MATCHES(ParameterType.Calldata, COMP(1)),
        MATCHES(ParameterType.Calldata, COMP(2), dynamic)
      )

      const expected = OR(
        MATCHES(ParameterType.Calldata, COMP(1), PASS(ParameterType.Dynamic)),
        MATCHES(ParameterType.Calldata, COMP(2), dynamic)
      )

      expect(padToMatchTypeTree(input)).toEqual(expected)
      expect(normalizeCondition(input)).toEqual(expected)
    })
  })

  describe("parameters types", () => {
    it("pads AbiEncoded branches", () => {
      const input = OR(
        MATCHES(ParameterType.AbiEncoded, COMP(1)),
        MATCHES(ParameterType.AbiEncoded, COMP(2), COMP(3), COMP(4))
      )

      const result = normalizeCondition(input)

      expect(result).toEqual(
        OR(
          MATCHES(ParameterType.AbiEncoded, COMP(1), PASS(), PASS()),
          MATCHES(ParameterType.AbiEncoded, COMP(2), COMP(3), COMP(4))
        )
      )
    })

    it("pads Tuple branches", () => {
      const input = OR(
        MATCHES(ParameterType.Tuple, COMP(1), COMP(2)),
        MATCHES(ParameterType.Tuple, COMP(3))
      )

      const result = normalizeCondition(input)

      expect(result).toEqual(
        OR(
          MATCHES(ParameterType.Tuple, COMP(3), PASS()),
          MATCHES(ParameterType.Tuple, COMP(1), COMP(2))
        )
      )
    })

    it("handles mixed types, pads matching types", () => {
      const dynamic: Condition = {
        operator: Operator.EqualTo,
        paramType: ParameterType.Dynamic,
        compValue: "0xaabbccdd",
      }

      const input = OR(
        MATCHES(ParameterType.Calldata, COMP(1)),
        dynamic,
        MATCHES(ParameterType.Calldata, COMP(4), COMP(5))
      )

      const expected = OR(
        MATCHES(ParameterType.Calldata, COMP(1), PASS()),
        dynamic,
        MATCHES(ParameterType.Calldata, COMP(4), COMP(5))
      )

      expect(padToMatchTypeTree(input)).toEqual(expected)
    })
  })

  describe("Nested structures", () => {
    it("finds complex branches inside nested logical operators", () => {
      const input = AND(
        OR(
          MATCHES(ParameterType.Calldata, COMP(1)),
          MATCHES(ParameterType.Calldata, COMP(3), COMP(4))
        ),
        OR(
          MATCHES(ParameterType.Calldata, COMP(8)),
          MATCHES(ParameterType.Calldata, COMP(5), COMP(6), COMP(7))
        )
      )

      const expected = AND(
        OR(
          MATCHES(ParameterType.Calldata, COMP(1), PASS(), PASS()),
          MATCHES(ParameterType.Calldata, COMP(3), COMP(4), PASS())
        ),
        OR(
          MATCHES(ParameterType.Calldata, COMP(8), PASS(), PASS()),
          MATCHES(ParameterType.Calldata, COMP(5), COMP(6), COMP(7))
        )
      )

      expect(normalizeCondition(input)).toEqual(expected)
    })

    it("handles complex branches inside Arrays", () => {
      const input = OR(
        MATCHES(
          ParameterType.Array,
          MATCHES(ParameterType.Calldata, COMP(1)),
          PASS()
        ),
        MATCHES(
          ParameterType.Array,
          MATCHES(ParameterType.Calldata, COMP(2), COMP(3))
        )
      )

      const expected = OR(
        MATCHES(
          ParameterType.Array,
          MATCHES(ParameterType.Calldata, COMP(1), PASS()),
          PASS()
        ),
        MATCHES(
          ParameterType.Array,
          MATCHES(ParameterType.Calldata, COMP(2), COMP(3))
        )
      )

      expect(padToMatchTypeTree(input)).toEqual(expected)
      expect(normalizeCondition(input)).toEqual(expected)
    })

    it("two branches which should mutually pad eachother", () => {
      const input = OR(
        MATCHES(
          ParameterType.Calldata,
          MATCHES(ParameterType.Tuple, PASS(), COMP(1))
        ),
        MATCHES(
          ParameterType.Calldata,
          MATCHES(ParameterType.Tuple, COMP(2)),
          MATCHES(
            ParameterType.Tuple,
            COMP(2),
            COMP(3),
            MATCHES(ParameterType.Array, COMP(3))
          )
        )
      )

      const expected = OR(
        // Simple call
        MATCHES(
          ParameterType.Calldata,
          MATCHES(ParameterType.Tuple, PASS(), COMP(1)),
          PASS_(
            ParameterType.Tuple,
            PASS(),
            PASS(),
            PASS_(ParameterType.Array, PASS())
          )
        ),
        // Complex call with nested tuple
        MATCHES(
          ParameterType.Calldata,
          MATCHES(ParameterType.Tuple, COMP(2), PASS()),
          MATCHES(
            ParameterType.Tuple,
            COMP(2),
            COMP(3),
            MATCHES(ParameterType.Array, COMP(3))
          )
        )
      )

      expect(padToMatchTypeTree(input)).toEqual(expected)
    })

    it("copies complex structure when padding", () => {
      const input = OR(
        // Simple call
        MATCHES(ParameterType.Calldata, COMP(2)),
        // Complex call with nested tuple
        MATCHES(
          ParameterType.Calldata,
          COMP(1),
          MATCHES(
            ParameterType.Tuple,
            COMP(2),
            COMP(3),
            MATCHES(ParameterType.Array, COMP(4))
          )
        )
      )

      const insertedSubTree = {
        operator: Operator.Pass,
        paramType: ParameterType.Tuple,
        children: [
          PASS(),
          PASS(),
          {
            operator: Operator.Pass,
            paramType: ParameterType.Array,
            children: [PASS()],
          },
        ],
      }

      const expected = OR(
        MATCHES(ParameterType.Calldata, COMP(2), insertedSubTree),
        MATCHES(
          ParameterType.Calldata,
          COMP(1),
          MATCHES(
            ParameterType.Tuple,
            COMP(2),
            COMP(3),
            MATCHES(ParameterType.Array, COMP(4))
          )
        )
      )

      expect(padToMatchTypeTree(input)).toEqual(expected)
      expect(normalizeCondition(input)).toEqual(expected)
    })
  })

  describe("Arrays", () => {
    it("handles complex branches inside Arrays", () => {
      const input = MATCHES(
        ParameterType.Array,
        MATCHES(ParameterType.Tuple, COMP(1), PASS(), COMP(3)),
        MATCHES(ParameterType.Tuple, COMP(4))
      )

      const expected = MATCHES(
        ParameterType.Array,
        MATCHES(ParameterType.Tuple, COMP(1), PASS(), COMP(3)),
        MATCHES(ParameterType.Tuple, COMP(4), PASS(), PASS())
      )

      expect(padToMatchTypeTree(input)).toEqual(expected)
      expect(normalizeCondition(input)).toEqual(expected)
    })
  })

  describe("Nothing to handle", () => {
    it("handles condition with no complex branches", () => {
      const input = OR(COMP(1), COMP(2), COMP(3))

      expect(padToMatchTypeTree(input)).toEqual(input)
      expect(normalizeCondition(input)).toEqual(input)
    })
  })
})
