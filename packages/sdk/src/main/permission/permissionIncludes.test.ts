import { expect, it, describe } from "vitest"
import { Condition, Operator, ParameterType } from "zodiac-roles-deployments"

import { abiEncode } from "../abiEncode"
import { permissionIncludes } from "./permissionIncludes"
import { PermissionCoerced } from "./types"

const AddressOne = "0x0000000000000000000000000000000000000001"
const AddressTwo = "0x0000000000000000000000000000000000000002"

const COMP = (id: number) => ({
  paramType: ParameterType.Static,
  operator: Operator.EqualTo,
  compValue: abiEncode(["uint256"], [id]),
})

describe("permissionIncludes()", () => {
  describe("Basic requirements", () => {
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
      it("p1 without send cannot include p2 with send", () => {
        expect(
          permissionIncludes(
            { targetAddress: AddressOne, send: false },
            { targetAddress: AddressOne, send: true }
          )
        ).toBe(false)

        expect(
          permissionIncludes(
            { targetAddress: AddressOne },
            { targetAddress: AddressOne, selector: "0x11223344", send: true }
          )
        ).toBe(false)

        expect(
          permissionIncludes(
            { targetAddress: AddressOne },
            {
              targetAddress: AddressOne,
              selector: "0x11223344",
              delegatecall: true,
            }
          )
        ).toBe(false)

        expect(
          permissionIncludes(
            { targetAddress: AddressOne },
            { targetAddress: AddressOne, selector: "0x11223344" }
          )
        ).toBe(true)
      })

      it("p1 with send includes p2 without send", () => {
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

      it("p1 without delegatecall cannot include p2 with delegatecall", () => {
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

      it("p1 with delegatecall includes p2 without delegatecall", () => {
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

      it("both flags work together", () => {
        expect(
          permissionIncludes(
            { targetAddress: AddressOne, send: true, delegatecall: true },
            { targetAddress: AddressOne, send: true }
          )
        ).toBe(true)

        expect(
          permissionIncludes(
            { targetAddress: AddressOne, send: true },
            { targetAddress: AddressOne, send: true, delegatecall: true }
          )
        ).toBe(false)
      })
    })
  })

  describe("Allowed permissions", () => {
    it("allowed includes allowed", () => {
      expect(
        permissionIncludes(
          { targetAddress: AddressOne },
          { targetAddress: AddressOne }
        )
      ).toBe(true)
    })

    it("allowed includes wildcard", () => {
      expect(
        permissionIncludes(
          { targetAddress: AddressOne },
          { targetAddress: AddressOne, selector: "0x01" }
        )
      ).toBe(true)
    })

    it("allowed includes conditional", () => {
      expect(
        permissionIncludes(
          { targetAddress: AddressOne },
          { targetAddress: AddressOne, selector: "0x01", condition: COMP(1) }
        )
      ).toBe(true)
    })

    it("wildcard does NOT include allowed", () => {
      expect(
        permissionIncludes(
          { targetAddress: AddressOne, selector: "0x01" },
          { targetAddress: AddressOne }
        )
      ).toBe(false)
    })

    it("conditional does NOT include allowed", () => {
      expect(
        permissionIncludes(
          { targetAddress: AddressOne, selector: "0x01", condition: COMP(1) },
          { targetAddress: AddressOne }
        )
      ).toBe(false)
    })
  })

  describe("Wildcard permissions", () => {
    it("wildcard includes wildcard with same selector", () => {
      expect(
        permissionIncludes(
          { targetAddress: AddressOne, selector: "0x01" },
          { targetAddress: AddressOne, selector: "0x01" }
        )
      ).toBe(true)
    })

    it("wildcard does NOT include wildcard with different selector", () => {
      expect(
        permissionIncludes(
          { targetAddress: AddressOne, selector: "0x01" },
          { targetAddress: AddressOne, selector: "0x02" }
        )
      ).toBe(false)
    })

    it("wildcard includes conditional with same selector", () => {
      expect(
        permissionIncludes(
          { targetAddress: AddressOne, selector: "0x01" },
          { targetAddress: AddressOne, selector: "0x01", condition: COMP(1) }
        )
      ).toBe(true)
    })

    it("wildcard does NOT include conditional with different selector", () => {
      expect(
        permissionIncludes(
          { targetAddress: AddressOne, selector: "0x01" },
          { targetAddress: AddressOne, selector: "0x02", condition: COMP(1) }
        )
      ).toBe(false)
    })

    it("conditional does NOT include wildcard", () => {
      expect(
        permissionIncludes(
          { targetAddress: AddressOne, selector: "0x01", condition: COMP(1) },
          { targetAddress: AddressOne, selector: "0x01" }
        )
      ).toBe(false)
    })
  })

  describe("Conditional permissions", () => {
    it("conditional includes identical conditional", () => {
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

    it("conditional does NOT include different conditional", () => {
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

    it("conditional does NOT include conditional with different selector", () => {
      expect(
        permissionIncludes(
          {
            targetAddress: AddressOne,
            selector: "0x01",
            condition: COMP(1),
          },
          {
            targetAddress: AddressOne,
            selector: "0x02",
            condition: COMP(1),
          }
        )
      ).toBe(false)
    })

    it("conditions are normalized before comparison", () => {
      // Test that equivalent but differently structured conditions are considered equal
      const condition1: Condition = {
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
        children: [
          COMP(2),
          COMP(1),
          {
            compValue: "0x",
            paramType: ParameterType.Static,
            operator: Operator.Pass,
          },
        ],
      }

      const condition2: Condition = {
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        children: [COMP(2), COMP(1)],
      }

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

  describe("Edge cases", () => {
    it("handles missing/undefined conditions as wildcard", () => {
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

    it("handles case sensitivity in addresses", () => {
      expect(
        permissionIncludes(
          { targetAddress: AddressOne.toUpperCase() as any },
          { targetAddress: AddressOne.toLowerCase() as any }
        )
      ).toBe(true)
    })

    it("validates execution flag combinations", () => {
      // Complex execution flag scenarios
      expect(
        permissionIncludes(
          { targetAddress: AddressOne, send: true, delegatecall: true },
          { targetAddress: AddressOne, send: false, delegatecall: false }
        )
      ).toBe(true)

      expect(
        permissionIncludes(
          { targetAddress: AddressOne, send: false, delegatecall: false },
          { targetAddress: AddressOne, send: true, delegatecall: true }
        )
      ).toBe(false)
    })
  })

  describe("Permission type matrix", () => {
    const matrix = [
      // [p1_type, p2_type, expected]
      ["allowed", "allowed", true],
      ["allowed", "wildcard", true],
      ["allowed", "conditional", true],
      ["wildcard", "allowed", false],
      ["wildcard", "wildcard", true], // same selector
      ["wildcard", "conditional", true], // same selector
      ["conditional", "allowed", false],
      ["conditional", "wildcard", false],
      ["conditional", "conditional", true], // same condition
    ]

    matrix.forEach(([p1Type, p2Type, expected]) => {
      it(`${p1Type} includes ${p2Type}: ${expected}`, () => {
        const p1 = createPermission(p1Type as any) as PermissionCoerced
        const p2 = createPermission(p2Type as any) as PermissionCoerced

        expect(permissionIncludes(p1, p2)).toBe(expected)
      })
    })

    function createPermission(type: "allowed" | "wildcard" | "conditional") {
      const base = { targetAddress: AddressOne }

      switch (type) {
        case "allowed":
          return base
        case "wildcard":
          return { ...base, selector: "0x01" }
        case "conditional":
          return { ...base, selector: "0x01", condition: COMP(1) }
      }
    }
  })
})
