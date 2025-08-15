import { it, suite, expect } from "vitest"
import { Clearance, ExecutionOptions, Role } from "zodiac-roles-deployments"
import { diffRoles } from "./role"

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
        annotations: [],
        lastUpdate: 0,
      },
    ] satisfies Role[]

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
        annotations: [],
        lastUpdate: 0,
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
        annotations: [],
        lastUpdate: 0,
      },
    ] satisfies Role[]

    const { minus, plus } = diffRoles({ prev, next })

    expect(minus).toHaveLength(2)

    expect(plus).toHaveLength(3)

    expect(minus.map(({ call }) => call)).toEqual([
      "assignRoles",
      "revokeTarget",
    ])

    expect(plus.map(({ call }) => call)).toEqual([
      "assignRoles",
      "assignRoles",
      "allowTarget",
    ])
  })

  it("it deletes a role containing several targets and members", () => {
    const prev = [
      {
        key: roleKey1,
        members: [AddressOne, AddressTwo] as `0x${string}`[],
        targets: [
          {
            address: ContractOne,
            clearance: Clearance.Target,
            executionOptions: ExecutionOptions.Send,
            functions: [],
          },
          {
            address: ContractTwo,
            clearance: Clearance.Function,
            executionOptions: ExecutionOptions.DelegateCall,
            functions: [
              {
                selector: "0x12345678",
                executionOptions: ExecutionOptions.None,
                wildcarded: true,
              },
            ],
          },
        ],
        annotations: [],
        lastUpdate: 0,
      },
      {
        key: roleKey2,
        members: [AddressTwo] as `0x${string}`[],
        targets: [
          {
            address: ContractOne,
            clearance: Clearance.Target,
            executionOptions: ExecutionOptions.None,
            functions: [],
          },
        ],
        annotations: [],
        lastUpdate: 0,
      },
    ] satisfies Role[]

    const next = [
      {
        key: roleKey2,
        members: [AddressTwo] as `0x${string}`[],
        targets: [
          {
            address: ContractOne,
            clearance: Clearance.Target,
            executionOptions: ExecutionOptions.None,
            functions: [],
          },
        ],
        annotations: [],
        lastUpdate: 0,
      },
    ] satisfies Role[]

    const { minus, plus } = diffRoles({ prev, next })

    // Should revoke all members from the deleted role
    expect(minus).toHaveLength(5)

    // No additions needed since roleKey2 already exists unchanged
    expect(plus).toHaveLength(0)

    // // Verify the removal operations
    const minusCalls = minus.map(({ call }) => call)

    expect(minus.filter(({ call }) => call === "assignRoles")).toHaveLength(2)
    expect(minus.filter(({ call }) => call === "revokeTarget")).toHaveLength(2)
    expect(minus.filter(({ call }) => call === "revokeFunction")).toHaveLength(
      1
    )
  })
})
