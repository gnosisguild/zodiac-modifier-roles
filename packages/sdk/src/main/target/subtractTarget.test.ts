import { describe, it, expect } from "vitest"
import {
  Clearance,
  Target,
  Function,
  Operator,
  ParameterType,
  ExecutionOptions,
} from "zodiac-roles-deployments"
import { subtractTarget } from "./subtractTarget"
import { abiEncode } from "../abiEncode"

const COMP = (id: number) => ({
  paramType: ParameterType.Static,
  operator: Operator.EqualTo,
  compValue: abiEncode(["uint256"], [id]),
})

const OR = (...children: any[]) => ({
  paramType: ParameterType.None,
  operator: Operator.Or,
  children,
})

const MATCHES = (paramType: ParameterType, ...children: any[]) => ({
  paramType,
  operator: Operator.Matches,
  children,
})

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

  describe("Function-level clearance", () => {
    it("returns functions from left that are not in right", () => {
      const func1: Function = {
        selector: "0x123456",
        wildcarded: true,
        executionOptions: 0,
      }
      const func2: Function = {
        selector: "0xaabbcc",
        wildcarded: true,
        executionOptions: 0,
      }

      const left: Target = {
        address: "0x11",
        executionOptions: 0,
        clearance: Clearance.Function,
        functions: [func1, func2],
      }
      const right: Target = {
        address: "0x11",
        executionOptions: 0,
        clearance: Clearance.Function,
        functions: [func1],
      }

      const result = subtractTarget(left, right)

      expect(result).toEqual({
        address: "0x11",
        executionOptions: 0,
        clearance: Clearance.Function,
        functions: [func2],
      })
    })

    it("returns undefined when all functions are equal", () => {
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
        clearance: Clearance.Function,
        executionOptions: ExecutionOptions.None,
        functions: [func],
      }

      const result = subtractTarget(left, right)

      expect(result).toBeUndefined()
    })
  })

  describe("Wildcarded functions", () => {
    it("returns undefined when both wildcarded with same execution options", () => {
      const leftFunc: Function = {
        selector: "0x12345678",
        wildcarded: true,
        executionOptions: 0,
      }
      const rightFunc: Function = {
        selector: "0x12345678",
        wildcarded: true,
        executionOptions: 0,
      }

      const left: Target = {
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: ExecutionOptions.None,
        functions: [leftFunc],
      }
      const right: Target = {
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: ExecutionOptions.None,
        functions: [rightFunc],
      }

      const result = subtractTarget(left, right)

      expect(result).toBeUndefined()
    })

    it("returns left when wildcarded functions have different execution options", () => {
      const leftFunc: Function = {
        selector: "0x12345678",
        wildcarded: true,
        executionOptions: 1,
      }
      const rightFunc: Function = {
        selector: "0x12345678",
        wildcarded: true,
        executionOptions: 2,
      }

      const left: Target = {
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: 0,
        functions: [leftFunc],
      }
      const right: Target = {
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: 0,
        functions: [rightFunc],
      }

      const result = subtractTarget(left, right)

      expect(result).toEqual(left)
    })

    it("returns left when left is wildcarded and right is conditional", () => {
      const leftFunc: Function = {
        selector: "0x12345678",
        wildcarded: true,
        executionOptions: 0,
      }
      const rightFunc: Function = {
        selector: "0x12345678",
        wildcarded: false,
        condition: COMP(1),
        executionOptions: 0,
      }

      const left: Target = {
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: 0,
        functions: [leftFunc],
      }
      const right: Target = {
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: 0,
        functions: [rightFunc],
      }

      const result = subtractTarget(left, right)

      expect(result).toEqual(left)
    })

    it("returns undefined when left is conditional and right is wildcarded", () => {
      const leftFunc: Function = {
        selector: "0x12345678",
        wildcarded: false,
        condition: COMP(1),
        executionOptions: 0,
      }
      const rightFunc: Function = {
        selector: "0x12345678",
        wildcarded: true,
        executionOptions: 0,
      }

      const left: Target = {
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: 0,
        functions: [leftFunc],
      }
      const right: Target = {
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: 0,
        functions: [rightFunc],
      }

      const result = subtractTarget(left, right)

      expect(result).toBeUndefined()
    })
  })

  describe("Conditional functions", () => {
    it("subtracts conditions when both are conditional", () => {
      const leftFunc: Function = {
        selector: "0x12345678",
        wildcarded: false,
        condition: OR(COMP(1), COMP(2)),
        executionOptions: 0,
      }
      const rightFunc: Function = {
        selector: "0x12345678",
        wildcarded: false,
        condition: COMP(1),
        executionOptions: 0,
      }

      const left: Target = {
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: 0,
        functions: [leftFunc],
      }
      const right: Target = {
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: 0,
        functions: [rightFunc],
      }

      const result = subtractTarget(left, right)

      expect(result).toEqual({
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: 0,
        functions: [
          {
            selector: "0x12345678",
            wildcarded: false,
            condition: COMP(2),
            executionOptions: 0,
          },
        ],
      })
    })

    it("returns undefined when conditions are equal", () => {
      const condition = OR(COMP(1), COMP(2))
      const leftFunc: Function = {
        selector: "0x12345678",
        wildcarded: false,
        condition,
        executionOptions: 0,
      }
      const rightFunc: Function = {
        selector: "0x12345678",
        wildcarded: false,
        condition,
        executionOptions: 0,
      }

      const left: Target = {
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: 0,
        functions: [leftFunc],
      }
      const right: Target = {
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: 0,
        functions: [rightFunc],
      }

      const result = subtractTarget(left, right)

      expect(result).toBeUndefined()
    })

    it("returns left when conditional functions have different execution options", () => {
      const condition = COMP(1)
      const leftFunc: Function = {
        selector: "0x12345678",
        wildcarded: false,
        condition,
        executionOptions: 1,
      }
      const rightFunc: Function = {
        selector: "0x12345678",
        wildcarded: false,
        condition,
        executionOptions: 2,
      }

      const left: Target = {
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: 0,
        functions: [leftFunc],
      }
      const right: Target = {
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: 0,
        functions: [rightFunc],
      }

      const result = subtractTarget(left, right)

      expect(result).toEqual(left)
    })
  })

  describe("Complex scenarios", () => {
    it("handles multiple functions with mixed results", () => {
      const func1: Function = {
        selector: "0x11111111",
        wildcarded: true,
        executionOptions: 0,
      }
      const func2: Function = {
        selector: "0x22222222",
        wildcarded: false,
        condition: OR(COMP(1), COMP(2), COMP(3)),
        executionOptions: 0,
      }
      const func3: Function = {
        selector: "0x33333333",
        wildcarded: true,
        executionOptions: 0,
      }

      const rightFunc2: Function = {
        selector: "0x22222222",
        wildcarded: false,
        condition: OR(COMP(1), COMP(2)),
        executionOptions: 0,
      }

      const left: Target = {
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: 0,
        functions: [func1, func2, func3],
      }

      const right: Target = {
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: 0,
        functions: [func1, rightFunc2], // func1 equal, func2 partial, func3 missing
      }

      const result = subtractTarget(left, right)

      expect(result).toEqual({
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: 0,
        functions: [
          func1,
          {
            selector: "0x22222222",
            wildcarded: false,
            condition: COMP(3),
            executionOptions: 0,
          },
        ],
      })
    })

    it("handles ERC20 transfer scenario", () => {
      const alice = "0xbadbad"
      const bob = "0xbeefbeef"

      const transferToAlice: Function = {
        selector: "0xa9059cbb", // transfer
        wildcarded: false,
        executionOptions: 0,
        condition: MATCHES(
          ParameterType.Calldata,
          {
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: alice,
          },
          { paramType: ParameterType.Static, operator: Operator.Pass }
        ),
      }

      const transferToBob: Function = {
        selector: "0xa9059cbb", // transfer
        wildcarded: false,
        executionOptions: 0,
        condition: MATCHES(ParameterType.Calldata, {
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue: bob,
        }),
      }

      const transferToAliceOrBob: Function = {
        selector: "0xa9059cbb",
        wildcarded: false,
        condition: MATCHES(
          ParameterType.Calldata,
          OR(
            {
              paramType: ParameterType.Static,
              operator: Operator.EqualTo,
              compValue: alice,
            },
            {
              paramType: ParameterType.Static,
              operator: Operator.EqualTo,
              compValue: bob,
            }
          ),
          { paramType: ParameterType.Static, operator: Operator.Pass }
        ),
        executionOptions: 0,
      }

      const left: Target = {
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: 0,
        functions: [transferToAliceOrBob],
      }
      const right: Target = {
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: 0,
        functions: [transferToAlice],
      }

      const result = subtractTarget(left, right)

      expect(result).toEqual({
        address: ADDRESS,
        clearance: Clearance.Function,
        executionOptions: 0,
        functions: [transferToBob],
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
