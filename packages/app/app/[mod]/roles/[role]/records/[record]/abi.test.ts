import { describe, expect, it } from "vitest"
import { mapAbiInputs } from "./abi"

describe("mapAbiInputs", () => {
  it("should correctly map arrays of tuples", () => {
    const result = mapAbiInputs(
      [
        {
          name: "_actions",
          type: "tuple[]",
          components: [
            {
              name: "actionType",
              type: "uint8",
              internalType: "enum SiloRouterV2.ActionType",
            },
            {
              name: "silo",
              type: "address",
              internalType: "contract ISilo",
            },
            {
              name: "asset",
              type: "address",
              internalType: "contract IERC20",
            },
            {
              name: "amount",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "collateralOnly",
              type: "bool",
              internalType: "bool",
            },
          ],
          internalType: "struct SiloRouterV2.Action[]",
        },
      ],
      [
        [
          {
            actionType: 1,
            silo: "0x92E7E77163FFed918421E3CB6e0A22F2Fe8B37FA",
            asset: "0xba100000625a3754423978a60c9317c58a424e3D",
            amount:
              115792089237316195423570985008687907853269984665640564039457584007913129639935n,
            collateralOnly: false,
          },
        ],
      ]
    )

    expect(result).toEqual({
      _actions: [
        {
          actionType: 1,
          silo: "0x92E7E77163FFed918421E3CB6e0A22F2Fe8B37FA",
          asset: "0xba100000625a3754423978a60c9317c58a424e3D",
          amount:
            115792089237316195423570985008687907853269984665640564039457584007913129639935n,
          collateralOnly: false,
        },
      ],
    })
  })
})
