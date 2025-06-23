import { expect, it, describe } from "vitest"
import { Condition, Operator, ParameterType } from "zodiac-roles-deployments"

import { abiEncode } from "../abiEncode"
import { maybeHoist } from "./maybeHoist"
import { FunctionPermissionCoerced, PermissionCoerced } from "./types"
import { conditionId, hoistCondition } from "../target/condition"
import { hoistTopOrs } from "../target/condition/hoistCondition"

const AddressOne = "0x0000000000000000000000000000000000000001"

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

const PASS = (): Condition => ({
  paramType: ParameterType.None,
  operator: Operator.Pass,
})

const MATCHES = (
  paramType: ParameterType,
  ...children: Condition[]
): Condition => ({
  paramType,
  operator: Operator.Matches,
  children,
})

describe("maybeHoist()", () => {
  describe("Basic behavior", () => {
    it("returns undefined when permission has no condition", () => {
      const permission: FunctionPermissionCoerced = {
        targetAddress: AddressOne,
        selector: "0x01",
      }

      const result = maybeHoist(permission)
      expect(result).toBeUndefined()
    })

    it("returns normalized condition when no probes provided", () => {
      const condition = COMP(1)
      const permission: FunctionPermissionCoerced = {
        targetAddress: AddressOne,
        selector: "0x01",
        condition: MATCHES(ParameterType.Calldata, COMP(1), PASS()),
      }

      const result = maybeHoist(permission)
      expect(conditionId(result!)).toEqual(
        conditionId(MATCHES(ParameterType.Calldata, COMP(1)))
      )
    })

    it("returns original condition when probes array is empty", () => {
      const condition = COMP(1)
      const permission: FunctionPermissionCoerced = {
        targetAddress: AddressOne,
        selector: "0x01",
        condition,
      }

      const result = maybeHoist(permission, [])
      expect(result).toStrictEqual(condition)
    })
  })

  describe("Hoisting logic", () => {
    it("chooses hoisted version when it includes more probes", () => {
      // Create a condition that benefits from hoisting
      const condition = MATCHES(
        ParameterType.Calldata,
        OR(COMP(1), COMP(2)),
        COMP(3)
      )

      const permission: FunctionPermissionCoerced = {
        targetAddress: AddressOne,
        selector: "0x01",
        condition,
      }

      // Create probes that would be included by individual branches after hoisting
      const probes: PermissionCoerced[] = [
        {
          targetAddress: AddressOne,
          selector: "0x01",
          condition: MATCHES(ParameterType.Calldata, COMP(1), COMP(3)),
        },
        {
          targetAddress: AddressOne,
          selector: "0x01",
          condition: MATCHES(ParameterType.Calldata, COMP(2), COMP(3)),
        },
      ]

      const result = maybeHoist(permission, probes)

      // Should return a hoisted condition (OR at the top level)
      expect(result).toBeDefined()
      expect(conditionId(result!)).toEqual(
        conditionId(hoistCondition(condition))
      )
    })

    it("keeps original condition when hoisting doesn't improve coverage", () => {
      const condition = COMP(1)
      const permission: FunctionPermissionCoerced = {
        targetAddress: AddressOne,
        selector: "0x01",
        condition,
      }

      // Probe that matches the original condition
      const probes: PermissionCoerced[] = [
        {
          targetAddress: AddressOne,
          selector: "0x01",
          condition: COMP(1),
        },
      ]

      const result = maybeHoist(permission, probes)
      expect(result).toEqual(condition)
    })

    it("choses hoisted Top ORs when it produces more matches", () => {
      const condition = MATCHES(
        ParameterType.Calldata,
        OR(COMP(1), COMP(2)),
        COMP(3),
        OR(COMP(4), COMP(5)),
        COMP(6)
      )
      const permission: FunctionPermissionCoerced = {
        targetAddress: AddressOne,
        selector: "0x01",
        condition,
      }

      // Probe that matches the original condition
      const probes: PermissionCoerced[] = [
        {
          targetAddress: AddressOne,
          selector: "0x01",
          condition: MATCHES(
            ParameterType.Calldata,
            COMP(1),
            COMP(3),
            OR(COMP(4), COMP(5)),
            COMP(6)
          ),
        },
      ]

      const result = maybeHoist(permission, probes)!

      expect(result).toEqual(hoistTopOrs(condition)[0])

      expect(hoistTopOrs(condition)).toHaveLength(2)
      expect(conditionId(result)).toEqual(
        conditionId(hoistTopOrs(condition)[0])
      )
      expect(conditionId(result)).not.toEqual(
        conditionId(hoistTopOrs(condition)[1])
      )
      expect(conditionId(result)).not.toEqual(
        conditionId(hoistCondition(condition))
      )
    })

    it("handles ties by keeping original condition", () => {
      const condition = OR(COMP(1), COMP(2))
      const permission: FunctionPermissionCoerced = {
        targetAddress: AddressOne,
        selector: "0x01",
        condition,
      }

      // Probes that would be covered equally by original and hoisted versions
      const probes: PermissionCoerced[] = [
        {
          targetAddress: AddressOne,
          selector: "0x01",
          condition: COMP(1),
        },
      ]

      const result = maybeHoist(permission, probes)
      expect(result).toEqual(condition)
    })
  })

  describe("Complex scenarios", () => {
    it("handles nested OR conditions in MATCHES", () => {
      // MATCHES(Calldata, OR(A, B), C) -> can hoist to OR(MATCHES(Calldata, A, C), MATCHES(Calldata, B, C))
      const condition = MATCHES(
        ParameterType.Calldata,
        OR(COMP(1), COMP(2)),
        COMP(3)
      )

      const permission: FunctionPermissionCoerced = {
        targetAddress: AddressOne,
        selector: "0x01",
        condition,
      }

      const probes: PermissionCoerced[] = [
        {
          targetAddress: AddressOne,
          selector: "0x01",
          condition: MATCHES(ParameterType.Calldata, COMP(1), COMP(3)),
        },
        {
          targetAddress: AddressOne,
          selector: "0x01",
          condition: MATCHES(ParameterType.Calldata, COMP(2), COMP(3)),
        },
        {
          targetAddress: AddressOne,
          selector: "0x01",
          condition: COMP(4), // This won't be included by any version
        },
      ]

      const result = maybeHoist(permission, probes)

      // Should choose hoisted version that includes more probes
      expect(result).toBeDefined()
      expect(result!.operator).toBe(Operator.Or)
    })

    it("handles multiple hoisting options and chooses the best", () => {
      // Complex condition with multiple OR nodes that could be hoisted
      const condition = MATCHES(
        ParameterType.Calldata,
        OR(COMP(1), COMP(2)),
        OR(COMP(3), COMP(4))
      )

      const permission: FunctionPermissionCoerced = {
        targetAddress: AddressOne,
        selector: "0x01",
        condition,
      }

      // Many probes that different hoisting strategies might include
      const probes: PermissionCoerced[] = [
        {
          targetAddress: AddressOne,
          selector: "0x01",
          condition: MATCHES(ParameterType.Calldata, COMP(1), COMP(3)),
        },
        {
          targetAddress: AddressOne,
          selector: "0x01",
          condition: MATCHES(ParameterType.Calldata, COMP(1), COMP(4)),
        },
        {
          targetAddress: AddressOne,
          selector: "0x01",
          condition: MATCHES(ParameterType.Calldata, COMP(2), COMP(3)),
        },
        {
          targetAddress: AddressOne,
          selector: "0x01",
          condition: MATCHES(ParameterType.Calldata, COMP(2), COMP(4)),
        },
      ]

      const result = maybeHoist(permission, probes)
      expect(result).toBeDefined()
    })

    it("considers execution flags in probe matching", () => {
      const condition = OR(COMP(1), COMP(2))
      const permission: FunctionPermissionCoerced = {
        targetAddress: AddressOne,
        selector: "0x01",
        condition,
        send: true,
      }

      const probes: PermissionCoerced[] = [
        {
          targetAddress: AddressOne,
          selector: "0x01",
          condition: COMP(1),
          send: true, // Matches execution flags
        },
        {
          targetAddress: AddressOne,
          selector: "0x01",
          condition: COMP(1),
          send: false, // Doesn't match execution flags
        },
      ]

      const result = maybeHoist(permission, probes)
      expect(result).toBeDefined()
    })

    it("handles different target addresses", () => {
      const condition = OR(COMP(1), COMP(2))
      const permission: FunctionPermissionCoerced = {
        targetAddress: AddressOne,
        selector: "0x01",
        condition,
      }

      const probes: PermissionCoerced[] = [
        {
          targetAddress: "0x0000000000000000000000000000000000000002", // Different address
          selector: "0x01",
          condition: COMP(1),
        },
      ]

      const result = maybeHoist(permission, probes)
      // Should keep original since probe doesn't match address
      expect(result).toEqual(condition)
    })
  })

  describe("Edge cases", () => {
    it("handles conditions with no hoisting opportunities", () => {
      const condition = AND(COMP(1), COMP(2)) // AND can't be hoisted like OR
      const permission: FunctionPermissionCoerced = {
        targetAddress: AddressOne,
        selector: "0x01",
        condition,
      }

      const probes: PermissionCoerced[] = [
        {
          targetAddress: AddressOne,
          selector: "0x01",
          condition: COMP(1),
        },
      ]

      const result = maybeHoist(permission, probes)
      expect(result).toEqual(condition)
    })

    it("handles deeply nested conditions", () => {
      const condition = MATCHES(
        ParameterType.Calldata,
        MATCHES(ParameterType.Tuple, OR(COMP(1), COMP(2))),
        COMP(3)
      )

      const permission: FunctionPermissionCoerced = {
        targetAddress: AddressOne,
        selector: "0x01",
        condition,
      }

      const probes: PermissionCoerced[] = [
        {
          targetAddress: AddressOne,
          selector: "0x01",
          condition: MATCHES(
            ParameterType.Calldata,
            MATCHES(ParameterType.Tuple, COMP(1)),
            COMP(3)
          ),
        },
      ]

      const result = maybeHoist(permission, probes)
      expect(result).toBeDefined()
    })
  })
})
