import { describe, it, expect } from "vitest"
import { Condition, Operator, ParameterType } from "zodiac-roles-deployments"

import { normalizeCondition } from "./normalize"
import { subtractCondition } from "./subtractCondition"
import { abiEncode } from "../../abiEncode"

// Helper functions
const COMP = (id: number): Condition => ({
  paramType: ParameterType.Static,
  operator: Operator.EqualTo,
  compValue: abiEncode(["uint256"], [id]),
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

const NOR = (...children: Condition[]): Condition => ({
  paramType: ParameterType.None,
  operator: Operator.Nor,
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

describe("subtractCondition", () => {
  describe("Basic subtraction rules", () => {
    it("OR(A, B, C) - B = OR(A, C)", () => {
      const a = COMP(1)
      const b = COMP(2)
      const c = COMP(3)
      const condition = OR(a, b, c)

      const result = subtractCondition(condition, b)

      expect(result).toEqual(OR(a, c))
    })

    it("OR(A, B) - B = A", () => {
      const a = COMP(1)
      const b = COMP(2)
      const condition = OR(a, b)

      const result = subtractCondition(condition, b)

      expect(result).toEqual(a)
    })

    it("OR(A, B) - C = OR(A, B) (unchanged)", () => {
      const a = COMP(1)
      const b = COMP(2)
      const c = COMP(3)
      const condition = OR(a, b)

      const result = subtractCondition(condition, c)

      expect(result).toEqual(condition)
    })

    it("A - A = undefined", () => {
      const a = COMP(1)

      const result = subtractCondition(a, a)

      expect(result).toBeUndefined()
    })

    it("AND(A, B) - A = AND(A, B) (can't subtract part of AND)", () => {
      const a = COMP(1)
      const b = COMP(2)
      const condition = AND(a, b)

      const result = subtractCondition(condition, a)

      expect(result).toEqual(condition)
    })

    it("AND(A, B) - AND(A, B) = undefined", () => {
      const a = COMP(1)
      const b = COMP(2)
      const condition = AND(a, b)

      const result = subtractCondition(condition, condition)

      expect(result).toBeUndefined()
    })
  })

  describe("OR operator", () => {
    it("simple pushed down OR", () => {
      const condition = MATCHES(
        ParameterType.Calldata,
        OR(
          {
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue:
              "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          },
          {
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue:
              "0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
          }
        ),
        {
          paramType: ParameterType.Static,
          operator: Operator.Pass,
        },
        {
          paramType: ParameterType.Static,
          operator: Operator.EqualToAvatar,
        }
      )

      const fragment = MATCHES(
        ParameterType.Calldata, // 5
        {
          paramType: ParameterType.Static, // 1
          operator: Operator.EqualTo, // 16
          compValue:
            "0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        },
        {
          paramType: ParameterType.Static, // 1
          operator: Operator.Pass, // 0
        },
        {
          paramType: ParameterType.Static, // 1
          operator: Operator.EqualToAvatar, // 15
        }
      )

      expect(
        normalizeCondition(subtractCondition(condition, fragment)!)
      ).toEqual(
        MATCHES(
          ParameterType.Calldata, // 5
          {
            paramType: ParameterType.Static, // 1
            operator: Operator.EqualTo, // 16
            compValue:
              "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          },
          {
            paramType: ParameterType.Static, // 1
            operator: Operator.Pass, // 0
          },
          {
            paramType: ParameterType.Static, // 1
            operator: Operator.EqualToAvatar, // 15
          }
        )
      )
    })

    it("removes fragment from nested OR", () => {
      const a = COMP(1)
      const b = COMP(2)
      const c = COMP(3)

      const condition = OR(a, OR(b, c))

      const result = subtractCondition(condition, b)

      expect(result).toEqual(OR(a, c))
    })

    it("removes fragment from nested OR 2", () => {
      const a = COMP(1)
      const b = COMP(2)
      const c = COMP(3)
      const d = COMP(4)

      const condition = OR(a, OR(b, c), d)

      const result = subtractCondition(condition, b)

      expect(result).toEqual(OR(a, c, d))
    })

    it("removes entire nested OR if it becomes empty", () => {
      const a = COMP(1)
      const b = COMP(2)
      const condition = OR(a, OR(b))

      const result = subtractCondition(condition, b)

      expect(result).toEqual(a)
    })

    it("handles complex nested structure", () => {
      const condition = OR(COMP(1), AND(COMP(2), COMP(3)), OR(COMP(4), COMP(5)))

      // Remove COMP(4)
      const result = subtractCondition(condition, COMP(4))

      expect(result).toEqual(OR(COMP(1), AND(COMP(2), COMP(3)), COMP(5)))
    })
  })

  describe("NOR operator", () => {
    it("NOR(A, B) - A = NOR(A, B) (can't subtract part)", () => {
      const a = COMP(1)
      const b = COMP(2)
      const condition = NOR(a, b)

      const result = subtractCondition(condition, a)

      expect(result).toEqual(condition)
    })

    it("NOR(A, B) - NOR(A, B) = undefined", () => {
      const condition = NOR(COMP(1), COMP(2))

      const result = subtractCondition(condition, condition)

      expect(result).toBeUndefined()
    })
  })

  describe("MATCHES operator", () => {
    it("MATCHES - exact match = undefined", () => {
      const condition = MATCHES(ParameterType.Calldata, COMP(1), COMP(2))

      const result = subtractCondition(condition, condition)

      expect(result).toBeUndefined()
    })

    it("MATCHES - does not subtract from subset", () => {
      const condition = MATCHES(ParameterType.Calldata, COMP(1), COMP(2))
      const fragment = COMP(1)

      const result = subtractCondition(condition, fragment)

      expect(result).toEqual(condition)
    })

    it("MATCHES - only subtracts from one hinge difference", () => {
      const condition = MATCHES(
        ParameterType.Calldata,
        OR(COMP(1), COMP(2)),
        OR(COMP(3), COMP(4))
      )

      const fragment = MATCHES(ParameterType.Calldata, COMP(2), COMP(4))

      const result = subtractCondition(condition, fragment)

      expect(result).toEqual(condition)
    })

    it("MATCHES - only subtracts whenon oe hinge difference", () => {
      const condition = MATCHES(
        ParameterType.Calldata,
        OR(COMP(1), COMP(2)),
        OR(COMP(3), COMP(4))
      )

      const fragmentOneHinge = MATCHES(
        ParameterType.Calldata,
        OR(COMP(1), COMP(2)),
        COMP(4)
      )
      const fragmentTwoHinge = MATCHES(ParameterType.Calldata, COMP(2), COMP(4))

      expect(subtractCondition(condition, fragmentOneHinge)).toEqual(
        MATCHES(ParameterType.Calldata, OR(COMP(1), COMP(2)), COMP(3))
      )
      expect(subtractCondition(condition, fragmentTwoHinge)).toBe(condition)
    })

    it("cannot subtract from MATCHES positions", () => {
      const condition = MATCHES(
        ParameterType.Calldata,
        COMP(1),
        OR(COMP(2), COMP(3))
      )
      const fragment = COMP(2)

      const result = subtractCondition(condition, fragment)

      expect(result).toEqual(condition)
    })
  })

  describe("Edge cases", () => {
    it("handles empty OR", () => {
      const condition = OR()
      const fragment = COMP(1)

      const result = subtractCondition(condition, fragment)

      expect(result).toEqual(condition)
    })

    it("OR with single child that gets removed", () => {
      const a = COMP(1)
      const condition = OR(a)

      const result = subtractCondition(condition, a)

      expect(result).toBeUndefined()
    })

    it("removes all children from OR", () => {
      const a = COMP(1)
      const b = COMP(2)
      const condition = OR(a, b, a) // duplicate

      const result = subtractCondition(condition, a)

      expect(result).toEqual(b)
    })
  })

  describe("Complex scenarios", () => {
    it("OR with mixed content", () => {
      const condition = OR(
        COMP(1),
        AND(COMP(2), COMP(3)),
        MATCHES(ParameterType.Calldata, COMP(4))
      )

      // Can remove the AND completely
      const result1 = subtractCondition(condition, AND(COMP(2), COMP(3)))
      expect(result1).toEqual(
        OR(COMP(1), MATCHES(ParameterType.Calldata, COMP(4)))
      )

      // Cannot remove part of the AND
      const result2 = subtractCondition(condition, COMP(2))
      expect(result2).toEqual(condition)
    })

    it("deeply nested ORs", () => {
      const condition = OR(COMP(1), OR(COMP(2), OR(COMP(3), COMP(4))))

      const result = subtractCondition(condition, COMP(3))

      expect(result).toEqual(OR(COMP(1), OR(COMP(2), COMP(4))))
    })
  })
})
