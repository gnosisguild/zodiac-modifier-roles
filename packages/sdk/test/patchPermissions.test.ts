import { expect } from "chai"

import patchPermissions from "../src/patchPermissions"
import { RolePermissions } from "../src/types"

describe("patchPermissions", () => {
  it("should revoke functions with param scopings", () => {
    const before: RolePermissions = {
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

    const after: RolePermissions = {
      targets: [],
    }

    expect(patchPermissions(before, after)).to.deep.equal([
      {
        call: "scopeRevokeFunction",
        targetAddress: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
        functionSig: "0x095ea7b3",
      },
    ])
  })

  it("should patch params scoping", () => {
    const before: RolePermissions = {
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

    const after: RolePermissions = {
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

    expect(patchPermissions(before, after)).to.deep.equal([
      {
        call: "scopeTarget",
        targetAddress: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
      },
      {
        call: "scopeFunction",
        targetAddress: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
        functionSig: "0x095ea7b3",
        compValue: [],
        isParamScoped: [],
        options: 0,
        paramComp: [],
        paramType: [],
      },
      {
        call: "scopeParameterAsOneOf",
        targetAddress: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
        functionSig: "0x095ea7b3",
        paramIndex: 1,
        type: 0,
        value: [
          "0x000000000000000000000000ddcbf776df3de60163066a5dddf2277cb445e0f3",
        ],
      },
    ])
  })
})
