import { processAnnotations } from "./annotations"
import { Preset } from "./types"

describe("processAnnotations()", () => {
  it("returns the original set of permissions if no annotations are given", async () => {
    const permissions = [
      {
        targetAddress: "0xc0ffee254729296a45a3885639AC7E10F9d54979",
        selector: "0x1234abcd",
      },
    ]
    const result = await processAnnotations(permissions, [])
    expect(result.permissions).toEqual(permissions)
  })

  it("returns presets (resolved annotated permissions)", async () => {
    const result = await processAnnotations(preset1.permissions, [annotation1])
    expect(result.presets).toEqual([preset1])
  })

  it("returns the remaining, un-annotated permissions", async () => {
    const permissions = [
      {
        targetAddress: "0xc0ffee254729296a45a3885639AC7E10F9d54979",
        selector: "0x1234abcd",
      },
      ...preset1.permissions,
    ]
    const result = await processAnnotations(permissions, [annotation1])
    expect(result.permissions).toEqual([
      {
        targetAddress: "0xc0ffee254729296a45a3885639AC7E10F9d54979",
        selector: "0x1234abcd",
      },
    ])
  })
})

const annotation1 = {
  uri: "https://kit.karpatkey.com/api/v1/permissions/gor/cowswap/swap?buy=0x6B175474E89094C44Da98b954EedeAC495271d0F%2C0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&sell=0x6B175474E89094C44Da98b954EedeAC495271d0F%2C0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  schema: "https://kit.karpatkey.com/api/v1/openapi.json",
}

const preset1: Preset = {
  permissions: [
    {
      targetAddress: "0xdeb83d81d4a9758a7baec5749da863c409ea6c6b",
      selector: "0x83afcefd",
      condition: {
        paramType: 0,
        operator: 1,
        children: [
          {
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
              { paramType: 1, operator: 0 },
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
    },
  ],
  uri: "https://kit.karpatkey.com/api/v1/permissions/gor/cowswap/swap?buy=0x6B175474E89094C44Da98b954EedeAC495271d0F%2C0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&sell=0x6B175474E89094C44Da98b954EedeAC495271d0F%2C0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  serverUrl: "https://kit.karpatkey.com/api/v1",
  apiInfo: {
    version: "1.0.0",
    title: "DeFi Kit",
    description:
      "Permissions for Zodiac Roles covering interactions with DeFi protocols",
  },

  pathKey: "/permissions/gor/cowswap/swap",
  operation: {
    summary: "Permissions for making swaps on cowswap",
    tags: ["cowswap permissions"],
    parameters: [
      {
        schema: {
          type: "array",
          items: {
            type: "string",
            deprecated: false,
            nullable: false,
          },
          deprecated: false,
          nullable: false,
        },
        required: false,
        name: "sell",
        in: "query",
        explode: false,
        style: "form",
        allowEmptyValue: false,
        allowReserved: false,
      },
      {
        schema: {
          type: "array",
          items: {
            type: "string",
            deprecated: false,
            nullable: false,
          },
          deprecated: false,
          nullable: false,
        },
        required: false,
        name: "buy",
        in: "query",
        explode: false,
        style: "form",
        allowEmptyValue: false,
        allowReserved: false,
      },
    ],
  },
  pathParams: {},
  queryParams: {
    buy: [
      "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    ],
    sell: [
      "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    ],
  },
}
