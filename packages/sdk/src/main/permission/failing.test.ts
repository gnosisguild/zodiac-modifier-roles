import { expect, it, suite } from "vitest"

import { validatePresets } from "./validatePresets"

suite.only("failing", () => {
  it("should return one preset - FULL", async () => {
    // dumping the preset entirely, and all permissions from on chain
    const { presets } = validatePresets({
      presets: [_sparkPreset()],
      permissions: _allOnChainPermissions(),
    })

    expect(presets).toHaveLength(1)
  })

  it("should return one preset - TRIMMED", async () => {
    // just the two simple permissions from the preset and form on chain enough to make it fail
    const { presets } = validatePresets({
      presets: [
        {
          permissions: [
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
                      "0x000000000000000000000000c13e21b648a5ee794902342038ff3adab66be987",
                  },
                  { paramType: 1, operator: 0 },
                ],
              },
            },
          ],
        },
      ],
      permissions: [
        {
          // yes
          targetAddress: "0x6b175474e89094c44da98b954eedeac495271d0f",
          selector: "0x095ea7b3",
          send: false,
          delegatecall: false,
          condition: {
            operator: 5,
            paramType: 5,
            children: [
              {
                operator: 2,
                paramType: 0,
                children: [
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x000000000000000000000000c92e8bdf79f0507f65a392b0ab4667716bfe0110",
                  },
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x0000000000000000000000004aa42145aa6ebf72e164c9bbc74fbd3788045016",
                  },
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x000000000000000000000000373238337bfe1146fb49989fc222523f83081ddb",
                  },
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x000000000000000000000000bebc44782c7db0a1a60cb6fe97d0b483032ff1c7",
                  },
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x00000000000000000000000083f20f44975d03b1b09e64809b757c47f942beea",
                  },
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x000000000000000000000000d3b5b60020504bc3489d6949d545893982ba3011",
                  },
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x0000000000000000000000003d4cc8a61c7528fd86c55cfe061a78dcba48edd1",
                  },
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x00000000000000000000000010e6593cdda8c58a1d0f14c5164b376352a55f2f",
                  },
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x000000000000000000000000c13e21b648a5ee794902342038ff3adab66be987",
                  },
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x00000000000000000000000087870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
                  },
                ],
              },
            ],
          },
        },
      ],
    })

    expect(presets).toHaveLength(1)
  })
})

function _sparkPreset(): any {
  return {
    permissions: [
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
                "0x000000000000000000000000c13e21b648a5ee794902342038ff3adab66be987",
            },
            { paramType: 1, operator: 0 },
          ],
        },
      },
      {
        // yes
        targetAddress: "0xc13e21b648a5ee794902342038ff3adab66be987",
        selector: "0xa415bcad",
        condition: {
          paramType: 5,
          operator: 5,
          children: [
            {
              paramType: 1,
              operator: 16,
              compValue:
                "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
            },
            { paramType: 1, operator: 0 },
            { paramType: 1, operator: 0 },
            { paramType: 1, operator: 0 },
            { paramType: 1, operator: 15 },
          ],
        },
      },
      {
        // yes
        targetAddress: "0xc13e21b648a5ee794902342038ff3adab66be987",
        selector: "0x573ade81",
        condition: {
          paramType: 5,
          operator: 5,
          children: [
            {
              paramType: 1,
              operator: 16,
              compValue:
                "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
            },
            { paramType: 1, operator: 0 },
            { paramType: 1, operator: 0 },
            { paramType: 1, operator: 15 },
          ],
        },
      },
    ],
    uri: "https://kit.karpatkey.com/api/v1/permissions/eth/spark/borrow?targets=DAI",
    serverUrl: "https://kit.karpatkey.com/api/v1",
    apiInfo: {
      version: "1.0.0",
      title: "DeFi Kit",
      description:
        "Permissions for Zodiac Roles covering interactions with DeFi protocols",
      contact: { name: "karpatkey", url: "https://kit.karpatkey.com" },
    },
    path: "/permissions/eth/spark/borrow",
    params: {},
    query: { targets: ["DAI"] },
    operation: {
      summary: "Borrow the specified tokens on spark",
      tags: ["spark permissions"],
      parameters: [
        {
          schema: {
            type: "array",
            items: {
              type: "string",
              enum: [
                "ETH",
                "DAI",
                "sDAI",
                "USDC",
                "WETH",
                "wstETH",
                "WBTC",
                "GNO",
                "rETH",
                "USDT",
                "weETH",
                "cbBTC",
                "sUSDS",
                "USDS",
                "LBTC",
                "tBTC",
                "ezETH",
                "rsETH",
                "0x6B175474E89094C44Da98b954EedeAC495271d0F",
                "0x83F20F44975D03b1b09e64809B757c47f942BEeA",
                "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
                "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
                "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
                "0x6810e776880C02933D47DB1b9fc05908e5386b96",
                "0xae78736Cd615f374D3085123A210448E74Fc6393",
                "0xdAC17F958D2ee523a2206206994597C13D831ec7",
                "0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee",
                "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
                "0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD",
                "0xdC035D45d973E3EC169d2276DDab16f1e407384F",
                "0x8236a87084f8B84306f72007F36F2618A5634494",
                "0x18084fbA666a33d37592fA2633fD49a74DD93a88",
                "0xbf5495Efe5DB9ce00f80364C8B423567e58d2110",
                "0xA1290d69c65A6Fe4DF752f95823fae25cB99e5A7",
              ],
            },
          },
          required: true,
          name: "targets",
          in: "query",
          explode: false,
        },
      ],
    },
  }
}
function _allOnChainPermissions(): any {
  return [
    {
      targetAddress: "0x0a992d191deec32afe36203ad87d7d289a738f81",
      selector: "0x57ecfd28",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 2,
            paramType: 0,
            children: [
              {
                operator: 1,
                paramType: 0,
                children: [
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x008effffffffffffffffffff00000000007837caf62653d097ff850000000000",
                  },
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x0000ffffffffffffffffffffffff000000000000000000000200000000000000",
                  },
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x004affffffffffffffffffff0000000000038b25adec7066af31550000000000",
                  },
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x0020ffffffffffffffffffff00000000002b4069517957735be00c0000000000",
                  },
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x00aeffffffffffffffffffff00000000005afd06847cc95f5cae1b0000000000",
                  },
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x00e4ffffffffffffffffffff0000000000846e7f810e08f1e2af2c0000000000",
                  },
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x0040ffffffffffffffffffff0000000000bd3fa81b58ba92a821360000000000",
                  },
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x002affffffffffffffffffff0000000000ee0fadae88a26365528f0000000000",
                  },
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x00a4ffffffffffffffffffff0000000000846e7f810e08f1e2af2c0000000000",
                  },
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x0084ffffffffffffffffffff00000000000b2c639c533813f4aa9d0000000000",
                  },
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x00eeffffffffffffffffffff00000000005afd06847cc95f5cae1b0000000000",
                  },
                ],
              },
              {
                operator: 1,
                paramType: 0,
                children: [
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x004affffffffffffffffffff0000000000038b25adec7066af31550000000000",
                  },
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x0020ffffffffffffffffffff00000000001682ae6375c4e4a97e4b0000000000",
                  },
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x00aeffffffffffffffffffff00000000005afd06847cc95f5cae1b0000000000",
                  },
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x00e4ffffffffffffffffffff0000000000846e7f810e08f1e2af2c0000000000",
                  },
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x0000ffffffffffffffffffffffff000000000000000000000600000000000000",
                  },
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x0040ffffffffffffffffffff0000000000bd3fa81b58ba92a821360000000000",
                  },
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x00a4ffffffffffffffffffff0000000000846e7f810e08f1e2af2c0000000000",
                  },
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x0084ffffffffffffffffffff0000000000833589fcd6edb6e08f4c0000000000",
                  },
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x00eeffffffffffffffffffff00000000005afd06847cc95f5cae1b0000000000",
                  },
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x008effffffffffffffffffff00000000007c32d4f71b54bda029130000000000",
                  },
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x002affffffffffffffffffff0000000000583bc394c861a46d89620000000000",
                  },
                ],
              },
              {
                operator: 1,
                paramType: 0,
                children: [
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x008effffffffffffffffffff000000000027c5edb3a432268e58310000000000",
                  },
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x004affffffffffffffffffff0000000000038b25adec7066af31550000000000",
                  },
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x00aeffffffffffffffffffff00000000005afd06847cc95f5cae1b0000000000",
                  },
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x0020ffffffffffffffffffff000000000019330d10d9cc8751218e0000000000",
                  },
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x00e4ffffffffffffffffffff0000000000846e7f810e08f1e2af2c0000000000",
                  },
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x0040ffffffffffffffffffff0000000000bd3fa81b58ba92a821360000000000",
                  },
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x00a4ffffffffffffffffffff0000000000846e7f810e08f1e2af2c0000000000",
                  },
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x0084ffffffffffffffffffff0000000000af88d065e77c8cc223930000000000",
                  },
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x002affffffffffffffffffff0000000000af51e8885d058642e08a0000000000",
                  },
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x00eeffffffffffffffffffff00000000005afd06847cc95f5cae1b0000000000",
                  },
                  {
                    operator: 21,
                    paramType: 2,
                    compValue:
                      "0x0000ffffffffffffffffffffffff000000000000000000000300000000000000",
                  },
                ],
              },
            ],
          },
        ],
      },
    },
    {
      targetAddress: "0x10e6593cdda8c58a1d0f14c5164b376352a55f2f",
      selector: "0x58a997f6",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 16,
            paramType: 1,
            compValue:
              "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
          },
          {
            operator: 16,
            paramType: 1,
            compValue:
              "0x000000000000000000000000da10009cbd5d07dd0cecc66161fc93d7c9000da1",
          },
        ],
      },
    },
    {
      targetAddress: "0x10e6593cdda8c58a1d0f14c5164b376352a55f2f",
      selector: "0x838b2520",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 16,
            paramType: 1,
            compValue:
              "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
          },
          {
            operator: 16,
            paramType: 1,
            compValue:
              "0x000000000000000000000000da10009cbd5d07dd0cecc66161fc93d7c9000da1",
          },
          { operator: 15, paramType: 1 },
        ],
      },
    },
    {
      targetAddress: "0x1b0e765f6224c21223aea2af16c1c46e38885a40",
      selector: "0xb7034f7e",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          { operator: 0, paramType: 1 },
          { operator: 15, paramType: 1 },
        ],
      },
    },
    {
      targetAddress: "0x23da9ade38e4477b23770ded512fd37b12381fab",
      selector: "0x569d3489",
      send: false,
      delegatecall: true,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 5,
            paramType: 3,
            children: [
              {
                operator: 2,
                paramType: 0,
                children: [
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                  },
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x000000000000000000000000c00e94cb662c3520282e6f5717214004a7f26888",
                  },
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x00000000000000000000000083f20f44975d03b1b09e64809b757c47f942beea",
                  },
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                  },
                ],
              },
              {
                operator: 2,
                paramType: 0,
                children: [
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                  },
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x00000000000000000000000083f20f44975d03b1b09e64809b757c47f942beea",
                  },
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                  },
                ],
              },
              { operator: 15, paramType: 1 },
              { operator: 0, paramType: 1 },
              { operator: 0, paramType: 1 },
              { operator: 0, paramType: 1 },
              { operator: 0, paramType: 1 },
              { operator: 0, paramType: 1 },
              { operator: 0, paramType: 1 },
              { operator: 0, paramType: 1 },
              { operator: 0, paramType: 1 },
              { operator: 0, paramType: 1 },
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
    },
    {
      targetAddress: "0x373238337bfe1146fb49989fc222523f83081ddb",
      selector: "0x3b4da69f",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [{ operator: 15, paramType: 1 }],
      },
    },
    {
      targetAddress: "0x373238337bfe1146fb49989fc222523f83081ddb",
      selector: "0xeb0dff66",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [{ operator: 15, paramType: 1 }],
      },
    },
    {
      targetAddress: "0x373238337bfe1146fb49989fc222523f83081ddb",
      selector: "0xef693bed",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [{ operator: 15, paramType: 1 }],
      },
    },
    {
      targetAddress: "0x3d4cc8a61c7528fd86c55cfe061a78dcba48edd1",
      selector: "0xdeace8f5",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 2,
            paramType: 0,
            children: [
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x0000000000000000000000000000000000000000000000000000000000000064",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x000000000000000000000000000000000000000000000000000000000000000a",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x000000000000000000000000000000000000000000000000000000000000a4b1",
              },
            ],
          },
          { operator: 15, paramType: 1 },
          { operator: 0, paramType: 1 },
          { operator: 0, paramType: 1 },
          { operator: 0, paramType: 1 },
          {
            operator: 16,
            paramType: 1,
            compValue:
              "0x00000000000000000000000010720f58cf4a22fa540ff10430fd967d2ef102de",
          },
        ],
      },
    },
    {
      targetAddress: "0x4370d3b6c9588e02ce9d22e684387859c7ff5b34",
      selector: "0x236300dc",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 0,
            paramType: 4,
            children: [{ operator: 0, paramType: 1 }],
          },
          { operator: 0, paramType: 1 },
          { operator: 15, paramType: 1 },
        ],
      },
    },
    {
      targetAddress: "0x4370d3b6c9588e02ce9d22e684387859c7ff5b34",
      selector: "0xbb492bf5",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 0,
            paramType: 4,
            children: [{ operator: 0, paramType: 1 }],
          },
          { operator: 15, paramType: 1 },
        ],
      },
    },
    {
      targetAddress: "0x4aa42145aa6ebf72e164c9bbc74fbd3788045016",
      selector: "0x01e4f53a",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [{ operator: 15, paramType: 1 }],
      },
    },
    {
      targetAddress: "0x4aa42145aa6ebf72e164c9bbc74fbd3788045016",
      selector: "0x3f7658fd",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 1,
            paramType: 0,
            children: [
              {
                operator: 21,
                paramType: 2,
                compValue:
                  "0x0054ffffffffffffffffffff00000000004aa42145aa6ebf72e1640000000000",
              },
              {
                operator: 21,
                paramType: 2,
                compValue:
                  "0x005effffffffffffffffffff0000000000c9bbc74fbd37880450160000000000",
              },
              {
                operator: 21,
                paramType: 2,
                compValue:
                  "0x0000ffffffffffffffffffff0000000000846e7f810e08f1e2af2c0000000000",
              },
              {
                operator: 21,
                paramType: 2,
                compValue:
                  "0x000affffffffffffffffffff00000000005afd06847cc95f5cae1b0000000000",
              },
            ],
          },
        ],
      },
    },
    {
      targetAddress: "0x4c36d2919e407f0cc2ee3c993ccf8ac26d9ce64e",
      selector: "0x23caab49",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 1,
            paramType: 0,
            children: [
              {
                operator: 21,
                paramType: 2,
                compValue:
                  "0x0020ffffffffffffffffffff0000000000f6a78083ca3e2a662d6d0000000000",
              },
              {
                operator: 21,
                paramType: 2,
                compValue:
                  "0x000effffffffffffffffffff00000000001e345b30c6bebf70ebe70000000000",
              },
              {
                operator: 21,
                paramType: 2,
                compValue:
                  "0x0051ffffffff0000000000000000000000272255bb0000000000000000000000",
              },
              {
                operator: 21,
                paramType: 2,
                compValue:
                  "0x006bffffffffffffffffffff00000000009d4a2e9eb0ce3606eb480000000000",
              },
              {
                operator: 21,
                paramType: 2,
                compValue:
                  "0x002affffffffffffffffffff0000000000d1703c939c8ace2e268d0000000000",
              },
              {
                operator: 21,
                paramType: 2,
                compValue:
                  "0x008bffffffffffffffffffff00000000005afd06847cc95f5cae1b0000000000",
              },
              {
                operator: 21,
                paramType: 2,
                compValue:
                  "0x0004ffffffffffffffffffff0000000000a7823d6f1e31569f51860000000000",
              },
              {
                operator: 21,
                paramType: 2,
                compValue:
                  "0x003effffffffffffffffffff0000000000c10a214be5109a6556710000000000",
              },
              {
                operator: 21,
                paramType: 2,
                compValue:
                  "0x0034ffffffffffffffffffff000000000088ad09518695c6c3712a0000000000",
              },
              {
                operator: 21,
                paramType: 2,
                compValue:
                  "0x0061ffffffffffffffffffff0000000000a0b86991c6218b36c1d10000000000",
              },
              {
                operator: 21,
                paramType: 2,
                compValue:
                  "0x004cffffffffff00000000000000000000010180640100000000000000000000",
              },
              {
                operator: 21,
                paramType: 2,
                compValue:
                  "0x0048ffffffff0000000000000000000000000927c00000000000000000000000",
              },
              {
                operator: 21,
                paramType: 2,
                compValue:
                  "0x0081ffffffffffffffffffff0000000000846e7f810e08f1e2af2c0000000000",
              },
              {
                operator: 21,
                paramType: 2,
                compValue:
                  "0x0000ffffffff0000000000000000000000000500000000000000000000000000",
              },
            ],
          },
        ],
      },
    },
    {
      targetAddress: "0x6b175474e89094c44da98b954eedeac495271d0f",
      selector: "0x095ea7b3",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 2,
            paramType: 0,
            children: [
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x000000000000000000000000c92e8bdf79f0507f65a392b0ab4667716bfe0110",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x0000000000000000000000004aa42145aa6ebf72e164c9bbc74fbd3788045016",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x000000000000000000000000373238337bfe1146fb49989fc222523f83081ddb",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x000000000000000000000000bebc44782c7db0a1a60cb6fe97d0b483032ff1c7",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x00000000000000000000000083f20f44975d03b1b09e64809b757c47f942beea",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x000000000000000000000000d3b5b60020504bc3489d6949d545893982ba3011",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x0000000000000000000000003d4cc8a61c7528fd86c55cfe061a78dcba48edd1",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x00000000000000000000000010e6593cdda8c58a1d0f14c5164b376352a55f2f",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x000000000000000000000000c13e21b648a5ee794902342038ff3adab66be987",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x00000000000000000000000087870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
              },
            ],
          },
        ],
      },
    },
    {
      targetAddress: "0x7e77461ca2a9d82d26fd5e0da2243bf72ea45747",
      selector: "0xa134ce5b",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 2,
            paramType: 0,
            children: [
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x0000000000000000000000000000000000000000000000000000000000002105",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x000000000000000000000000000000000000000000000000000000000000000a",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x000000000000000000000000000000000000000000000000000000000000a4b1",
              },
            ],
          },
          { operator: 15, paramType: 1 },
        ],
      },
    },
    {
      targetAddress: "0x83f20f44975d03b1b09e64809b757c47f942beea",
      selector: "0x095ea7b3",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 2,
            paramType: 0,
            children: [
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x000000000000000000000000c92e8bdf79f0507f65a392b0ab4667716bfe0110",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x000000000000000000000000c13e21b648a5ee794902342038ff3adab66be987",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x00000000000000000000000087870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
              },
            ],
          },
        ],
      },
    },
    {
      targetAddress: "0x83f20f44975d03b1b09e64809b757c47f942beea",
      selector: "0x6e553f65",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          { operator: 0, paramType: 1 },
          { operator: 15, paramType: 1 },
        ],
      },
    },
    {
      targetAddress: "0x83f20f44975d03b1b09e64809b757c47f942beea",
      selector: "0xb460af94",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          { operator: 0, paramType: 1 },
          { operator: 15, paramType: 1 },
          { operator: 15, paramType: 1 },
        ],
      },
    },
    {
      targetAddress: "0x83f20f44975d03b1b09e64809b757c47f942beea",
      selector: "0xba087652",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          { operator: 0, paramType: 1 },
          { operator: 15, paramType: 1 },
          { operator: 15, paramType: 1 },
        ],
      },
    },
    {
      targetAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
      selector: "0x573ade81",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 2,
            paramType: 0,
            children: [
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              },
            ],
          },
          { operator: 0, paramType: 1 },
          { operator: 0, paramType: 1 },
          { operator: 15, paramType: 1 },
        ],
      },
    },
    {
      targetAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
      selector: "0x5a3b74b9",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 2,
            paramType: 0,
            children: [
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x00000000000000000000000083f20f44975d03b1b09e64809b757c47f942beea",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              },
            ],
          },
        ],
      },
    },
    {
      targetAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
      selector: "0x617ba037",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 2,
            paramType: 0,
            children: [
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x00000000000000000000000083f20f44975d03b1b09e64809b757c47f942beea",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              },
            ],
          },
          { operator: 0, paramType: 1 },
          { operator: 15, paramType: 1 },
        ],
      },
    },
    {
      targetAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
      selector: "0x69328dec",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 2,
            paramType: 0,
            children: [
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x00000000000000000000000083f20f44975d03b1b09e64809b757c47f942beea",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              },
            ],
          },
          { operator: 0, paramType: 1 },
          { operator: 15, paramType: 1 },
        ],
      },
    },
    {
      targetAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
      selector: "0x94ba89a2",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 2,
            paramType: 0,
            children: [
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              },
            ],
          },
        ],
      },
    },
    {
      targetAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
      selector: "0xa415bcad",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 2,
            paramType: 0,
            children: [
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              },
            ],
          },
          { operator: 0, paramType: 1 },
          { operator: 0, paramType: 1 },
          { operator: 0, paramType: 1 },
          { operator: 15, paramType: 1 },
        ],
      },
    },
    {
      targetAddress: "0x88ad09518695c6c3712ac10a214be5109a655671",
      selector: "0xd7405481",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 16,
            paramType: 1,
            compValue:
              "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          },
          {
            operator: 16,
            paramType: 1,
            compValue:
              "0x0000000000000000000000000392a2f5ac47388945d8c84212469f545fae52b2",
          },
          { operator: 0, paramType: 1 },
          {
            operator: 16,
            paramType: 2,
            compValue:
              "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000020000000000000000000000000846e7f810e08f1e2af2c5afd06847cc95f5cae1b",
          },
        ],
      },
    },
    {
      targetAddress: "0x99c9fc46f92e8a1c0dec1b1747d010903e884be1",
      selector: "0x58a997f6",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 16,
            paramType: 1,
            compValue:
              "0x000000000000000000000000c00e94cb662c3520282e6f5717214004a7f26888",
          },
          {
            operator: 16,
            paramType: 1,
            compValue:
              "0x0000000000000000000000007e7d4467112689329f7e06571ed0e8cbad4910ee",
          },
        ],
      },
    },
    {
      targetAddress: "0x99c9fc46f92e8a1c0dec1b1747d010903e884be1",
      selector: "0x838b2520",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 16,
            paramType: 1,
            compValue:
              "0x000000000000000000000000c00e94cb662c3520282e6f5717214004a7f26888",
          },
          {
            operator: 16,
            paramType: 1,
            compValue:
              "0x0000000000000000000000007e7d4467112689329f7e06571ed0e8cbad4910ee",
          },
          { operator: 15, paramType: 1 },
        ],
      },
    },
    {
      targetAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      selector: "0x095ea7b3",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 2,
            paramType: 0,
            children: [
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x000000000000000000000000c92e8bdf79f0507f65a392b0ab4667716bfe0110",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x00000000000000000000000088ad09518695c6c3712ac10a214be5109a655671",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x000000000000000000000000c3d688b66703497daa19211eedff47f25384cdc3",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x000000000000000000000000bd3fa81b58ba92a82136038b25adec7066af3155",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x000000000000000000000000bebc44782c7db0a1a60cb6fe97d0b483032ff1c7",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x0000000000000000000000007e77461ca2a9d82d26fd5e0da2243bf72ea45747",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x000000000000000000000000bbbbbbbbbb9cc5e90e3b3af64bdaf62c37eeffcb",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x000000000000000000000000c13e21b648a5ee794902342038ff3adab66be987",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x00000000000000000000000087870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
              },
            ],
          },
        ],
      },
    },
    {
      targetAddress: "0xa3a7b6f88361f48403514059f1f16c8e78d60eec",
      selector: "0xd2ce7d65",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 16,
            paramType: 1,
            compValue:
              "0x000000000000000000000000c00e94cb662c3520282e6f5717214004a7f26888",
          },
          { operator: 15, paramType: 1 },
        ],
      },
    },
    {
      targetAddress: "0xbbbbbbbbbb9cc5e90e3b3af64bdaf62c37eeffcb",
      selector: "0x5c2bea49",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 2,
            paramType: 0,
            children: [
              {
                operator: 5,
                paramType: 3,
                children: [
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                  },
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x0000000000000000000000007f39c581f595b53c5cb19bd0b3f8da6c935e2ca0",
                  },
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x00000000000000000000000048f7e36eb6b826b2df4b2e630b62cd25e89e40e2",
                  },
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x000000000000000000000000870ac11d48b15db9a138cf899d20f13f79ba00bc",
                  },
                  { operator: 0, paramType: 1 },
                ],
              },
              {
                operator: 5,
                paramType: 3,
                children: [
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                  },
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x0000000000000000000000002260fac5e5542a773aa44fbcfedf7c193bc2c599",
                  },
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x000000000000000000000000dddd770badd886df3864029e4b377b5f6a2b6b83",
                  },
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x000000000000000000000000870ac11d48b15db9a138cf899d20f13f79ba00bc",
                  },
                  { operator: 0, paramType: 1 },
                ],
              },
            ],
          },
          { operator: 0, paramType: 1 },
          {
            operator: 16,
            paramType: 1,
            compValue:
              "0x0000000000000000000000000000000000000000000000000000000000000000",
          },
          { operator: 15, paramType: 1 },
          { operator: 15, paramType: 1 },
        ],
      },
    },
    {
      targetAddress: "0xbbbbbbbbbb9cc5e90e3b3af64bdaf62c37eeffcb",
      selector: "0xa99aad89",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 2,
            paramType: 0,
            children: [
              {
                operator: 5,
                paramType: 3,
                children: [
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                  },
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x0000000000000000000000007f39c581f595b53c5cb19bd0b3f8da6c935e2ca0",
                  },
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x00000000000000000000000048f7e36eb6b826b2df4b2e630b62cd25e89e40e2",
                  },
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x000000000000000000000000870ac11d48b15db9a138cf899d20f13f79ba00bc",
                  },
                  { operator: 0, paramType: 1 },
                ],
              },
              {
                operator: 5,
                paramType: 3,
                children: [
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                  },
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x0000000000000000000000002260fac5e5542a773aa44fbcfedf7c193bc2c599",
                  },
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x000000000000000000000000dddd770badd886df3864029e4b377b5f6a2b6b83",
                  },
                  {
                    operator: 16,
                    paramType: 1,
                    compValue:
                      "0x000000000000000000000000870ac11d48b15db9a138cf899d20f13f79ba00bc",
                  },
                  { operator: 0, paramType: 1 },
                ],
              },
            ],
          },
          { operator: 0, paramType: 1 },
          {
            operator: 16,
            paramType: 1,
            compValue:
              "0x0000000000000000000000000000000000000000000000000000000000000000",
          },
          { operator: 15, paramType: 1 },
          {
            operator: 16,
            paramType: 2,
            compValue:
              "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000",
          },
        ],
      },
    },
    {
      targetAddress: "0xbd3fa81b58ba92a82136038b25adec7066af3155",
      selector: "0x6fd3504e",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          { operator: 0, paramType: 1 },
          {
            operator: 2,
            paramType: 0,
            children: [
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x0000000000000000000000000000000000000000000000000000000000000002",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x0000000000000000000000000000000000000000000000000000000000000003",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x0000000000000000000000000000000000000000000000000000000000000006",
              },
            ],
          },
          {
            operator: 16,
            paramType: 1,
            compValue:
              "0x000000000000000000000000846e7f810e08f1e2af2c5afd06847cc95f5cae1b",
          },
          {
            operator: 16,
            paramType: 1,
            compValue:
              "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          },
        ],
      },
    },
    {
      targetAddress: "0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7",
      selector: "0x3df02124",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 2,
            paramType: 0,
            children: [
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x0000000000000000000000000000000000000000000000000000000000000000",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x0000000000000000000000000000000000000000000000000000000000000001",
              },
            ],
          },
          {
            operator: 2,
            paramType: 0,
            children: [
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x0000000000000000000000000000000000000000000000000000000000000000",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x0000000000000000000000000000000000000000000000000000000000000001",
              },
            ],
          },
        ],
      },
    },
    {
      targetAddress: "0xc00e94cb662c3520282e6f5717214004a7f26888",
      selector: "0x095ea7b3",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 2,
            paramType: 0,
            children: [
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x00000000000000000000000099c9fc46f92e8a1c0dec1b1747d010903e884be1",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x000000000000000000000000c92e8bdf79f0507f65a392b0ab4667716bfe0110",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x000000000000000000000000a3a7b6f88361f48403514059f1f16c8e78d60eec",
              },
            ],
          },
        ],
      },
    },
    {
      targetAddress: "0xc13e21b648a5ee794902342038ff3adab66be987",
      selector: "0x573ade81",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 2,
            paramType: 0,
            children: [
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              },
            ],
          },
          { operator: 0, paramType: 1 },
          { operator: 0, paramType: 1 },
          { operator: 15, paramType: 1 },
        ],
      },
    },
    {
      targetAddress: "0xc13e21b648a5ee794902342038ff3adab66be987",
      selector: "0x5a3b74b9",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 16,
            paramType: 1,
            compValue:
              "0x00000000000000000000000083f20f44975d03b1b09e64809b757c47f942beea",
          },
        ],
      },
    },
    {
      targetAddress: "0xc13e21b648a5ee794902342038ff3adab66be987",
      selector: "0x617ba037",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 16,
            paramType: 1,
            compValue:
              "0x00000000000000000000000083f20f44975d03b1b09e64809b757c47f942beea",
          },
          { operator: 0, paramType: 1 },
          { operator: 15, paramType: 1 },
        ],
      },
    },
    {
      targetAddress: "0xc13e21b648a5ee794902342038ff3adab66be987",
      selector: "0x69328dec",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 16,
            paramType: 1,
            compValue:
              "0x00000000000000000000000083f20f44975d03b1b09e64809b757c47f942beea",
          },
          { operator: 0, paramType: 1 },
          { operator: 15, paramType: 1 },
        ],
      },
    },
    {
      targetAddress: "0xc13e21b648a5ee794902342038ff3adab66be987",
      selector: "0xa415bcad",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 2,
            paramType: 0,
            children: [
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
              },
              {
                operator: 16,
                paramType: 1,
                compValue:
                  "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              },
            ],
          },
          { operator: 0, paramType: 1 },
          { operator: 0, paramType: 1 },
          { operator: 0, paramType: 1 },
          { operator: 15, paramType: 1 },
        ],
      },
    },
    {
      targetAddress: "0xc3d688b66703497daa19211eedff47f25384cdc3",
      selector: "0xf2b9fdb8",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 16,
            paramType: 1,
            compValue:
              "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          },
        ],
      },
    },
    {
      targetAddress: "0xc3d688b66703497daa19211eedff47f25384cdc3",
      selector: "0xf3fef3a3",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 16,
            paramType: 1,
            compValue:
              "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          },
        ],
      },
    },
    {
      targetAddress: "0xd3b5b60020504bc3489d6949d545893982ba3011",
      selector: "0xd2ce7d65",
      send: false,
      delegatecall: false,
      condition: {
        operator: 5,
        paramType: 5,
        children: [
          {
            operator: 16,
            paramType: 1,
            compValue:
              "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
          },
          { operator: 15, paramType: 1 },
        ],
      },
    },
  ]
}
