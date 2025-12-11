import { describe, it, expect } from "vitest"
import { Encoding, Condition, Operator } from "zodiac-roles-deployments"
import { abiEncode } from "../../abiEncode"

import { normalizeCondition } from "."
import { padToMatchTypeTree } from "./padToMatchTypeTree"

// Helper to create test conditions
const COMP = (id: number): Condition => ({
  paramType: Encoding.Static,
  operator: Operator.EqualTo,
  compValue: abiEncode(["uint256"], [id]),
})

const PASS = (paramType: Encoding = Encoding.Static): Condition => ({
  paramType,
  operator: Operator.Pass,
})

const PASS_ = (paramType: Encoding, ...children: Condition[]): Condition => ({
  paramType,
  operator: Operator.Pass,
  children,
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

describe("padToMatchTypeTree", () => {
  describe("Basic padding scenarios", () => {
    it("pads shorter AbiEncoded branch to match longer one", () => {
      const input = OR(
        MATCHES(Encoding.AbiEncoded, COMP(1)), // 1 child
        MATCHES(Encoding.AbiEncoded, COMP(2), COMP(3)) // 2 children
      )

      const result = normalizeCondition(input)

      // Should return OR with both branches having 2 children
      expect(result).toEqual(
        OR(
          MATCHES(Encoding.AbiEncoded, COMP(1), PASS()), // 1 child
          MATCHES(Encoding.AbiEncoded, COMP(2), COMP(3)) // 2 children
        )
      )
    })

    it("pads multiple shorter branches to match the longest", () => {
      const input = OR(
        MATCHES(Encoding.AbiEncoded, COMP(4), COMP(5), COMP(6)),
        MATCHES(Encoding.AbiEncoded, COMP(1)),
        MATCHES(Encoding.AbiEncoded, COMP(2), COMP(3))
      )

      const result = normalizeCondition(input)

      expect(result).toEqual(
        OR(
          MATCHES(Encoding.AbiEncoded, COMP(1), PASS(), PASS()),
          MATCHES(Encoding.AbiEncoded, COMP(2), COMP(3), PASS()),
          MATCHES(Encoding.AbiEncoded, COMP(4), COMP(5), COMP(6))
        )
      )
    })

    it("does not pad when all branches have same length", () => {
      const input = OR(
        MATCHES(Encoding.AbiEncoded, COMP(1), COMP(2)),
        MATCHES(Encoding.AbiEncoded, COMP(3), COMP(4))
      )

      const expected = OR(
        MATCHES(Encoding.AbiEncoded, COMP(1), COMP(2)),
        MATCHES(Encoding.AbiEncoded, COMP(3), COMP(4))
      )

      expect(padToMatchTypeTree(input)).toEqual(expected)
      expect(normalizeCondition(input)).toEqual(expected)
    })

    it("preserves Dynamic nodes when copying structure", () => {
      const dynamic = {
        paramType: Encoding.Dynamic,
        operator: Operator.EqualTo,
        compValue: abiEncode(["string"], ["Hello World"]),
      }

      const input = OR(
        MATCHES(Encoding.AbiEncoded, COMP(1)),
        MATCHES(Encoding.AbiEncoded, COMP(2), dynamic)
      )

      const expected = OR(
        MATCHES(Encoding.AbiEncoded, COMP(1), PASS(Encoding.Dynamic)),
        MATCHES(Encoding.AbiEncoded, COMP(2), dynamic)
      )

      expect(padToMatchTypeTree(input)).toEqual(expected)
      expect(normalizeCondition(input)).toEqual(expected)
    })
  })

  describe("parameters types", () => {
    it("pads AbiEncoded branches", () => {
      const input = OR(
        MATCHES(Encoding.AbiEncoded, COMP(1)),
        MATCHES(Encoding.AbiEncoded, COMP(2), COMP(3), COMP(4))
      )

      const result = normalizeCondition(input)

      expect(result).toEqual(
        OR(
          MATCHES(Encoding.AbiEncoded, COMP(1), PASS(), PASS()),
          MATCHES(Encoding.AbiEncoded, COMP(2), COMP(3), COMP(4))
        )
      )
    })

    it("pads Tuple branches", () => {
      const input = OR(
        MATCHES(Encoding.Tuple, COMP(1), COMP(2)),
        MATCHES(Encoding.Tuple, COMP(3))
      )

      const result = normalizeCondition(input)

      expect(result).toEqual(
        OR(
          MATCHES(Encoding.Tuple, COMP(3), PASS()),
          MATCHES(Encoding.Tuple, COMP(1), COMP(2))
        )
      )
    })

    it("handles mixed types, pads matching types", () => {
      const dynamic: Condition = {
        operator: Operator.EqualTo,
        paramType: Encoding.Dynamic,
        compValue: "0xaabbccdd",
      }

      const input = OR(
        MATCHES(Encoding.AbiEncoded, COMP(1)),
        dynamic,
        MATCHES(Encoding.AbiEncoded, COMP(4), COMP(5))
      )

      const expected = OR(
        MATCHES(Encoding.AbiEncoded, COMP(1), PASS()),
        dynamic,
        MATCHES(Encoding.AbiEncoded, COMP(4), COMP(5))
      )

      expect(padToMatchTypeTree(input)).toEqual(expected)
    })
  })

  describe("Nested structures", () => {
    it("finds complex branches inside nested logical operators", () => {
      const input = AND(
        OR(
          MATCHES(Encoding.AbiEncoded, COMP(1)),
          MATCHES(Encoding.AbiEncoded, COMP(3), COMP(4))
        ),
        OR(
          MATCHES(Encoding.AbiEncoded, COMP(8)),
          MATCHES(Encoding.AbiEncoded, COMP(5), COMP(6), COMP(7))
        )
      )

      const expected = AND(
        OR(
          MATCHES(Encoding.AbiEncoded, COMP(1), PASS(), PASS()),
          MATCHES(Encoding.AbiEncoded, COMP(3), COMP(4), PASS())
        ),
        OR(
          MATCHES(Encoding.AbiEncoded, COMP(8), PASS(), PASS()),
          MATCHES(Encoding.AbiEncoded, COMP(5), COMP(6), COMP(7))
        )
      )

      expect(normalizeCondition(input)).toEqual(expected)
    })

    it("handles complex branches inside Arrays", () => {
      const input = OR(
        MATCHES(Encoding.Array, MATCHES(Encoding.AbiEncoded, COMP(1)), PASS()),
        MATCHES(Encoding.Array, MATCHES(Encoding.AbiEncoded, COMP(2), COMP(3)))
      )

      const expected = OR(
        MATCHES(
          Encoding.Array,
          MATCHES(Encoding.AbiEncoded, COMP(1), PASS()),
          PASS()
        ),
        MATCHES(Encoding.Array, MATCHES(Encoding.AbiEncoded, COMP(2), COMP(3)))
      )

      expect(padToMatchTypeTree(input)).toEqual(expected)
      expect(normalizeCondition(input)).toEqual(expected)
    })

    it("two branches which should mutually pad eachother", () => {
      const input = OR(
        MATCHES(Encoding.AbiEncoded, MATCHES(Encoding.Tuple, PASS(), COMP(1))),
        MATCHES(
          Encoding.AbiEncoded,
          MATCHES(Encoding.Tuple, COMP(2)),
          MATCHES(
            Encoding.Tuple,
            COMP(2),
            COMP(3),
            MATCHES(Encoding.Array, COMP(3))
          )
        )
      )

      const expected = OR(
        // Simple call
        MATCHES(
          Encoding.AbiEncoded,
          MATCHES(Encoding.Tuple, PASS(), COMP(1)),
          PASS_(Encoding.Tuple, PASS(), PASS(), PASS_(Encoding.Array, PASS()))
        ),
        // Complex call with nested tuple
        MATCHES(
          Encoding.AbiEncoded,
          MATCHES(Encoding.Tuple, COMP(2), PASS()),
          MATCHES(
            Encoding.Tuple,
            COMP(2),
            COMP(3),
            MATCHES(Encoding.Array, COMP(3))
          )
        )
      )

      expect(padToMatchTypeTree(input)).toEqual(expected)
    })

    it("copies complex structure when padding", () => {
      const input = OR(
        // Simple call
        MATCHES(Encoding.AbiEncoded, COMP(2)),
        // Complex call with nested tuple
        MATCHES(
          Encoding.AbiEncoded,
          COMP(1),
          MATCHES(
            Encoding.Tuple,
            COMP(2),
            COMP(3),
            MATCHES(Encoding.Array, COMP(4))
          )
        )
      )

      const insertedSubTree = {
        operator: Operator.Pass,
        paramType: Encoding.Tuple,
        children: [
          PASS(),
          PASS(),
          {
            operator: Operator.Pass,
            paramType: Encoding.Array,
            children: [PASS()],
          },
        ],
      }

      const expected = OR(
        MATCHES(Encoding.AbiEncoded, COMP(2), insertedSubTree),
        MATCHES(
          Encoding.AbiEncoded,
          COMP(1),
          MATCHES(
            Encoding.Tuple,
            COMP(2),
            COMP(3),
            MATCHES(Encoding.Array, COMP(4))
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
        Encoding.Array,
        MATCHES(Encoding.Tuple, COMP(1), PASS(), COMP(3)),
        MATCHES(Encoding.Tuple, COMP(4))
      )

      const expected = MATCHES(
        Encoding.Array,
        MATCHES(Encoding.Tuple, COMP(1), PASS(), COMP(3)),
        MATCHES(Encoding.Tuple, COMP(4), PASS(), PASS())
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
