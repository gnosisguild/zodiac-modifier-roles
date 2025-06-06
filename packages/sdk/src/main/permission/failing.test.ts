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
    {
      // yes
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
      // yes
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
      // yes
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
      // yes
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
      //yes
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
  ]
}
