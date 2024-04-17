import { expect } from "chai"

import {
  Permission,
  processPermissions,
  reconstructPermissions,
} from "../src/permissions"
import { diffTargets, splitTargets } from "../src/targets"

describe("splitTargets", () => {
  it("splits so that both shares combined yield the original permissions", () => {
    const { targets: combinedTargets } = processPermissions(combinedPermissions)
    const { targets: split } = processPermissions(splitPermissions)

    const remainderTargets = splitTargets(combinedTargets, split)
    const remainingPermissions = reconstructPermissions(remainderTargets)

    const { targets: finalTargets } = processPermissions([
      ...splitPermissions,
      ...remainingPermissions,
    ])

    expect(diffTargets(finalTargets, combinedTargets)).to.have.length(0)
    expect(diffTargets(combinedTargets, finalTargets)).to.have.length(0)
  })

  it("handles the case where the combined target does not have a condition set, but the split target does", () => {
    // this happens, for example, when a user whitelists a function without setting a condition and applies a preset that does set a condition on that function

    const { targets: combined } = processPermissions([
      {
        targetAddress: "0xcb444e90d8198415266c6a2724b7900fb12fc56e",
        selector: "0x095ea7b3",
        send: false,
        delegatecall: false,
      },
    ])

    const { targets: split } = processPermissions([
      {
        targetAddress: "0xcb444e90d8198415266c6a2724b7900fb12fc56e",
        selector: "0x095ea7b3",
        send: false,
        delegatecall: false,
        condition: {
          paramType: 5,
          operator: 5,
          children: [
            {
              paramType: 1,
              operator: 16,
              compValue:
                "0x000000000000000000000000c92e8bdf79f0507f65a392b0ab4667716bfe0110",
            },
          ],
        },
      },
    ])

    expect(splitTargets(combined, split)).to.deep.equal(combined)
  })
})

const combinedPermissions: Permission[] = [
  {
    targetAddress: "0xcb444e90d8198415266c6a2724b7900fb12fc56e",
    selector: "0x095ea7b3",
    send: false,
    delegatecall: false,
    condition: {
      paramType: 5,
      operator: 5,
      children: [
        {
          paramType: 1,
          operator: 16,
          compValue:
            "0x000000000000000000000000c92e8bdf79f0507f65a392b0ab4667716bfe0110",
        },
      ],
    },
  },
  {
    targetAddress: "0xddafbb505ad214d7b80b1f830fccc89b60fb7a83",
    selector: "0x095ea7b3",
    send: false,
    delegatecall: false,
    condition: {
      paramType: 5,
      operator: 5,
      children: [
        {
          paramType: 0,
          operator: 2,
          children: [
            {
              paramType: 1,
              operator: 16,
              compValue:
                "0x000000000000000000000000c92e8bdf79f0507f65a392b0ab4667716bfe0110",
            },
            {
              paramType: 1,
              operator: 16,
              compValue:
                "0x0000000000000000000000000fec3d212bcc29ef3e505b555d7a7343df0b7f76",
            },
          ],
        },
      ],
    },
  },
  {
    targetAddress: "0x23da9ade38e4477b23770ded512fd37b12381fab",
    selector: "0x569d3489",
    send: false,
    delegatecall: true,
    condition: {
      paramType: 5,
      operator: 5,
      children: [
        {
          paramType: 3,
          operator: 5,
          children: [
            {
              paramType: 0,
              operator: 2,
              children: [
                {
                  paramType: 1,
                  operator: 16,
                  compValue:
                    "0x000000000000000000000000cb444e90d8198415266c6a2724b7900fb12fc56e",
                },
                {
                  paramType: 1,
                  operator: 16,
                  compValue:
                    "0x000000000000000000000000ddafbb505ad214d7b80b1f830fccc89b60fb7a83",
                },
              ],
            },
            {
              paramType: 0,
              operator: 2,
              children: [
                {
                  paramType: 1,
                  operator: 16,
                  compValue:
                    "0x000000000000000000000000cb444e90d8198415266c6a2724b7900fb12fc56e",
                },
                {
                  paramType: 1,
                  operator: 16,
                  compValue:
                    "0x000000000000000000000000ddafbb505ad214d7b80b1f830fccc89b60fb7a83",
                },
              ],
            },
            {
              paramType: 1,
              operator: 0,
            },
            {
              paramType: 1,
              operator: 0,
            },
            {
              paramType: 1,
              operator: 0,
            },
            {
              paramType: 1,
              operator: 0,
            },
            {
              paramType: 1,
              operator: 0,
            },
            {
              paramType: 1,
              operator: 0,
            },
            {
              paramType: 1,
              operator: 0,
            },
            {
              paramType: 1,
              operator: 0,
            },
            {
              paramType: 1,
              operator: 0,
            },
            {
              paramType: 1,
              operator: 0,
            },
          ],
        },
      ],
    },
  },
  {
    targetAddress: "0x23da9ade38e4477b23770ded512fd37b12381fab",
    selector: "0x5a66c223",
    send: false,
    delegatecall: true,
    condition: {
      paramType: 5,
      operator: 5,
      children: [
        {
          paramType: 3,
          operator: 5,
          children: [
            {
              paramType: 0,
              operator: 2,
              children: [
                {
                  paramType: 1,
                  operator: 16,
                  compValue:
                    "0x000000000000000000000000cb444e90d8198415266c6a2724b7900fb12fc56e",
                },
                {
                  paramType: 1,
                  operator: 16,
                  compValue:
                    "0x000000000000000000000000ddafbb505ad214d7b80b1f830fccc89b60fb7a83",
                },
              ],
            },
            {
              paramType: 0,
              operator: 2,
              children: [
                {
                  paramType: 1,
                  operator: 16,
                  compValue:
                    "0x000000000000000000000000cb444e90d8198415266c6a2724b7900fb12fc56e",
                },
                {
                  paramType: 1,
                  operator: 16,
                  compValue:
                    "0x000000000000000000000000ddafbb505ad214d7b80b1f830fccc89b60fb7a83",
                },
              ],
            },
            {
              paramType: 1,
              operator: 0,
            },
            {
              paramType: 1,
              operator: 0,
            },
            {
              paramType: 1,
              operator: 0,
            },
            {
              paramType: 1,
              operator: 0,
            },
            {
              paramType: 1,
              operator: 0,
            },
            {
              paramType: 1,
              operator: 0,
            },
            {
              paramType: 1,
              operator: 0,
            },
            {
              paramType: 1,
              operator: 0,
            },
            {
              paramType: 1,
              operator: 0,
            },
            {
              paramType: 1,
              operator: 0,
            },
          ],
        },
      ],
    },
  },
  {
    targetAddress: "0x2086f52651837600180de173b09470f54ef74910",
    selector: "0x095ea7b3",
    send: false,
    delegatecall: false,
    condition: {
      paramType: 5,
      operator: 5,
      children: [
        {
          paramType: 0,
          operator: 2,
          children: [
            {
              paramType: 1,
              operator: 16,
              compValue:
                "0x00000000000000000000000098ef32edd24e2c92525e59afc4475c1242a30184",
            },
            {
              paramType: 1,
              operator: 16,
              compValue:
                "0x0000000000000000000000000fec3d212bcc29ef3e505b555d7a7343df0b7f76",
            },
          ],
        },
      ],
    },
  },
  {
    targetAddress: "0x98ef32edd24e2c92525e59afc4475c1242a30184",
    selector: "0x43a0d066",
    send: false,
    delegatecall: false,
    condition: {
      paramType: 5,
      operator: 5,
      children: [
        {
          paramType: 1,
          operator: 16,
          compValue:
            "0x000000000000000000000000000000000000000000000000000000000000000a",
        },
      ],
    },
  },
  {
    targetAddress: "0x0821ed041620b83b306ffac74df3fa855cede51a",
    selector: "0xc32e7202",
    send: false,
    delegatecall: false,
  },
  {
    targetAddress: "0x0821ed041620b83b306ffac74df3fa855cede51a",
    selector: "0x3d18b912",
    send: false,
    delegatecall: false,
  },
  {
    targetAddress: "0x0821ed041620b83b306ffac74df3fa855cede51a",
    selector: "0x7050ccd9",
    send: false,
    delegatecall: false,
    condition: {
      paramType: 5,
      operator: 5,
      children: [
        {
          paramType: 1,
          operator: 15,
        },
      ],
    },
  },
  {
    targetAddress: "0x4ecaba5870353805a9f068101a40e0f32ed605c6",
    selector: "0x095ea7b3",
    send: false,
    delegatecall: false,
    condition: {
      paramType: 5,
      operator: 5,
      children: [
        {
          paramType: 1,
          operator: 16,
          compValue:
            "0x0000000000000000000000000fec3d212bcc29ef3e505b555d7a7343df0b7f76",
        },
      ],
    },
  },
  {
    targetAddress: "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d",
    selector: "0x095ea7b3",
    send: false,
    delegatecall: false,
    condition: {
      paramType: 5,
      operator: 5,
      children: [
        {
          paramType: 1,
          operator: 16,
          compValue:
            "0x0000000000000000000000000fec3d212bcc29ef3e505b555d7a7343df0b7f76",
        },
      ],
    },
  },
  {
    targetAddress: "0x0fec3d212bcc29ef3e505b555d7a7343df0b7f76",
    selector: "0x9eba6619",
    send: false,
    delegatecall: false,
    condition: {
      paramType: 5,
      operator: 5,
      children: [
        {
          paramType: 1,
          operator: 16,
          compValue:
            "0x0000000000000000000000000821ed041620b83b306ffac74df3fa855cede51a",
        },
        {
          paramType: 0,
          operator: 2,
          children: [
            {
              paramType: 1,
              operator: 16,
              compValue:
                "0x0000000000000000000000002086f52651837600180de173b09470f54ef74910",
            },
            {
              paramType: 1,
              operator: 16,
              compValue:
                "0x000000000000000000000000e91d153e0b41518a2ce8dd3d7944fa863463a97d",
            },
            {
              paramType: 1,
              operator: 16,
              compValue:
                "0x0000000000000000000000004ecaba5870353805a9f068101a40e0f32ed605c6",
            },
            {
              paramType: 1,
              operator: 16,
              compValue:
                "0x000000000000000000000000ddafbb505ad214d7b80b1f830fccc89b60fb7a83",
            },
          ],
        },
        {
          paramType: 1,
          operator: 0,
        },
        {
          paramType: 1,
          operator: 16,
          compValue:
            "0x2086f52651837600180de173b09470f54ef7491000000000000000000000004f",
        },
      ],
    },
  },
]

const splitPermissions: Permission[] = [
  {
    targetAddress: "0x2086f52651837600180de173b09470f54ef74910",
    selector: "0x095ea7b3",
    condition: {
      paramType: 5,
      operator: 5,
      children: [
        {
          paramType: 1,
          operator: 16,
          compValue:
            "0x00000000000000000000000098ef32edd24e2c92525e59afc4475c1242a30184",
        },
        {
          paramType: 1,
          operator: 0,
        },
      ],
    },
  },
  {
    targetAddress: "0x98ef32edd24e2c92525e59afc4475c1242a30184",
    selector: "0x43a0d066",
    condition: {
      paramType: 5,
      operator: 5,
      children: [
        {
          paramType: 1,
          operator: 16,
          compValue:
            "0x000000000000000000000000000000000000000000000000000000000000000a",
        },
        {
          paramType: 1,
          operator: 0,
        },
        {
          paramType: 1,
          operator: 0,
        },
      ],
    },
  },
  {
    targetAddress: "0x0821ed041620b83b306ffac74df3fa855cede51a",
    selector: "0xc32e7202",
  },
  {
    targetAddress: "0x0821ed041620b83b306ffac74df3fa855cede51a",
    selector: "0x3d18b912",
  },
  {
    targetAddress: "0x0821ed041620b83b306ffac74df3fa855cede51a",
    selector: "0x7050ccd9",
    condition: {
      paramType: 5,
      operator: 5,
      children: [
        {
          paramType: 1,
          operator: 15,
        },
        {
          paramType: 1,
          operator: 0,
        },
      ],
    },
  },
  {
    targetAddress: "0x2086f52651837600180de173b09470f54ef74910",
    selector: "0x095ea7b3",
    condition: {
      paramType: 5,
      operator: 5,
      children: [
        {
          paramType: 1,
          operator: 16,
          compValue:
            "0x0000000000000000000000000fec3d212bcc29ef3e505b555d7a7343df0b7f76",
        },
        {
          paramType: 1,
          operator: 0,
        },
      ],
    },
  },
  {
    targetAddress: "0x4ecaba5870353805a9f068101a40e0f32ed605c6",
    selector: "0x095ea7b3",
    condition: {
      paramType: 5,
      operator: 5,
      children: [
        {
          paramType: 1,
          operator: 16,
          compValue:
            "0x0000000000000000000000000fec3d212bcc29ef3e505b555d7a7343df0b7f76",
        },
        {
          paramType: 1,
          operator: 0,
        },
      ],
    },
  },
  {
    targetAddress: "0xddafbb505ad214d7b80b1f830fccc89b60fb7a83",
    selector: "0x095ea7b3",
    condition: {
      paramType: 5,
      operator: 5,
      children: [
        {
          paramType: 1,
          operator: 16,
          compValue:
            "0x0000000000000000000000000fec3d212bcc29ef3e505b555d7a7343df0b7f76",
        },
        {
          paramType: 1,
          operator: 0,
        },
      ],
    },
  },
  {
    targetAddress: "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d",
    selector: "0x095ea7b3",
    condition: {
      paramType: 5,
      operator: 5,
      children: [
        {
          paramType: 1,
          operator: 16,
          compValue:
            "0x0000000000000000000000000fec3d212bcc29ef3e505b555d7a7343df0b7f76",
        },
        {
          paramType: 1,
          operator: 0,
        },
      ],
    },
  },
  {
    targetAddress: "0x0fec3d212bcc29ef3e505b555d7a7343df0b7f76",
    selector: "0x9eba6619",
    condition: {
      paramType: 5,
      operator: 5,
      children: [
        {
          paramType: 1,
          operator: 16,
          compValue:
            "0x0000000000000000000000000821ed041620b83b306ffac74df3fa855cede51a",
        },
        {
          paramType: 0,
          operator: 2,
          children: [
            {
              paramType: 1,
              operator: 16,
              compValue:
                "0x0000000000000000000000002086f52651837600180de173b09470f54ef74910",
            },
            {
              paramType: 1,
              operator: 16,
              compValue:
                "0x0000000000000000000000004ecaba5870353805a9f068101a40e0f32ed605c6",
            },
            {
              paramType: 1,
              operator: 16,
              compValue:
                "0x000000000000000000000000ddafbb505ad214d7b80b1f830fccc89b60fb7a83",
            },
            {
              paramType: 1,
              operator: 16,
              compValue:
                "0x000000000000000000000000e91d153e0b41518a2ce8dd3d7944fa863463a97d",
            },
          ],
        },
        {
          paramType: 1,
          operator: 0,
        },
        {
          paramType: 1,
          operator: 16,
          compValue:
            "0x2086f52651837600180de173b09470f54ef7491000000000000000000000004f",
        },
        {
          paramType: 3,
          operator: 0,
          children: [
            {
              paramType: 4,
              operator: 0,
              children: [
                {
                  paramType: 1,
                  operator: 0,
                },
              ],
            },
            {
              paramType: 4,
              operator: 0,
              children: [
                {
                  paramType: 1,
                  operator: 0,
                },
              ],
            },
            {
              paramType: 2,
              operator: 0,
            },
            {
              paramType: 1,
              operator: 0,
            },
          ],
        },
      ],
    },
  },
] as const
