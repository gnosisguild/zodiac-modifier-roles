import { describe, expect, it } from "vitest"
import { derivePermissionFromCall } from "./derivePermissions"
import { c, Operator } from "zodiac-roles-sdk"
import { encodeFunctionData, parseAbiItem } from "viem"
import { ParamType } from "ethers"

describe("derivePermissionFromCall", () => {
  it("scopes each calldata parameter with equals if no wildcards are set", async () => {
    const permission = await derivePermissionFromCall({
      call: swap1EthForUsdc,
      abi: batchSwapAbi,
      wildcards: [],
    })

    expect(permission.targetAddress).toEqual(swap1EthForUsdc.to)
    expect(permission.selector).toEqual(swap1EthForUsdc.data.slice(0, 10))
    expect(permission.delegatecall).toBeFalsy()
    expect(permission.condition).toEqual(
      c.calldataMatches(
        swap1EthForUsdcArgs.map((value) => c.eq(value)),
        batchSwapAbiInputs
      )()
    )
  })

  it("allows wildcarding top-level param", async () => {
    const permission = await derivePermissionFromCall({
      call: swap1EthForUsdc,
      abi: batchSwapAbi,
      wildcards: ["swaps"],
    })

    expect(permission.condition).toEqual(
      c.calldataMatches(
        swap1EthForUsdcArgs.map((value, index) =>
          index === 1 ? undefined : c.eq(value)
        ),
        batchSwapAbiInputs
      )()
    )
  })

  it("handles nested wildcards to unnamed fields", async () => {
    const permission = await derivePermissionFromCall({
      call: swap1EthForUsdc,
      abi: batchSwapAbi,
      wildcards: ["funds.[1]"],
    })

    expect(permission.condition).toEqual(
      c.calldataMatches(
        swap1EthForUsdcArgs.map((value, index) =>
          index === 3
            ? c.matches([
                "0x849D52316331967b6fF1198e5E32A0eB168D039d",
                undefined,
                "0x849D52316331967b6fF1198e5E32A0eB168D039d",
                false,
              ])
            : c.eq(value)
        ),
        batchSwapAbiInputs
      )()
    )
  })

  it("does not set a condition if all parameters are wildcarded", async () => {
    const permission = await derivePermissionFromCall({
      call: swap1EthForUsdc,
      abi: batchSwapAbi,
      wildcards: [
        "kind",
        "swaps",
        "assets",
        "funds.[0]",
        "funds.[1]",
        "funds.[2]",
        "funds.[3]",
        "limits",
        "deadline",
      ],
    })
    expect(permission.condition).toBeUndefined()
  })

  it("ignores wildcards in array elements", async () => {
    const permission = await derivePermissionFromCall({
      call: swap1EthForUsdc,
      abi: batchSwapAbi,
      wildcards: ["swaps.[1]"],
    })
    const swapsCondition = permission.condition!.children![1]
    expect(swapsCondition.operator).toBe(Operator.EqualTo)
  })
})

const batchSwapAbi = parseAbiItem(
  "function batchSwap(uint8 kind, (bytes32,uint256,uint256,uint256,bytes)[] swaps, address[] assets, (address,bool,address,bool) funds, int256[] limits, uint256 deadline) payable"
)

const batchSwapAbiInputs = batchSwapAbi.inputs.map((input) =>
  ParamType.from(input)
)

const swap1EthForUsdcArgs = [
  0,
  [
    [
      "0x93d199263632a4ef4bb438f1feb99e57b4b5f0bd0000000000000000000005c2",
      0n,
      1n,
      500000000000000000n,
      "0x",
    ],
    [
      "0xc8cf54b0b70899ea846b70361e62f3f5b22b1f4b0002000000000000000006c7",
      1n,
      2n,
      0n,
      "0x",
    ],
    [
      "0xc2aa60465bffa1a88f5ba471a59ca0435c3ec5c100020000000000000000062c",
      2n,
      3n,
      0n,
      "0x",
    ],
    [
      "0xf01b0684c98cd7ada480bfdf6e43876422fa1fc10002000000000000000005de",
      0n,
      1n,
      500000000000000000n,
      "0x",
    ],
    [
      "0xc8cf54b0b70899ea846b70361e62f3f5b22b1f4b0002000000000000000006c7",
      1n,
      2n,
      0n,
      "0x",
    ],
    [
      "0x2875f3effe9ec897d7e4c32680d77ca3e628f33a0002000000000000000006d1",
      2n,
      3n,
      0n,
      "0x",
    ],
  ],
  [
    "0x0000000000000000000000000000000000000000",
    "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
    "0xe07F9D810a48ab5c3c914BA3cA53AF14E4491e8A",
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  ],
  [
    "0x849D52316331967b6fF1198e5E32A0eB168D039d",
    false,
    "0x849D52316331967b6fF1198e5E32A0eB168D039d",
    false,
  ],
  [BigInt(1000000000000000000), BigInt(0), BigInt(0), BigInt(-1860401715)],
  BigInt(9007199254740991),
] as const

const swap1EthForUsdc = {
  id: "swap1EthForUsdc",
  to: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
  value: "1000000000000000000",
  operation: 0,
  metadata: {},
  data: encodeFunctionData({
    abi: [batchSwapAbi],
    functionName: "batchSwap",
    args: swap1EthForUsdcArgs,
  }),
} as const
