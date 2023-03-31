import {
    AAVE, COMP, DAI, rETH2, sETH2, SWISE,
    USDC, USDT, WBTC, WETH, wstETH,
    balancer,
    uniswapv3
} from "../addresses"
import {
    staticEqual,
    staticOneOf,
} from "../../helpers/utils"
import { AVATAR } from "../../placeholders"
import { RolePreset } from "../../types"
import { allow } from "../../allow"


const preset = {
    network: 1,
    allow: [

        //---------------------------------------------------------------------------------------------------------------------------------
        // Wrapping and unwrapping of ETH, WETH
        //---------------------------------------------------------------------------------------------------------------------------------
        // {
        //   targetAddress: WETH,
        //   signature: "withdraw(uint256)",
        // },
        allow.mainnet.weth["withdraw"](),

        // {
        //   targetAddress: WETH,
        //   signature: "deposit()",
        //   send: true,
        // },
        allow.mainnet.weth["deposit"](
            {
                send: true
            }
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Swapping of tokens COMP, AAVE, rETH2, SWISE, sETH2, WETH, USDC, DAI, USDT and WBTC in UniswapV3
        //---------------------------------------------------------------------------------------------------------------------------------

        // THE FUNCTION "swapExactTokensForTokens(uint256,uint256,address[],address)" USE UNISWAPV2 ROUTES
        // {
        //   targetAddress: uniswapv3.ROUTER_2,
        //   signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
        //   params: {
        //     [2]: dynamic32OneOf(
        //       [
        //         [COMP, WETH, USDC],
        //         [COMP, WETH, DAI],
        //         [COMP, WETH],
        //         [AAVE, WETH, USDC],
        //         [AAVE, WETH, DAI],
        //         [AAVE, WETH],
        //         [rETH2, sETH2, WETH, USDC],
        //         [rETH2, sETH2, WETH, DAI],
        //         [rETH2, sETH2, WETH],
        //         [SWISE, sETH2, WETH, USDC],
        //         [SWISE, sETH2, WETH, DAI],
        //         [SWISE, sETH2, WETH],
        //         [sETH2, WETH],
        //         [WETH, sETH2],
        //         [WETH, DAI],
        //         [WETH, USDC],
        //         [WETH, USDT],
        //         [WETH, WBTC],
        //         [USDC, WETH],
        //         [USDC, USDT],
        //         [USDC, WETH, USDT],
        //         [USDC, DAI],
        //         [USDC, WETH, DAI],
        //         [DAI, WETH],
        //         [DAI, USDC],
        //         [DAI, WETH, USDC],
        //         [DAI, USDT],
        //         [DAI, WETH, USDT],
        //         [USDT, WETH],
        //         [USDT, USDC],
        //         [USDT, WETH, USDC],
        //         [USDT, DAI],
        //         [USDT, WETH, DAI],
        //         [WBTC, WETH],
        //       ],
        //       "address[]"
        //     ),
        //     [3]: staticEqual(AVATAR),
        //   },
        // },
        allow.mainnet.uniswapv3.router_2["swapExactTokensForTokens"](
            undefined,
            undefined,
            {
                oneOf: [
                    [COMP, WETH, USDC],
                    [COMP, WETH, DAI],
                    [COMP, WETH],
                    [AAVE, WETH, USDC],
                    [AAVE, WETH, DAI],
                    [AAVE, WETH],
                    [rETH2, sETH2, WETH, USDC],
                    [rETH2, sETH2, WETH, DAI],
                    [rETH2, sETH2, WETH],
                    [SWISE, sETH2, WETH, USDC],
                    [SWISE, sETH2, WETH, DAI],
                    [SWISE, sETH2, WETH],
                    [sETH2, WETH],
                    [WETH, sETH2],
                    [WETH, DAI],
                    [WETH, USDC],
                    [WETH, USDT],
                    [WETH, WBTC],
                    [USDC, WETH],
                    [USDC, USDT],
                    [USDC, WETH, USDT],
                    [USDC, DAI],
                    [USDC, WETH, DAI],
                    [DAI, WETH],
                    [DAI, USDC],
                    [DAI, WETH, USDC],
                    [DAI, USDT],
                    [DAI, WETH, USDT],
                    [USDT, WETH],
                    [USDT, USDC],
                    [USDT, WETH, USDC],
                    [USDT, DAI],
                    [USDT, WETH, DAI],
                    [WBTC, WETH]
                ]
            },
            AVATAR
        ),

        // Swap COMP for WETH
        {
            targetAddress: uniswapv3.ROUTER_2,
            signature:
                "exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))",
            params: {
                [0]: staticEqual(COMP, "address"),
                [1]: staticEqual(WETH, "address"),
                // [2]: staticOneOf([100, 500, 3000, 10000], "uint24"),
                [3]: staticEqual(AVATAR),
            },
        },

        // Swap AAVE for WETH
        {
            targetAddress: uniswapv3.ROUTER_2,
            signature:
                "exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))",
            params: {
                [0]: staticEqual(AAVE, "address"),
                [1]: staticEqual(WETH, "address"),
                // [2]: staticOneOf([100, 500, 3000, 10000], "uint24"),
                [3]: staticEqual(AVATAR),
            },
        },

        // Swap rETH2 for sETH2
        {
            targetAddress: uniswapv3.ROUTER_2,
            signature:
                "exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))",
            params: {
                [0]: staticEqual(rETH2, "address"),
                [1]: staticEqual(sETH2, "address"),
                // [2]: staticOneOf([100, 500, 3000, 10000], "uint24"),
                [3]: staticEqual(AVATAR),
            },
        },

        // Swap SWISE for sETH2
        {
            targetAddress: uniswapv3.ROUTER_2,
            signature:
                "exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))",
            params: {
                [0]: staticEqual(SWISE, "address"),
                [1]: staticEqual(sETH2, "address"),
                // [2]: staticOneOf([100, 500, 3000, 10000], "uint24"),
                [3]: staticEqual(AVATAR),
            },
        },

        // Swap sETH2 for WETH
        {
            targetAddress: uniswapv3.ROUTER_2,
            signature:
                "exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))",
            params: {
                [0]: staticEqual(sETH2, "address"),
                [1]: staticEqual(WETH, "address"),
                // [2]: staticOneOf([100, 500, 3000, 10000], "uint24"),
                [3]: staticEqual(AVATAR),
            },
        },

        // Swap WETH for sETH2/USDC/USDT/DAI/WBTC
        {
            targetAddress: uniswapv3.ROUTER_2,
            signature:
                "exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))",
            params: {
                [0]: staticEqual(WETH, "address"),
                [1]: staticOneOf([sETH2, USDC, USDT, DAI, WBTC], "address"),
                // [2]: staticOneOf([100, 500, 3000, 10000], "uint24"),
                [3]: staticEqual(AVATAR),
            },
        },

        // Swap USDC for WETH/USDT/DAI
        {
            targetAddress: uniswapv3.ROUTER_2,
            signature:
                "exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))",
            params: {
                [0]: staticEqual(USDC, "address"),
                [1]: staticOneOf([WETH, USDT, DAI], "address"),
                // [2]: staticOneOf([100, 500, 3000, 10000], "uint24"),
                [3]: staticEqual(AVATAR),
            },
        },

        // Swap DAI for WETH/USDC/USDT
        {
            targetAddress: uniswapv3.ROUTER_2,
            signature:
                "exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))",
            params: {
                [0]: staticEqual(DAI, "address"),
                [1]: staticOneOf([WETH, USDC, USDT], "address"),
                // [2]: staticOneOf([100, 500, 3000, 10000], "uint24"),
                [3]: staticEqual(AVATAR),
            },
        },

        // Swap USDT for WETH/USDC/DAI
        {
            targetAddress: uniswapv3.ROUTER_2,
            signature:
                "exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))",
            params: {
                [0]: staticEqual(USDT, "address"),
                [1]: staticOneOf([WETH, USDC, DAI], "address"),
                // [2]: staticOneOf([100, 500, 3000, 10000], "uint24"),
                [3]: staticEqual(AVATAR),
            },
        },

        // Swap WBTC for WETH
        {
            targetAddress: uniswapv3.ROUTER_2,
            signature:
                "exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))",
            params: {
                [0]: staticEqual(WBTC, "address"),
                [1]: staticEqual(WETH, "address"),
                // [2]: staticOneOf([100, 500, 3000, 10000], "uint24"),
                [3]: staticEqual(AVATAR),
            },
        },

        //---------------------------------------------------------------------------------------------------------------------------------
        // Swapping of COMP, WETH, in Balancer: https://dev.balancer.fi/guides/swaps/single-swaps
        //---------------------------------------------------------------------------------------------------------------------------------

        // Swap COMP for WETH
        // ...allowErc20Approve([COMP], [balancer.VAULT]),
        {
            targetAddress: balancer.VAULT,
            signature:
                "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
            params: {
                [0]: staticEqual("0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"), // Offset of the tuple from beginning 224=32*7
                [1]: staticEqual(AVATAR), // recipient
                [2]: staticEqual(false, "bool"),
                [3]: staticEqual(AVATAR), // sender
                [4]: staticEqual(false, "bool"),
                [7]: staticEqual(
                    "0xefaa1604e82e1b3af8430b90192c1b9e8197e377000200000000000000000021",
                    "bytes32"
                ), // COMP-WETH pool ID
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
                [9]: staticEqual(COMP, "address"), // Asset in
                [10]: staticEqual(WETH, "address"), // Asset out
                [12]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "bytes32"), // Offset of bytes from beginning of tuple 192=32*6
                [13]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"
                ), // bytes (userData) = for all current Balancer pools this can be left empty
            },
        },

        // Swap WETH for DAI
        // ...allowErc20Approve([WETH], [balancer.VAULT]),
        {
            targetAddress: balancer.VAULT,
            signature:
                "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
            params: {
                [0]: staticEqual("0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"), // Offset of the tuple from beginning 224=32*7
                [1]: staticEqual(AVATAR), // recipient
                [2]: staticEqual(false, "bool"),
                [3]: staticEqual(AVATAR), // sender
                [4]: staticEqual(false, "bool"),
                [7]: staticEqual(
                    "0x0b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a",
                    "bytes32"
                ), // WETH-DAI pool ID
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
                [9]: staticEqual(WETH, "address"), // Asset in
                [10]: staticEqual(DAI, "address"), // Asset out
                [12]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "bytes32"), // Offset of bytes from beginning of tuple 192=32*6
                [13]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"
                ), // bytes (userData) = for all current Balancer pools this can be left empty
            },
        },

        // Swap WETH for USDC
        // ...allowErc20Approve([WETH], [balancer.VAULT]),
        {
            targetAddress: balancer.VAULT,
            signature:
                "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
            params: {
                [0]: staticEqual("0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"), // Offset of the tuple from beginning 224=32*7
                [1]: staticEqual(AVATAR), // recipient
                [2]: staticEqual(false, "bool"),
                [3]: staticEqual(AVATAR), // sender
                [4]: staticEqual(false, "bool"),
                [7]: staticEqual(
                    "0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8000200000000000000000019",
                    "bytes32"
                ), //USDC-WETH pool ID
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
                [9]: staticEqual(WETH, "address"), //Asset in
                [10]: staticEqual(USDC, "address"), //Asset out
                [12]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "bytes32"), // Offset of bytes from beginning of tuple 192=32*6
                [13]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"
                ), // bytes (userData) = for all current Balancer pools this can be left empty
            },
        },

        // Swap wstETH for WETH
        // ...allowErc20Approve([wstETH], [balancer.VAULT]),
        {
            targetAddress: balancer.VAULT,
            signature:
                "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
            params: {
                [0]: staticEqual("0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"), // Offset of the tuple from beginning 224=32*7
                [1]: staticEqual(AVATAR), // recipient
                [2]: staticEqual(false, "bool"),
                [3]: staticEqual(AVATAR), // sender
                [4]: staticEqual(false, "bool"),
                [7]: staticEqual(
                    "0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080",
                    "bytes32"
                ), // wstETH-WETH pool ID
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
                [9]: staticEqual(wstETH, "address"), // Asset in
                [10]: staticEqual(WETH, "address"), // Asset out
                [12]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "bytes32"), // Offset of bytes from beginning of tuple 192=32*6
                [13]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"
                ), // bytes (userData) = for all current Balancer pools this can be left empty
            },
        },

        // Swap WETH for wstETH
        // ...allowErc20Approve([WETH], [balancer.VAULT]),
        {
            targetAddress: balancer.VAULT,
            signature:
                "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
            params: {
                [0]: staticEqual("0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"), // Offset of the tuple from beginning 224=32*7
                [1]: staticEqual(AVATAR), // recipient
                [2]: staticEqual(false, "bool"),
                [3]: staticEqual(AVATAR), // sender
                [4]: staticEqual(false, "bool"),
                [7]: staticEqual(
                    "0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080",
                    "bytes32"
                ), // wstETH-WETH pool ID
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
                [9]: staticEqual(WETH, "address"), //Asset in
                [10]: staticEqual(wstETH, "address"), //Asset out
                [12]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "bytes32"), // Offset of bytes from beginning of tuple 192=32*6
                [13]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"
                ), // bytes (userData) = for all current Balancer pools this can be left empty
            },
        },
    ],
    placeholders: { AVATAR },
} satisfies RolePreset

export default preset
