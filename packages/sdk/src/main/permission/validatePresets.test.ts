import { describe, it, suite, expect } from "vitest"

import { Target } from "zodiac-roles-deployments"

import { validatePresets } from "./validatePresets"
import { PermissionCoerced } from "./types"

suite("validatePreset()", () => {
  it.todo("confirms one preset")

  it.todo("excludes one preset")

  it.todo("does not return permissions included in confirmed presets")

  it.todo("does not exclude permissions included in excluded presets")

  it.todo("throws if permissions can't be merged")

  describe("From Real Examples", () => {
    it.only("from: https://roles.gnosisguild.org/eth:0xd1f7cd1c68a7f82ad86d320d2446eb706822f742/roles/MANAGER", () => {
      const result = validatePresets({
        targets: targets(),
        presets: annotations(),
      })

      expect(result.presets.map((p) => p.uri)).toEqual([
        "https://kit.karpatkey.com/api/v1/permissions/eth/aave_v3/borrow?targets=DAI",
        "https://kit.karpatkey.com/api/v1/permissions/eth/aave_v3/borrow?targets=USDC",
        "https://kit.kpk.io/api/v1/permissions/eth/cowswap/swap?sell=0xc00e94Cb662C3520282E6f5717214004A7f26888%2C0x6B175474E89094C44Da98b954EedeAC495271d0F%2C0x83F20F44975D03b1b09e64809B757c47f942BEeA%2C0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&buy=0x6B175474E89094C44Da98b954EedeAC495271d0F%2C0x83F20F44975D03b1b09e64809B757c47f942BEeA%2C0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        "https://kit.karpatkey.com/api/v1/permissions/eth/spark/deposit?targets=sDAI",
        "https://kit.karpatkey.com/api/v1/permissions/eth/spark/borrow?targets=DAI",
      ])

      function annotations(): {
        uri: string
        schema: string
        permissions: PermissionCoerced[]
      }[] {
        return [
          {
            uri: "https://kit.karpatkey.com/api/v1/permissions/eth/aave_v3/deposit?targets=DAI",
            schema: "https://kit.karpatkey.com/api/v1/openapi.json",
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
                        "0x00000000000000000000000087870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
                    },
                    { paramType: 1, operator: 0 },
                  ],
                },
              },
              {
                targetAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
                selector: "0x617ba037",
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
                    { paramType: 1, operator: 15 },
                    { paramType: 1, operator: 0 },
                  ],
                },
              },
              {
                targetAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
                selector: "0x69328dec",
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
                    { paramType: 1, operator: 15 },
                  ],
                },
              },
              {
                targetAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
                selector: "0x5a3b74b9",
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
                  ],
                },
              },
              {
                targetAddress: "0x8164cc65827dcfe994ab23944cbc90e0aa80bfcb",
                selector: "0x236300dc",
                condition: {
                  paramType: 5,
                  operator: 5,
                  children: [
                    {
                      paramType: 4,
                      operator: 0,
                      children: [{ paramType: 1, operator: 0 }],
                    },
                    { paramType: 1, operator: 0 },
                    { paramType: 1, operator: 15 },
                    { paramType: 1, operator: 0 },
                  ],
                },
              },
            ],
          },
          {
            uri: "https://kit.karpatkey.com/api/v1/permissions/eth/aave_v3/deposit?targets=sDAI",
            schema: "https://kit.karpatkey.com/api/v1/openapi.json",
            permissions: [
              {
                targetAddress: "0x83f20f44975d03b1b09e64809b757c47f942beea",
                selector: "0x095ea7b3",
                condition: {
                  paramType: 5,
                  operator: 5,
                  children: [
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x00000000000000000000000087870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
                    },
                    { paramType: 1, operator: 0 },
                  ],
                },
              },
              {
                targetAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
                selector: "0x617ba037",
                condition: {
                  paramType: 5,
                  operator: 5,
                  children: [
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x00000000000000000000000083f20f44975d03b1b09e64809b757c47f942beea",
                    },
                    { paramType: 1, operator: 0 },
                    { paramType: 1, operator: 15 },
                    { paramType: 1, operator: 0 },
                  ],
                },
              },
              {
                targetAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
                selector: "0x69328dec",
                condition: {
                  paramType: 5,
                  operator: 5,
                  children: [
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x00000000000000000000000083f20f44975d03b1b09e64809b757c47f942beea",
                    },
                    { paramType: 1, operator: 0 },
                    { paramType: 1, operator: 15 },
                  ],
                },
              },
              {
                targetAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
                selector: "0x5a3b74b9",
                condition: {
                  paramType: 5,
                  operator: 5,
                  children: [
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x00000000000000000000000083f20f44975d03b1b09e64809b757c47f942beea",
                    },
                    { paramType: 1, operator: 0 },
                  ],
                },
              },
              {
                targetAddress: "0x8164cc65827dcfe994ab23944cbc90e0aa80bfcb",
                selector: "0x236300dc",
                condition: {
                  paramType: 5,
                  operator: 5,
                  children: [
                    {
                      paramType: 4,
                      operator: 0,
                      children: [{ paramType: 1, operator: 0 }],
                    },
                    { paramType: 1, operator: 0 },
                    { paramType: 1, operator: 15 },
                    { paramType: 1, operator: 0 },
                  ],
                },
              },
            ],
          },
          {
            uri: "https://kit.karpatkey.com/api/v1/permissions/eth/aave_v3/deposit?targets=USDC",
            schema: "https://kit.karpatkey.com/api/v1/openapi.json",
            permissions: [
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
                        "0x00000000000000000000000087870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
                    },
                    { paramType: 1, operator: 0 },
                  ],
                },
              },
              {
                targetAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
                selector: "0x617ba037",
                condition: {
                  paramType: 5,
                  operator: 5,
                  children: [
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                    },
                    { paramType: 1, operator: 0 },
                    { paramType: 1, operator: 15 },
                    { paramType: 1, operator: 0 },
                  ],
                },
              },
              {
                targetAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
                selector: "0x69328dec",
                condition: {
                  paramType: 5,
                  operator: 5,
                  children: [
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                    },
                    { paramType: 1, operator: 0 },
                    { paramType: 1, operator: 15 },
                  ],
                },
              },
              {
                targetAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
                selector: "0x5a3b74b9",
                condition: {
                  paramType: 5,
                  operator: 5,
                  children: [
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                    },
                    { paramType: 1, operator: 0 },
                  ],
                },
              },
              {
                targetAddress: "0x8164cc65827dcfe994ab23944cbc90e0aa80bfcb",
                selector: "0x236300dc",
                condition: {
                  paramType: 5,
                  operator: 5,
                  children: [
                    {
                      paramType: 4,
                      operator: 0,
                      children: [{ paramType: 1, operator: 0 }],
                    },
                    { paramType: 1, operator: 0 },
                    { paramType: 1, operator: 15 },
                    { paramType: 1, operator: 0 },
                  ],
                },
              },
            ],
          },
          {
            uri: "https://kit.karpatkey.com/api/v1/permissions/eth/aave_v3/borrow?targets=DAI",
            schema: "https://kit.karpatkey.com/api/v1/openapi.json",
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
                        "0x00000000000000000000000087870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
                    },
                    { paramType: 1, operator: 0 },
                  ],
                },
              },
              {
                targetAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
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
                targetAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
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
          },
          {
            uri: "https://kit.karpatkey.com/api/v1/permissions/eth/aave_v3/borrow?targets=USDC",
            schema: "https://kit.karpatkey.com/api/v1/openapi.json",
            permissions: [
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
                        "0x00000000000000000000000087870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
                    },
                    { paramType: 1, operator: 0 },
                  ],
                },
              },
              {
                targetAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
                selector: "0xa415bcad",
                condition: {
                  paramType: 5,
                  operator: 5,
                  children: [
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                    },
                    { paramType: 1, operator: 0 },
                    { paramType: 1, operator: 0 },
                    { paramType: 1, operator: 0 },
                    { paramType: 1, operator: 15 },
                  ],
                },
              },
              {
                targetAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
                selector: "0x573ade81",
                condition: {
                  paramType: 5,
                  operator: 5,
                  children: [
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                    },
                    { paramType: 1, operator: 0 },
                    { paramType: 1, operator: 0 },
                    { paramType: 1, operator: 15 },
                  ],
                },
              },
            ],
          },
          {
            uri: "https://kit.kpk.io/api/v1/permissions/eth/cowswap/swap?sell=0xc00e94Cb662C3520282E6f5717214004A7f26888%2C0x6B175474E89094C44Da98b954EedeAC495271d0F%2C0x83F20F44975D03b1b09e64809B757c47f942BEeA%2C0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&buy=0x6B175474E89094C44Da98b954EedeAC495271d0F%2C0x83F20F44975D03b1b09e64809B757c47f942BEeA%2C0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            schema: "https://kit.karpatkey.com/api/v1/openapi.json",
            permissions: [
              {
                targetAddress: "0xc00e94cb662c3520282e6f5717214004a7f26888",
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
                targetAddress: "0x83f20f44975d03b1b09e64809b757c47f942beea",
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
                                "0x000000000000000000000000c00e94cb662c3520282e6f5717214004a7f26888",
                            },
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
                                "0x00000000000000000000000083f20f44975d03b1b09e64809b757c47f942beea",
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
                                "0x00000000000000000000000083f20f44975d03b1b09e64809b757c47f942beea",
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
                delegatecall: true,
              },
            ],
          },
          {
            uri: "https://kit.karpatkey.com/api/v1/permissions/eth/spark/deposit?targets=DSR_sDAI",
            schema: "https://kit.karpatkey.com/api/v1/openapi.json",
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
                        "0x00000000000000000000000083f20f44975d03b1b09e64809b757c47f942beea",
                    },
                    { paramType: 1, operator: 0 },
                  ],
                },
              },
              {
                targetAddress: "0x83f20f44975d03b1b09e64809b757c47f942beea",
                selector: "0x6e553f65",
                condition: {
                  paramType: 5,
                  operator: 5,
                  children: [
                    { paramType: 1, operator: 0 },
                    { paramType: 1, operator: 15 },
                  ],
                },
              },
              {
                targetAddress: "0x83f20f44975d03b1b09e64809b757c47f942beea",
                selector: "0xba087652",
                condition: {
                  paramType: 5,
                  operator: 5,
                  children: [
                    { paramType: 1, operator: 0 },
                    { paramType: 1, operator: 15 },
                    { paramType: 1, operator: 15 },
                  ],
                },
              },
              {
                targetAddress: "0x83f20f44975d03b1b09e64809b757c47f942beea",
                selector: "0xb460af94",
                condition: {
                  paramType: 5,
                  operator: 5,
                  children: [
                    { paramType: 1, operator: 0 },
                    { paramType: 1, operator: 15 },
                    { paramType: 1, operator: 15 },
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
                        "0x0000000000000000000000005803199f1085d52d1bb527f24dc1a2744e80a979",
                    },
                    { paramType: 1, operator: 0 },
                  ],
                },
              },
              {
                targetAddress: "0x5803199f1085d52d1bb527f24dc1a2744e80a979",
                selector: "0x8fba2cee",
                condition: {
                  paramType: 5,
                  operator: 5,
                  children: [
                    { paramType: 1, operator: 15 },
                    { paramType: 1, operator: 0 },
                    { paramType: 1, operator: 0 },
                  ],
                },
              },
              {
                targetAddress: "0x83f20f44975d03b1b09e64809b757c47f942beea",
                selector: "0x095ea7b3",
                condition: {
                  paramType: 5,
                  operator: 5,
                  children: [
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x0000000000000000000000005803199f1085d52d1bb527f24dc1a2744e80a979",
                    },
                    { paramType: 1, operator: 0 },
                  ],
                },
              },
              {
                targetAddress: "0x5803199f1085d52d1bb527f24dc1a2744e80a979",
                selector: "0x57de6782",
                condition: {
                  paramType: 5,
                  operator: 5,
                  children: [
                    { paramType: 1, operator: 15 },
                    { paramType: 1, operator: 0 },
                    { paramType: 1, operator: 0 },
                  ],
                },
              },
              {
                targetAddress: "0x5803199f1085d52d1bb527f24dc1a2744e80a979",
                selector: "0x850d6b31",
                condition: {
                  paramType: 5,
                  operator: 5,
                  children: [
                    { paramType: 1, operator: 15 },
                    { paramType: 1, operator: 0 },
                    { paramType: 1, operator: 0 },
                  ],
                },
              },
            ],
          },
          {
            uri: "https://kit.karpatkey.com/api/v1/permissions/eth/spark/deposit?targets=sDAI",
            schema: "https://kit.karpatkey.com/api/v1/openapi.json",
            permissions: [
              {
                targetAddress: "0x83f20f44975d03b1b09e64809b757c47f942beea",
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
                targetAddress: "0xc13e21b648a5ee794902342038ff3adab66be987",
                selector: "0x617ba037",
                condition: {
                  paramType: 5,
                  operator: 5,
                  children: [
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x00000000000000000000000083f20f44975d03b1b09e64809b757c47f942beea",
                    },
                    { paramType: 1, operator: 0 },
                    { paramType: 1, operator: 15 },
                    { paramType: 1, operator: 0 },
                  ],
                },
              },
              {
                targetAddress: "0xc13e21b648a5ee794902342038ff3adab66be987",
                selector: "0x69328dec",
                condition: {
                  paramType: 5,
                  operator: 5,
                  children: [
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x00000000000000000000000083f20f44975d03b1b09e64809b757c47f942beea",
                    },
                    { paramType: 1, operator: 0 },
                    { paramType: 1, operator: 15 },
                  ],
                },
              },
              {
                targetAddress: "0xc13e21b648a5ee794902342038ff3adab66be987",
                selector: "0x5a3b74b9",
                condition: {
                  paramType: 5,
                  operator: 5,
                  children: [
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x00000000000000000000000083f20f44975d03b1b09e64809b757c47f942beea",
                    },
                    { paramType: 1, operator: 0 },
                  ],
                },
              },
              {
                targetAddress: "0x4370d3b6c9588e02ce9d22e684387859c7ff5b34",
                selector: "0x236300dc",
                condition: {
                  paramType: 5,
                  operator: 5,
                  children: [
                    {
                      paramType: 4,
                      operator: 0,
                      children: [{ paramType: 1, operator: 0 }],
                    },
                    { paramType: 1, operator: 0 },
                    { paramType: 1, operator: 15 },
                    { paramType: 1, operator: 0 },
                  ],
                },
              },
              {
                targetAddress: "0x4370d3b6c9588e02ce9d22e684387859c7ff5b34",
                selector: "0xbb492bf5",
                condition: {
                  paramType: 5,
                  operator: 5,
                  children: [
                    {
                      paramType: 4,
                      operator: 0,
                      children: [{ paramType: 1, operator: 0 }],
                    },
                    { paramType: 1, operator: 15 },
                  ],
                },
              },
            ],
          },
          {
            uri: "https://kit.karpatkey.com/api/v1/permissions/eth/spark/borrow?targets=DAI",
            schema: "https://kit.karpatkey.com/api/v1/openapi.json",
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
          },
          {
            uri: "https://kit.karpatkey.com/api/v1/permissions/eth/spark/borrow?targets=USDC",
            schema: "https://kit.karpatkey.com/api/v1/openapi.json",
            permissions: [
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
                        "0x000000000000000000000000c13e21b648a5ee794902342038ff3adab66be987",
                    },
                    { paramType: 1, operator: 0 },
                  ],
                },
              },
              {
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
                        "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                    },
                    { paramType: 1, operator: 0 },
                    { paramType: 1, operator: 0 },
                    { paramType: 1, operator: 0 },
                    { paramType: 1, operator: 15 },
                  ],
                },
              },
              {
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
                        "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                    },
                    { paramType: 1, operator: 0 },
                    { paramType: 1, operator: 0 },
                    { paramType: 1, operator: 15 },
                  ],
                },
              },
            ],
          },
        ]
      }

      function targets(): Target[] {
        return [
          {
            address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            clearance: 2,
            executionOptions: 0,
            functions: [
              {
                selector: "0x095ea7b3",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 0,
                      operator: 2,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000c92e8bdf79f0507f65a392b0ab4667716bfe0110",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x00000000000000000000000088ad09518695c6c3712ac10a214be5109a655671",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000c3d688b66703497daa19211eedff47f25384cdc3",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000bd3fa81b58ba92a82136038b25adec7066af3155",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000bebc44782c7db0a1a60cb6fe97d0b483032ff1c7",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000007e77461ca2a9d82d26fd5e0da2243bf72ea45747",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000bbbbbbbbbb9cc5e90e3b3af64bdaf62c37eeffcb",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000008898b472c54c31894e3b9bb83cea802a5d0e63c6",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x00000000000000000000000087870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          },
          {
            address: "0xc00e94cb662c3520282e6f5717214004a7f26888",
            clearance: 2,
            executionOptions: 0,
            functions: [
              {
                selector: "0x095ea7b3",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 0,
                      operator: 2,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x00000000000000000000000099c9fc46f92e8a1c0dec1b1747d010903e884be1",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000c92e8bdf79f0507f65a392b0ab4667716bfe0110",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x00000000000000000000000088ad09518695c6c3712ac10a214be5109a655671",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000a3a7b6f88361f48403514059f1f16c8e78d60eec",
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          },
          {
            address: "0xc13e21b648a5ee794902342038ff3adab66be987",
            clearance: 2,
            executionOptions: 0,
            functions: [
              {
                selector: "0x617ba037",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x00000000000000000000000083f20f44975d03b1b09e64809b757c47f942beea",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 0,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 15,
                      compValue: "0x",
                      children: [],
                    },
                  ],
                },
              },
              {
                selector: "0x69328dec",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x00000000000000000000000083f20f44975d03b1b09e64809b757c47f942beea",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 0,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 15,
                      compValue: "0x",
                      children: [],
                    },
                  ],
                },
              },
              {
                selector: "0x5a3b74b9",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x00000000000000000000000083f20f44975d03b1b09e64809b757c47f942beea",
                      children: [],
                    },
                  ],
                },
              },
              {
                selector: "0xa415bcad",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 0,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 0,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 0,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 15,
                      compValue: "0x",
                      children: [],
                    },
                  ],
                },
              },
              {
                selector: "0x573ade81",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 0,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 0,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 15,
                      compValue: "0x",
                      children: [],
                    },
                  ],
                },
              },
            ],
          },
          {
            address: "0x4aa42145aa6ebf72e164c9bbc74fbd3788045016",
            clearance: 2,
            executionOptions: 0,
            functions: [
              {
                selector: "0x01e4f53a",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 1,
                      operator: 15,
                      compValue: "0x",
                      children: [],
                    },
                  ],
                },
              },
              {
                selector: "0x3f7658fd",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 0,
                      operator: 1,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 2,
                          operator: 21,
                          compValue:
                            "0x0054ffffffffffffffffffff00000000004aa42145aa6ebf72e1640000000000",
                          children: [],
                        },
                        {
                          paramType: 2,
                          operator: 21,
                          compValue:
                            "0x005effffffffffffffffffff0000000000c9bbc74fbd37880450160000000000",
                          children: [],
                        },
                        {
                          paramType: 2,
                          operator: 21,
                          compValue:
                            "0x0000ffffffffffffffffffff0000000000846e7f810e08f1e2af2c0000000000",
                          children: [],
                        },
                        {
                          paramType: 2,
                          operator: 21,
                          compValue:
                            "0x000affffffffffffffffffff00000000005afd06847cc95f5cae1b0000000000",
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          },
          {
            address: "0x8898b472c54c31894e3b9bb83cea802a5d0e63c6",
            clearance: 2,
            executionOptions: 0,
            functions: [
              {
                selector: "0x93f18ac5",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 0,
                  operator: 2,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 5,
                      operator: 5,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000000000000000000000000000000000006172626f",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 15,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 15,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 2,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000000000000000000000000000000000000000000000",
                          children: [],
                        },
                      ],
                    },
                    {
                      paramType: 5,
                      operator: 5,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000000000000000000000000000000000006f707469",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 15,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 15,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 2,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000000000000000000000000000000000000000000000",
                          children: [],
                        },
                      ],
                    },
                    {
                      paramType: 5,
                      operator: 5,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000000000000000000000000000000000006261736d",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 15,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 15,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 2,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000000000000000000000000000000000000000000000",
                          children: [],
                        },
                      ],
                    },
                    {
                      paramType: 5,
                      operator: 5,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000000000000000000000000000000000000000676e6f",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 15,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 15,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 2,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000000000000000000000000000000000000000000000",
                          children: [],
                        },
                      ],
                    },
                    {
                      paramType: 5,
                      operator: 5,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000000000000000000000000000000000006f707469",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 15,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 15,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 2,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000000000000000000000000000000000000000000000",
                          children: [],
                        },
                      ],
                    },
                    {
                      paramType: 5,
                      operator: 5,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000000000000000000000000000000000006172626f",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 15,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 15,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 2,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000000000000000000000000000000000000000000000",
                          children: [],
                        },
                      ],
                    },
                    {
                      paramType: 5,
                      operator: 5,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000000000000000000000000000000000000000676e6f",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 15,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 15,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 2,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000000000000000000000000000000000000000000000",
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              },
              {
                selector: "0x8aac16ba",
                executionOptions: 1,
                wildcarded: false,
                condition: {
                  paramType: 0,
                  operator: 2,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 5,
                      operator: 5,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000000000000000000000000000000000006172626f",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 15,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 15,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 2,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000000000000000000000000000000000000000000000",
                          children: [],
                        },
                      ],
                    },
                    {
                      paramType: 5,
                      operator: 5,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000000000000000000000000000000000006f707469",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 15,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 15,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 2,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000000000000000000000000000000000000000000000",
                          children: [],
                        },
                      ],
                    },
                    {
                      paramType: 5,
                      operator: 5,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000000000000000000000000000000000000000676e6f",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000642c27a96dffb6f21443a89b789a3194ff8399fa",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 15,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 2,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000846e7f810e08f1e2af2c5afd06847cc95f5cae1b",
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          },
          {
            address: "0x4c36d2919e407f0cc2ee3c993ccf8ac26d9ce64e",
            clearance: 2,
            executionOptions: 0,
            functions: [
              {
                selector: "0x23caab49",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 0,
                      operator: 2,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 0,
                          operator: 1,
                          compValue: "0x",
                          children: [
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x0020ffffffffffffffffffff0000000000f6a78083ca3e2a662d6d0000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x000effffffffffffffffffff00000000001e345b30c6bebf70ebe70000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x0051ffffffff0000000000000000000000272255bb0000000000000000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x006bffffffffffffffffffff00000000009d4a2e9eb0ce3606eb480000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x002affffffffffffffffffff0000000000d1703c939c8ace2e268d0000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x008bffffffffffffffffffff00000000005afd06847cc95f5cae1b0000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x0004ffffffffffffffffffff0000000000a7823d6f1e31569f51860000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x003effffffffffffffffffff0000000000c10a214be5109a6556710000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x0034ffffffffffffffffffff000000000088ad09518695c6c3712a0000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x0061ffffffffffffffffffff0000000000a0b86991c6218b36c1d10000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x004cffffffffff00000000000000000000010180640100000000000000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x0048ffffffff0000000000000000000000000927c00000000000000000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x0081ffffffffffffffffffff0000000000846e7f810e08f1e2af2c0000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x0000ffffffff0000000000000000000000000500000000000000000000000000",
                              children: [],
                            },
                          ],
                        },
                        {
                          paramType: 0,
                          operator: 1,
                          compValue: "0x",
                          children: [
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x0020ffffffffffffffffffff0000000000f6a78083ca3e2a662d6d0000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x000effffffffffffffffffff00000000001e345b30c6bebf70ebe70000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x0051ffffffff0000000000000000000000272255bb0000000000000000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x002affffffffffffffffffff0000000000d1703c939c8ace2e268d0000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x008bffffffffffffffffffff00000000005afd06847cc95f5cae1b0000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x0061ffffffffffffffffffff0000000000c00e94cb662c3520282e0000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x0004ffffffffffffffffffff0000000000a7823d6f1e31569f51860000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x003effffffffffffffffffff0000000000c10a214be5109a6556710000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x0034ffffffffffffffffffff000000000088ad09518695c6c3712a0000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x006bffffffffffffffffffff00000000006f5717214004a7f268880000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x004cffffffffff00000000000000000000010180640100000000000000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x0048ffffffff0000000000000000000000000927c00000000000000000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x0081ffffffffffffffffffff0000000000846e7f810e08f1e2af2c0000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x0000ffffffff0000000000000000000000000500000000000000000000000000",
                              children: [],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          },
          {
            address: "0x6b175474e89094c44da98b954eedeac495271d0f",
            clearance: 2,
            executionOptions: 0,
            functions: [
              {
                selector: "0x095ea7b3",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 0,
                      operator: 2,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000c92e8bdf79f0507f65a392b0ab4667716bfe0110",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000004aa42145aa6ebf72e164c9bbc74fbd3788045016",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000373238337bfe1146fb49989fc222523f83081ddb",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000bebc44782c7db0a1a60cb6fe97d0b483032ff1c7",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x00000000000000000000000083f20f44975d03b1b09e64809b757c47f942beea",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000d3b5b60020504bc3489d6949d545893982ba3011",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000003d4cc8a61c7528fd86c55cfe061a78dcba48edd1",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000008898b472c54c31894e3b9bb83cea802a5d0e63c6",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x00000000000000000000000010e6593cdda8c58a1d0f14c5164b376352a55f2f",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000c13e21b648a5ee794902342038ff3adab66be987",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x00000000000000000000000087870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          },
          {
            address: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
            clearance: 2,
            executionOptions: 0,
            functions: [
              {
                selector: "0x617ba037",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 0,
                      operator: 2,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x00000000000000000000000083f20f44975d03b1b09e64809b757c47f942beea",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                          children: [],
                        },
                      ],
                    },
                    {
                      paramType: 1,
                      operator: 0,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 15,
                      compValue: "0x",
                      children: [],
                    },
                  ],
                },
              },
              {
                selector: "0x69328dec",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 0,
                      operator: 2,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x00000000000000000000000083f20f44975d03b1b09e64809b757c47f942beea",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                          children: [],
                        },
                      ],
                    },
                    {
                      paramType: 1,
                      operator: 0,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 15,
                      compValue: "0x",
                      children: [],
                    },
                  ],
                },
              },
              {
                selector: "0x5a3b74b9",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 0,
                      operator: 2,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x00000000000000000000000083f20f44975d03b1b09e64809b757c47f942beea",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              },
              {
                selector: "0xa415bcad",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 0,
                      operator: 2,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                          children: [],
                        },
                      ],
                    },
                    {
                      paramType: 1,
                      operator: 0,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 0,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 0,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 15,
                      compValue: "0x",
                      children: [],
                    },
                  ],
                },
              },
              {
                selector: "0x573ade81",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 0,
                      operator: 2,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                          children: [],
                        },
                      ],
                    },
                    {
                      paramType: 1,
                      operator: 0,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 0,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 15,
                      compValue: "0x",
                      children: [],
                    },
                  ],
                },
              },
              {
                selector: "0x94ba89a2",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 0,
                      operator: 2,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          },
          {
            address: "0x83f20f44975d03b1b09e64809b757c47f942beea",
            clearance: 2,
            executionOptions: 0,
            functions: [
              {
                selector: "0x095ea7b3",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 0,
                      operator: 2,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000c92e8bdf79f0507f65a392b0ab4667716bfe0110",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000c13e21b648a5ee794902342038ff3adab66be987",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x00000000000000000000000087870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              },
              {
                selector: "0x6e553f65",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 1,
                      operator: 0,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 15,
                      compValue: "0x",
                      children: [],
                    },
                  ],
                },
              },
              {
                selector: "0xba087652",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 1,
                      operator: 0,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 15,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 15,
                      compValue: "0x",
                      children: [],
                    },
                  ],
                },
              },
              {
                selector: "0xb460af94",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 1,
                      operator: 0,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 15,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 15,
                      compValue: "0x",
                      children: [],
                    },
                  ],
                },
              },
            ],
          },
          {
            address: "0x23da9ade38e4477b23770ded512fd37b12381fab",
            clearance: 2,
            executionOptions: 0,
            functions: [
              {
                selector: "0x569d3489",
                executionOptions: 2,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 3,
                      operator: 5,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 0,
                          operator: 2,
                          compValue: "0x",
                          children: [
                            {
                              paramType: 1,
                              operator: 16,
                              compValue:
                                "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                              children: [],
                            },
                            {
                              paramType: 1,
                              operator: 16,
                              compValue:
                                "0x000000000000000000000000c00e94cb662c3520282e6f5717214004a7f26888",
                              children: [],
                            },
                            {
                              paramType: 1,
                              operator: 16,
                              compValue:
                                "0x00000000000000000000000083f20f44975d03b1b09e64809b757c47f942beea",
                              children: [],
                            },
                            {
                              paramType: 1,
                              operator: 16,
                              compValue:
                                "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                              children: [],
                            },
                          ],
                        },
                        {
                          paramType: 0,
                          operator: 2,
                          compValue: "0x",
                          children: [
                            {
                              paramType: 1,
                              operator: 16,
                              compValue:
                                "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                              children: [],
                            },
                            {
                              paramType: 1,
                              operator: 16,
                              compValue:
                                "0x00000000000000000000000083f20f44975d03b1b09e64809b757c47f942beea",
                              children: [],
                            },
                            {
                              paramType: 1,
                              operator: 16,
                              compValue:
                                "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                              children: [],
                            },
                          ],
                        },
                        {
                          paramType: 1,
                          operator: 15,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              },
              {
                selector: "0x5a66c223",
                executionOptions: 2,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 3,
                      operator: 5,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 0,
                          operator: 2,
                          compValue: "0x",
                          children: [
                            {
                              paramType: 1,
                              operator: 16,
                              compValue:
                                "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                              children: [],
                            },
                            {
                              paramType: 1,
                              operator: 16,
                              compValue:
                                "0x000000000000000000000000c00e94cb662c3520282e6f5717214004a7f26888",
                              children: [],
                            },
                            {
                              paramType: 1,
                              operator: 16,
                              compValue:
                                "0x00000000000000000000000083f20f44975d03b1b09e64809b757c47f942beea",
                              children: [],
                            },
                            {
                              paramType: 1,
                              operator: 16,
                              compValue:
                                "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                              children: [],
                            },
                          ],
                        },
                        {
                          paramType: 0,
                          operator: 2,
                          compValue: "0x",
                          children: [
                            {
                              paramType: 1,
                              operator: 16,
                              compValue:
                                "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                              children: [],
                            },
                            {
                              paramType: 1,
                              operator: 16,
                              compValue:
                                "0x00000000000000000000000083f20f44975d03b1b09e64809b757c47f942beea",
                              children: [],
                            },
                            {
                              paramType: 1,
                              operator: 16,
                              compValue:
                                "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                              children: [],
                            },
                          ],
                        },
                        {
                          paramType: 1,
                          operator: 15,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          },
          {
            address: "0x4370d3b6c9588e02ce9d22e684387859c7ff5b34",
            clearance: 2,
            executionOptions: 0,
            functions: [
              {
                selector: "0x236300dc",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 4,
                      operator: 0,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                      ],
                    },
                    {
                      paramType: 1,
                      operator: 0,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 15,
                      compValue: "0x",
                      children: [],
                    },
                  ],
                },
              },
              {
                selector: "0xbb492bf5",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 4,
                      operator: 0,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 1,
                          operator: 0,
                          compValue: "0x",
                          children: [],
                        },
                      ],
                    },
                    {
                      paramType: 1,
                      operator: 15,
                      compValue: "0x",
                      children: [],
                    },
                  ],
                },
              },
            ],
          },
          {
            address: "0xc3d688b66703497daa19211eedff47f25384cdc3",
            clearance: 2,
            executionOptions: 0,
            functions: [
              {
                selector: "0xf2b9fdb8",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                      children: [],
                    },
                  ],
                },
              },
              {
                selector: "0xf3fef3a3",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                      children: [],
                    },
                  ],
                },
              },
            ],
          },
          {
            address: "0x1b0e765f6224c21223aea2af16c1c46e38885a40",
            clearance: 2,
            executionOptions: 0,
            functions: [
              {
                selector: "0xb7034f7e",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 1,
                      operator: 0,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 15,
                      compValue: "0x",
                      children: [],
                    },
                  ],
                },
              },
            ],
          },
          {
            address: "0x373238337bfe1146fb49989fc222523f83081ddb",
            clearance: 2,
            executionOptions: 0,
            functions: [
              {
                selector: "0x3b4da69f",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 1,
                      operator: 15,
                      compValue: "0x",
                      children: [],
                    },
                  ],
                },
              },
              {
                selector: "0xef693bed",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 1,
                      operator: 15,
                      compValue: "0x",
                      children: [],
                    },
                  ],
                },
              },
              {
                selector: "0xeb0dff66",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 1,
                      operator: 15,
                      compValue: "0x",
                      children: [],
                    },
                  ],
                },
              },
            ],
          },
          {
            address: "0xbbbbbbbbbb9cc5e90e3b3af64bdaf62c37eeffcb",
            clearance: 2,
            executionOptions: 0,
            functions: [
              {
                selector: "0xa99aad89",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 0,
                      operator: 2,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 3,
                          operator: 5,
                          compValue: "0x",
                          children: [
                            {
                              paramType: 1,
                              operator: 16,
                              compValue:
                                "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                              children: [],
                            },
                            {
                              paramType: 1,
                              operator: 16,
                              compValue:
                                "0x0000000000000000000000007f39c581f595b53c5cb19bd0b3f8da6c935e2ca0",
                              children: [],
                            },
                            {
                              paramType: 1,
                              operator: 16,
                              compValue:
                                "0x00000000000000000000000048f7e36eb6b826b2df4b2e630b62cd25e89e40e2",
                              children: [],
                            },
                            {
                              paramType: 1,
                              operator: 16,
                              compValue:
                                "0x000000000000000000000000870ac11d48b15db9a138cf899d20f13f79ba00bc",
                              children: [],
                            },
                            {
                              paramType: 1,
                              operator: 0,
                              compValue: "0x",
                              children: [],
                            },
                          ],
                        },
                        {
                          paramType: 3,
                          operator: 5,
                          compValue: "0x",
                          children: [
                            {
                              paramType: 1,
                              operator: 16,
                              compValue:
                                "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                              children: [],
                            },
                            {
                              paramType: 1,
                              operator: 16,
                              compValue:
                                "0x0000000000000000000000002260fac5e5542a773aa44fbcfedf7c193bc2c599",
                              children: [],
                            },
                            {
                              paramType: 1,
                              operator: 16,
                              compValue:
                                "0x000000000000000000000000dddd770badd886df3864029e4b377b5f6a2b6b83",
                              children: [],
                            },
                            {
                              paramType: 1,
                              operator: 16,
                              compValue:
                                "0x000000000000000000000000870ac11d48b15db9a138cf899d20f13f79ba00bc",
                              children: [],
                            },
                            {
                              paramType: 1,
                              operator: 0,
                              compValue: "0x",
                              children: [],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      paramType: 1,
                      operator: 0,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x0000000000000000000000000000000000000000000000000000000000000000",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 15,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 2,
                      operator: 16,
                      compValue:
                        "0x0000000000000000000000000000000000000000000000000000000000000000",
                      children: [],
                    },
                  ],
                },
              },
              {
                selector: "0x5c2bea49",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 0,
                      operator: 2,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 3,
                          operator: 5,
                          compValue: "0x",
                          children: [
                            {
                              paramType: 1,
                              operator: 16,
                              compValue:
                                "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                              children: [],
                            },
                            {
                              paramType: 1,
                              operator: 16,
                              compValue:
                                "0x0000000000000000000000007f39c581f595b53c5cb19bd0b3f8da6c935e2ca0",
                              children: [],
                            },
                            {
                              paramType: 1,
                              operator: 16,
                              compValue:
                                "0x00000000000000000000000048f7e36eb6b826b2df4b2e630b62cd25e89e40e2",
                              children: [],
                            },
                            {
                              paramType: 1,
                              operator: 16,
                              compValue:
                                "0x000000000000000000000000870ac11d48b15db9a138cf899d20f13f79ba00bc",
                              children: [],
                            },
                            {
                              paramType: 1,
                              operator: 0,
                              compValue: "0x",
                              children: [],
                            },
                          ],
                        },
                        {
                          paramType: 3,
                          operator: 5,
                          compValue: "0x",
                          children: [
                            {
                              paramType: 1,
                              operator: 16,
                              compValue:
                                "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                              children: [],
                            },
                            {
                              paramType: 1,
                              operator: 16,
                              compValue:
                                "0x0000000000000000000000002260fac5e5542a773aa44fbcfedf7c193bc2c599",
                              children: [],
                            },
                            {
                              paramType: 1,
                              operator: 16,
                              compValue:
                                "0x000000000000000000000000dddd770badd886df3864029e4b377b5f6a2b6b83",
                              children: [],
                            },
                            {
                              paramType: 1,
                              operator: 16,
                              compValue:
                                "0x000000000000000000000000870ac11d48b15db9a138cf899d20f13f79ba00bc",
                              children: [],
                            },
                            {
                              paramType: 1,
                              operator: 0,
                              compValue: "0x",
                              children: [],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      paramType: 1,
                      operator: 0,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x0000000000000000000000000000000000000000000000000000000000000000",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 15,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 15,
                      compValue: "0x",
                      children: [],
                    },
                  ],
                },
              },
            ],
          },
          {
            address: "0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7",
            clearance: 2,
            executionOptions: 0,
            functions: [
              {
                selector: "0x3df02124",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 0,
                      operator: 2,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000000000000000000000000000000000000000000000",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000000000000000000000000000000000000000000001",
                          children: [],
                        },
                      ],
                    },
                    {
                      paramType: 0,
                      operator: 2,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000000000000000000000000000000000000000000000",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000000000000000000000000000000000000000000001",
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          },
          {
            address: "0x3d4cc8a61c7528fd86c55cfe061a78dcba48edd1",
            clearance: 2,
            executionOptions: 0,
            functions: [
              {
                selector: "0xdeace8f5",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 0,
                      operator: 2,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000000000000000000000000000000000000000000064",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000000000000000000000000000000000000000000a",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000000000000000000000000000000000000000a4b1",
                          children: [],
                        },
                      ],
                    },
                    {
                      paramType: 1,
                      operator: 15,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 0,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 0,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 0,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x0000000000000000000000009298dfd8a0384da62643c2e98f437e820029e75e",
                      children: [],
                    },
                  ],
                },
              },
            ],
          },
          {
            address: "0x88ad09518695c6c3712ac10a214be5109a655671",
            clearance: 2,
            executionOptions: 0,
            functions: [
              {
                selector: "0xad58bdd1",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x000000000000000000000000c00e94cb662c3520282e6f5717214004a7f26888",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 15,
                      compValue: "0x",
                      children: [],
                    },
                  ],
                },
              },
              {
                selector: "0xd7405481",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x0000000000000000000000000392a2f5ac47388945d8c84212469f545fae52b2",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 0,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 2,
                      operator: 16,
                      compValue:
                        "0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000846e7f810e08f1e2af2c5afd06847cc95f5cae1b",
                      children: [],
                    },
                  ],
                },
              },
            ],
          },
          {
            address: "0x10e6593cdda8c58a1d0f14c5164b376352a55f2f",
            clearance: 2,
            executionOptions: 0,
            functions: [
              {
                selector: "0x58a997f6",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x000000000000000000000000da10009cbd5d07dd0cecc66161fc93d7c9000da1",
                      children: [],
                    },
                  ],
                },
              },
              {
                selector: "0x838b2520",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x000000000000000000000000da10009cbd5d07dd0cecc66161fc93d7c9000da1",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 15,
                      compValue: "0x",
                      children: [],
                    },
                  ],
                },
              },
            ],
          },
          {
            address: "0x99c9fc46f92e8a1c0dec1b1747d010903e884be1",
            clearance: 2,
            executionOptions: 0,
            functions: [
              {
                selector: "0x58a997f6",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x000000000000000000000000c00e94cb662c3520282e6f5717214004a7f26888",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x0000000000000000000000007e7d4467112689329f7e06571ed0e8cbad4910ee",
                      children: [],
                    },
                  ],
                },
              },
              {
                selector: "0x838b2520",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x000000000000000000000000c00e94cb662c3520282e6f5717214004a7f26888",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x0000000000000000000000007e7d4467112689329f7e06571ed0e8cbad4910ee",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 15,
                      compValue: "0x",
                      children: [],
                    },
                  ],
                },
              },
            ],
          },
          {
            address: "0xbd3fa81b58ba92a82136038b25adec7066af3155",
            clearance: 2,
            executionOptions: 0,
            functions: [
              {
                selector: "0x6fd3504e",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 1,
                      operator: 0,
                      compValue: "0x",
                      children: [],
                    },
                    {
                      paramType: 0,
                      operator: 2,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000000000000000000000000000000000000000000002",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000000000000000000000000000000000000000000003",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000000000000000000000000000000000000000000006",
                          children: [],
                        },
                      ],
                    },
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x000000000000000000000000846e7f810e08f1e2af2c5afd06847cc95f5cae1b",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                      children: [],
                    },
                  ],
                },
              },
            ],
          },
          {
            address: "0x0a992d191deec32afe36203ad87d7d289a738f81",
            clearance: 2,
            executionOptions: 0,
            functions: [
              {
                selector: "0x57ecfd28",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 0,
                      operator: 2,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 0,
                          operator: 1,
                          compValue: "0x",
                          children: [
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x008effffffffffffffffffff00000000007837caf62653d097ff850000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x0000ffffffffffffffffffffffff000000000000000000000200000000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x004affffffffffffffffffff0000000000038b25adec7066af31550000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x0020ffffffffffffffffffff00000000002b4069517957735be00c0000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x00aeffffffffffffffffffff00000000005afd06847cc95f5cae1b0000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x00e4ffffffffffffffffffff0000000000846e7f810e08f1e2af2c0000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x0040ffffffffffffffffffff0000000000bd3fa81b58ba92a821360000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x002affffffffffffffffffff0000000000ee0fadae88a26365528f0000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x00a4ffffffffffffffffffff0000000000846e7f810e08f1e2af2c0000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x0084ffffffffffffffffffff00000000000b2c639c533813f4aa9d0000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x00eeffffffffffffffffffff00000000005afd06847cc95f5cae1b0000000000",
                              children: [],
                            },
                          ],
                        },
                        {
                          paramType: 0,
                          operator: 1,
                          compValue: "0x",
                          children: [
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x004affffffffffffffffffff0000000000038b25adec7066af31550000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x0020ffffffffffffffffffff00000000001682ae6375c4e4a97e4b0000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x00aeffffffffffffffffffff00000000005afd06847cc95f5cae1b0000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x00e4ffffffffffffffffffff0000000000846e7f810e08f1e2af2c0000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x0000ffffffffffffffffffffffff000000000000000000000600000000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x0040ffffffffffffffffffff0000000000bd3fa81b58ba92a821360000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x00a4ffffffffffffffffffff0000000000846e7f810e08f1e2af2c0000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x0084ffffffffffffffffffff0000000000833589fcd6edb6e08f4c0000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x00eeffffffffffffffffffff00000000005afd06847cc95f5cae1b0000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x008effffffffffffffffffff00000000007c32d4f71b54bda029130000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x002affffffffffffffffffff0000000000583bc394c861a46d89620000000000",
                              children: [],
                            },
                          ],
                        },
                        {
                          paramType: 0,
                          operator: 1,
                          compValue: "0x",
                          children: [
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x008effffffffffffffffffff000000000027c5edb3a432268e58310000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x004affffffffffffffffffff0000000000038b25adec7066af31550000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x00aeffffffffffffffffffff00000000005afd06847cc95f5cae1b0000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x0020ffffffffffffffffffff000000000019330d10d9cc8751218e0000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x00e4ffffffffffffffffffff0000000000846e7f810e08f1e2af2c0000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x0040ffffffffffffffffffff0000000000bd3fa81b58ba92a821360000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x00a4ffffffffffffffffffff0000000000846e7f810e08f1e2af2c0000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x0084ffffffffffffffffffff0000000000af88d065e77c8cc223930000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x002affffffffffffffffffff0000000000af51e8885d058642e08a0000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x00eeffffffffffffffffffff00000000005afd06847cc95f5cae1b0000000000",
                              children: [],
                            },
                            {
                              paramType: 2,
                              operator: 21,
                              compValue:
                                "0x0000ffffffffffffffffffffffff000000000000000000000300000000000000",
                              children: [],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          },
          {
            address: "0x7e77461ca2a9d82d26fd5e0da2243bf72ea45747",
            clearance: 2,
            executionOptions: 0,
            functions: [
              {
                selector: "0xa134ce5b",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 0,
                      operator: 2,
                      compValue: "0x",
                      children: [
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x0000000000000000000000000000000000000000000000000000000000002105",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000000000000000000000000000000000000000000a",
                          children: [],
                        },
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000000000000000000000000000000000000000a4b1",
                          children: [],
                        },
                      ],
                    },
                    {
                      paramType: 1,
                      operator: 15,
                      compValue: "0x",
                      children: [],
                    },
                  ],
                },
              },
            ],
          },
          {
            address: "0xd3b5b60020504bc3489d6949d545893982ba3011",
            clearance: 2,
            executionOptions: 0,
            functions: [
              {
                selector: "0xd2ce7d65",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 15,
                      compValue: "0x",
                      children: [],
                    },
                  ],
                },
              },
            ],
          },
          {
            address: "0xa3a7b6f88361f48403514059f1f16c8e78d60eec",
            clearance: 2,
            executionOptions: 0,
            functions: [
              {
                selector: "0xd2ce7d65",
                executionOptions: 0,
                wildcarded: false,
                condition: {
                  paramType: 5,
                  operator: 5,
                  compValue: "0x",
                  children: [
                    {
                      paramType: 1,
                      operator: 16,
                      compValue:
                        "0x000000000000000000000000c00e94cb662c3520282e6f5717214004a7f26888",
                      children: [],
                    },
                    {
                      paramType: 1,
                      operator: 15,
                      compValue: "0x",
                      children: [],
                    },
                  ],
                },
              },
            ],
          },
        ]
      }
    })
  })
})
