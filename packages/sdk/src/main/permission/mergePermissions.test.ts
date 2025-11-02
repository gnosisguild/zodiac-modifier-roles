import { describe, expect, it, suite } from "vitest"
import { AbiType, Operator } from "zodiac-roles-deployments"

import { abiEncode } from "../abiEncode"
import { mergePermissions } from "./mergePermissions"
import {
  isPermissionAllowed,
  isPermissionConditional,
  isPermissionWildcarded,
} from "./id"

import { Permission } from "./types"

const DUMMY_COMP = (id: number) => ({
  paramType: AbiType.Static,
  operator: Operator.Custom,
  compValue: abiEncode(["uint256"], [id]),
})

suite("mergePermissions()", () => {
  /*
   * nomenclature for these tests:
   * allowed     -> Clearance.Target, i.e., target fully allowed
   * wildcarded  -> Clearance.Function AND wildcarded == true AND condition == undefined
   * conditional -> Clearance.Function AND wildcarded == false AND condition == defined
   */

  const AddressOne = "0x0000000000000000000000000000000000000001"
  const AddressTwo = "0x0000000000000000000000000000000000000002"

  describe("Allowed + Allowed", () => {
    it("does not merge distinct entries", () => {
      const { permissions, violations, warnings } = mergePermissions([
        { targetAddress: AddressOne },
        { targetAddress: AddressTwo },
      ])
      expect(permissions).to.deep.equal([
        { targetAddress: AddressOne },
        { targetAddress: AddressTwo },
      ])
      expect(violations).toHaveLength(0)
      expect(warnings).toHaveLength(0)
    })
    it("filters out duplicate", () => {
      const { permissions, violations, warnings } = mergePermissions([
        { targetAddress: AddressOne },
        { targetAddress: AddressOne },
      ])

      expect(permissions).to.deep.equal([{ targetAddress: AddressOne }])
      expect(violations).toHaveLength(0)
      expect(warnings).toHaveLength(0)
    })
    it("flags violation when matching with different ExecutionOptions", () => {
      const { permissions, violations, warnings } = mergePermissions([
        { targetAddress: AddressOne, send: true },
        { targetAddress: AddressOne, delegatecall: true },
      ])
      expect(permissions).toHaveLength(0)
      expect(warnings).toHaveLength(0)
      expect(violations).toHaveLength(1)
    })
  })

  describe("Allowed + Wildcarded", () => {
    it("does not merge distinct entries", () => {
      const allowed: Permission = { targetAddress: AddressOne }
      const wildcarded: Permission = {
        targetAddress: AddressTwo,
        selector: "0x1",
      }

      expect(isPermissionAllowed(allowed)).to.be.true
      expect(isPermissionWildcarded(wildcarded)).to.be.true

      const { permissions, violations, warnings } = mergePermissions([
        allowed,
        wildcarded,
      ])

      expect(permissions).to.deep.equal([allowed, wildcarded])

      expect(permissions).toHaveLength(2)
      expect(warnings).toHaveLength(0)
      expect(violations).toHaveLength(0)
    })
    it("merges as Allowed with warning", () => {
      const { permissions, violations, warnings } = mergePermissions([
        { targetAddress: AddressOne },
        { targetAddress: AddressOne, selector: "0x1" },
      ])

      expect(permissions).to.deep.equal([{ targetAddress: AddressOne }])

      expect(permissions).toHaveLength(1)
      expect(warnings).toHaveLength(1)
      expect(violations).toHaveLength(0)
    })
    it("flags violation when matching with different ExecutionOptions", () => {
      const { permissions, violations, warnings } = mergePermissions([
        { targetAddress: AddressOne },
        { targetAddress: AddressOne, selector: "0x1", send: true },
      ])
      expect(permissions).toHaveLength(0)
      expect(warnings).toHaveLength(0)
      expect(violations).toHaveLength(1)
    })
  })

  describe("Allowed + Conditional", () => {
    it("does not merge distinct entries", () => {
      const allowed: Permission = { targetAddress: AddressOne }
      const conditional: Permission = {
        targetAddress: AddressTwo,
        selector: "0x1",
        condition: DUMMY_COMP(1),
      }

      expect(isPermissionAllowed(allowed)).to.be.true
      expect(isPermissionConditional(conditional)).to.be.true

      const { permissions, violations, warnings } = mergePermissions([
        allowed,
        conditional,
      ])

      expect(permissions).to.deep.equal([allowed, conditional])

      expect(permissions).toHaveLength(2)
      expect(warnings).toHaveLength(0)
      expect(violations).toHaveLength(0)
    })
    it("merges as Allowed with warning", () => {
      const { permissions, violations, warnings } = mergePermissions([
        {
          targetAddress: AddressOne,
          selector: "0x1",
          condition: DUMMY_COMP(1),
        },
        { targetAddress: AddressOne },
      ])
      expect(permissions).to.deep.equal([{ targetAddress: AddressOne }])
      expect(permissions).toHaveLength(1)
      expect(warnings).toHaveLength(1)
      expect(violations).toHaveLength(0)
    })
    it("flags violation when matching with different ExecutionOptions", () => {
      const { permissions, violations, warnings } = mergePermissions([
        {
          targetAddress: AddressOne,
          selector: "0x1",
          send: true,
          condition: DUMMY_COMP(1),
        },
        { targetAddress: AddressOne },
      ])

      expect(permissions).toHaveLength(0)
      expect(warnings).toHaveLength(0)
      expect(violations).toHaveLength(1)
    })
  })

  describe("Wilcarded + Wildcarded", () => {
    it("does not merge distinct entries", () => {
      const { permissions, violations, warnings } = mergePermissions([
        { targetAddress: AddressOne, selector: "0x1" },
        { targetAddress: AddressTwo, selector: "0x1" },
      ])
      expect(permissions).to.deep.equal([
        { targetAddress: AddressOne, selector: "0x1" },
        { targetAddress: AddressTwo, selector: "0x1" },
      ])
      expect(permissions).toHaveLength(2)
      expect(warnings).toHaveLength(0)
      expect(violations).toHaveLength(0)
    })
    it("filters out duplicate", () => {
      const { permissions, violations, warnings } = mergePermissions([
        { targetAddress: AddressOne, selector: "0x1" },
        { targetAddress: AddressOne, selector: "0x1" },
      ])
      expect(permissions).to.deep.equal([
        { targetAddress: AddressOne, selector: "0x1" },
      ])

      expect(permissions).toHaveLength(1)
      expect(warnings).toHaveLength(0)
      expect(violations).toHaveLength(0)
    })
    it("flags violation when matching with different ExecutionOptions", () => {
      const { permissions, violations, warnings } = mergePermissions([
        { targetAddress: AddressOne, selector: "0x1", send: true },
        { targetAddress: AddressOne, selector: "0x1", delegatecall: true },
      ])

      expect(permissions).toHaveLength(0)
      expect(warnings).toHaveLength(0)
      expect(violations).toHaveLength(1)
    })
  })

  describe("Wilcarded + Conditional", () => {
    it("does not merge distinct entries", () => {
      const { permissions, violations, warnings } = mergePermissions([
        { targetAddress: AddressOne, selector: "0x1" },
        {
          targetAddress: AddressTwo,
          selector: "0x2",
          condition: DUMMY_COMP(1),
        },
      ])
      expect(permissions).to.deep.equal([
        { targetAddress: AddressOne, selector: "0x1" },
        {
          targetAddress: AddressTwo,
          selector: "0x2",
          condition: DUMMY_COMP(1),
        },
      ])
      expect(permissions).toHaveLength(2)
      expect(warnings).toHaveLength(0)
      expect(violations).toHaveLength(0)
    })
    it("merges as Wildcarded with warning", () => {
      const { permissions, violations, warnings } = mergePermissions([
        { targetAddress: AddressOne, selector: "0x1" },
        {
          targetAddress: AddressOne,
          selector: "0x1",
          condition: DUMMY_COMP(1),
        },
      ])
      expect(permissions).to.deep.equal([
        { targetAddress: AddressOne, selector: "0x1" },
      ])
      expect(permissions).toHaveLength(1)
      expect(warnings).toHaveLength(1)
      expect(violations).toHaveLength(0)
    })
    it("flags violation when matching with different ExecutionOptions", () => {
      const { permissions, violations, warnings } = mergePermissions([
        { targetAddress: AddressOne, selector: "0x1", send: true },
        {
          targetAddress: AddressOne,
          selector: "0x1",
          condition: DUMMY_COMP(1),
          send: true,
          delegatecall: true,
        },
      ])

      expect(permissions).toHaveLength(0)
      expect(warnings).toHaveLength(0)
      expect(violations).toHaveLength(1)
    })
  })

  describe("Conditional + Conditional", () => {
    it("does not merge distinct entries", () => {
      {
        const { permissions, violations, warnings } = mergePermissions([
          {
            targetAddress: AddressOne,
            selector: "0x2",
            condition: DUMMY_COMP(1),
          },
          {
            targetAddress: AddressTwo,
            selector: "0x2",
            condition: DUMMY_COMP(2),
          },
        ])
        expect(permissions).to.deep.equal([
          {
            targetAddress: AddressOne,
            selector: "0x2",
            condition: DUMMY_COMP(1),
          },
          {
            targetAddress: AddressTwo,
            selector: "0x2",
            condition: DUMMY_COMP(2),
          },
        ])
        expect(permissions).toHaveLength(2)
        expect(warnings).toHaveLength(0)
        expect(violations).toHaveLength(0)
      }

      {
        const { permissions, violations, warnings } = mergePermissions([
          {
            targetAddress: AddressOne,
            selector: "0x2",
            condition: DUMMY_COMP(1),
          },
          {
            targetAddress: AddressOne,
            selector: "0x3",
            condition: DUMMY_COMP(2),
          },
        ])
        expect(permissions).to.deep.equal([
          {
            targetAddress: AddressOne,
            selector: "0x2",
            condition: DUMMY_COMP(1),
          },
          {
            targetAddress: AddressOne,
            selector: "0x3",
            condition: DUMMY_COMP(2),
          },
        ])
        expect(permissions).toHaveLength(2)
        expect(warnings).toHaveLength(0)
        expect(violations).toHaveLength(0)
      }
    })
    it("merges as Conditional with children OR", () => {
      const { permissions, violations, warnings } = mergePermissions([
        {
          targetAddress: AddressOne,
          selector: "0x1",
          condition: DUMMY_COMP(1),
        },
        {
          targetAddress: AddressOne,
          selector: "0x1",
          condition: DUMMY_COMP(2),
        },
      ])

      expect(permissions).to.deep.equal([
        {
          targetAddress: AddressOne,
          selector: "0x1",
          condition: {
            paramType: AbiType.None,
            operator: Operator.Or,
            children: [DUMMY_COMP(1), DUMMY_COMP(2)],
          },
        },
      ])
      expect(permissions).toHaveLength(1)
      expect(warnings).toHaveLength(0)
      expect(violations).toHaveLength(0)
    })
    it("flags violation when matching with different ExecutionOptions", () => {
      const { permissions, violations, warnings } = mergePermissions([
        {
          targetAddress: AddressOne,
          selector: "0x1",
          condition: DUMMY_COMP(1),
        },
        {
          targetAddress: AddressOne,
          selector: "0x1",
          condition: DUMMY_COMP(2),
          send: true,
        },
      ])

      expect(permissions).toHaveLength(0)
      expect(warnings).toHaveLength(0)
      expect(violations).toHaveLength(1)
    })
  })

  describe("multiple merge into one", () => {
    it("Conditional + Wildcarded + Allowed -> yields Allowed with warning", () => {
      const { permissions, violations, warnings } = mergePermissions([
        {
          targetAddress: AddressOne,
          selector: "0x1",
        },
        {
          targetAddress: AddressOne,
          selector: "0x1",
          condition: DUMMY_COMP(2),
        },
        {
          targetAddress: AddressOne,
        },
      ])

      expect(permissions).to.deep.equal([
        {
          targetAddress: AddressOne,
        },
      ])
      expect(permissions).toHaveLength(1)
      expect(warnings).toHaveLength(2)
      expect(violations).toHaveLength(0)
    })
    it("Conditional + Conditional + Wildcarded -> yields Wildcarded", () => {
      const { permissions, violations, warnings } = mergePermissions([
        {
          targetAddress: AddressOne,
          selector: "0x1",
          condition: DUMMY_COMP(1),
        },
        {
          targetAddress: AddressOne,
          selector: "0x1",
          condition: DUMMY_COMP(2),
        },
        {
          targetAddress: AddressOne,
          selector: "0x1",
        },
      ])

      expect(permissions).to.deep.equal([
        {
          targetAddress: AddressOne,
          selector: "0x1",
        },
      ])
      expect(permissions).toHaveLength(1)
      expect(warnings).toHaveLength(1)
      expect(violations).toHaveLength(0)
    })
    it("Conditional + Conditional + Allowed -> yields Allowed", () => {
      const { permissions, violations, warnings } = mergePermissions([
        {
          targetAddress: AddressOne,
          selector: "0x1",
          condition: DUMMY_COMP(1),
        },
        {
          targetAddress: AddressOne,
        },
        {
          targetAddress: AddressOne,
          selector: "0x1",
          condition: DUMMY_COMP(2),
        },
      ])

      expect(permissions).to.deep.equal([
        {
          targetAddress: AddressOne,
        },
      ])
      expect(permissions).toHaveLength(1)
      expect(warnings).toHaveLength(2)
      expect(violations).toHaveLength(0)
    })
  })
})
