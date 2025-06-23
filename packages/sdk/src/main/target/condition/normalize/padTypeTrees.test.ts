import { describe, it, expect } from "vitest"
import { Condition, Operator, ParameterType } from "zodiac-roles-deployments"
import { abiEncode } from "../../../abiEncode"

// Import the function we're testing through normalizeCondition
import { normalizeCondition } from "."

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

describe("ensureBranchTypeTreeCompatibility", () => {
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

      const result = normalizeCondition(input)

      expect(result).toEqual(
        OR(
          MATCHES(ParameterType.Calldata, COMP(1), COMP(2)),
          MATCHES(ParameterType.Calldata, COMP(3), COMP(4))
        )
      )
    })
  })

  describe("Different parameter types", () => {
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

    it("handles mixed types (only pads matching types)", () => {
      const equals: Condition = {
        operator: Operator.EqualTo,
        paramType: ParameterType.Dynamic,
        compValue: "0xaabbccdd",
      }

      const input = OR(
        MATCHES(ParameterType.Calldata, COMP(1)),
        equals,
        MATCHES(ParameterType.Calldata, COMP(4), COMP(5))
      )

      const result = normalizeCondition(input)

      expect(result).toEqual(
        OR(
          MATCHES(ParameterType.Calldata, COMP(1), PASS()),
          MATCHES(ParameterType.Calldata, COMP(4), COMP(5)),
          equals
        )
      )
    })
  })

  describe("Nested structures", () => {
    it("finds complex branches inside nested logical operators", () => {
      const input = AND(
        OR(
          MATCHES(ParameterType.Calldata, COMP(1)),
          MATCHES(ParameterType.Calldata, COMP(2), COMP(3))
        ),
        COMP(4)
      )

      const result = normalizeCondition(input)

      expect(result).toEqual(
        AND(
          COMP(4),
          OR(
            MATCHES(ParameterType.Calldata, COMP(1), PASS()),
            MATCHES(ParameterType.Calldata, COMP(2), COMP(3))
          )
        )
      )

      // Should find and pad the Calldata branches inside the OR
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

      const result = normalizeCondition(input)
      expect(result).toEqual(
        OR(
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
      )
    })

    it("finds two branches which should mutually patch eachother", () => {
      const input = OR(
        // Simple call
        MATCHES(
          ParameterType.Calldata,
          MATCHES(ParameterType.Tuple, PASS(), COMP(1))
        ),
        // Complex call with nested tuple
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

      const result = normalizeCondition(input)

      expect(result).toEqual(
        OR(
          // Simple call
          MATCHES(
            ParameterType.Calldata,
            MATCHES(ParameterType.Tuple, PASS(), COMP(1)),
            PASS_(
              ParameterType.Tuple,
              PASS(),
              PASS(),
              MATCHES(ParameterType.Array, PASS())
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
      )

      // Should find and pad the Calldata branches inside the OR
    })
  })

  describe("Structure copying", () => {
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

      const result = normalizeCondition(input)

      const pass = {
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

      expect(result).toEqual(
        OR(
          MATCHES(ParameterType.Calldata, COMP(2), pass),
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
      )
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

      const result = normalizeCondition(input)

      expect(result).toEqual(
        OR(
          MATCHES(ParameterType.Calldata, COMP(1), PASS(ParameterType.Dynamic)),
          MATCHES(ParameterType.Calldata, COMP(2), dynamic)
        )
      )
    })
  })

  describe("Nothing to handle", () => {
    it("handles condition with no complex branches", () => {
      const input = OR(COMP(1), COMP(2), COMP(3))

      const result = normalizeCondition(input)

      expect(result).toEqual(OR(COMP(1), COMP(2), COMP(3)))
    })

    it("handles single complex branch", () => {
      const input = OR(
        COMP(1),
        MATCHES(ParameterType.Calldata, COMP(2), COMP(3))
      )

      const result = normalizeCondition(input)

      expect(result).toEqual(
        OR(MATCHES(ParameterType.Calldata, COMP(2), COMP(3)), COMP(1))
      )
    })
  })
})
