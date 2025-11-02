import { describe, it, expect } from "vitest"
import { AbiType, Condition, Operator } from "zodiac-roles-deployments"
import { abiEncode } from "../../abiEncode"

import { normalizeCondition } from "."
import { padToMatchTypeTree } from "./padToMatchTypeTree"

// Helper to create test conditions
const COMP = (id: number): Condition => ({
  paramType: AbiType.Static,
  operator: Operator.EqualTo,
  compValue: abiEncode(["uint256"], [id]),
})

const PASS = (paramType: AbiType = AbiType.Static): Condition => ({
  paramType,
  operator: Operator.Pass,
})

const PASS_ = (paramType: AbiType, ...children: Condition[]): Condition => ({
  paramType,
  operator: Operator.Pass,
  children,
})

const OR = (...children: Condition[]): Condition => ({
  paramType: AbiType.None,
  operator: Operator.Or,
  children,
})

const AND = (...children: Condition[]): Condition => ({
  paramType: AbiType.None,
  operator: Operator.And,
  children,
})

const MATCHES = (paramType: AbiType, ...children: Condition[]): Condition => ({
  paramType,
  operator: Operator.Matches,
  children,
})

describe("padToMatchTypeTree", () => {
  describe("Basic padding scenarios", () => {
    it("pads shorter Calldata branch to match longer one", () => {
      const input = OR(
        MATCHES(AbiType.Calldata, COMP(1)), // 1 child
        MATCHES(AbiType.Calldata, COMP(2), COMP(3)) // 2 children
      )

      const result = normalizeCondition(input)

      // Should return OR with both branches having 2 children
      expect(result).toEqual(
        OR(
          MATCHES(AbiType.Calldata, COMP(1), PASS()), // 1 child
          MATCHES(AbiType.Calldata, COMP(2), COMP(3)) // 2 children
        )
      )
    })

    it("pads multiple shorter branches to match the longest", () => {
      const input = OR(
        MATCHES(AbiType.Calldata, COMP(4), COMP(5), COMP(6)),
        MATCHES(AbiType.Calldata, COMP(1)),
        MATCHES(AbiType.Calldata, COMP(2), COMP(3))
      )

      const result = normalizeCondition(input)

      expect(result).toEqual(
        OR(
          MATCHES(AbiType.Calldata, COMP(1), PASS(), PASS()),
          MATCHES(AbiType.Calldata, COMP(2), COMP(3), PASS()),
          MATCHES(AbiType.Calldata, COMP(4), COMP(5), COMP(6))
        )
      )
    })

    it("does not pad when all branches have same length", () => {
      const input = OR(
        MATCHES(AbiType.Calldata, COMP(1), COMP(2)),
        MATCHES(AbiType.Calldata, COMP(3), COMP(4))
      )

      const expected = OR(
        MATCHES(AbiType.Calldata, COMP(1), COMP(2)),
        MATCHES(AbiType.Calldata, COMP(3), COMP(4))
      )

      expect(padToMatchTypeTree(input)).toEqual(expected)
      expect(normalizeCondition(input)).toEqual(expected)
    })

    it("preserves Dynamic nodes when copying structure", () => {
      const dynamic = {
        paramType: AbiType.Dynamic,
        operator: Operator.EqualTo,
        compValue: abiEncode(["string"], ["Hello World"]),
      }

      const input = OR(
        MATCHES(AbiType.Calldata, COMP(1)),
        MATCHES(AbiType.Calldata, COMP(2), dynamic)
      )

      const expected = OR(
        MATCHES(AbiType.Calldata, COMP(1), PASS(AbiType.Dynamic)),
        MATCHES(AbiType.Calldata, COMP(2), dynamic)
      )

      expect(padToMatchTypeTree(input)).toEqual(expected)
      expect(normalizeCondition(input)).toEqual(expected)
    })
  })

  describe("parameters types", () => {
    it("pads AbiEncoded branches", () => {
      const input = OR(
        MATCHES(AbiType.AbiEncoded, COMP(1)),
        MATCHES(AbiType.AbiEncoded, COMP(2), COMP(3), COMP(4))
      )

      const result = normalizeCondition(input)

      expect(result).toEqual(
        OR(
          MATCHES(AbiType.AbiEncoded, COMP(1), PASS(), PASS()),
          MATCHES(AbiType.AbiEncoded, COMP(2), COMP(3), COMP(4))
        )
      )
    })

    it("pads Tuple branches", () => {
      const input = OR(
        MATCHES(AbiType.Tuple, COMP(1), COMP(2)),
        MATCHES(AbiType.Tuple, COMP(3))
      )

      const result = normalizeCondition(input)

      expect(result).toEqual(
        OR(
          MATCHES(AbiType.Tuple, COMP(3), PASS()),
          MATCHES(AbiType.Tuple, COMP(1), COMP(2))
        )
      )
    })

    it("handles mixed types, pads matching types", () => {
      const dynamic: Condition = {
        operator: Operator.EqualTo,
        paramType: AbiType.Dynamic,
        compValue: "0xaabbccdd",
      }

      const input = OR(
        MATCHES(AbiType.Calldata, COMP(1)),
        dynamic,
        MATCHES(AbiType.Calldata, COMP(4), COMP(5))
      )

      const expected = OR(
        MATCHES(AbiType.Calldata, COMP(1), PASS()),
        dynamic,
        MATCHES(AbiType.Calldata, COMP(4), COMP(5))
      )

      expect(padToMatchTypeTree(input)).toEqual(expected)
    })
  })

  describe("Nested structures", () => {
    it("finds complex branches inside nested logical operators", () => {
      const input = AND(
        OR(
          MATCHES(AbiType.Calldata, COMP(1)),
          MATCHES(AbiType.Calldata, COMP(3), COMP(4))
        ),
        OR(
          MATCHES(AbiType.Calldata, COMP(8)),
          MATCHES(AbiType.Calldata, COMP(5), COMP(6), COMP(7))
        )
      )

      const expected = AND(
        OR(
          MATCHES(AbiType.Calldata, COMP(1), PASS(), PASS()),
          MATCHES(AbiType.Calldata, COMP(3), COMP(4), PASS())
        ),
        OR(
          MATCHES(AbiType.Calldata, COMP(8), PASS(), PASS()),
          MATCHES(AbiType.Calldata, COMP(5), COMP(6), COMP(7))
        )
      )

      expect(normalizeCondition(input)).toEqual(expected)
    })

    it("handles complex branches inside Arrays", () => {
      const input = OR(
        MATCHES(AbiType.Array, MATCHES(AbiType.Calldata, COMP(1)), PASS()),
        MATCHES(AbiType.Array, MATCHES(AbiType.Calldata, COMP(2), COMP(3)))
      )

      const expected = OR(
        MATCHES(
          AbiType.Array,
          MATCHES(AbiType.Calldata, COMP(1), PASS()),
          PASS()
        ),
        MATCHES(AbiType.Array, MATCHES(AbiType.Calldata, COMP(2), COMP(3)))
      )

      expect(padToMatchTypeTree(input)).toEqual(expected)
      expect(normalizeCondition(input)).toEqual(expected)
    })

    it("two branches which should mutually pad eachother", () => {
      const input = OR(
        MATCHES(AbiType.Calldata, MATCHES(AbiType.Tuple, PASS(), COMP(1))),
        MATCHES(
          AbiType.Calldata,
          MATCHES(AbiType.Tuple, COMP(2)),
          MATCHES(
            AbiType.Tuple,
            COMP(2),
            COMP(3),
            MATCHES(AbiType.Array, COMP(3))
          )
        )
      )

      const expected = OR(
        // Simple call
        MATCHES(
          AbiType.Calldata,
          MATCHES(AbiType.Tuple, PASS(), COMP(1)),
          PASS_(AbiType.Tuple, PASS(), PASS(), PASS_(AbiType.Array, PASS()))
        ),
        // Complex call with nested tuple
        MATCHES(
          AbiType.Calldata,
          MATCHES(AbiType.Tuple, COMP(2), PASS()),
          MATCHES(
            AbiType.Tuple,
            COMP(2),
            COMP(3),
            MATCHES(AbiType.Array, COMP(3))
          )
        )
      )

      expect(padToMatchTypeTree(input)).toEqual(expected)
    })

    it("copies complex structure when padding", () => {
      const input = OR(
        // Simple call
        MATCHES(AbiType.Calldata, COMP(2)),
        // Complex call with nested tuple
        MATCHES(
          AbiType.Calldata,
          COMP(1),
          MATCHES(
            AbiType.Tuple,
            COMP(2),
            COMP(3),
            MATCHES(AbiType.Array, COMP(4))
          )
        )
      )

      const insertedSubTree = {
        operator: Operator.Pass,
        paramType: AbiType.Tuple,
        children: [
          PASS(),
          PASS(),
          {
            operator: Operator.Pass,
            paramType: AbiType.Array,
            children: [PASS()],
          },
        ],
      }

      const expected = OR(
        MATCHES(AbiType.Calldata, COMP(2), insertedSubTree),
        MATCHES(
          AbiType.Calldata,
          COMP(1),
          MATCHES(
            AbiType.Tuple,
            COMP(2),
            COMP(3),
            MATCHES(AbiType.Array, COMP(4))
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
        AbiType.Array,
        MATCHES(AbiType.Tuple, COMP(1), PASS(), COMP(3)),
        MATCHES(AbiType.Tuple, COMP(4))
      )

      const expected = MATCHES(
        AbiType.Array,
        MATCHES(AbiType.Tuple, COMP(1), PASS(), COMP(3)),
        MATCHES(AbiType.Tuple, COMP(4), PASS(), PASS())
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
