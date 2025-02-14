import { describe, expect, it, suite } from "vitest"
import { Operator, ParameterType } from "zodiac-roles-deployments"
import { encodeAbiParameters } from "../utils/encodeAbiParameters"
import { mergePermissions } from "./mergePermissions"

const DUMMY_COMP = (id: number) => ({
  paramType: ParameterType.Static,
  operator: Operator.Custom,
  compValue: encodeAbiParameters(["uint256"], [id]),
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

  describe("allowed + allowed", () => {
    it("two distinct targets don't get merged", () => {
      expect(
        mergePermissions([
          { targetAddress: AddressOne },
          { targetAddress: AddressTwo },
        ])
      ).to.deep.equal([
        { targetAddress: AddressOne },
        { targetAddress: AddressTwo },
      ])
    })

    it("filters out duplicate entry ✅", () => {
      expect(
        mergePermissions([
          { targetAddress: AddressOne },
          { targetAddress: AddressOne },
        ])
      ).to.deep.equal([{ targetAddress: AddressOne }])
    })

    it("throws on out duplicate entry with incompatible execution options", () => {
      expect(() =>
        mergePermissions([
          { targetAddress: AddressOne, send: true },
          { targetAddress: AddressOne, delegatecall: true },
        ])
      ).toThrowError()
    })
  })

  describe("allowed + wildcarded", () => {
    it("distinct targetAddresses don't get merged", () => {
      expect(
        mergePermissions([
          { targetAddress: AddressOne },
          { targetAddress: AddressTwo, selector: "0x1" },
        ])
      ).to.deep.equal([
        { targetAddress: AddressOne },
        { targetAddress: AddressTwo, selector: "0x1" },
      ])
    })
    it("throws for same targetAddress", () => {
      expect(() => {
        mergePermissions([
          { targetAddress: AddressOne },
          { targetAddress: AddressOne, selector: "0x1" },
        ])
      }).toThrowError(
        "An address can either be fully allowed or scoped to selected functions. The following addresses are both: 0x0000000000000000000000000000000000000001"
      )
    })
  })

  describe("allowed + conditional", () => {
    it("throws for same targetAddress", () => {
      expect(() => {
        mergePermissions([
          { targetAddress: AddressOne },
          {
            targetAddress: AddressOne,
            selector: "0x1",
            condition: DUMMY_COMP(1),
          },
        ])
      }).toThrowError(
        "An address can either be fully allowed or scoped to selected functions. The following addresses are both: 0x0000000000000000000000000000000000000001"
      )
    })
  })

  describe("wilcarded + wildcarded", () => {
    it("distinct targetAddresses don't get merged", () => {
      expect(
        mergePermissions([
          { targetAddress: AddressOne, selector: "0x1" },
          { targetAddress: AddressTwo, selector: "0x1" },
        ])
      ).to.deep.equal([
        { targetAddress: AddressOne, selector: "0x1" },
        { targetAddress: AddressTwo, selector: "0x1" },
      ])
    })
    it("filters out duplicate for same targetAddress", () => {
      expect(
        mergePermissions([
          { targetAddress: AddressOne, selector: "0x1" },
          { targetAddress: AddressOne, selector: "0x1" },
        ])
      ).to.deep.equal([
        { targetAddress: AddressOne, selector: "0x1", condition: undefined },
      ])
    })
    it("throws on duplicate with incompatible execution options", () => {
      expect(() =>
        mergePermissions([
          { targetAddress: AddressOne, selector: "0x1", send: true },
          { targetAddress: AddressOne, selector: "0x1", delegatecall: true },
        ])
      ).toThrowError()
    })
  })

  describe("wilcarded + conditional", () => {
    it("distinct targetAddresses don't get merged", () => {
      expect(
        mergePermissions([
          { targetAddress: AddressOne, selector: "0x1" },
          {
            targetAddress: AddressTwo,
            selector: "0x2",
            condition: DUMMY_COMP(1),
          },
        ])
      ).to.deep.equal([
        { targetAddress: AddressOne, selector: "0x1" },
        {
          targetAddress: AddressTwo,
          selector: "0x2",
          condition: DUMMY_COMP(1),
        },
      ])
    })
    it("ignores conditional, merges as wildcarded, for same targetAddress", () => {
      expect(
        mergePermissions([
          { targetAddress: AddressOne, selector: "0x1" },
          {
            targetAddress: AddressOne,
            selector: "0x1",
            condition: DUMMY_COMP(1),
          },
        ])
      ).to.deep.equal([
        { targetAddress: AddressOne, selector: "0x1", condition: undefined },
      ])
    })
    it("throws on incompatible execution options", () => {
      expect(() =>
        mergePermissions([
          { targetAddress: AddressOne, selector: "0x1", send: true },
          {
            targetAddress: AddressOne,
            selector: "0x1",
            condition: DUMMY_COMP(1),
            send: false,
          },
        ])
      ).toThrowError()
    })
  })

  describe("condtional + conditional", () => {
    it("merges compatible conditional permissions for same targetAddress and selector, via OR", () => {
      expect(
        mergePermissions([
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
      ).to.deep.equal([
        {
          targetAddress: AddressOne,
          selector: "0x1",
          condition: {
            paramType: ParameterType.None,
            operator: Operator.Or,
            children: [DUMMY_COMP(1), DUMMY_COMP(2)],
          },
        },
      ])
    })
    it("throws on incompatible execution options, for same targetAddress and selector", () => {
      expect(() =>
        mergePermissions([
          {
            targetAddress: AddressOne,
            selector: "0x1",
            condition: DUMMY_COMP(1),
            send: false,
          },
          {
            targetAddress: AddressOne,
            selector: "0x1",
            condition: DUMMY_COMP(2),
            send: true,
          },
        ])
      ).toThrowError()
    })
  })
})
