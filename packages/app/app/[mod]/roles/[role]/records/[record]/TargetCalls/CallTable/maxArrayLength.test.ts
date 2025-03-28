import { describe, it, expect } from "vitest"
import { maxArrayLength } from "./maxArrayLength"

describe("maxArrayLength", () => {
  it("returns the maximum array length if there are nested arrays", () => {
    const values = [
      0,
      [
        {
          poolId:
            "0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8000200000000000000000019",
          assetInIndex: "0",
          assetOutIndex: "1",
          amount: "500000000000000000",
          userData: "0x",
        },
        {
          poolId:
            "0x0b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a",
          assetInIndex: "0",
          assetOutIndex: "2",
          amount: "500000000000000000",
          userData: "0x",
        },
        {
          poolId:
            "0x79c58f70905f734641735bc61e45c19dd9ad60bc0000000000000000000004e7",
          assetInIndex: "2",
          assetOutIndex: "1",
          amount: "0",
          userData: "0x",
        },
      ],
      [
        "0x0000000000000000000000000000000000000000",
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      ],
      {
        sender: "0x849D52316331967b6fF1198e5E32A0eB168D039d",
        fromInternalBalance: false,
        recipient: "0x849D52316331967b6fF1198e5E32A0eB168D039d",
        toInternalBalance: false,
      },
      ["1000000000000000000", "-2577523341", "0"],
      "9007199254740991",
    ]
    const params = [
      {
        internalType: "enum IVault.SwapKind",
        name: "kind",
        type: "uint8",
      },
      {
        components: [
          {
            internalType: "bytes32",
            name: "poolId",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "assetInIndex",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "assetOutIndex",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "userData",
            type: "bytes",
          },
        ],
        internalType: "struct IVault.BatchSwapStep[]",
        name: "swaps",
        type: "tuple[]",
      },
      {
        internalType: "contract IAsset[]",
        name: "assets",
        type: "address[]",
      },
      {
        components: [
          {
            internalType: "address",
            name: "sender",
            type: "address",
          },
          {
            internalType: "bool",
            name: "fromInternalBalance",
            type: "bool",
          },
          {
            internalType: "address payable",
            name: "recipient",
            type: "address",
          },
          {
            internalType: "bool",
            name: "toInternalBalance",
            type: "bool",
          },
        ],
        internalType: "struct IVault.FundManagement",
        name: "funds",
        type: "tuple",
      },
      {
        internalType: "int256[]",
        name: "limits",
        type: "int256[]",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
    ]
    expect(maxArrayLength(values, params)).toBe(3)
  })
})
