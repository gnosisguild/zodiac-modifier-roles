import { describe, expect, it, suite } from "vitest"
import { processPermissions } from "./processPermissions"
import {
  Clearance,
  ExecutionOptions,
  Operator,
  ParameterType,
} from "zodiac-roles-deployments"
import { encodeAbiParameters } from "../utils/encodeAbiParameters"
import { normalizeCondition } from "../conditions"

const DUMMY_COMP = (id: number) => ({
  paramType: ParameterType.Static,
  operator: Operator.Custom,
  compValue: encodeAbiParameters(["uint256"], [id]),
})

suite("processPermissions()", () => {
  /*
   * nomenclature for these tests:
   * allowed     -> Clearance.Target, i.e., target fully allowed
   * wildcarded  -> Clearance.Function AND wildcarded == true AND condition == undefined
   * conditional -> Clearance.Function AND wildcarded == false AND condition == defined
   */

  const AddressOne = "0x0000000000000000000000000000000000000001"
  const AddressTwo = "0x0000000000000000000000000000000000000002"

  describe("allowed + allowed", () => {
    it("processes for distinct targetAddresses ✅", () => {
      expect(
        processPermissions([
          { targetAddress: AddressOne },
          { targetAddress: AddressTwo },
        ])
      ).to.deep.equal({
        targets: [
          {
            address: AddressOne,
            clearance: Clearance.Target,
            executionOptions: ExecutionOptions.None,
            functions: [],
          },
          {
            address: AddressTwo,
            clearance: Clearance.Target,
            executionOptions: ExecutionOptions.None,
            functions: [],
          },
        ],
        annotations: [],
      })
    })

    it("filters out duplicate entry", () => {
      expect(
        processPermissions([
          { targetAddress: AddressOne },
          { targetAddress: AddressOne },
        ])
      ).to.deep.equal({
        targets: [
          {
            address: AddressOne,
            clearance: Clearance.Target,
            executionOptions: ExecutionOptions.None,
            functions: [],
          },
        ],
        annotations: [],
      })
    })
  })

  describe("allowed + wildcarded", () => {
    it("processes distinct targetAddresses ✅", () => {
      expect(
        processPermissions([
          { targetAddress: AddressOne },
          { targetAddress: AddressTwo, selector: "0x1" },
        ])
      ).to.deep.equal({
        targets: [
          {
            address: AddressOne,
            clearance: Clearance.Target,
            executionOptions: ExecutionOptions.None,
            functions: [],
          },
          {
            address: AddressTwo,
            clearance: Clearance.Function,
            executionOptions: ExecutionOptions.None,
            functions: [
              {
                selector: "0x1",
                executionOptions: ExecutionOptions.None,
                wildcarded: true,
                condition: undefined,
              },
            ],
          },
        ],
        annotations: [],
      })
    })
    it("throws for same targetAddress ❌", () => {
      expect(() => {
        processPermissions([
          { targetAddress: AddressOne },
          { targetAddress: AddressOne, selector: "0x1" },
        ])
      }).toThrowError(
        "An address can either be fully allowed or scoped to selected functions. The following addresses are both: 0x0000000000000000000000000000000000000001"
      )
    })
  })

  describe("allowed + conditional", () => {
    it("throws for same targetAddress ❌", () => {
      expect(() => {
        processPermissions([
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
    it("processes distinct targetAddresses ✅", () => {
      expect(
        processPermissions([
          { targetAddress: AddressOne, selector: "0x1" },
          { targetAddress: AddressTwo, selector: "0x1" },
        ])
      ).to.deep.equal({
        targets: [
          {
            address: AddressOne,
            clearance: Clearance.Function,
            executionOptions: ExecutionOptions.None,
            functions: [
              {
                selector: "0x1",
                executionOptions: ExecutionOptions.None,
                wildcarded: true,
                condition: undefined,
              },
            ],
          },
          {
            address: AddressTwo,
            clearance: Clearance.Function,
            executionOptions: ExecutionOptions.None,
            functions: [
              {
                selector: "0x1",
                executionOptions: ExecutionOptions.None,
                wildcarded: true,
                condition: undefined,
              },
            ],
          },
        ],
        annotations: [],
      })
    })
    it("filters out duplicate for same targetAddress ✅", () => {
      expect(
        processPermissions([
          { targetAddress: AddressOne, selector: "0x1" },
          { targetAddress: AddressOne, selector: "0x1" },
        ])
      ).to.deep.equal({
        targets: [
          {
            address: AddressOne,
            clearance: Clearance.Function,
            executionOptions: ExecutionOptions.None,
            functions: [
              {
                selector: "0x1",
                executionOptions: ExecutionOptions.None,
                wildcarded: true,
                condition: undefined,
              },
            ],
          },
        ],
        annotations: [],
      })
    })
  })

  describe("wilcarded + conditional", () => {
    it("processes for different targetAddresses ✅", () => {
      expect(
        processPermissions([
          { targetAddress: AddressOne, selector: "0x1" },
          {
            targetAddress: AddressTwo,
            selector: "0x2",
            condition: DUMMY_COMP(1),
          },
        ])
      ).to.deep.equal({
        targets: [
          {
            address: AddressOne,
            clearance: Clearance.Function,
            executionOptions: ExecutionOptions.None,
            functions: [
              {
                selector: "0x1",
                executionOptions: ExecutionOptions.None,
                wildcarded: true,
                condition: undefined,
              },
            ],
          },
          {
            address: AddressTwo,
            clearance: Clearance.Function,
            executionOptions: ExecutionOptions.None,
            functions: [
              {
                selector: "0x2",
                executionOptions: ExecutionOptions.None,
                wildcarded: false,
                condition: normalizeCondition(DUMMY_COMP(1)),
              },
            ],
          },
        ],
        annotations: [],
      })
    })
    it("ignores conditional, fallbacks to wildcarded, for same targetAddress ✅", () => {
      expect(
        processPermissions([
          { targetAddress: AddressOne, selector: "0x1" },
          {
            targetAddress: AddressOne,
            selector: "0x1",
            condition: DUMMY_COMP(1),
          },
        ])
      ).to.deep.equal({
        targets: [
          {
            address: AddressOne,
            clearance: Clearance.Function,
            executionOptions: ExecutionOptions.None,
            functions: [
              {
                selector: "0x1",
                executionOptions: ExecutionOptions.None,
                wildcarded: true,
                condition: undefined,
              },
            ],
          },
        ],
        annotations: [],
      })
    })
    it("throws on incompatible execution options ❌", () => {
      expect(() =>
        processPermissions([
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
    it("merges compatible conditional permissions for same targetAddress and selector, via OR ✅", () => {
      expect(
        processPermissions([
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
      ).to.deep.equal({
        targets: [
          {
            address: AddressOne,
            clearance: Clearance.Function,
            executionOptions: ExecutionOptions.None,
            functions: [
              {
                selector: "0x1",
                executionOptions: ExecutionOptions.None,
                wildcarded: false,
                condition: normalizeCondition({
                  paramType: ParameterType.None,
                  operator: Operator.Or,
                  children: [DUMMY_COMP(1), DUMMY_COMP(2)],
                }),
              },
            ],
          },
        ],
        annotations: [],
      })
    })
    it("throws for same targetAddress and selector, when incompatible execution options ❌", () => {
      expect(() =>
        processPermissions([
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
