import { expect } from "chai"

import diffPermissions from "../src/diffPermissions"
import { Clearance, ExecutionOptions, RolePermissions } from "../src/types"

describe("diffPermissions", () => {
  it("should correctly diff target-cleared targets", () => {
    const a: RolePermissions = {
      targets: [
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
      ],
    }

    const b: RolePermissions = {
      targets: [
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
      ],
    }

    expect(diffPermissions(a, b)).to.deep.equal({
      targets: [
        {
          address: "0x2",
          clearance: Clearance.Target,
          executionOptions: ExecutionOptions.None,
          functions: [],
        },
      ],
    })
    expect(diffPermissions(b, a)).to.deep.equal({
      targets: [
        {
          address: "0x2",
          clearance: Clearance.Target,
          executionOptions: ExecutionOptions.Both,
          functions: [],
        },
      ],
    })
  })

  it("should diff functions based all their properties including parameters", () => {
    const a: RolePermissions = {
      targets: [
        {
          address: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
          clearance: 2,
          executionOptions: 0,
          functions: [
            {
              sighash: "0x095ea7b3",
              executionOptions: 0,
              wildcarded: false,
              parameters: [
                {
                  index: 0,
                  type: 0,
                  comparison: 3,
                  comparisonValue: [
                    "0x000000000000000000000000ddcbf776df3de60163066a5dddf2277cb445e0f3",
                  ],
                },
              ],
            },
          ],
        },
      ],
    }

    const b: RolePermissions = {
      targets: [
        {
          address: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
          clearance: 2,
          executionOptions: 0,
          functions: [
            {
              sighash: "0x095ea7b3",
              executionOptions: 0,
              wildcarded: false,
              parameters: [
                {
                  index: 1,
                  type: 0,
                  comparison: 1,
                  comparisonValue: [
                    "0x000000000000000000000000ddcbf776df3de60163066a5dddf2277cb445e0f3",
                  ],
                },
              ],
            },
          ],
        },
      ],
    }

    expect(diffPermissions(a, a)).to.deep.equal({ targets: [] })
    expect(diffPermissions(a, b)).to.deep.equal(a)
  })
})
