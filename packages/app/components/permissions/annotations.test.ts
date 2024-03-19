import { PermissionCoerced } from "zodiac-roles-sdk"
import { processAnnotations } from "./annotations"

describe("processAnnotations()", () => {
  it("returns the original set of permissions if no annotations are given", async () => {
    const permissions = [
      {
        targetAddress: "0xc0ffee254729296a45a3885639ac7e10f9d54979",
        selector: "0x1234abcd",
        condition: undefined,
        send: false,
        delegatecall: false,
      },
    ] as const
    const result = await processAnnotations(permissions, [])
    expect(result.permissions).toEqual(permissions)
  })

  it("returns presets (resolved annotated permissions)", async () => {
    const result = await processAnnotations(permissionsForPreset1, [
      annotation1,
    ])
    expect(result.presets).toMatchInlineSnapshot(`
      [
        {
          "apiInfo": {
            "contact": {
              "name": "Karpatkey",
              "url": "https://kit.karpatkey.com",
            },
            "description": "Permissions for Zodiac Roles covering interactions with DeFi protocols",
            "title": "DeFi Kit",
            "version": "1.0.0",
          },
          "operation": {
            "parameters": [
              {
                "allowEmptyValue": false,
                "allowReserved": false,
                "explode": false,
                "in": "query",
                "name": "sell",
                "required": true,
                "schema": {
                  "deprecated": false,
                  "items": {
                    "anyOf": [
                      {
                        "deprecated": false,
                        "nullable": false,
                        "type": "string",
                      },
                      {
                        "deprecated": false,
                        "enum": [
                          "ETH",
                        ],
                        "nullable": false,
                        "type": "string",
                      },
                    ],
                    "deprecated": false,
                    "nullable": false,
                  },
                  "nullable": false,
                  "type": "array",
                },
                "style": "form",
              },
              {
                "allowEmptyValue": false,
                "allowReserved": false,
                "explode": false,
                "in": "query",
                "name": "buy",
                "required": true,
                "schema": {
                  "deprecated": false,
                  "items": {
                    "anyOf": [
                      {
                        "deprecated": false,
                        "nullable": false,
                        "type": "string",
                      },
                      {
                        "deprecated": false,
                        "enum": [
                          "ETH",
                        ],
                        "nullable": false,
                        "type": "string",
                      },
                    ],
                    "deprecated": false,
                    "nullable": false,
                  },
                  "nullable": false,
                  "type": "array",
                },
                "style": "form",
              },
            ],
            "summary": "Make swaps on cowswap",
            "tags": [
              "cowswap permissions",
            ],
          },
          "pathKey": "/permissions/eth/cowswap/swap",
          "pathParams": {},
          "permissions": [
            {
              "condition": {
                "children": [
                  {
                    "compValue": "0x000000000000000000000000c92e8bdf79f0507f65a392b0ab4667716bfe0110",
                    "operator": 16,
                    "paramType": 1,
                  },
                  {
                    "operator": 0,
                    "paramType": 1,
                  },
                ],
                "operator": 5,
                "paramType": 5,
              },
              "selector": "0x095ea7b3",
              "targetAddress": "0x6b175474e89094c44da98b954eedeac495271d0f",
            },
            {
              "condition": {
                "children": [
                  {
                    "compValue": "0x000000000000000000000000c92e8bdf79f0507f65a392b0ab4667716bfe0110",
                    "operator": 16,
                    "paramType": 1,
                  },
                  {
                    "operator": 0,
                    "paramType": 1,
                  },
                ],
                "operator": 5,
                "paramType": 5,
              },
              "selector": "0x095ea7b3",
              "targetAddress": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            },
            {
              "condition": {
                "children": [
                  {
                    "children": [
                      {
                        "children": [
                          {
                            "compValue": "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                            "operator": 16,
                            "paramType": 1,
                          },
                          {
                            "compValue": "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                            "operator": 16,
                            "paramType": 1,
                          },
                        ],
                        "operator": 2,
                        "paramType": 0,
                      },
                      {
                        "children": [
                          {
                            "compValue": "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                            "operator": 16,
                            "paramType": 1,
                          },
                          {
                            "compValue": "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                            "operator": 16,
                            "paramType": 1,
                          },
                        ],
                        "operator": 2,
                        "paramType": 0,
                      },
                      {
                        "operator": 15,
                        "paramType": 1,
                      },
                      {
                        "operator": 0,
                        "paramType": 1,
                      },
                      {
                        "operator": 0,
                        "paramType": 1,
                      },
                      {
                        "operator": 0,
                        "paramType": 1,
                      },
                      {
                        "operator": 0,
                        "paramType": 1,
                      },
                      {
                        "operator": 0,
                        "paramType": 1,
                      },
                      {
                        "operator": 0,
                        "paramType": 1,
                      },
                      {
                        "operator": 0,
                        "paramType": 1,
                      },
                      {
                        "operator": 0,
                        "paramType": 1,
                      },
                      {
                        "operator": 0,
                        "paramType": 1,
                      },
                    ],
                    "operator": 5,
                    "paramType": 3,
                  },
                  {
                    "operator": 0,
                    "paramType": 1,
                  },
                  {
                    "operator": 0,
                    "paramType": 1,
                  },
                ],
                "operator": 5,
                "paramType": 5,
              },
              "delegatecall": true,
              "selector": "0x569d3489",
              "targetAddress": "0x23da9ade38e4477b23770ded512fd37b12381fab",
            },
            {
              "condition": {
                "children": [
                  {
                    "children": [
                      {
                        "children": [
                          {
                            "compValue": "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                            "operator": 16,
                            "paramType": 1,
                          },
                          {
                            "compValue": "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                            "operator": 16,
                            "paramType": 1,
                          },
                        ],
                        "operator": 2,
                        "paramType": 0,
                      },
                      {
                        "children": [
                          {
                            "compValue": "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                            "operator": 16,
                            "paramType": 1,
                          },
                          {
                            "compValue": "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                            "operator": 16,
                            "paramType": 1,
                          },
                        ],
                        "operator": 2,
                        "paramType": 0,
                      },
                      {
                        "operator": 15,
                        "paramType": 1,
                      },
                      {
                        "operator": 0,
                        "paramType": 1,
                      },
                      {
                        "operator": 0,
                        "paramType": 1,
                      },
                      {
                        "operator": 0,
                        "paramType": 1,
                      },
                      {
                        "operator": 0,
                        "paramType": 1,
                      },
                      {
                        "operator": 0,
                        "paramType": 1,
                      },
                      {
                        "operator": 0,
                        "paramType": 1,
                      },
                      {
                        "operator": 0,
                        "paramType": 1,
                      },
                      {
                        "operator": 0,
                        "paramType": 1,
                      },
                      {
                        "operator": 0,
                        "paramType": 1,
                      },
                    ],
                    "operator": 5,
                    "paramType": 3,
                  },
                ],
                "operator": 5,
                "paramType": 5,
              },
              "delegatecall": true,
              "selector": "0x5a66c223",
              "targetAddress": "0x23da9ade38e4477b23770ded512fd37b12381fab",
            },
          ],
          "queryParams": {
            "buy": [
              "0x6B175474E89094C44Da98b954EedeAC495271d0F",
              "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            ],
            "sell": [
              "0x6B175474E89094C44Da98b954EedeAC495271d0F",
              "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            ],
          },
          "serverUrl": "https://kit.karpatkey.com/api/v1",
          "uri": "https://kit.karpatkey.com/api/v1/permissions/eth/cowswap/swap?buy=0x6B175474E89094C44Da98b954EedeAC495271d0F%2C0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&sell=0x6B175474E89094C44Da98b954EedeAC495271d0F%2C0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        },
      ]
    `)
  })

  it("returns the remaining, un-annotated permissions", async () => {
    const permissions = [
      {
        targetAddress: "0xc0ffee254729296a45a3885639AC7E10F9d54979",
        selector: "0x1234abcd",
      },
      ...permissionsForPreset1,
    ] as const
    const result = await processAnnotations(permissions, [annotation1])
    expect(result.permissions).toEqual([
      {
        targetAddress: "0xc0ffee254729296a45a3885639ac7e10f9d54979",
        selector: "0x1234abcd",
        condition: undefined,
        send: false,
        delegatecall: false,
      },
    ])
  })
})

const annotation1 = {
  uri: "https://kit.karpatkey.com/api/v1/permissions/eth/cowswap/swap?buy=0x6B175474E89094C44Da98b954EedeAC495271d0F%2C0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&sell=0x6B175474E89094C44Da98b954EedeAC495271d0F%2C0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  schema: "https://kit.karpatkey.com/api/v1/openapi.json",
}

const permissionsForPreset1: PermissionCoerced[] = [
  {
    targetAddress: "0x6b175474e89094c44da98b954eedeac495271d0f",
    selector: "0x095ea7b3",
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
        { paramType: 1, operator: 0 },
      ],
    },
  },
  {
    targetAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    selector: "0x095ea7b3",
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
        { paramType: 1, operator: 0 },
      ],
    },
  },
  {
    targetAddress: "0x23da9ade38e4477b23770ded512fd37b12381fab",
    selector: "0x569d3489",
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
                    "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                },
                {
                  paramType: 1,
                  operator: 16,
                  compValue:
                    "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
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
                    "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                },
                {
                  paramType: 1,
                  operator: 16,
                  compValue:
                    "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                },
              ],
            },
            { paramType: 1, operator: 15 },
            { paramType: 1, operator: 0 },
            { paramType: 1, operator: 0 },
            { paramType: 1, operator: 0 },
            { paramType: 1, operator: 0 },
            { paramType: 1, operator: 0 },
            { paramType: 1, operator: 0 },
            { paramType: 1, operator: 0 },
            { paramType: 1, operator: 0 },
            { paramType: 1, operator: 0 },
          ],
        },
        { paramType: 1, operator: 0 },
        { paramType: 1, operator: 0 },
      ],
    },
    delegatecall: true,
  },
  {
    targetAddress: "0x23da9ade38e4477b23770ded512fd37b12381fab",
    selector: "0x5a66c223",
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
                    "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                },
                {
                  paramType: 1,
                  operator: 16,
                  compValue:
                    "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
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
                    "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                },
                {
                  paramType: 1,
                  operator: 16,
                  compValue:
                    "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                },
              ],
            },
            { paramType: 1, operator: 15 },
            { paramType: 1, operator: 0 },
            { paramType: 1, operator: 0 },
            { paramType: 1, operator: 0 },
            { paramType: 1, operator: 0 },
            { paramType: 1, operator: 0 },
            { paramType: 1, operator: 0 },
            { paramType: 1, operator: 0 },
            { paramType: 1, operator: 0 },
            { paramType: 1, operator: 0 },
          ],
        },
      ],
    },
    delegatecall: true,
  },
]
