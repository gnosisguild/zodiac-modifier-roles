import {
    AURA, BAL, COMP, CRV, DAI, LDO, rETH2,
    sETH2, SWISE, USDC, USDT, WETH, wstETH,
    balancer,
    uniswapv3
} from "..//addresses"
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
        // Swapping of tokens COMP, CRV, LDO, WETH, USDC, DAI and USDT in Uniswap
        //---------------------------------------------------------------------------------------------------------------------------------

        /* ...allowErc20Approve(
          [COMP, rETH2, SWISE, sETH2, CRV, LDO, WETH, USDC, DAI, USDT],
          [uniswapv3.ROUTER_2]
        ), */

        // {
        //     targetAddress: uniswapv3.ROUTER_2,
        //     signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
        //     params: {
        //         [2]: dynamic32OneOf(
        //             [
        //                 [COMP, WETH, USDC],
        //                 [COMP, WETH, DAI],
        //                 [COMP, WETH],
        //                 [CRV, WETH, USDC],
        //                 [CRV, WETH, DAI],
        //                 [CRV, WETH],
        //                 [LDO, WETH, USDC],
        //                 [LDO, WETH, DAI],
        //                 [LDO, WETH],
        //                 [WETH, USDC],
        //                 [WETH, DAI],
        //                 [WETH, USDT],
        //                 [USDC, WETH],
        //                 [USDC, USDT],
        //                 [USDC, WETH, USDT],
        //                 [USDC, DAI],
        //                 [USDC, WETH, DAI],
        //                 [DAI, WETH],
        //                 [DAI, USDC],
        //                 [DAI, WETH, USDC],
        //                 [DAI, USDT],
        //                 [DAI, WETH, USDT],
        //                 [USDT, WETH],
        //                 [USDT, USDC],
        //                 [USDT, WETH, USDC],
        //                 [USDT, DAI],
        //                 [USDT, WETH, DAI],
        //             ],
        //             "address[]"
        //         ),
        //         [3]: staticEqual(AVATAR),
        //     },
        // },
        allow.mainnet.uniswapv3.router_2["swapExactTokensForTokens"](
            undefined,
            undefined,
            {
                oneOf: [
                    [COMP, WETH, USDC],
                    [COMP, WETH, DAI],
                    [COMP, WETH],
                    [CRV, WETH, USDC],
                    [CRV, WETH, DAI],
                    [CRV, WETH],
                    [LDO, WETH, USDC],
                    [LDO, WETH, DAI],
                    [LDO, WETH],
                    [WETH, USDC],
                    [WETH, DAI],
                    [WETH, USDT],
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
                ]
            },
            AVATAR
        ),

        {
            targetAddress: uniswapv3.ROUTER_2,
            signature:
                "exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))",
            params: {
                [0]: staticOneOf(
                    [COMP, CRV, DAI, LDO, rETH2, sETH2, SWISE, USDC, USDT, WETH],
                    "address"
                ),
                [1]: staticOneOf([DAI, USDC, USDT, sETH2, WETH], "address"),
                [3]: staticEqual(AVATAR),
            },
        },

        //---------------------------------------------------------------------------------------------------------------------------------
        // Swapping AURA, BAL, COMP, WETH and wstETH in Balancer: https://dev.balancer.fi/guides/swaps/single-swaps
        //---------------------------------------------------------------------------------------------------------------------------------

        /*     
        swap(SingleSwap_struct,FundManagement_struct,token_limit,deadline)
    
        struct SingleSwap {
          bytes32 poolId;
          SwapKind kind;      0 = GIVEN_IN, 1 = GIVEN_OUT
          IAsset assetIn;
          IAsset assetOut;
          uint256 amount;
          bytes userData;     userData specifies the JoinKind, see https://dev.balancer.fi/resources/joins-and-exits/pool-joins
        }
        struct FundManagement {
          address sender;
          bool fromInternalBalance;
          address payable recipient;
          bool toInternalBalance;
        }
         */

        // Swap AURA for WETH
        // ...allowErc20Approve([AURA], [balancer.VAULT]),
        {
            targetAddress: balancer.VAULT,
            signature:
                "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
            params: {
                [0]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"
                ),
                [1]: staticEqual(AVATAR), // recipient
                [2]: staticEqual(false, "bool"),
                [3]: staticEqual(AVATAR), // sender
                [4]: staticEqual(false, "bool"),
                [7]: staticEqual(
                    "0xcfca23ca9ca720b6e98e3eb9b6aa0ffc4a5c08b9000200000000000000000274",
                    "bytes32"
                ), // WETH-AURA pool ID
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
                [9]: staticEqual(AURA, "address"), // Asset in
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

        // Swap BAL for WETH
        // ...allowErc20Approve([BAL], [balancer.VAULT]),
        {
            targetAddress: balancer.VAULT,
            signature:
                "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
            params: {
                [0]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"
                ),
                [1]: staticEqual(AVATAR), // recipient
                [2]: staticEqual(false, "bool"),
                [3]: staticEqual(AVATAR), // sender
                [4]: staticEqual(false, "bool"),
                [7]: staticEqual(
                    "0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014",
                    "bytes32"
                ), // BAL-WETH pool ID
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
                [9]: staticEqual(BAL, "address"), // Asset in
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
                [0]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"
                ),
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
                [0]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"
                ),
                [1]: staticEqual(AVATAR), // recipient
                [2]: staticEqual(false, "bool"),
                [3]: staticEqual(AVATAR), // sender
                [4]: staticEqual(false, "bool"),
                [7]: staticEqual(
                    "0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8000200000000000000000019",
                    "bytes32"
                ), // USDC-WETH pool ID
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
                [9]: staticEqual(WETH, "address"), // Asset in
                [10]: staticEqual(USDC, "address"), // Asset out
                [12]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "bytes32"), // Offset of bytes from beginning of tuple 192=32*6
                [13]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"
                ), // bytes (userData) = for all current Balancer pools this can be left empty
            },
        },

        // Swap COMP for WETH
        // ...allowErc20Approve([COMP], [balancer.VAULT]),
        {
            targetAddress: balancer.VAULT,
            signature:
                "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
            params: {
                [0]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"
                ),
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

        // Swap wstETH for WETH
        // ...allowErc20Approve([wstETH], [balancer.VAULT]),
        {
            targetAddress: balancer.VAULT,
            signature:
                "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
            params: {
                [0]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"
                ),
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
                [0]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"
                ),
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
                [9]: staticEqual(WETH, "address"), // Asset in
                [10]: staticEqual(wstETH, "address"), // Asset out
                [12]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "bytes32"), // Offset of bytes from beginning of tuple 192=32*6
                [13]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"
                ), // bytes (userData) = for all current Balancer pools this can be left empty
            },
        },

        //---------------------------------------------------------------------------------------------------------------------------------
        // Swapping of COMP, BAL, LDO, CRV, WETH, USDC, USDT and DAI in SushiSwap
        //---------------------------------------------------------------------------------------------------------------------------------

        /* ...allowErc20Approve(
          [COMP, BAL, LDO, CRV, WETH, USDC, USDT, DAI],
          [SUSHISWAP_ROUTER]
        ), */

        // {
        //     targetAddress: SUSHISWAP_ROUTER,
        //     signature:
        //         "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
        //     params: {
        //         [2]: dynamic32OneOf(
        //             [
        //                 [COMP, WETH, USDC],
        //                 [COMP, WETH, DAI],
        //                 [COMP, WETH],
        //                 [BAL, WETH, USDC],
        //                 [BAL, WETH, DAI],
        //                 [BAL, WETH],
        //                 [LDO, WETH, USDC],
        //                 [LDO, WETH, DAI],
        //                 [LDO, WETH],
        //                 [CRV, WETH, USDC],
        //                 [CRV, WETH, DAI],
        //                 [CRV, WETH],
        //                 [WETH, USDC],
        //                 [WETH, DAI],
        //                 [WETH, USDT],
        //                 [USDC, WETH],
        //                 [USDC, WETH, USDT],
        //                 [USDC, USDT],
        //                 [USDC, WETH, DAI],
        //                 [USDC, DAI],
        //                 [USDT, WETH],
        //                 [USDT, WETH, USDC],
        //                 [USDT, USDC],
        //                 [USDT, WETH, DAI],
        //                 [USDT, DAI],
        //                 [DAI, WETH],
        //                 [DAI, WETH, USDC],
        //                 [DAI, USDC],
        //                 [DAI, WETH, USDT],
        //                 [DAI, USDT],
        //             ],
        //             "address[]"
        //         ),
        //         [3]: staticEqual(AVATAR),
        //     },
        // },
        allow.mainnet.sushiswap.router["swapExactTokensForTokens"](
            undefined,
            undefined,
            {
                oneOf: [
                    [COMP, WETH, USDC],
                    [COMP, WETH, DAI],
                    [COMP, WETH],
                    [BAL, WETH, USDC],
                    [BAL, WETH, DAI],
                    [BAL, WETH],
                    [LDO, WETH, USDC],
                    [LDO, WETH, DAI],
                    [LDO, WETH],
                    [CRV, WETH, USDC],
                    [CRV, WETH, DAI],
                    [CRV, WETH],
                    [WETH, USDC],
                    [WETH, DAI],
                    [WETH, USDT],
                    [USDC, WETH],
                    [USDC, WETH, USDT],
                    [USDC, USDT],
                    [USDC, WETH, DAI],
                    [USDC, DAI],
                    [USDT, WETH],
                    [USDT, WETH, USDC],
                    [USDT, USDC],
                    [USDT, WETH, DAI],
                    [USDT, DAI],
                    [DAI, WETH],
                    [DAI, WETH, USDC],
                    [DAI, USDC],
                    [DAI, WETH, USDT],
                    [DAI, USDT],
                ]
            },
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Swapping of ETH and stETH in Curve
        //---------------------------------------------------------------------------------------------------------------------------------

        // // ...allowErc20Approve([stETH], [CURVE_stETH_ETH_POOL]),
        // {
        //     targetAddress: CURVE_stETH_ETH_POOL,
        //     signature: "exchange(int128,int128,uint256,uint256)",
        //     send: true,
        // },
        // Exchange using ETH
        allow.mainnet.curve.steth_eth_pool["exchange"](
            undefined,
            undefined,
            undefined,
            undefined,
            {
                send: true
            }
        ),

        // Exchange not using ETH
        allow.mainnet.curve.steth_eth_pool["exchange"](),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Swapping in Curve's 3pool
        //---------------------------------------------------------------------------------------------------------------------------------

        // ...allowErc20Approve([DAI, USDC, USDT], [CURVE_3POOL]),
        // {
        //     targetAddress: CURVE_3POOL,
        //     signature: "exchange(int128,int128,uint256,uint256)",
        // },
        allow.mainnet.curve.x3CRV_pool["exchange"](),
    ],
    placeholders: { AVATAR },
} satisfies RolePreset

export default preset
