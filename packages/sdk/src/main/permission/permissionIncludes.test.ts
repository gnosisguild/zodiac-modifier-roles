import { expect, it, suite, describe } from "vitest"
import { Operator, ParameterType } from "zodiac-roles-deployments"

import { abiEncode } from "../abiEncode"
import { permissionIncludes } from "./permissionIncludes"

const AddressOne = "0x0000000000000000000000000000000000000001"
const AddressTwo = "0x0000000000000000000000000000000000000002"

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

const AND = (...children: any[]) => ({
  paramType: ParameterType.None,
  operator: Operator.And,
  children,
})

const MATCHES = (paramType: ParameterType, ...children: any[]) => ({
  paramType,
  operator: Operator.Matches,
  children,
})

suite("permissionIncludes()", () => {
  describe("Address matching", () => {
    it("same address returns true", () => {
      expect(
        permissionIncludes(
          { targetAddress: AddressOne },
          { targetAddress: AddressOne }
        )
      ).toBe(true)
    })

    it("different addresses return false", () => {
      expect(
        permissionIncludes(
          { targetAddress: AddressOne },
          { targetAddress: AddressTwo }
        )
      ).toBe(false)
    })
  })

  describe("Execution flags", () => {
    it("send: false or undefined are equivalent", () => {
      expect(
        permissionIncludes(
          { targetAddress: AddressOne },
          { targetAddress: AddressOne, send: false }
        )
      ).toBe(true)

      expect(
        permissionIncludes(
          { targetAddress: AddressOne, send: false },
          { targetAddress: AddressOne }
        )
      ).toBe(true)
    })

    it("send: p1 without send cannot include p2 with send", () => {
      expect(
        permissionIncludes(
          { targetAddress: AddressOne },
          { targetAddress: AddressOne, send: true }
        )
      ).toBe(false)

      expect(
        permissionIncludes(
          { targetAddress: AddressOne, send: false },
          { targetAddress: AddressOne, send: true }
        )
      ).toBe(false)
    })

    it("send: p1 with send includes p2 without send", () => {
      expect(
        permissionIncludes(
          { targetAddress: AddressOne, send: true },
          { targetAddress: AddressOne }
        )
      ).toBe(true)

      expect(
        permissionIncludes(
          { targetAddress: AddressOne, send: true },
          { targetAddress: AddressOne, send: false }
        )
      ).toBe(true)
    })

    it("delegatecall: false or undefined are equivalent", () => {
      expect(
        permissionIncludes(
          { targetAddress: AddressOne },
          { targetAddress: AddressOne, delegatecall: false }
        )
      ).toBe(true)

      expect(
        permissionIncludes(
          { targetAddress: AddressOne, delegatecall: false },
          { targetAddress: AddressOne }
        )
      ).toBe(true)
    })

    it("delegatecall: p1 without delegatecall cannot include p2 with delegatecall", () => {
      expect(
        permissionIncludes(
          { targetAddress: AddressOne },
          { targetAddress: AddressOne, delegatecall: true }
        )
      ).toBe(false)

      expect(
        permissionIncludes(
          { targetAddress: AddressOne, delegatecall: false },
          { targetAddress: AddressOne, delegatecall: true }
        )
      ).toBe(false)
    })

    it("delegatecall: p1 with delegatecall includes p2 without delegatecall", () => {
      expect(
        permissionIncludes(
          { targetAddress: AddressOne, delegatecall: true },
          { targetAddress: AddressOne }
        )
      ).toBe(true)

      expect(
        permissionIncludes(
          { targetAddress: AddressOne, delegatecall: true },
          { targetAddress: AddressOne, delegatecall: false }
        )
      ).toBe(true)
    })
  })

  describe("Selector matching", () => {
    it("same selector returns true", () => {
      expect(
        permissionIncludes(
          { targetAddress: AddressOne, selector: "0x01" },
          { targetAddress: AddressOne, selector: "0x01" }
        )
      ).toBe(true)
    })

    it("different selectors return false", () => {
      expect(
        permissionIncludes(
          { targetAddress: AddressOne, selector: "0x01" },
          { targetAddress: AddressOne, selector: "0x02" }
        )
      ).toBe(false)
    })

    it("wildcard p1 (no selector) should include specific p2 (with selector)", () => {
      // This tests the core wildcard logic - currently FAILS
      expect(
        permissionIncludes(
          { targetAddress: AddressOne }, // Wildcard permission
          { targetAddress: AddressOne, selector: "0x01" } // Specific function
        )
      ).toBe(false)
    })

    it("specific p1 (with selector) should NOT include wildcard p2 (no selector)", () => {
      expect(
        permissionIncludes(
          { targetAddress: AddressOne, selector: "0x01" }, // Specific function
          { targetAddress: AddressOne } // Wildcard permission
        )
      ).toBe(false)
    })

    it("wildcard permissions should include each other", () => {
      expect(
        permissionIncludes(
          { targetAddress: AddressOne }, // Wildcard
          { targetAddress: AddressOne } // Wildcard
        )
      ).toBe(true)
    })
  })

  describe("Condition matching", () => {
    it("missing or undefined conditions are equivalent", () => {
      expect(
        permissionIncludes(
          { targetAddress: AddressOne, selector: "0x01", condition: undefined },
          { targetAddress: AddressOne, selector: "0x01" }
        )
      ).toBe(true)

      expect(
        permissionIncludes(
          { targetAddress: AddressOne, selector: "0x01" },
          { targetAddress: AddressOne, selector: "0x01", condition: undefined }
        )
      ).toBe(true)
    })

    it("condition: p1 without condition cannot include p2 with condition", () => {
      expect(
        permissionIncludes(
          { targetAddress: AddressOne, selector: "0x01" },
          { targetAddress: AddressOne, selector: "0x01", condition: COMP(1) }
        )
      ).toBe(false)
    })

    it("condition: p1 with condition includes p2 without condition", () => {
      expect(
        permissionIncludes(
          { targetAddress: AddressOne, selector: "0x01", condition: COMP(1) },
          { targetAddress: AddressOne, selector: "0x01" }
        )
      ).toBe(false)
    })

    it("identical conditions are equal", () => {
      expect(
        permissionIncludes(
          {
            targetAddress: AddressOne,
            selector: "0x01",
            condition: COMP(1),
          },
          {
            targetAddress: AddressOne,
            selector: "0x01",
            condition: COMP(1),
          }
        )
      ).toBe(true)
    })

    it("different conditions are not equal", () => {
      expect(
        permissionIncludes(
          {
            targetAddress: AddressOne,
            selector: "0x01",
            condition: COMP(1),
          },
          {
            targetAddress: AddressOne,
            selector: "0x01",
            condition: COMP(2),
          }
        )
      ).toBe(false)
    })
  })

  describe("Complex condition inclusion", () => {
    it("OR condition includes individual branches", () => {
      // OR(A, B) should include A
      expect(
        permissionIncludes(
          {
            targetAddress: AddressOne,
            selector: "0x01",
            condition: OR(COMP(1), COMP(2)),
          },
          {
            targetAddress: AddressOne,
            selector: "0x01",
            condition: COMP(1),
          }
        )
      ).toBe(true)

      // OR(A, B) should include B
      expect(
        permissionIncludes(
          {
            targetAddress: AddressOne,
            selector: "0x01",
            condition: OR(COMP(1), COMP(2)),
          },
          {
            targetAddress: AddressOne,
            selector: "0x01",
            condition: COMP(2),
          }
        )
      ).toBe(true)

      // OR(A, B) should NOT include C
      expect(
        permissionIncludes(
          {
            targetAddress: AddressOne,
            selector: "0x01",
            condition: OR(COMP(1), COMP(2)),
          },
          {
            targetAddress: AddressOne,
            selector: "0x01",
            condition: COMP(3),
          }
        )
      ).toBe(false)
    })

    it("hoisted conditions from MATCHES", () => {
      // MATCHES(Calldata, OR(A, B), C) gets hoisted to OR(MATCHES(Calldata, A, C), MATCHES(Calldata, B, C))
      // This should include MATCHES(Calldata, A, C)
      const complexCondition = MATCHES(
        ParameterType.Calldata,
        OR(COMP(1), COMP(2)),
        COMP(3)
      )

      const simpleCondition = MATCHES(ParameterType.Calldata, COMP(1), COMP(3))

      expect(
        permissionIncludes(
          {
            targetAddress: AddressOne,
            selector: "0x01",
            condition: complexCondition,
          },
          {
            targetAddress: AddressOne,
            selector: "0x01",
            condition: simpleCondition,
          }
        )
      ).toBe(true)
    })

    it("real-world scenario", () => {
      // Permission for transfer function with amount OR recipient restrictions
      const broadCondition = OR(
        MATCHES(ParameterType.Calldata, COMP(1), COMP(100)), // amount <= 100
        MATCHES(ParameterType.Calldata, COMP(2), COMP(200)) // recipient == specific address
      )

      const specificCondition = MATCHES(
        ParameterType.Calldata,
        COMP(1),
        COMP(100)
      )

      expect(
        permissionIncludes(
          {
            targetAddress: AddressOne,
            selector: "0xa9059cbb",
            condition: broadCondition,
          },
          {
            targetAddress: AddressOne,
            selector: "0xa9059cbb",
            condition: specificCondition,
          }
        )
      ).toBe(true)
    })
  })

  describe("Edge cases and error handling", () => {
    it("handles null conditions gracefully", () => {
      expect(
        permissionIncludes(
          {
            targetAddress: AddressOne,
            selector: "0x01",
            condition: null as any,
          },
          { targetAddress: AddressOne, selector: "0x01" }
        )
      ).toBe(true)
    })

    it("handles empty OR conditions", () => {
      const emptyOr = OR() // No children

      expect(
        permissionIncludes(
          {
            targetAddress: AddressOne,
            selector: "0x01",
            condition: emptyOr,
          },
          {
            targetAddress: AddressOne,
            selector: "0x01",
            condition: COMP(1),
          }
        )
      ).toBe(false)
    })

    it("handles circular-like structures", () => {
      const condition1 = OR(COMP(1), COMP(2))
      const condition2 = OR(COMP(2), COMP(1)) // Same but different order

      expect(
        permissionIncludes(
          {
            targetAddress: AddressOne,
            selector: "0x01",
            condition: condition1,
          },
          {
            targetAddress: AddressOne,
            selector: "0x01",
            condition: condition2,
          }
        )
      ).toBe(true)
    })
  })

  describe("Integration with wildcards and complex scenarios", () => {
    it("wildcard with execution flags should include specific function with same flags", () => {
      expect(
        permissionIncludes(
          { targetAddress: AddressOne, send: true, delegatecall: true }, // Wildcard with flags
          { targetAddress: AddressOne, selector: "0x01", send: true } // Specific function
        )
      ).toBe(false)
    })

    it("wildcard with fewer privileges cannot include specific function with more privileges", () => {
      expect(
        permissionIncludes(
          { targetAddress: AddressOne, send: true }, // Wildcard with only send
          { targetAddress: AddressOne, selector: "0x01", delegatecall: true } // Specific function needs delegatecall
        )
      ).toBe(false)
    })
  })
})
