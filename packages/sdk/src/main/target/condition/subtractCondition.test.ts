import { describe, it, expect } from "vitest"
import { Condition, Operator, ParameterType } from "zodiac-roles-deployments"

import { normalizeCondition } from "./normalize"
import { subtractCondition } from "./subtractCondition"
import { abiEncode } from "../../abiEncode"

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

  describe("OR n:1 subtraction", () => {
    it("OR(A, B, C) - A = OR(B, C)", () => {
      const a = COMP(1)
      const b = COMP(2)
      const c = COMP(3)
      const condition = OR(a, b, c)

      const result = subtractCondition(condition, a)

      expect(result).toEqual(OR(b, c))
    })

    it("OR(A, B) - A = B (unwrap single child)", () => {
      const a = COMP(1)
      const b = COMP(2)
      const condition = OR(a, b)

      const result = subtractCondition(condition, a)

      expect(result).toEqual(b)
    })

    it("OR(A) - A = undefined (complete removal)", () => {
      const a = COMP(1)
      const condition = OR(a)

      const result = subtractCondition(condition, a)

      expect(result).toBeUndefined()
    })

    it("OR(A, B, C) - D = OR(A, B, C) (no match, unchanged)", () => {
      const a = COMP(1)
      const b = COMP(2)
      const c = COMP(3)
      const d = COMP(4)
      const condition = OR(a, b, c)

      const result = subtractCondition(condition, d)

      expect(result).toEqual(condition)
      expect(result == condition).toBeTruthy()
    })

    it("removes from nested OR: OR(A, OR(B, C), D) - B = OR(A, C, D)", () => {
      const a = COMP(1)
      const b = COMP(2)
      const c = COMP(3)
      const d = COMP(4)
      const condition = OR(a, OR(b, c), d)

      const result = subtractCondition(condition, b)

      expect(result).toEqual(OR(a, c, d))
    })

    it("removes from deeply nested OR", () => {
      const a = COMP(1)
      const b = COMP(2)
      const c = COMP(3)
      const condition = OR(a, OR(b, c))

      const result = subtractCondition(condition, b)

      expect(result).toEqual(OR(a, c))
    })
  })

  describe("OR n:m subtraction (remove multiple items)", () => {
    it("OR(A, B, C, D) - OR(A, C) = OR(B, D)", () => {
      const a = COMP(1)
      const b = COMP(2)
      const c = COMP(3)
      const d = COMP(4)
      const condition = OR(a, b, c, d)
      const fragment = OR(a, c)

      const result = subtractCondition(condition, fragment)

      expect(result).toEqual(OR(b, d))
    })

    it("OR(A, B, C) - OR(A, B, C) = undefined (complete removal)", () => {
      const a = COMP(1)
      const b = COMP(2)
      const c = COMP(3)
      const condition = OR(a, b, c)
      const fragment = OR(a, b, c)

      const result = subtractCondition(condition, fragment)

      expect(result).toBeUndefined()
    })

    it("OR(A, B, C) - OR(A, B) = C (unwrap single remainder)", () => {
      const a = COMP(1)
      const b = COMP(2)
      const c = COMP(3)
      const condition = OR(a, b, c)
      const fragment = OR(a, b)

      const result = subtractCondition(condition, fragment)

      expect(result).toEqual(c)
    })

    it("OR(A, B, C) - OR(A, D) = OR(A, B, C) (partial match, unchanged)", () => {
      const a = COMP(1)
      const b = COMP(2)
      const c = COMP(3)
      const d = COMP(4)
      const condition = OR(a, b, c)
      const fragment = OR(a, d) // D not in original

      const result = subtractCondition(condition, fragment)

      expect(result).toEqual(condition)
    })

    it("OR(A, B, C) - OR() = OR(A, B, C) (empty fragment, unchanged)", () => {
      const a = COMP(1)
      const b = COMP(2)
      const c = COMP(3)
      const condition = OR(a, b, c)
      const fragment = OR()

      const result = subtractCondition(condition, fragment)

      expect(result).toEqual(condition)
    })

    it("handles different order: OR(A, B, C) - OR(C, A) = B", () => {
      const a = COMP(1)
      const b = COMP(2)
      const c = COMP(3)
      const condition = OR(a, b, c)
      const fragment = OR(c, a) // Different order

      const result = subtractCondition(condition, fragment)

      expect(result).toEqual(b)
    })
  })

  describe("AND subtraction", () => {
    it("AND(A, B) - AND(A, B) = undefined (exact match)", () => {
      const a = COMP(1)
      const b = COMP(2)
      const condition = AND(a, b)

      const result = subtractCondition(condition, condition)

      expect(result).toBeUndefined()
    })

    it("AND(A, B, C) - B = AND(A, B, C) (cannot subtract single part)", () => {
      const a = COMP(1)
      const b = COMP(2)
      const c = COMP(3)
      const condition = AND(a, b, c)

      const result = subtractCondition(condition, b)

      expect(result).toEqual(condition)
    })

    it("AND(A, OR(B, C)) - AND(A, B) = AND(A, C) (recursive subtraction)", () => {
      const a = COMP(1)
      const b = COMP(2)
      const c = COMP(3)
      const condition = AND(a, OR(b, c))
      const fragment = AND(a, b)

      const result = subtractCondition(condition, fragment)

      expect(result).toEqual(AND(a, c))
    })

    it("AND(OR(A, B), OR(C, D)) - AND(A, C) = unchanged (multiple position differences)", () => {
      const a = COMP(1)
      const b = COMP(2)
      const c = COMP(3)
      const d = COMP(4)
      const condition = AND(OR(a, b), OR(c, d))
      const fragment = AND(a, c)

      const result = subtractCondition(condition, fragment)

      expect(result).toEqual(condition)
    })

    it("AND(OR(A, B), X, Y) - AND(A, X, Y) = AND(B, X, Y) (single position difference)", () => {
      const a = COMP(1)
      const b = COMP(2)
      const x = COMP(10)
      const y = COMP(11)
      const condition = AND(OR(a, b), x, y)
      const fragment = AND(a, x, y)

      const result = subtractCondition(condition, fragment)

      expect(result).toEqual(AND(b, x, y))
    })

    it("AND(A, OR(B, C), D) - AND(A, OR(B, C), E) = unchanged (different non-OR position)", () => {
      const a = COMP(1)
      const b = COMP(2)
      const c = COMP(3)
      const d = COMP(4)
      const e = COMP(5)
      const condition = AND(a, OR(b, c), d)
      const fragment = AND(a, OR(b, c), e)

      const result = subtractCondition(condition, fragment)

      expect(result).toEqual(condition)
    })

    it("AND(A, B) - AND(C, D) = unchanged (completely different)", () => {
      const a = COMP(1)
      const b = COMP(2)
      const c = COMP(3)
      const d = COMP(4)
      const condition = AND(a, b)
      const fragment = AND(c, d)

      const result = subtractCondition(condition, fragment)

      expect(result).toEqual(condition)
    })

    it("AND(A, B, C) - AND(A, B) = unchanged (different lengths)", () => {
      const a = COMP(1)
      const b = COMP(2)
      const c = COMP(3)
      const condition = AND(a, b, c)
      const fragment = AND(a, b)

      const result = subtractCondition(condition, fragment)

      expect(result).toEqual(condition)
    })

    it("nested AND with OR subtraction: AND(OR(A, B, C), D) - AND(OR(A, B), D) = AND(C, D)", () => {
      const a = COMP(1)
      const b = COMP(2)
      const c = COMP(3)
      const d = COMP(4)
      const condition = AND(OR(a, b, c), d)
      const fragment = AND(OR(a, b), d)

      const result = subtractCondition(condition, fragment)

      expect(result).toEqual(AND(c, d))
    })

    it("deeply nested AND: AND(AND(OR(A, B), C), D) - AND(AND(A, C), D) = AND(AND(B, C), D)", () => {
      const a = COMP(1)
      const b = COMP(2)
      const c = COMP(3)
      const d = COMP(4)
      const condition = AND(AND(OR(a, b), c), d)
      const fragment = AND(AND(a, c), d)

      const result = subtractCondition(condition, fragment)

      expect(result).toEqual(AND(AND(b, c), d))
    })
  })

  describe("MATCHES subtraction", () => {
    it("MATCHES(T, A, B) - MATCHES(T, A, B) = undefined (exact match)", () => {
      const condition = MATCHES(ParameterType.Calldata, COMP(1), COMP(2))

      const result = subtractCondition(condition, condition)

      expect(result).toBeUndefined()
    })

    it("MATCHES(T, A, B) - A = unchanged (cannot subtract from non-MATCHES)", () => {
      const condition = MATCHES(ParameterType.Calldata, COMP(1), COMP(2))
      const fragment = COMP(1)

      const result = subtractCondition(condition, fragment)

      expect(result).toEqual(condition)
    })

    it("MATCHES(T1, A, B) - MATCHES(T2, A, B) = unchanged (different param types)", () => {
      const condition = MATCHES(ParameterType.Calldata, COMP(1), COMP(2))
      const fragment = MATCHES(ParameterType.AbiEncoded, COMP(1), COMP(2))

      const result = subtractCondition(condition, fragment)

      expect(result).toEqual(condition)
      expect(result == condition).toBeTruthy()
    })

    it("MATCHES(T, A, B) - MATCHES(T, A) = unchanged (different lengths)", () => {
      const condition = MATCHES(ParameterType.Calldata, COMP(1), COMP(2))
      const fragment = MATCHES(ParameterType.Calldata, COMP(1))

      const result = subtractCondition(condition, fragment)

      expect(result).toEqual(condition)
    })

    it("MATCHES(T, OR(A, B), C) - MATCHES(T, A, C) = MATCHES(T, B, C) (single position OR)", () => {
      const a = COMP(1)
      const b = COMP(2)
      const c = COMP(3)
      const condition = MATCHES(ParameterType.Calldata, OR(a, b), c)
      const fragment = MATCHES(ParameterType.Calldata, a, c)

      const result = subtractCondition(condition, fragment)

      expect(result).toEqual(MATCHES(ParameterType.Calldata, b, c))
    })

    it("MATCHES(T, A, OR(B, C)) - MATCHES(T, A, B) = MATCHES(T, A, C) (last position OR)", () => {
      const a = COMP(1)
      const b = COMP(2)
      const c = COMP(3)
      const condition = MATCHES(ParameterType.Calldata, a, OR(b, c))
      const fragment = MATCHES(ParameterType.Calldata, a, b)

      const result = subtractCondition(condition, fragment)

      expect(result).toEqual(MATCHES(ParameterType.Calldata, a, c))
    })

    it("MATCHES(T, OR(A, B), OR(C, D)) - MATCHES(T, A, C) = unchanged (multiple position differences)", () => {
      const a = COMP(1)
      const b = COMP(2)
      const c = COMP(3)
      const d = COMP(4)
      const condition = MATCHES(ParameterType.Calldata, OR(a, b), OR(c, d))
      const fragment = MATCHES(ParameterType.Calldata, a, c)

      const result = subtractCondition(condition, fragment)

      expect(result).toEqual(condition)
    })

    it("MATCHES(T, OR(A, B, C), D) - MATCHES(T, OR(A, B), D) = MATCHES(T, C, D) (OR subtraction at position)", () => {
      const a = COMP(1)
      const b = COMP(2)
      const c = COMP(3)
      const d = COMP(4)
      const condition = MATCHES(ParameterType.Calldata, OR(a, b, c), d)
      const fragment = MATCHES(ParameterType.Calldata, OR(a, b), d)

      const result = subtractCondition(condition, fragment)

      expect(result).toEqual(MATCHES(ParameterType.Calldata, c, d))
    })

    it("MATCHES(T, A, B, C) - MATCHES(T, X, B, C) = unchanged (non-OR position difference)", () => {
      const a = COMP(1)
      const b = COMP(2)
      const c = COMP(3)
      const x = COMP(10)
      const condition = MATCHES(ParameterType.Calldata, a, b, c)
      const fragment = MATCHES(ParameterType.Calldata, x, b, c)

      const result = subtractCondition(condition, fragment)

      expect(result).toEqual(condition)
      expect(result === condition).toBeTruthy()
    })

    it("complex OR at multiple positions - only single hinge allowed", () => {
      const condition = MATCHES(
        ParameterType.Calldata,
        OR(COMP(1), COMP(2)),
        COMP(10),
        OR(COMP(3), COMP(4))
      )

      // Single hinge at position 0 - should work
      const fragment1 = MATCHES(
        ParameterType.Calldata,
        COMP(1),
        COMP(10),
        OR(COMP(3), COMP(4))
      )
      expect(subtractCondition(condition, fragment1)).toEqual(
        MATCHES(ParameterType.Calldata, COMP(2), COMP(10), OR(COMP(3), COMP(4)))
      )

      // Single hinge at position 2 - should work
      const fragment2 = MATCHES(
        ParameterType.Calldata,
        OR(COMP(1), COMP(2)),
        COMP(10),
        COMP(3)
      )
      expect(subtractCondition(condition, fragment2)).toEqual(
        MATCHES(ParameterType.Calldata, OR(COMP(1), COMP(2)), COMP(10), COMP(4))
      )

      // Multiple position differences - should not work
      const fragment3 = MATCHES(
        ParameterType.Calldata,
        COMP(1),
        COMP(10),
        COMP(3)
      )
      expect(subtractCondition(condition, fragment3)).toEqual(condition)
    })

    it("nested MATCHES within MATCHES positions", () => {
      const nestedA = MATCHES(ParameterType.Tuple, COMP(10), COMP(11))
      const nestedB = MATCHES(ParameterType.Tuple, COMP(10), COMP(12))
      const condition = MATCHES(
        ParameterType.Calldata,
        OR(nestedA, nestedB),
        COMP(20)
      )
      const fragment = MATCHES(ParameterType.Calldata, nestedA, COMP(20))

      const result = subtractCondition(condition, fragment)

      expect(result).toEqual(MATCHES(ParameterType.Calldata, nestedB, COMP(20)))
    })

    it("real-world ERC20 transfer scenario", () => {
      // transfer(address to, uint256 amount) with OR at recipient position
      const condition = MATCHES(
        ParameterType.Calldata,
        OR(
          {
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: "0xALICE",
          },
          {
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: "0xBOB",
          }
        ),
        { paramType: ParameterType.Static, operator: Operator.Pass }
      )

      const fragment = MATCHES(
        ParameterType.Calldata,
        {
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: "0xALICE",
        },
        { paramType: ParameterType.Static, operator: Operator.Pass }
      )

      const result = subtractCondition(condition, fragment)

      expect(result).toEqual(
        MATCHES(
          ParameterType.Calldata,
          {
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: "0xBOB",
          },
          { paramType: ParameterType.Static, operator: Operator.Pass }
        )
      )
    })
  })
})
