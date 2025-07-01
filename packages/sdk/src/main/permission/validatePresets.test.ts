import { describe, it, suite, expect } from "vitest"

import { Target } from "zodiac-roles-deployments"

import { validatePresets } from "./validatePresets"
import { PermissionCoerced } from "./types"
import { processPermissions } from "./processPermissions"

suite("validatePreset()", () => {
  it.todo("confirms one preset")

  it.todo("excludes one preset")

  it.todo("does not return permissions included in confirmed presets")

  it.todo("does not exclude permissions included in excluded presets")

  it.todo("throws if permissions can't be merged")

  describe("From Real Examples", () => {
    it("confirms all combined presets", () => {
      /*
       * This test includes the exact same input as https://roles.gnosisguild.org/eth:0xd1f7cd1c68a7f82ad86d320d2446eb706822f742/roles/MANAGER
       *
       * It does not confirm the cowswap preset, which differs from what we see on the UI. Next text isolates the confirmation logic for that Annotation
       */

      const allPermissions = annotations().flatMap((a) => a.permissions)
      const { targets } = processPermissions(allPermissions)

      const result = validatePresets({
        targets,
        presets: annotations(),
      })

      expect(result.presets.map((p) => p.uri)).toEqual(
        annotations().map((a) => a.uri)
      )

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
    })
  })
})
