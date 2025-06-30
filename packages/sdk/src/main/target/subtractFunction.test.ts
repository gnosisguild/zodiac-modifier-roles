import { describe, it, expect } from "vitest"
import { Function, Operator, ParameterType } from "zodiac-roles-deployments"
import { subtractFunction } from "./subtractFunction"
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

describe("subtractFunction", () => {
  describe("Wildcarded functions", () => {
    it("returns undefined when both wildcarded with same execution options", () => {
      const left: Function = {
        selector: "0x12345678",
        wildcarded: true,
        executionOptions: 0,
      }
      const right: Function = {
        selector: "0x12345678",
        wildcarded: true,
        executionOptions: 0,
      }

      const result = subtractFunction(left, right)

      expect(result).toBeUndefined()
    })

    it("returns left when wildcarded functions have different execution options", () => {
      const left: Function = {
        selector: "0x12345678",
        wildcarded: true,
        executionOptions: 1,
      }
      const right: Function = {
        selector: "0x12345678",
        wildcarded: true,
        executionOptions: 2,
      }

      const result = subtractFunction(left, right)

      expect(result).toEqual(left)
    })

    it("returns left when left is wildcarded and right is conditional", () => {
      const left: Function = {
        selector: "0x12345678",
        wildcarded: true,
        executionOptions: 0,
      }
      const right: Function = {
        selector: "0x12345678",
        wildcarded: false,
        condition: COMP(1),
        executionOptions: 0,
      }

      const result = subtractFunction(left, right)

      expect(result).toEqual(left)
    })

    it("returns undefined when left is conditional and right is wildcarded", () => {
      const left: Function = {
        selector: "0x12345678",
        wildcarded: false,
        condition: COMP(1),
        executionOptions: 0,
      }
      const right: Function = {
        selector: "0x12345678",
        wildcarded: true,
        executionOptions: 0,
      }

      const result = subtractFunction(left, right)

      expect(result).toBeUndefined()
    })
  })

  describe("Conditional functions", () => {
    it("subtracts conditions when both are conditional", () => {
      const left: Function = {
        selector: "0x12345678",
        wildcarded: false,
        condition: OR(COMP(1), COMP(2)),
        executionOptions: 0,
      }
      const right: Function = {
        selector: "0x12345678",
        wildcarded: false,
        condition: COMP(1),
        executionOptions: 0,
      }

      const result = subtractFunction(left, right)

      expect(result).toEqual({
        selector: "0x12345678",
        wildcarded: false,
        condition: COMP(2),
        executionOptions: 0,
      })
    })

    it("returns undefined when conditions are equal", () => {
      const condition = OR(COMP(1), COMP(2))
      const left: Function = {
        selector: "0x12345678",
        wildcarded: false,
        condition,
        executionOptions: 0,
      }
      const right: Function = {
        selector: "0x12345678",
        wildcarded: false,
        condition,
        executionOptions: 0,
      }

      const result = subtractFunction(left, right)

      expect(result).toBeUndefined()
    })

    it("returns left when conditional functions have different execution options", () => {
      const condition = COMP(1)
      const left: Function = {
        selector: "0x12345678",
        wildcarded: false,
        condition,
        executionOptions: 1,
      }
      const right: Function = {
        selector: "0x12345678",
        wildcarded: false,
        condition,
        executionOptions: 2,
      }

      const result = subtractFunction(left, right)

      expect(result).toEqual(left)
    })
  })

  describe("Execution options", () => {
    it("returns left when execution options differ (wildcarded)", () => {
      const left: Function = {
        selector: "0x12345678",
        wildcarded: true,
        executionOptions: 1, // Send
      }
      const right: Function = {
        selector: "0x12345678",
        wildcarded: true,
        executionOptions: 2, // DelegateCall
      }

      const result = subtractFunction(left, right)

      expect(result).toEqual(left)
    })

    it("returns left when execution options differ (conditional)", () => {
      const condition = COMP(1)
      const left: Function = {
        selector: "0x12345678",
        wildcarded: false,
        condition,
        executionOptions: 3, // Both
      }
      const right: Function = {
        selector: "0x12345678",
        wildcarded: false,
        condition,
        executionOptions: 1, // Send
      }

      const result = subtractFunction(left, right)

      expect(result).toEqual(left)
    })
  })

  describe("Condition subtraction", () => {
    it("Subtracts right from left", () => {
      const left: Function = {
        selector: "0x12345678",
        wildcarded: false,
        condition: OR(COMP(1), OR(COMP(2), COMP(3))),
        executionOptions: 0,
      }
      const right: Function = {
        selector: "0x12345678",
        wildcarded: false,
        condition: COMP(2),
        executionOptions: 0,
      }

      const result = subtractFunction(left, right)

      expect(result).toEqual({
        selector: "0x12345678",
        wildcarded: false,
        condition: OR(COMP(1), COMP(3)),
        executionOptions: 0,
      })
    })
  })

  describe("Error cases", () => {
    it("throws when selectors don't match", () => {
      const left: Function = {
        selector: "0x11111111",
        wildcarded: true,
        executionOptions: 0,
      }
      const right: Function = {
        selector: "0x22222222",
        wildcarded: true,
        executionOptions: 0,
      }

      expect(() => subtractFunction(left, right)).toThrow("Invariant")
    })
  })
})
