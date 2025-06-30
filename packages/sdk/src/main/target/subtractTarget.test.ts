import { describe, it, expect } from "vitest"
import {
  Clearance,
  Target,
  Function,
  ExecutionOptions,
  Operator,
  ParameterType,
} from "zodiac-roles-deployments"
import { subtractTarget } from "./subtractTarget"
import { abiEncode } from "../abiEncode"

describe("subtractTarget", () => {
  const ADDRESS = "0x1234567890123456789012345678901234567890"

  describe("Target-level clearance", () => {
    it("returns undefined when both targets are allowed with same execution options", () => {
      const left: Target = {
        address: ADDRESS,
        clearance: Clearance.Target,
        executionOptions: 0,
        functions: [],
      }
      const right: Target = {
        address: ADDRESS,
        clearance: Clearance.Target,
        executionOptions: 0,
        functions: [],
      }

      const result = subtractTarget(left, right)

      expect(result).toBeUndefined()
    })

    it("returns left when allowed targets have different execution options", () => {
      const left: Target = {
        address: ADDRESS,
        clearance: Clearance.Target,
        executionOptions: 1,
        functions: [],
      }
      const right: Target = {
        address: ADDRESS,
        clearance: Clearance.Target,
        executionOptions: 2,
        functions: [],
      }

      const result = subtractTarget(left, right)

      expect(result).toEqual(left)
    })

    it("returns left when left is allowed and right is scoped", () => {
      const left: Target = {
        address: ADDRESS,
        clearance: Clearance.Target,
        executionOptions: ExecutionOptions.None,
        functions: [],
      }
      const right: Target = {
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: ExecutionOptions.None,
        functions: [],
      }

      const result = subtractTarget(left, right)

      expect(result).toEqual(left)
    })

    it("returns undefined when left is scoped and right is allowed", () => {
      const func: Function = {
        selector: "0x12345678",
        wildcarded: true,
        executionOptions: 0,
      }
      const left: Target = {
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: ExecutionOptions.None,
        functions: [func],
      }
      const right: Target = {
        address: ADDRESS,
        clearance: Clearance.Target,
        executionOptions: 0,
        functions: [],
      }

      const result = subtractTarget(left, right)

      expect(result).toEqual(undefined)
    })
  })

  describe("Function-level subtraction behavior", () => {
    it("returns functions from left that are not in right", () => {
      const func1: Function = {
        selector: "0x11111111",
        wildcarded: true,
        executionOptions: 0,
      }
      const func2: Function = {
        selector: "0x22222222",
        wildcarded: true,
        executionOptions: 0,
      }

      const left: Target = {
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: 0,
        functions: [func1, func2],
      }
      const right: Target = {
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: 0,
        functions: [func1], // only has func1
      }

      const result = subtractTarget(left, right)

      expect(result).toEqual({
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: 0,
        functions: [func2], // only func2 remains
      })
    })

    it("does not return functions in right that are not in left", () => {
      const func1: Function = {
        selector: "0x11111111",
        wildcarded: true,
        executionOptions: 0,
      }
      const func2: Function = {
        selector: "0x22222222",
        wildcarded: true,
        executionOptions: 0,
      }

      const left: Target = {
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: 0,
        functions: [func1], // only has func1
      }
      const right: Target = {
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: 0,
        functions: [func1, func2], // has both
      }

      const result = subtractTarget(left, right)

      expect(result).toBeUndefined() // func1 is fully subtracted, nothing remains
    })

    it("returns the subtraction when both have the function", () => {
      const func1: Function = {
        selector: "0x11111111",
        wildcarded: false,
        condition: {
          paramType: ParameterType.None,
          operator: Operator.Or,
          children: [
            {
              paramType: ParameterType.Static,
              operator: Operator.EqualTo,
              compValue: abiEncode(["uint256"], [1]),
            },
            {
              paramType: ParameterType.Static,
              operator: Operator.EqualTo,
              compValue: abiEncode(["uint256"], [2]),
            },
          ],
        },
        executionOptions: 0,
      }
      const func1Right: Function = {
        selector: "0x11111111",
        wildcarded: false,
        condition: {
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: abiEncode(["uint256"], [1]),
        },
        executionOptions: 0,
      }

      const left: Target = {
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: 0,
        functions: [func1], // allows 1 OR 2
      }
      const right: Target = {
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: 0,
        functions: [func1Right], // allows only 1
      }

      const result = subtractTarget(left, right)

      expect(result).toEqual({
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: 0,
        functions: [
          {
            selector: "0x11111111",
            wildcarded: false,
            condition: {
              paramType: ParameterType.Static,
              operator: Operator.EqualTo,
              compValue: abiEncode(["uint256"], [2]),
            },
            executionOptions: 0,
          },
        ], // only allows 2 now
      })
    })
  })

  describe("Error cases", () => {
    it("throws when addresses don't match", () => {
      const left: Target = {
        address: ADDRESS,
        clearance: Clearance.Target,
        executionOptions: 0,
        functions: [],
      }
      const right: Target = {
        address: "0x9999999999999999999999999999999999999999",
        clearance: Clearance.Target,
        executionOptions: 0,
        functions: [],
      }

      expect(() => subtractTarget(left, right)).toThrow("Invariant")
    })

    it("throws when clearance is not Target or Function", () => {
      const left: Target = {
        address: ADDRESS,
        clearance: 99 as Clearance, // Invalid clearance
        executionOptions: 0,
        functions: [],
      }
      const right: Target = {
        address: ADDRESS,
        clearance: Clearance.Target,
        executionOptions: 0,
        functions: [],
      }

      expect(() => subtractTarget(left, right)).toThrow("Invariant")
    })
  })
})