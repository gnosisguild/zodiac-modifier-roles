import { describe, it, expect } from "vitest"
import { Condition, Operator, ParameterType } from "zodiac-roles-deployments"

import { normalizeCondition } from "./normalize"
import { subtractCondition } from "./subtractCondition"
import { abiEncode } from "../abiEncode"

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
  describe("Core behavior", () => {
    describe("Exact match removal", () => {
      it("returns undefined when condition equals fragment", () => {
        const a = COMP(1)
        const result = subtractCondition(a, a)
        expect(result).toBeUndefined()
      })

      it("returns undefined for complex exact matches", () => {
        const condition = OR(COMP(1), AND(COMP(2), COMP(3)))
        const result = subtractCondition(condition, condition)
        expect(result).toBeUndefined()
      })
    })

    describe("No match cases", () => {
      it("returns original when fragment doesn't match", () => {
        const condition = COMP(1)
        const fragment = COMP(2)
        const result = subtractCondition(condition, fragment)
        expect(result).toEqual(condition)
        expect(result).toBe(condition) // Reference equality
      })

      it("returns original for incompatible operators", () => {
        const condition = AND(COMP(1), COMP(2))
        const fragment = OR(COMP(1), COMP(2))
        const result = subtractCondition(condition, fragment)
        expect(result).toEqual(condition)
      })
    })
  })

  describe("OR operator", () => {
    describe("Single item removal (n:1)", () => {
      it("OR(A, B, C) - B = OR(A, C)", () => {
        const a = COMP(1)
        const b = COMP(2)
        const c = COMP(3)
        const condition = OR(a, b, c)

        const result = subtractCondition(condition, b)

        expect(result).toEqual(OR(a, c))
      })

      it("OR(A, B) - B = A (unwraps single child)", () => {
        const a = COMP(1)
        const b = COMP(2)
        const condition = OR(a, b)

        const result = subtractCondition(condition, b)

        expect(result).toEqual(a)
      })

      it("OR(A) - A = undefined (complete removal)", () => {
        const a = COMP(1)
        const condition = OR(a)

        const result = subtractCondition(condition, a)

        expect(result).toBeUndefined()
      })

      it("OR(A, B) - C = OR(A, B) (no match)", () => {
        const a = COMP(1)
        const b = COMP(2)
        const c = COMP(3)
        const condition = OR(a, b)

        const result = subtractCondition(condition, c)

        expect(result).toEqual(condition)
        expect(result).toBe(condition) // Reference equality
      })
    })

    describe("Multiple item removal (n:m)", () => {
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

      it("OR(A, B, C) - OR(A, D) = OR(A, B, C) (partial match)", () => {
        const a = COMP(1)
        const b = COMP(2)
        const c = COMP(3)
        const d = COMP(4)
        const condition = OR(a, b, c)
        const fragment = OR(a, d) // D not in original

        const result = subtractCondition(condition, fragment)

        expect(result).toEqual(condition)
      })

      it("OR(A, B, C) - OR() = OR(A, B, C) (empty fragment)", () => {
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

    describe("Nested OR structures", () => {
      it("removes from nested OR: OR(A, OR(B, C), D) - B = OR(A, C, D)", () => {
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

      it("deeply nested ORs", () => {
        const condition = OR(COMP(1), OR(COMP(2), OR(COMP(3), COMP(4))))

        const result = subtractCondition(condition, COMP(3))

        expect(result).toEqual(OR(COMP(1), OR(COMP(2), COMP(4))))
      })

      it("handles complex nested structure", () => {
        const condition = OR(
          COMP(1),
          AND(COMP(2), COMP(3)),
          OR(COMP(4), COMP(5))
        )

        // Remove COMP(4)
        const result = subtractCondition(condition, COMP(4))

        expect(result).toEqual(OR(COMP(1), AND(COMP(2), COMP(3)), COMP(5)))
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

      it("removes all duplicate children from OR", () => {
        const a = COMP(1)
        const b = COMP(2)
        const condition = OR(a, b, a) // duplicate

        const result = subtractCondition(condition, a)

        expect(result).toEqual(b)
      })
    })

    describe("Pushed down OR (from normalization)", () => {
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
          ParameterType.Calldata,
          {
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue:
              "0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
          },
          {
            paramType: ParameterType.Static,
            operator: Operator.Pass,
          },
          {
            paramType: ParameterType.Static,
            operator: Operator.EqualToAvatar,
          }
        )

        expect(
          normalizeCondition(subtractCondition(condition, fragment)!)
        ).toEqual(
          MATCHES(
            ParameterType.Calldata,
            {
              paramType: ParameterType.Static,
              operator: Operator.EqualTo,
              compValue:
                "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            },
            {
              paramType: ParameterType.Static,
              operator: Operator.Pass,
            },
            {
              paramType: ParameterType.Static,
              operator: Operator.EqualToAvatar,
            }
          )
        )
      })
    })
  })

  describe("AND operator", () => {
    it("exact match returns undefined", () => {
      const condition = AND(COMP(1), COMP(2))
      const result = subtractCondition(condition, condition)
      expect(result).toBeUndefined()
    })

    it("cannot subtract single part", () => {
      const condition = AND(COMP(1), COMP(2), COMP(3))
      const result = subtractCondition(condition, COMP(2))
      expect(result).toEqual(condition)
    })

    it("recursive subtraction at hinge position", () => {
      const condition = AND(COMP(1), OR(COMP(2), COMP(3)))
      const fragment = AND(COMP(1), COMP(2))
      const result = subtractCondition(condition, fragment)
      expect(result).toEqual(AND(COMP(1), COMP(3)))
    })

    it("different lengths returns unchanged", () => {
      const condition = AND(COMP(1), COMP(2), COMP(3))
      const fragment = AND(COMP(1), COMP(2))
      const result = subtractCondition(condition, fragment)
      expect(result).toEqual(condition)
    })

    it("nested OR subtraction", () => {
      const condition = AND(OR(COMP(1), COMP(2), COMP(3)), COMP(4))
      const fragment = AND(OR(COMP(1), COMP(2)), COMP(4))
      const result = subtractCondition(condition, fragment)
      expect(result).toEqual(AND(COMP(3), COMP(4)))
    })

    it("deeply nested AND", () => {
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

  describe("MATCHES operator", () => {
    it("exact match returns undefined", () => {
      const condition = MATCHES(ParameterType.Calldata, COMP(1), COMP(2))
      const result = subtractCondition(condition, condition)
      expect(result).toBeUndefined()
    })

    it("cannot subtract from non-MATCHES", () => {
      const condition = MATCHES(ParameterType.Calldata, COMP(1), COMP(2))
      const fragment = COMP(1)

      const result = subtractCondition(condition, fragment)

      expect(result).toEqual(condition)
    })

    it("different param types returns unchanged", () => {
      const condition = MATCHES(ParameterType.Calldata, COMP(1), COMP(2))
      const fragment = MATCHES(ParameterType.AbiEncoded, COMP(1), COMP(2))
      const result = subtractCondition(condition, fragment)
      expect(result).toEqual(condition)
      expect(result).toBe(condition)
    })

    it("different lengths returns unchanged", () => {
      const condition = MATCHES(ParameterType.Calldata, COMP(1), COMP(2))
      const fragment = MATCHES(ParameterType.Calldata, COMP(1))

      const result = subtractCondition(condition, fragment)

      expect(result).toEqual(condition)
    })

    it("single position OR subtraction", () => {
      const condition = MATCHES(
        ParameterType.Calldata,
        OR(COMP(1), COMP(2)),
        COMP(3)
      )
      const fragment = MATCHES(ParameterType.Calldata, COMP(1), COMP(3))
      const result = subtractCondition(condition, fragment)
      expect(result).toEqual(MATCHES(ParameterType.Calldata, COMP(2), COMP(3)))
    })

    it("OR subtraction at different positions", () => {
      const a = COMP(1)
      const b = COMP(2)
      const c = COMP(3)

      // First position
      const condition1 = MATCHES(ParameterType.Calldata, OR(a, b), c)
      const fragment1 = MATCHES(ParameterType.Calldata, a, c)
      expect(subtractCondition(condition1, fragment1)).toEqual(
        MATCHES(ParameterType.Calldata, b, c)
      )

      // Last position
      const condition2 = MATCHES(ParameterType.Calldata, a, OR(b, c))
      const fragment2 = MATCHES(ParameterType.Calldata, a, b)
      expect(subtractCondition(condition2, fragment2)).toEqual(
        MATCHES(ParameterType.Calldata, a, c)
      )
    })

    it("complex OR at multiple positions", () => {
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

    it("nested MATCHES within positions", () => {
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

    it("real-world ERC20 transfer example", () => {
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

  describe("MISC", () => {
    describe("Single hinge principle", () => {
      it("AND and MATCHES follow identical subtraction rules", () => {
        const a = COMP(1)
        const b = COMP(2)
        const c = COMP(3)
        const d = COMP(4)

        // Test 1: Single hinge subtraction works the same
        const andCondition = AND(OR(a, b), c)
        const matchesCondition = MATCHES(ParameterType.Calldata, OR(a, b), c)

        const andResult = subtractCondition(andCondition, AND(a, c))
        const matchesResult = subtractCondition(
          matchesCondition,
          MATCHES(ParameterType.Calldata, a, c)
        )

        expect(andResult).toEqual(AND(b, c))
        expect(matchesResult).toEqual(MATCHES(ParameterType.Calldata, b, c))

        // Test 2: Multiple hinges rejected the same way
        const andMulti = AND(OR(a, b), OR(c, d))
        const matchesMulti = MATCHES(ParameterType.Calldata, OR(a, b), OR(c, d))

        const andMultiResult = subtractCondition(andMulti, AND(a, c))
        const matchesMultiResult = subtractCondition(
          matchesMulti,
          MATCHES(ParameterType.Calldata, a, c)
        )

        expect(andMultiResult).toEqual(andMulti) // unchanged
        expect(matchesMultiResult).toEqual(matchesMulti) // unchanged

        // Test 3: Exact match removal works the same
        expect(subtractCondition(andCondition, andCondition)).toBeUndefined()
        expect(
          subtractCondition(matchesCondition, matchesCondition)
        ).toBeUndefined()
      })

      it("requires exactly one position to differ", () => {
        // AND test
        const andCondition = AND(OR(COMP(1), COMP(2)), COMP(10), COMP(20))
        const andFragment = AND(COMP(1), COMP(10), COMP(20))
        expect(subtractCondition(andCondition, andFragment)).toEqual(
          AND(COMP(2), COMP(10), COMP(20))
        )

        // MATCHES test
        const matchesCondition = MATCHES(
          ParameterType.Calldata,
          OR(COMP(1), COMP(2)),
          COMP(10),
          COMP(20)
        )
        const matchesFragment = MATCHES(
          ParameterType.Calldata,
          COMP(1),
          COMP(10),
          COMP(20)
        )
        expect(subtractCondition(matchesCondition, matchesFragment)).toEqual(
          MATCHES(ParameterType.Calldata, COMP(2), COMP(10), COMP(20))
        )
      })

      it("rejects multiple position differences", () => {
        const condition = AND(OR(COMP(1), COMP(2)), OR(COMP(3), COMP(4)))
        const fragment = AND(COMP(1), COMP(3))

        const result = subtractCondition(condition, fragment)
        expect(result).toEqual(condition) // unchanged
      })

      it("subtraction only at differing position", () => {
        // Verify that subtraction happens only at the single differing position
        const condition = AND(COMP(1), OR(COMP(2), COMP(3), COMP(4)), COMP(5))

        // Remove one item from the OR at position 1
        const fragment = AND(COMP(1), COMP(2), COMP(5))
        const result = subtractCondition(condition, fragment)

        expect(result).toEqual(AND(COMP(1), OR(COMP(3), COMP(4)), COMP(5)))

        // Verify the OR was properly reduced but positions 0 and 2 unchanged
        expect(result?.children?.[0]).toEqual(COMP(1))
        expect(result?.children?.[2]).toEqual(COMP(5))
      })
    })

    describe("Edge cases", () => {
      it("handles subtraction failure at hinge position", () => {
        const condition = AND(COMP(1), AND(COMP(2), COMP(3)), COMP(4))
        const fragment = AND(
          COMP(1),
          COMP(2), // Can't subtract COMP(2) from AND(COMP(2), COMP(3))
          COMP(4)
        )
        const result = subtractCondition(condition, fragment)
        expect(result).toEqual(condition) // unchanged
      })

      it("handles undefined remainder at hinge position", () => {
        const condition = AND(
          COMP(1),
          OR(COMP(2)), // Single item OR
          COMP(3)
        )
        const fragment = AND(COMP(1), COMP(2), COMP(3))
        // This would make position 1 undefined, which is not allowed
        const result = subtractCondition(condition, fragment)
        expect(result).toEqual(condition) // unchanged
      })

      it("complex nested positional operators", () => {
        // AND containing MATCHES
        const condition1 = AND(
          MATCHES(ParameterType.Calldata, OR(COMP(1), COMP(2)), COMP(10)),
          COMP(20)
        )
        const fragment1 = AND(
          MATCHES(ParameterType.Calldata, COMP(1), COMP(10)),
          COMP(20)
        )
        expect(subtractCondition(condition1, fragment1)).toEqual(
          AND(MATCHES(ParameterType.Calldata, COMP(2), COMP(10)), COMP(20))
        )

        // MATCHES containing AND
        const condition2 = MATCHES(
          ParameterType.Calldata,
          AND(COMP(1), OR(COMP(2), COMP(3))),
          COMP(10)
        )
        const fragment2 = MATCHES(
          ParameterType.Calldata,
          AND(COMP(1), COMP(2)),
          COMP(10)
        )
        expect(subtractCondition(condition2, fragment2)).toEqual(
          MATCHES(ParameterType.Calldata, AND(COMP(1), COMP(3)), COMP(10))
        )
      })
    })

    it("OR with mixed operators", () => {
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

    it("multiple position differences rejected", () => {
      const condition = MATCHES(
        ParameterType.Calldata,
        OR(COMP(1), COMP(2)),
        OR(COMP(3), COMP(4))
      )

      const fragment = MATCHES(ParameterType.Calldata, COMP(2), COMP(4))

      const result = subtractCondition(condition, fragment)

      expect(result).toEqual(condition)
    })

    it("single hinge subtraction accepted", () => {
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
})
