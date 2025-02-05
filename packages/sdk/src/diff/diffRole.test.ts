import { it, suite, expect } from "vitest"
import { Clearance, ExecutionOptions } from "zodiac-roles-deployments"
import { diffRoles } from "./diffRole"

const AddressOne = "0x0000000000000000000000000000000000000001" as `0x${string}`
const AddressTwo = "0x0000000000000000000000000000000000000002" as `0x${string}`
const AddressThree =
  "0x0000000000000000000000000000000000000003" as `0x${string}`

const ContractOne =
  "0x000000000000000000000000000000000000000a" as `0x${string}`
const ContractTwo =
  "0x000000000000000000000000000000000000000b" as `0x${string}`

const roleKey1 = "0x001"
const roleKey2 = "0x002"

suite("diffRoles", () => {
  it("it diffs, and merge reduces through collections", () => {
    const prev = [
      {
        key: roleKey1,
        members: [AddressOne, AddressTwo] as `0x${string}`[],
        targets: [
          {
            address: ContractOne,
            clearance: Clearance.Target,
            executionOptions: ExecutionOptions.None,
            functions: [],
          },
          {
            address: ContractTwo,
            clearance: Clearance.Target,
            executionOptions: ExecutionOptions.None,
            functions: [],
          },
        ],
      },
    ]

    const next = [
      {
        key: roleKey1,
        members: [AddressOne, AddressThree] as `0x${string}`[],
        targets: [
          {
            address: ContractOne,
            clearance: Clearance.Target,
            executionOptions: ExecutionOptions.None,
            functions: [],
          },
        ],
      },
      {
        key: roleKey2,
        members: [AddressThree] as `0x${string}`[],
        targets: [
          {
            address: ContractTwo,
            clearance: Clearance.Target,
            executionOptions: ExecutionOptions.None,
            functions: [],
          },
        ],
      },
    ]

    const { minus, plus } = diffRoles({ prev, next })

    expect(minus).toHaveLength(2)
    expect(plus).toHaveLength(3)

    expect(minus.map(({ call }) => call)).toEqual([
      "revokeTarget",
      "assignRoles",
    ])

    expect(plus.map(({ call }) => call)).toEqual([
      "assignRoles",
      "allowTarget",
      "assignRoles",
    ])
  })
})
