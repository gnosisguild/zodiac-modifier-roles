// testTargets are generated through the following defi-kit actions:
// [
//   // Use defi-kit to generate the permissions...
//   ...allowAction.lido.deposit(),
//   ...allowAction.compound_v2.deposit({ targets: ["USDC", "DAI"] }),
//   ...allowAction.compound_v3.deposit({ targets: ["cUSDCv3"] }),
//   // Additional permissions not coming through defi-kit...
//   allow.mainnet.balancer.vault.flashLoan(),
// ]

export const testAnnotations = [
  {
    url: "https://kit.karpatkey.com/eth:0x012300000000000000000000000000000000123/manager/allow/lido/deposit",
    schema: "https://kit.karpatkey.com/api/v1/openapi.json",
  },
  {
    url: "https://kit.karpatkey.com/eth:0x012300000000000000000000000000000000123/manager/allow/compound_v2/deposit?targets=USD&targets=DAI",
    schema: "https://kit.karpatkey.com/api/v1/openapi.json",
  },
  {
    url: "https://kit.karpatkey.com/eth:0x012300000000000000000000000000000000123/manager/allow/compound_v3/deposit?targets=cUSDCv3",
    schema: "https://kit.karpatkey.com/api/v1/openapi.json",
  },
];

export const testTargets = [
  {
    address: "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
    clearance: 2,
    executionOptions: 0,
    functions: [
      {
        selector: "0x095ea7b3",
        executionOptions: 0,
        wildcarded: false,
        condition: {
          paramType: 0,
          operator: 2,
          children: [
            {
              paramType: 5,
              operator: 5,
              children: [
                {
                  paramType: 1,
                  operator: 16,
                  compValue:
                    "0x000000000000000000000000889edc2edab5f40e902b864ad4d7ade8e412f9b1",
                },
              ],
            },
            {
              paramType: 5,
              operator: 5,
              children: [
                {
                  paramType: 1,
                  operator: 16,
                  compValue:
                    "0x0000000000000000000000007f39c581f595b53c5cb19bd0b3f8da6c935e2ca0",
                },
              ],
            },
          ],
        },
      },
      {
        selector: "0xa1903eab",
        executionOptions: 1,
        wildcarded: false,
        condition: {
          paramType: 5,
          operator: 5,
          children: [
            {
              paramType: 1,
              operator: 0,
            },
          ],
        },
      },
    ],
  },
  {
    address: "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0",
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
          children: [
            {
              paramType: 1,
              operator: 16,
              compValue:
                "0x000000000000000000000000889edc2edab5f40e902b864ad4d7ade8e412f9b1",
            },
          ],
        },
      },
      {
        selector: "0xea598cb0",
        executionOptions: 0,
        wildcarded: true,
      },
      {
        selector: "0xde0e9a3e",
        executionOptions: 0,
        wildcarded: true,
      },
    ],
  },
  {
    address: "0x889edc2edab5f40e902b864ad4d7ade8e412f9b1",
    clearance: 2,
    executionOptions: 0,
    functions: [
      {
        selector: "0xd6681042",
        executionOptions: 0,
        wildcarded: false,
        condition: {
          paramType: 5,
          operator: 5,
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
              paramType: 1,
              operator: 15,
            },
          ],
        },
      },
      {
        selector: "0xacf41e4d",
        executionOptions: 0,
        wildcarded: false,
        condition: {
          paramType: 5,
          operator: 5,
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
              paramType: 1,
              operator: 15,
            },
          ],
        },
      },
      {
        selector: "0x7951b76f",
        executionOptions: 0,
        wildcarded: false,
        condition: {
          paramType: 5,
          operator: 5,
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
              paramType: 1,
              operator: 15,
            },
          ],
        },
      },
      {
        selector: "0xf8444436",
        executionOptions: 0,
        wildcarded: true,
      },
      {
        selector: "0xe3afe0a3",
        executionOptions: 0,
        wildcarded: true,
      },
    ],
  },
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
          paramType: 0,
          operator: 2,
          children: [
            {
              paramType: 5,
              operator: 5,
              children: [
                {
                  paramType: 1,
                  operator: 16,
                  compValue:
                    "0x000000000000000000000000c3d688b66703497daa19211eedff47f25384cdc3",
                },
              ],
            },
            {
              paramType: 5,
              operator: 5,
              children: [
                {
                  paramType: 1,
                  operator: 16,
                  compValue:
                    "0x00000000000000000000000039aa39c021dfbae8fac545936693ac917d5e7563",
                },
              ],
            },
          ],
        },
      },
    ],
  },
  {
    address: "0x39aa39c021dfbae8fac545936693ac917d5e7563",
    clearance: 2,
    executionOptions: 0,
    functions: [
      {
        selector: "0xa0712d68",
        executionOptions: 1,
        wildcarded: false,
        condition: {
          paramType: 5,
          operator: 5,
          children: [
            {
              paramType: 1,
              operator: 0,
            },
          ],
        },
      },
      {
        selector: "0xdb006a75",
        executionOptions: 0,
        wildcarded: true,
      },
      {
        selector: "0x852a12e3",
        executionOptions: 0,
        wildcarded: true,
      },
    ],
  },
  {
    address: "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b",
    clearance: 2,
    executionOptions: 0,
    functions: [
      {
        selector: "0xc2998238",
        executionOptions: 0,
        wildcarded: false,
        condition: {
          paramType: 0,
          operator: 2,
          children: [
            {
              paramType: 5,
              operator: 5,
              children: [
                {
                  paramType: 4,
                  operator: 16,
                  compValue:
                    "0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000100000000000000000000000039aa39c021dfbae8fac545936693ac917d5e7563",
                  children: [
                    {
                      paramType: 1,
                      operator: 0,
                    },
                  ],
                },
              ],
            },
            {
              paramType: 5,
              operator: 5,
              children: [
                {
                  paramType: 4,
                  operator: 16,
                  compValue:
                    "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000005d3a536e4d6dbd6114cc1ead35777bab948e3643",
                  children: [
                    {
                      paramType: 1,
                      operator: 0,
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      {
        selector: "0xede4edd0",
        executionOptions: 0,
        wildcarded: false,
        condition: {
          paramType: 0,
          operator: 2,
          children: [
            {
              paramType: 5,
              operator: 5,
              children: [
                {
                  paramType: 1,
                  operator: 16,
                  compValue:
                    "0x0000000000000000000000005d3a536e4d6dbd6114cc1ead35777bab948e3643",
                },
              ],
            },
            {
              paramType: 5,
              operator: 5,
              children: [
                {
                  paramType: 1,
                  operator: 16,
                  compValue:
                    "0x00000000000000000000000039aa39c021dfbae8fac545936693ac917d5e7563",
                },
              ],
            },
          ],
        },
      },
      {
        selector: "0x1c3db2e0",
        executionOptions: 0,
        wildcarded: false,
        condition: {
          paramType: 0,
          operator: 2,
          children: [
            {
              paramType: 5,
              operator: 5,
              children: [
                {
                  paramType: 1,
                  operator: 15,
                },
                {
                  paramType: 4,
                  operator: 16,
                  compValue:
                    "0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000100000000000000000000000039aa39c021dfbae8fac545936693ac917d5e7563",
                  children: [
                    {
                      paramType: 1,
                      operator: 0,
                    },
                  ],
                },
              ],
            },
            {
              paramType: 5,
              operator: 5,
              children: [
                {
                  paramType: 1,
                  operator: 15,
                },
                {
                  paramType: 4,
                  operator: 16,
                  compValue:
                    "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000005d3a536e4d6dbd6114cc1ead35777bab948e3643",
                  children: [
                    {
                      paramType: 1,
                      operator: 0,
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
          children: [
            {
              paramType: 1,
              operator: 16,
              compValue:
                "0x0000000000000000000000005d3a536e4d6dbd6114cc1ead35777bab948e3643",
            },
          ],
        },
      },
    ],
  },
  {
    address: "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643",
    clearance: 2,
    executionOptions: 0,
    functions: [
      {
        selector: "0xa0712d68",
        executionOptions: 1,
        wildcarded: false,
        condition: {
          paramType: 5,
          operator: 5,
          children: [
            {
              paramType: 1,
              operator: 0,
            },
          ],
        },
      },
      {
        selector: "0xdb006a75",
        executionOptions: 0,
        wildcarded: true,
      },
      {
        selector: "0x852a12e3",
        executionOptions: 0,
        wildcarded: true,
      },
    ],
  },
  {
    address: "0xc3d688b66703497daa19211eedff47f25384cdc3",
    clearance: 2,
    executionOptions: 0,
    functions: [
      {
        selector: "0x110496e5",
        executionOptions: 0,
        wildcarded: false,
        condition: {
          paramType: 5,
          operator: 5,
          children: [
            {
              paramType: 1,
              operator: 16,
              compValue:
                "0x000000000000000000000000a397a8c2086c554b531c02e29f3291c9704b00c7",
            },
          ],
        },
      },
      {
        selector: "0xf2b9fdb8",
        executionOptions: 0,
        wildcarded: false,
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
                    "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                },
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
                    "0x0000000000000000000000001f9840a85d5af5bf1d1762f925bdaddc4201f984",
                },
                {
                  paramType: 1,
                  operator: 16,
                  compValue:
                    "0x000000000000000000000000514910771af9ca656af840dff83e8264ecf986ca",
                },
                {
                  paramType: 1,
                  operator: 16,
                  compValue:
                    "0x0000000000000000000000002260fac5e5542a773aa44fbcfedf7c193bc2c599",
                },
              ],
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
          children: [
            {
              paramType: 0,
              operator: 2,
              children: [
                {
                  paramType: 1,
                  operator: 16,
                  compValue:
                    "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                },
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
                    "0x0000000000000000000000001f9840a85d5af5bf1d1762f925bdaddc4201f984",
                },
                {
                  paramType: 1,
                  operator: 16,
                  compValue:
                    "0x000000000000000000000000514910771af9ca656af840dff83e8264ecf986ca",
                },
                {
                  paramType: 1,
                  operator: 16,
                  compValue:
                    "0x0000000000000000000000002260fac5e5542a773aa44fbcfedf7c193bc2c599",
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
          children: [
            {
              paramType: 1,
              operator: 16,
              compValue:
                "0x000000000000000000000000c3d688b66703497daa19211eedff47f25384cdc3",
            },
          ],
        },
      },
    ],
  },
  {
    address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
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
          children: [
            {
              paramType: 1,
              operator: 16,
              compValue:
                "0x000000000000000000000000c3d688b66703497daa19211eedff47f25384cdc3",
            },
          ],
        },
      },
    ],
  },
  {
    address: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
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
          children: [
            {
              paramType: 1,
              operator: 16,
              compValue:
                "0x000000000000000000000000c3d688b66703497daa19211eedff47f25384cdc3",
            },
          ],
        },
      },
    ],
  },
  {
    address: "0x514910771af9ca656af840dff83e8264ecf986ca",
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
          children: [
            {
              paramType: 1,
              operator: 16,
              compValue:
                "0x000000000000000000000000c3d688b66703497daa19211eedff47f25384cdc3",
            },
          ],
        },
      },
    ],
  },
  {
    address: "0xa397a8c2086c554b531c02e29f3291c9704b00c7",
    clearance: 2,
    executionOptions: 0,
    functions: [
      {
        selector: "0x555029a6",
        executionOptions: 1,
        wildcarded: false,
        condition: {
          paramType: 0,
          operator: 2,
          children: [
            {
              paramType: 5,
              operator: 5,
              children: [
                {
                  paramType: 4,
                  operator: 16,
                  compValue:
                    "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001414354494f4e5f535550504c595f4e41544956455f544f4b454e000000000000",
                  children: [
                    {
                      paramType: 1,
                      operator: 0,
                    },
                  ],
                },
                {
                  paramType: 4,
                  operator: 5,
                  children: [
                    {
                      paramType: 6,
                      operator: 5,
                      children: [
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000c3d688b66703497daa19211eedff47f25384cdc3",
                        },
                        {
                          paramType: 1,
                          operator: 15,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              paramType: 5,
              operator: 5,
              children: [
                {
                  paramType: 4,
                  operator: 16,
                  compValue:
                    "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001414354494f4e5f57495448445241575f4e41544956455f544f4b454e00000000",
                  children: [
                    {
                      paramType: 1,
                      operator: 0,
                    },
                  ],
                },
                {
                  paramType: 4,
                  operator: 5,
                  children: [
                    {
                      paramType: 6,
                      operator: 5,
                      children: [
                        {
                          paramType: 1,
                          operator: 16,
                          compValue:
                            "0x000000000000000000000000c3d688b66703497daa19211eedff47f25384cdc3",
                        },
                        {
                          paramType: 1,
                          operator: 15,
                        },
                      ],
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
    address: "0xba12222222228d8ba445958a75a0704d566bf2c8",
    clearance: 2,
    executionOptions: 0,
    functions: [
      {
        selector: "0x5c38449e",
        executionOptions: 0,
        wildcarded: true,
      },
    ],
  },
];
