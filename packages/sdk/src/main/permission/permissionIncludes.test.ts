import { expect, it, suite } from "vitest"
import { Operator, ParameterType } from "zodiac-roles-deployments"

import { abiEncode } from "../abiEncode"
import { permissionIncludes } from "./permissionIncludes"

const AddressOne = "0x0000000000000000000000000000000000000001"
const AddressTwo = "0x0000000000000000000000000000000000000002"

const DUMMY_COMP = (id: number) => ({
  paramType: ParameterType.Static,
  operator: Operator.Custom,
  compValue: abiEncode(["uint256"], [id]),
})

suite("permissionIncludes()", () => {
  it("compares by targetAddress", () => {
    expect(
      permissionIncludes(
        { targetAddress: AddressOne },
        { targetAddress: AddressOne }
      )
    ).to.equal(true)

    expect(
      permissionIncludes(
        { targetAddress: AddressOne },
        { targetAddress: AddressTwo }
      )
    ).to.equal(false)
  })

  it("send: false or undefined are equivalent", () => {
    expect(
      permissionIncludes(
        { targetAddress: AddressOne },
        { targetAddress: AddressOne, send: false }
      )
    ).to.equal(true)

    expect(
      permissionIncludes(
        { targetAddress: AddressOne },
        { targetAddress: AddressOne, send: true }
      )
    ).to.equal(false)
  })

  it("delegatecall: false or undefined are equivalent", () => {
    expect(
      permissionIncludes(
        { targetAddress: AddressOne },
        { targetAddress: AddressOne, delegatecall: false }
      )
    ).to.equal(true)

    expect(
      permissionIncludes(
        { targetAddress: AddressOne },
        { targetAddress: AddressOne, delegatecall: true }
      )
    ).to.equal(false)
  })

  it("compares by selector", () => {
    expect(
      permissionIncludes(
        { targetAddress: AddressOne, selector: "0x01" },
        { targetAddress: AddressOne, selector: "0x01" }
      )
    ).to.equal(true)

    expect(
      permissionIncludes(
        { targetAddress: AddressOne, selector: "0x01" },
        { targetAddress: AddressOne, selector: "0x02" }
      )
    ).to.equal(false)
  })

  it("condition: missing or undefined are equivalent", () => {
    expect(
      permissionIncludes(
        { targetAddress: AddressOne, selector: "0x01", condition: undefined },
        { targetAddress: AddressOne, selector: "0x01" }
      )
    ).to.equal(true)
  })

  it("condition: matches when stricly equal", () => {
    expect(
      permissionIncludes(
        {
          targetAddress: AddressOne,
          selector: "0x01",
          condition: DUMMY_COMP(1),
        },
        {
          targetAddress: AddressOne,
          selector: "0x01",
          condition: DUMMY_COMP(1),
        }
      )
    ).to.equal(true)

    expect(
      permissionIncludes(
        {
          targetAddress: AddressOne,
          selector: "0x01",
          condition: DUMMY_COMP(1),
        },
        {
          targetAddress: AddressOne,
          selector: "0x01",
          condition: DUMMY_COMP(2),
        }
      )
    ).to.equal(false)
  })

  // it("condition: matches when normalized equal", () => {
  //   expect(
  //     permissionIncludes(
  //       {
  //         targetAddress: AddressOne,
  //         selector: "0x01",
  //         condition: {
  //           paramType: ParameterType.None,
  //           operator: Operator.Or,
  //           children: [DUMMY_COMP(1), DUMMY_COMP(2)],
  //         },
  //       },
  //       {
  //         targetAddress: AddressOne,
  //         selector: "0x01",
  //         condition: {
  //           paramType: ParameterType.None,
  //           operator: Operator.Or,
  //           children: [DUMMY_COMP(1), DUMMY_COMP(2), DUMMY_COMP(1)],
  //         },
  //       }
  //     )
  //   ).to.equal(true)

  //   expect(
  //     permissionIncludes(
  //       {
  //         targetAddress: AddressOne,
  //         selector: "0x01",
  //         condition: {
  //           paramType: ParameterType.None,
  //           operator: Operator.Or,
  //           children: [DUMMY_COMP(1), DUMMY_COMP(2)],
  //         },
  //       },
  //       {
  //         targetAddress: AddressOne,
  //         selector: "0x01",
  //         condition: {
  //           paramType: ParameterType.None,
  //           operator: Operator.Or,
  //           children: [DUMMY_COMP(1), DUMMY_COMP(2), DUMMY_COMP(3)],
  //         },
  //       }
  //     )
  //   ).to.equal(false)
  // })
})
