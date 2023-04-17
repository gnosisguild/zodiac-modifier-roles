import { expect } from "chai"

import { diffPermissions } from "../src/diffPermissions"
import {
  Clearance,
  ExecutionOptions,
  Operator,
  ParameterType,
  Target,
} from "../src/types"

describe("diffPermissions", () => {
  it("should correctly diff target-cleared targets", () => {
    const a: Target[] = [
      {
        address: "0x1",
        clearance: Clearance.Target,
        executionOptions: ExecutionOptions.None,
        functions: [],
      },
      {
        address: "0x2",
        clearance: Clearance.Target,
        executionOptions: ExecutionOptions.None,
        functions: [],
      },
    ]

    const b: Target[] = [
      {
        address: "0x1",
        clearance: Clearance.Target,
        executionOptions: ExecutionOptions.None,
        functions: [],
      },
      {
        address: "0x2",
        clearance: Clearance.Target,
        executionOptions: ExecutionOptions.Both,
        functions: [],
      },
    ]

    expect(diffPermissions(a, b)).to.deep.equal([
      {
        address: "0x2",
        clearance: Clearance.Target,
        executionOptions: ExecutionOptions.None,
        functions: [],
      },
    ])
    expect(diffPermissions(b, a)).to.deep.equal([
      {
        address: "0x2",
        clearance: Clearance.Target,
        executionOptions: ExecutionOptions.Both,
        functions: [],
      },
    ])
  })

  it("should diff functions based on all their properties including conditions", () => {
    const a: Target[] = [
      {
        address: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
        clearance: 2,
        executionOptions: 0,
        functions: [
          {
            selector: "0x095ea7b3",
            executionOptions: 0,
            wildcarded: false,
            condition: {
              paramType: ParameterType.None,
              operator: Operator.Pass,
            },
          },
        ],
      },
    ]

    const b: Target[] = [
      {
        address: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
        clearance: 2,
        executionOptions: 0,
        functions: [
          {
            selector: "0x095ea7b3",
            executionOptions: 0,
            wildcarded: false,
            condition: {
              paramType: ParameterType.Dynamic,
              operator: Operator.EqualTo,
              compValue: "0x00",
            },
          },
        ],
      },
    ]

    expect(diffPermissions(a, a)).to.deep.equal([])
    expect(diffPermissions(a, b)).to.deep.equal(a)
  })
})
