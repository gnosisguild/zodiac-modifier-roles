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

    it("confirms the one of the COWSWAP presets", () => {
      /*
       * This test includesonly the cowswap preset, and it illustrates how one permission is blocking it
       *
       */

      {
        const result = validatePresets({
          targets: targets(),
          presets: [annotation()],
        })

        expect(result.presets.map((p) => p.uri)).toEqual([])
      }

      {
        const result = validatePresets({
          targets: targets(),
          presets: [
            {
              ...annotation(),
              permissions: annotation().permissions.slice(0, -1),
            },
          ],
        })

        expect(result.presets.map((p) => p.uri)).toEqual([
          "https://kit.kpk.io/api/v1/permissions/eth/cowswap/swap?sell=0xc00e94Cb662C3520282E6f5717214004A7f26888%2C0x6B175474E89094C44Da98b954EedeAC495271d0F%2C0x83F20F44975D03b1b09e64809B757c47f942BEeA%2C0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&buy=0x6B175474E89094C44Da98b954EedeAC495271d0F%2C0x83F20F44975D03b1b09e64809B757c47f942BEeA%2C0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        ])
      }

      function annotation(): {
        uri: string
        schema: string
        permissions: PermissionCoerced[]
      } {
        return {
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
        }
      }

      function targets(): Target[] {
        return [
          {
            // keep
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
            // keep
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
            // keep
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
            // keep
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
            // keep
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
        ]
      }
    })
  })
})
