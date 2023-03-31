import {
    GNO, USDC, USDT, WBTC, WETH, WXDAI,
    balancer
} from "../addresses"
import {
    staticEqual,
    staticOneOf,
} from "../../helpers/utils"
import { AVATAR } from "../../placeholders"
import { RolePreset } from "../../types"
import { allow } from "../../allow"


const preset = {
    network: 100,
    allow: [

        //---------------------------------------------------------------------------------------------------------------------------------
        // Curve
        //---------------------------------------------------------------------------------------------------------------------------------

        //---------------------------------------------------------------------------------------------------------------------------------
        // Curve 3pool
        //---------------------------------------------------------------------------------------------------------------------------------

        // Remove Liquidity
        // {
        //     targetAddress: x3CRV_POOL,
        //     signature: "remove_liquidity(uint256,uint256[3])",
        // },
        allow.gnosis.curve.x3CRV_pool["remove_liquidity"](),

        // Remove Liquidity of One Coin
        // {
        //     targetAddress: x3CRV_POOL,
        //     signature: "remove_liquidity_one_coin(uint256,int128,uint256)",
        // },
        allow.gnosis.curve.x3CRV_pool["remove_liquidity_one_coin"](),

        // Remove Liquidity Imbalance
        // {
        //     targetAddress: x3CRV_POOL,
        //     signature: "remove_liquidity_imbalance(uint256[3],uint256)",
        // },
        allow.gnosis.curve.x3CRV_pool["remove_liquidity_imbalance"](),

        // Unstake
        // {
        //     targetAddress: x3CRV_GAUGE,
        //     signature: "withdraw(uint256)",
        // },
        allow.gnosis.curve.x3CRV_gauge["withdraw(uint256)"](),

        // NO EVIDENCE OF BEING USED
        // {
        //     targetAddress: x3CRV_GAUGE,
        //     signature: "withdraw(uint256,address,bool)",
        //     params: {
        //         [1]: staticEqual(AVATAR),
        //     },
        // },
        allow.gnosis.curve.x3CRV_gauge["withdraw(uint256,address,bool)"](
            undefined,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Curve EURe/x3CRV
        //---------------------------------------------------------------------------------------------------------------------------------

        // Remove Liquidity
        // {
        //     targetAddress: crvEUReUSD_POOL,
        //     signature: "remove_liquidity(uint256,uint256[2])",
        // },
        allow.gnosis.curve.crvEUReUSD_pool["remove_liquidity(uint256,uint256[2])"](),

        // Remove Liquidity (Underlying, using ZAP)
        // {
        //     targetAddress: crvEUReUSD_ZAP,
        //     signature: "remove_liquidity(uint256,uint256[4])",
        // },
        allow.gnosis.curve.crvEUReUSD_zap["remove_liquidity(uint256,uint256[4])"](),

        // Remove Liquidity of One Coin
        // {
        //     targetAddress: crvEUReUSD_POOL,
        //     signature: "remove_liquidity_one_coin(uint256,uint256,uint256)",
        // },
        allow.gnosis.curve.crvEUReUSD_pool["remove_liquidity_one_coin(uint256,uint256,uint256)"](),

        // Remove Liquidity of One Coin (Underlying, using ZAP)
        // {
        //     targetAddress: crvEUReUSD_ZAP,
        //     signature: "remove_liquidity_one_coin(uint256,uint256,uint256)",
        // },
        allow.gnosis.curve.crvEUReUSD_zap["remove_liquidity_one_coin(uint256,uint256,uint256)"](),

        // Unstake
        // {
        //     targetAddress: crvEUReUSD_GAUGE,
        //     signature: "withdraw(uint256)",
        // },
        allow.gnosis.curve.crvEUReUSD_gauge["withdraw(uint256)"](),

        // NO EVIDENCE OF BEING USED
        // {
        //     targetAddress: crvEUReUSD_GAUGE,
        //     signature: "withdraw(uint256,address,bool)",
        //     params: {
        //         [1]: staticEqual(AVATAR),
        //     },
        // },
        allow.gnosis.curve.crvEUReUSD_gauge["withdraw(uint256,address,bool)"](
            undefined,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Curve sGNO/GNO
        //---------------------------------------------------------------------------------------------------------------------------------

        // Remove Liquidity
        allow.gnosis.curve.sgnoCRV_lp_pool["remove_liquidity(uint256,uint256[2])"](),

        // Remove Liquidity of One Coin
        allow.gnosis.curve.sgnoCRV_lp_pool["remove_liquidity_one_coin(uint256,int128,uint256)"](),

        // Remove Liquidity Imbalance Coin
        allow.gnosis.curve.sgnoCRV_lp_pool["remove_liquidity_imbalance(uint256[2],uint256)"](),

        // Unstake
        allow.gnosis.curve.sgnoCRV_gauge["withdraw(uint256)"](),
        // NO EVIDENCE OF BEING USED
        allow.gnosis.curve.sgnoCRV_gauge["withdraw(uint256,address,bool)"](
            undefined,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Curve tricrypto
        //---------------------------------------------------------------------------------------------------------------------------------

        // Remove Liquidity
        allow.gnosis.curve.crv3crypto_pool["remove_liquidity"](),

        // Remove Liquidity (Underlying, using ZAP)
        allow.gnosis.curve.crv3crypto_zap["remove_liquidity(uint256,uint256[5])"](),

        // Remove Liquidity of One Coin
        allow.gnosis.curve.crv3crypto_pool["remove_liquidity_one_coin"](),

        // Remove Liquidity of One Coin (Underlying, using ZAP)
        allow.gnosis.curve.crv3crypto_zap["remove_liquidity_one_coin(uint256,uint256,uint256)"](),

        // Unstake
        allow.gnosis.curve.crv3crypto_gauge["withdraw(uint256)"](),
        // NO EVIDENCE OF BEING USED
        allow.gnosis.curve.crv3crypto_gauge["withdraw(uint256,address,bool)"](
            undefined,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Curve rGNO/sGNO
        //---------------------------------------------------------------------------------------------------------------------------------

        // Remove Liquidity
        allow.gnosis.curve.rgnoCRV_lp_pool["remove_liquidity(uint256,uint256[2])"](),

        // Remove Liquidity of One Coin
        allow.gnosis.curve.rgnoCRV_lp_pool["remove_liquidity_one_coin(uint256,int128,uint256)"](),

        // Remove Liquidity Imbalance Coin
        allow.gnosis.curve.rgnoCRV_lp_pool["remove_liquidity_imbalance(uint256[2],uint256)"](),

        // Unstake
        allow.gnosis.curve.rgnoCRV_gauge["withdraw(uint256)"](),
        // NO EVIDENCE OF BEING USED
        allow.gnosis.curve.rgnoCRV_gauge["withdraw(uint256,address,bool)"](
            undefined,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Curve MAI/x3CRV
        //---------------------------------------------------------------------------------------------------------------------------------

        // Remove Liquidity
        // {
        //     targetAddress: MAIx3CRV_LP_POOL,
        //     signature: "remove_liquidity(uint256,uint256[2])",
        // },
        allow.gnosis.curve.MAIx3CRV_lp_pool["remove_liquidity(uint256,uint256[2])"](),

        // Remove Liquidity (Underlying, using ZAP)
        // {
        //     targetAddress: FACTORY_METAPOOLS_ZAP,
        //     signature: "remove_liquidity(address,uint256,uint256[4])",
        // },
        allow.gnosis.curve.factory_metapools_zap["remove_liquidity(address,uint256,uint256[4])"](),

        // Remove Liquidity of One Coin
        // {
        //     targetAddress: MAIx3CRV_LP_POOL,
        //     signature: "remove_liquidity_one_coin(uint256,int128,uint256)",
        // },
        allow.gnosis.curve.MAIx3CRV_lp_pool["remove_liquidity_one_coin(uint256,int128,uint256)"](),

        // Remove Liquidity of One Coin (Underlying, using ZAP)
        // {
        //     targetAddress: FACTORY_METAPOOLS_ZAP,
        //     signature: "remove_liquidity_one_coin(address,uint256,int128,uint256)",
        // },
        allow.gnosis.curve.factory_metapools_zap["remove_liquidity_one_coin(address,uint256,int128,uint256)"](),

        // Unstake
        // {
        //     targetAddress: MAIx3CRV_GAUGE,
        //     signature: "withdraw(uint256)",
        // },
        allow.gnosis.curve.MAIx3CRV_gauge["withdraw(uint256)"](),

        // NO EVIDENCE OF BEING USED
        // {
        //     targetAddress: MAIx3CRV_GAUGE,
        //     signature: "withdraw(uint256,address,bool)",
        //     params: {
        //         [1]: staticEqual(AVATAR),
        //     },
        // },
        allow.gnosis.curve.MAIx3CRV_gauge["withdraw(uint256,address,bool)"](
            undefined,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Honeyswap
        //---------------------------------------------------------------------------------------------------------------------------------
        //---------------------------------------------------------------------------------------------------------------------------------
        // Honeyswap
        //---------------------------------------------------------------------------------------------------------------------------------

        // Remove Liquidity
        allow.gnosis.honeyswap.router["removeLiquidity"](
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        // //---------------------------------------------------------------------------------------------------------------------------------
        // // Honeyswap WETH/GNO
        // //---------------------------------------------------------------------------------------------------------------------------------
        // ...allowErc20Approve([WETH, GNO], [HONEYSWAP_ROUTER]),
        // ...allowErc20Approve([HLP_WETH_GNO], [HONEYSWAP_ROUTER]),

        // // Add Liquidity
        // allow.gnosis.honeyswap.router["addLiquidity"](
        //     {
        //         oneOf: [WETH, GNO]
        //     },
        //     {
        //         oneOf: [WETH, GNO]
        //     },
        //     undefined,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // // Remove Liquidity
        // allow.gnosis.honeyswap.router["removeLiquidity"](
        //     WETH,
        //     GNO,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // //---------------------------------------------------------------------------------------------------------------------------------
        // // Honeyswap GNO/FLX
        // //---------------------------------------------------------------------------------------------------------------------------------
        // ...allowErc20Approve([GNO, FLX], [HONEYSWAP_ROUTER]),
        // ...allowErc20Approve([HLP_GNO_FLX], [HONEYSWAP_ROUTER]),

        // // Add Liquidity
        // allow.gnosis.honeyswap.router["addLiquidity"](
        //     {
        //         oneOf: [GNO, FLX]
        //     },
        //     {
        //         oneOf: [GNO, FLX]
        //     },
        //     undefined,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // // Remove Liquidity
        // allow.gnosis.honeyswap.router["removeLiquidity"](
        //     GNO,
        //     FLX,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // //---------------------------------------------------------------------------------------------------------------------------------
        // // Honeyswap GNO/WXDAI
        // //---------------------------------------------------------------------------------------------------------------------------------
        // ...allowErc20Approve([GNO, WXDAI], [HONEYSWAP_ROUTER]),
        // ...allowErc20Approve([HLP_GNO_WXDAI], [HONEYSWAP_ROUTER]),

        // // Add Liquidity using XDAI
        // allow.gnosis.honeyswap.router["addLiquidityETH"](
        //     GNO,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR,
        //     undefined,
        //     {
        //         send: true
        //     }
        // ),

        // // Add Liquidity using WXDAI
        // allow.gnosis.honeyswap.router["addLiquidity"](
        //     {
        //         oneOf: [GNO, WXDAI]
        //     },
        //     {
        //         oneOf: [GNO, WXDAI]
        //     },
        //     undefined,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // // Remove Liquidity using XDAI
        // allow.gnosis.honeyswap.router["removeLiquidityETH"](
        //     GNO,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // // Remove Liquidity using WXDAI
        // allow.gnosis.honeyswap.router["removeLiquidity"](
        //     GNO,
        //     WXDAI,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // //---------------------------------------------------------------------------------------------------------------------------------
        // // Honeyswap GIV/GNO
        // //---------------------------------------------------------------------------------------------------------------------------------
        // ...allowErc20Approve([GIV, GNO], [HONEYSWAP_ROUTER]),
        // ...allowErc20Approve([HLP_GIV_GNO], [HONEYSWAP_ROUTER]),

        // // Add Liquidity
        // allow.gnosis.honeyswap.router["addLiquidity"](
        //     {
        //         oneOf: [GIV, GNO]
        //     },
        //     {
        //         oneOf: [GIV, GNO]
        //     },
        //     undefined,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // // Remove Liquidity
        // allow.gnosis.honeyswap.router["removeLiquidity"](
        //     GIV,
        //     GNO,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Swapr
        //---------------------------------------------------------------------------------------------------------------------------------

        // Remove Liquidity
        allow.gnosis.swapr.router["removeLiquidity"](
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        allow.gnosis.swapr.router["removeLiquidityWithPermit"](
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        // Remove Liquidity using XDAI
        allow.gnosis.swapr.router["removeLiquidityETH"](
            undefined,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        allow.gnosis.swapr.router["removeLiquidityETHWithPermit"](
            undefined,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        // //---------------------------------------------------------------------------------------------------------------------------------
        // // Swapr WETH/GNO
        // //---------------------------------------------------------------------------------------------------------------------------------
        // ...allowErc20Approve([WETH, GNO], [SWAPR_ROUTER]),
        // ...allowErc20Approve([DXS_WETH_GNO], [SWAPR_ROUTER]),

        // // Add Liquidity
        // allow.gnosis.swapr.router["addLiquidity"](
        //     {
        //         oneOf: [WETH, GNO]
        //     },
        //     {
        //         oneOf: [WETH, GNO]
        //     },
        //     undefined,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // // Remove Liquidity
        // allow.gnosis.swapr.router["removeLiquidity"](
        //     WETH,
        //     GNO,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // allow.gnosis.swapr.router["removeLiquidityWithPermit"](
        //     WETH,
        //     GNO,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // //---------------------------------------------------------------------------------------------------------------------------------
        // // Swapr GNO/WXDAI
        // //---------------------------------------------------------------------------------------------------------------------------------
        // ...allowErc20Approve([GNO, WXDAI], [SWAPR_ROUTER]),
        // ...allowErc20Approve([DXS_GNO_WXDAI], [SWAPR_ROUTER]),

        // // Add Liquidity using XDAI
        // allow.gnosis.swapr.router["addLiquidityETH"](
        //     GNO,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR,
        //     undefined,
        //     {
        //         send: true
        //     }
        // ),

        // // Add Liquidity using WXDAI
        // allow.gnosis.swapr.router["addLiquidity"](
        //     {
        //         oneOf: [GNO, WXDAI]
        //     },
        //     {
        //         oneOf: [GNO, WXDAI]
        //     },
        //     undefined,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // // Remove Liquidity using XDAI
        // allow.gnosis.swapr.router["removeLiquidityETH"](
        //     GNO,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // allow.gnosis.swapr.router["removeLiquidityETHWithPermit"](
        //     GNO,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // // Remove Liquidity using WXDAI
        // allow.gnosis.swapr.router["removeLiquidity"](
        //     GNO,
        //     WXDAI,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // allow.gnosis.swapr.router["removeLiquidityWithPermit"](
        //     GNO,
        //     WXDAI,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // //---------------------------------------------------------------------------------------------------------------------------------
        // // Swapr CRV/GNO
        // //---------------------------------------------------------------------------------------------------------------------------------
        // ...allowErc20Approve([CRV, GNO], [SWAPR_ROUTER]),
        // ...allowErc20Approve([DXS_CRV_GNO], [SWAPR_ROUTER]),

        // // Add Liquidity
        // allow.gnosis.swapr.router["addLiquidity"](
        //     {
        //         oneOf: [CRV, GNO]
        //     },
        //     {
        //         oneOf: [CRV, GNO]
        //     },
        //     undefined,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // // Remove Liquidity
        // allow.gnosis.swapr.router["removeLiquidity"](
        //     CRV,
        //     GNO,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // allow.gnosis.swapr.router["removeLiquidityWithPermit"](
        //     CRV,
        //     GNO,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // //---------------------------------------------------------------------------------------------------------------------------------
        // // Swapr GNO/QI
        // //---------------------------------------------------------------------------------------------------------------------------------
        // ...allowErc20Approve([GNO, QI], [SWAPR_ROUTER]),
        // ...allowErc20Approve([DXS_GNO_QI], [SWAPR_ROUTER]),

        // // Add Liquidity
        // allow.gnosis.swapr.router["addLiquidity"](
        //     {
        //         oneOf: [GNO, QI]
        //     },
        //     {
        //         oneOf: [GNO, QI]
        //     },
        //     undefined,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // // Remove Liquidity
        // allow.gnosis.swapr.router["removeLiquidity"](
        //     GNO,
        //     QI,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // allow.gnosis.swapr.router["removeLiquidityWithPermit"](
        //     GNO,
        //     QI,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // //---------------------------------------------------------------------------------------------------------------------------------
        // // Swapr BER/GNO
        // //---------------------------------------------------------------------------------------------------------------------------------
        // ...allowErc20Approve([BER, GNO], [SWAPR_ROUTER]),
        // ...allowErc20Approve([DXS_BER_GNO], [SWAPR_ROUTER]),

        // // Add Liquidity
        // allow.gnosis.swapr.router["addLiquidity"](
        //     {
        //         oneOf: [BER, GNO]
        //     },
        //     {
        //         oneOf: [BER, GNO]
        //     },
        //     undefined,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // // Remove Liquidity
        // allow.gnosis.swapr.router["removeLiquidity"](
        //     BER,
        //     GNO,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // allow.gnosis.swapr.router["removeLiquidityWithPermit"](
        //     BER,
        //     GNO,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // SushiSwap
        //---------------------------------------------------------------------------------------------------------------------------------

        // Remove Liquidity
        allow.gnosis.sushiswap.router["removeLiquidity"](
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        allow.gnosis.sushiswap.router["removeLiquidityWithPermit"](
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        // Unstake and Claim Rewards
        allow.gnosis.sushiswap.minichef_v2["withdrawAndHarvest"](
            undefined,
            undefined,
            AVATAR
        ),

        // //---------------------------------------------------------------------------------------------------------------------------------
        // // SushiSwap SUSHI/GNO
        // //---------------------------------------------------------------------------------------------------------------------------------
        // ...allowErc20Approve([SUSHI, GNO], [SUSHISWAP_ROUTER]),
        // ...allowErc20Approve([SLP_SUSHI_GNO], [SUSHISWAP_ROUTER]),

        // // Add Liquidity
        // allow.gnosis.sushiswap.router["addLiquidity"](
        //     SUSHI,
        //     GNO,
        //     undefined,
        //     undefined,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // // Remove Liquidity
        // allow.gnosis.sushiswap.router["removeLiquidity"](
        //     SUSHI,
        //     GNO,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // // Remove Liquidity
        // allow.gnosis.sushiswap.router["removeLiquidityWithPermit"](
        //     SUSHI,
        //     GNO,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // // Stake
        // allow.gnosis.sushiswap.minichef_v2["deposit"](
        //     10,
        //     undefined,
        //     AVATAR
        // ),

        // // Unstake and Claim Rewards
        // allow.gnosis.sushiswap.minichef_v2["withdrawAndHarvest"](
        //     10,
        //     undefined,
        //     AVATAR
        // ),

        // // Claim Rewards
        // allow.gnosis.sushiswap.minichef_v2["harvest"](
        //     10,
        //     AVATAR
        // ),

        // //---------------------------------------------------------------------------------------------------------------------------------
        // // SushiSwap WETH/wstETH
        // //---------------------------------------------------------------------------------------------------------------------------------
        // ...allowErc20Approve([WETH, wstETH], [SUSHISWAP_ROUTER]),
        // ...allowErc20Approve([SLP_WETH_wstETH], [SUSHISWAP_ROUTER]),

        // // Add Liquidity
        // allow.gnosis.sushiswap.router["addLiquidity"](
        //     WETH,
        //     wstETH,
        //     undefined,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // // Remove Liquidity
        // allow.gnosis.sushiswap.router["removeLiquidity"](
        //     WETH,
        //     wstETH,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // // Remove Liquidity
        // allow.gnosis.sushiswap.router["removeLiquidityWithPermit"](
        //     WETH,
        //     wstETH,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Agave
        //---------------------------------------------------------------------------------------------------------------------------------

        //---------------------------------------------------------------------------------------------------------------------------------
        // Agave - XDAI
        //---------------------------------------------------------------------------------------------------------------------------------

        // Set/Unset (bool "useAsCollateral" = True / "useAsCollateral" = False) WXDAI as Collateral (Set)
        allow.gnosis.agave.lending_pool["setUserUseReserveAsCollateral"](
            WXDAI
        ),

        // Repay
        allow.gnosis.agave.wxdai_gateway["repayETH"](
            undefined,
            undefined,
            AVATAR,
            {
                send: true
            }
        ),

        // Withdraw
        allow.gnosis.agave.wxdai_gateway["withdrawETH"](
            undefined,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Agave - GNO/WETH/USDC/USDT
        //---------------------------------------------------------------------------------------------------------------------------------

        // Set/Unset (bool "useAsCollateral" = True / "useAsCollateral" = False) the token as Collateral (Set)
        allow.gnosis.agave.lending_pool["setUserUseReserveAsCollateral"](
            {
                oneOf: [GNO, WETH, USDC, USDT]
            },
        ),

        // Repay
        allow.gnosis.agave.lending_pool["repay"](
            {
                oneOf: [GNO, WETH, USDC, USDT]
            },
            undefined,
            undefined,
            AVATAR,
        ),

        // Withdraw
        allow.gnosis.agave.lending_pool["withdraw"](
            {
                oneOf: [GNO, WETH, USDC, USDT]
            },
            undefined,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Agave - Staking
        //---------------------------------------------------------------------------------------------------------------------------------

        // Unstake
        allow.gnosis.agave.stkAGVE["redeem"](
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Balancer
        //---------------------------------------------------------------------------------------------------------------------------------

        // Relayer Approval (this is done only once per wallet)
        allow.gnosis.balancer.relayer_library["setRelayerApproval"](
            balancer.RELAYER
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Balancer Boosted Agave GNO/WETH
        //---------------------------------------------------------------------------------------------------------------------------------

        // Remove Liquidity
        {
            targetAddress: balancer.VAULT,
            signature:
                "exitPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
            params: {
                [0]: staticEqual(
                    "0xf48f01dcb2cbb3ee1f6aab0e742c2d3941039d56000200000000000000000012",
                    "bytes32"
                ), // Balancer PoolId
                [1]: staticEqual(AVATAR),
                [2]: staticEqual(AVATAR),
                [3]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000080",
                    "bytes32"), // Offset of tuple from beginning 128=32*4
                [4]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000080",
                    "bytes32"), // Offset of address[] from beginning of tuple 128=32*4
                [5]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"), // Offset of uint256[] from beginning of tuple 224=32*7
                [6]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000140",
                    "bytes32"), // Offset of bytes from beginning of tuple 320=32*10
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "bytes32"
                ), // Length of address[] = 2
                [9]: staticEqual(balancer.bb_ag_WETH, "address"),
                [10]: staticEqual(balancer.bb_ag_GNO, "address"),
                [11]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "bytes32"
                ), // Length of unit256[] = 2
                [14]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040",
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                ],
                    "bytes32"
                ), // Length of bytes
                [15]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "0x0000000000000000000000000000000000000000000000000000000000000002"
                ],
                    "bytes32"
                ), // Join Kind
            },
        },

        // Using the BALANCER_RELAYER and it's BALANCER_RELAYER_LIBRARY 

        // Swap WETH for bb_ag_WETH (for both, join and exit pool) / Swap GNO for bb_ag_GNO (for both, join and exit pool)
        {
            targetAddress: balancer.RELAYER_LIBRARY,
            signature:
                "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256,uint256,uint256)",
            params: {
                [0]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000120",
                    "bytes32"), // Offset of the tuple from beginning 288=32*9
                [1]: staticOneOf([
                    AVATAR,
                    balancer.RELAYER,
                ],
                    "address"), // sender
                [3]: staticOneOf([
                    AVATAR,
                    balancer.RELAYER,
                ],
                    "address"), // recipient
                [9]: staticOneOf([
                    "0xbb9cd48d33033f5effbedec9dd700c7d7e1dcf5000000000000000000000000e", // bb_ag_WETH
                    "0xffff76a3280e95dc855696111c2562da09db2ac000000000000000000000000c", // bb_ag_GNO
                ],
                    "bytes32"), // Balancer PoolId
                [10]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
                [11]: staticOneOf([
                    WETH,
                    balancer.bb_ag_WETH,
                    GNO,
                    balancer.bb_ag_GNO
                ],
                    "address"), // assetIn
                [12]: staticOneOf([
                    WETH,
                    balancer.bb_ag_WETH,
                    GNO,
                    balancer.bb_ag_GNO
                ],
                    "address"), // assetOut
                [14]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "bytes32"), // Offset of bytes from beginning of tuple 192=32*6
                [15]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"
                ), // bytes (userData) = for all current Balancer pools this can be left empty
            }
        },

        // Remove Liquidity
        {
            targetAddress: balancer.RELAYER_LIBRARY,
            signature:
                "exitPool(bytes32,uint8,address,address,(address[],uint256[],bytes,bool),(uint256,uint256)[])",
            params: {
                [0]: staticEqual(
                    "0xf48f01dcb2cbb3ee1f6aab0e742c2d3941039d56000200000000000000000012",
                    "bytes32"
                ), // Balancer PoolId
                [1]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"
                ), // bytes (userData)
                [2]: staticEqual(AVATAR),
                [3]: staticEqual(balancer.RELAYER, "address"),
                [4]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "bytes32"), // Offset of the first tuple from beginning 192=32*6
                [5]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000280",
                    "bytes32"), // Offset of the second tuple from beginning 640=32*20
                [6]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000080",
                    "bytes32"), // Offset of address[] from beginning of tuple 128=32*4
                [7]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"), // Offset of uint256[] from beginning of tuple 224=32*7
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000140",
                    "bytes32"), // Offset of bytes from beginning of tuple 320=32*10
                [10]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "bytes32"
                ), // Length of address[] = 2
                [11]: staticEqual(balancer.bb_ag_WETH, "address"),
                [12]: staticEqual(balancer.bb_ag_GNO, "address"),
                [13]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "bytes32"
                ), // Length of unit256[] = 2
                [16]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040",
                    "0x00000000000000000000000000000000000000000000000000000000000000c0"
                ],
                    "bytes32"
                ), // Length of bytes
                [17]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "0x0000000000000000000000000000000000000000000000000000000000000002"
                ],
                    "bytes32"
                ), // Join Kind
                [20]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "bytes32"
                ), // Length of (uint256,uint256)[] = 1
            },
        },

        // Unstake
        allow.gnosis.balancer.B_50bbagGNO_50bbagWETH_gauge["withdraw(uint256)"](),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Balancer Boosted Agave USD
        //---------------------------------------------------------------------------------------------------------------------------------

        // Remove Liquidity
        {
            targetAddress: balancer.VAULT,
            signature:
                "exitPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
            params: {
                [0]: staticEqual(
                    "0xfedb19ec000d38d92af4b21436870f115db22725000000000000000000000010",
                    "bytes32"
                ), // Balancer PoolId
                [1]: staticEqual(AVATAR),
                [2]: staticEqual(AVATAR),
                [3]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000080",
                    "bytes32"), // Offset of tuple from beginning 128=32*4
                [4]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000080",
                    "bytes32"), // Offset of address[] from beginning of tuple 128=32*4
                [5]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000120",
                    "bytes32"), // Offset of uint256[] from beginning of tuple 288=32*9
                [6]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000001c0",
                    "bytes32"), // Offset of bytes from beginning of tuple 448=32*14
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000004",
                    "bytes32"
                ), // Length of address[] = 4
                [9]: staticEqual(balancer.bb_ag_WXDAI, "address"),
                [10]: staticEqual(balancer.bb_ag_USDT, "address"),
                [11]: staticEqual(balancer.bb_ag_USDC, "address"),
                [12]: staticEqual(balancer.bb_ag_USD, "address"),
                [13]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000004",
                    "bytes32"
                ), // Length of unit256[] = 4
                [18]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040",
                    "0x0000000000000000000000000000000000000000000000000000000000000100",
                ],
                    "bytes32"
                ), // Length of bytes
                [19]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "0x0000000000000000000000000000000000000000000000000000000000000002"
                ],
                    "bytes32"
                ), // Join Kind
            },
        },

        // Using the BALANCER_RELAYER and it's BALANCER_RELAYER_LIBRARY 

        // Swap WXDAI for bb_ag_WXDAI (for both, join and exit pool)
        // Swap USDT for bb_ag_USDT (for both, join and exit pool)
        // Swap USDC for bb_ag_USDC (for both, join and exit pool)
        {
            targetAddress: balancer.RELAYER_LIBRARY,
            signature:
                "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256,uint256,uint256)",
            params: {
                [0]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000120",
                    "bytes32"), // Offset of the tuple from beginning 288=32*9
                [1]: staticOneOf([
                    AVATAR,
                    balancer.RELAYER,
                ],
                    "address"), // sender
                [3]: staticOneOf([
                    AVATAR,
                    balancer.RELAYER,
                ],
                    "address"), // recipient
                [9]: staticOneOf([
                    "0x41211bba6d37f5a74b22e667533f080c7c7f3f1300000000000000000000000b", // bb_ag_WXDAI
                    "0xd16f72b02da5f51231fde542a8b9e2777a478c8800000000000000000000000f", // bb_ag_USDT
                    "0xe7f88d7d4ef2eb18fcf9dd7216ba7da1c46f3dd600000000000000000000000a", // bb_ag_USDC
                ],
                    "bytes32"), // Balancer PoolId
                [10]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
                [11]: staticOneOf([
                    WXDAI,
                    balancer.bb_ag_WXDAI,
                    USDT,
                    balancer.bb_ag_USDT,
                    USDC,
                    balancer.bb_ag_USDC
                ],
                    "address"), // assetIn
                [12]: staticOneOf([
                    WXDAI,
                    balancer.bb_ag_WXDAI,
                    USDT,
                    balancer.bb_ag_USDT,
                    USDC,
                    balancer.bb_ag_USDC
                ],
                    "address"), // assetOut
                [14]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "bytes32"), // Offset of bytes from beginning of tuple 192=32*6
                [15]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"
                ), // bytes (userData) = for all current Balancer pools this can be left empty
            }
        },

        // IMPORTANT: FOR THE "Balancer Boosted Agave USD" the joinPool and exitPool MUST BE WHITELISTED WITH BOTH THE SENDER AND 
        // RECIPIENT WITH THE POSSIBILITY OF BEING EITHER THE AVATAR OR THE BALANCER_RELAYER. WHEN YOU ADD OR REMOVE LIQUIDITY
        // FROM A POOL WITH bb_ag_USD (ie: Balancer Boosted Agave WETH/WBTC/USD) THE BALANCER_RELAYER DOES A joinPool or exitPool 
        // WITH THE BALANCER_RELAYER AS BOTH THE SENDER AND RECIPIENT.

        // Remove Liquidity
        {
            targetAddress: balancer.RELAYER_LIBRARY,
            signature:
                "exitPool(bytes32,uint8,address,address,(address[],uint256[],bytes,bool),(uint256,uint256)[])",
            params: {
                [0]: staticEqual(
                    "0xfedb19ec000d38d92af4b21436870f115db22725000000000000000000000010",
                    "bytes32"
                ), // Balancer PoolId
                [1]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"
                ), // bytes (userData)
                [2]: staticOneOf([
                    AVATAR,
                    balancer.RELAYER,
                ],
                    "address"), // sender
                [3]: staticOneOf([
                    AVATAR,
                    balancer.RELAYER,
                ],
                    "address"), // recipient
                [4]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "bytes32"), // Offset of the first tuple from beginning 192=32*6
                [5]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000300",
                    "bytes32"), // Offset of the second tuple from beginning 768=32*24
                [6]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000080",
                    "bytes32"), // Offset of address[] from beginning of tuple 128=32*4
                [7]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000120",
                    "bytes32"), // Offset of uint256[] from beginning of tuple 288=32*9
                [8]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000001c0",
                    "bytes32"), // Offset of bytes from beginning of tuple 448=32*14
                [10]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000004",
                    "bytes32"
                ), // Length of address[] = 4
                [11]: staticEqual(balancer.bb_ag_WXDAI, "address"),
                [12]: staticEqual(balancer.bb_ag_USDT, "address"),
                [13]: staticEqual(balancer.bb_ag_USDC, "address"),
                [14]: staticEqual(balancer.bb_ag_USD, "address"),
                [15]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000004",
                    "bytes32"
                ), // Length of unit256[] = 4
                [20]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040",
                    "0x0000000000000000000000000000000000000000000000000000000000000100"
                ],
                    "bytes32"
                ), // Length of bytes
                [21]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "0x0000000000000000000000000000000000000000000000000000000000000002"
                ],
                    "bytes32"
                ), // Join Kind
                [24]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "bytes32"
                ), // Length of (uint256,uint256)[] = 1
            },
        },

        // Unstake
        allow.gnosis.balancer.bb_ag_USD_gauge["withdraw(uint256)"](),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Balancer Boosted Agave WETH/WBTC/USD
        //---------------------------------------------------------------------------------------------------------------------------------

        // Remove Liquidity
        {
            targetAddress: balancer.VAULT,
            signature:
                "exitPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
            params: {
                [0]: staticEqual(
                    "0x66f33ae36dd80327744207a48122f874634b3ada000100000000000000000013",
                    "bytes32"
                ), // Balancer PoolId
                [1]: staticEqual(AVATAR),
                [2]: staticEqual(AVATAR),
                [3]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000080",
                    "bytes32"), // Offset of tuple from beginning 128=32*4
                [4]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000080",
                    "bytes32"), // Offset of address[] from beginning of tuple 128=32*4
                [5]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000100",
                    "bytes32"), // Offset of uint256[] from beginning of tuple 256=32*8
                [6]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000180",
                    "bytes32"), // Offset of bytes from beginning of tuple 384=32*12
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000003",
                    "bytes32"
                ), // Length of address[] = 3
                [9]: staticEqual(balancer.bb_ag_WETH, "address"),
                [10]: staticEqual(balancer.bb_ag_WBTC, "address"),
                [11]: staticEqual(balancer.bb_ag_USD, "address"),
                [12]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000003",
                    "bytes32"
                ), // Length of unit256[] = 3
                [16]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040",
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                ],
                    "bytes32"
                ), // Length of bytes
                [17]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "0x0000000000000000000000000000000000000000000000000000000000000002"
                ],
                    "bytes32"
                ), // Join Kind
            },
        },

        // Using the BALANCER_RELAYER and it's BALANCER_RELAYER_LIBRARY 

        // Swap WETH for bb_ag_WETH (for both, join and exit pool)
        // Swap WBTC for bb_ag_WBTC (for both, join and exit pool)
        // Swap WXDAI for bb_ag_WXDAI (for both, join and exit pool)
        // Swap USDT for bb_ag_USDT (for both, join and exit pool)
        // Swap USDC for bb_ag_USDC (for both, join and exit pool)
        {
            targetAddress: balancer.RELAYER_LIBRARY,
            signature:
                "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256,uint256,uint256)",
            params: {
                [0]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000120",
                    "bytes32"), // Offset of the tuple from beginning 288=32*9
                [1]: staticOneOf([
                    AVATAR,
                    balancer.RELAYER,
                ],
                    "address"), // sender
                [3]: staticOneOf([
                    AVATAR,
                    balancer.RELAYER,
                ],
                    "address"), // recipient
                [9]: staticOneOf([
                    "0xbb9cd48d33033f5effbedec9dd700c7d7e1dcf5000000000000000000000000e", // bb_ag_WETH
                    "0xd4015683b8153666190e0b2bec352580ebc4caca00000000000000000000000d", // bb_ag_WBTC
                    "0x41211bba6d37f5a74b22e667533f080c7c7f3f1300000000000000000000000b", // bb_ag_WXDAI
                    "0xd16f72b02da5f51231fde542a8b9e2777a478c8800000000000000000000000f", // bb_ag_USDT
                    "0xe7f88d7d4ef2eb18fcf9dd7216ba7da1c46f3dd600000000000000000000000a", // bb_ag_USDC
                ],
                    "bytes32"), // Balancer PoolId
                [10]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
                [11]: staticOneOf([
                    WETH,
                    balancer.bb_ag_WETH,
                    WBTC,
                    balancer.bb_ag_WBTC,
                    WXDAI,
                    balancer.bb_ag_WXDAI,
                    USDT,
                    balancer.bb_ag_USDT,
                    USDC,
                    balancer.bb_ag_USDC
                ],
                    "address"), // assetIn
                [12]: staticOneOf([
                    WETH,
                    balancer.bb_ag_WETH,
                    WBTC,
                    balancer.bb_ag_WBTC,
                    WXDAI,
                    balancer.bb_ag_WXDAI,
                    USDT,
                    balancer.bb_ag_USDT,
                    USDC,
                    balancer.bb_ag_USDC
                ],
                    "address"), // assetOut
                [14]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "bytes32"), // Offset of bytes from beginning of tuple 192=32*6
                [15]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"
                ), // bytes (userData) = for all current Balancer pools this can be left empty
            }
        },

        // Remove Liquidity
        {
            targetAddress: balancer.RELAYER_LIBRARY,
            signature:
                "exitPool(bytes32,uint8,address,address,(address[],uint256[],bytes,bool),(uint256,uint256)[])",
            params: {
                [0]: staticEqual(
                    "0x66f33ae36dd80327744207a48122f874634b3ada000100000000000000000013",
                    "bytes32"
                ), // Balancer PoolId
                [1]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"
                ), // bytes (userData)
                [2]: staticEqual(AVATAR),
                [3]: staticEqual(balancer.RELAYER, "address"),
                [4]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "bytes32"), // Offset of the first tuple from beginning 192=32*6
                [5]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000002c0",
                    "bytes32"), // Offset of the second tuple from beginning 704=32*22
                [6]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000080",
                    "bytes32"), // Offset of address[] from beginning of tuple 128=32*4
                [7]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000100",
                    "bytes32"), // Offset of uint256[] from beginning of tuple 256=32*8
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000180",
                    "bytes32"), // Offset of bytes from beginning of tuple 384=32*12
                [10]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000003",
                    "bytes32"
                ), // Length of address[] = 3
                [11]: staticEqual(balancer.bb_ag_WETH, "address"),
                [12]: staticEqual(balancer.bb_ag_WBTC, "address"),
                [13]: staticEqual(balancer.bb_ag_USD, "address"),
                [14]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000003",
                    "bytes32"
                ), // Length of unit256[] = 3
                [18]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040",
                    "0x00000000000000000000000000000000000000000000000000000000000000e0"
                ],
                    "bytes32"
                ), // Length of bytes
                [19]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "0x0000000000000000000000000000000000000000000000000000000000000002"
                ],
                    "bytes32"
                ), // Join Kind
                [22]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "bytes32"
                ), // Length of (uint256,uint256)[] = 1
            },
        },

        // Unstake
        allow.gnosis.balancer.agUSD_agWETH_agWBTC_gauge["withdraw(uint256)"](),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Balancer Boosted Agave GNO/USD
        //---------------------------------------------------------------------------------------------------------------------------------

        // Remove Liquidity
        {
            targetAddress: balancer.VAULT,
            signature:
                "exitPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
            params: {
                [0]: staticEqual(
                    "0xb973ca96a3f0d61045f53255e319aedb6ed49240000200000000000000000011",
                    "bytes32"
                ), // Balancer PoolId
                [1]: staticEqual(AVATAR),
                [2]: staticEqual(AVATAR),
                [3]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000080",
                    "bytes32"), // Offset of tuple from beginning 128=32*4
                [4]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000080",
                    "bytes32"), // Offset of address[] from beginning of tuple 128=32*4
                [5]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"), // Offset of uint256[] from beginning of tuple 224=32*7
                [6]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000140",
                    "bytes32"), // Offset of bytes from beginning of tuple 320=32*10
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "bytes32"
                ), // Length of address[] = 2
                [9]: staticEqual(balancer.bb_ag_USD, "address"),
                [10]: staticEqual(balancer.bb_ag_GNO, "address"),
                [11]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "bytes32"
                ), // Length of unit256[] = 2
                [14]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040",
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                ],
                    "bytes32"
                ), // Length of bytes
                [15]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "0x0000000000000000000000000000000000000000000000000000000000000002"
                ],
                    "bytes32"
                ), // Join Kind
            },
        },

        // Using the BALANCER_RELAYER and it's BALANCER_RELAYER_LIBRARY 

        // Swap GNO for bb_ag_GNO (for both, join and exit pool)
        // Swap WXDAI for bb_ag_WXDAI (for both, join and exit pool)
        // Swap USDT for bb_ag_USDT (for both, join and exit pool)
        // Swap USDC for bb_ag_USDC (for both, join and exit pool)
        {
            targetAddress: balancer.RELAYER_LIBRARY,
            signature:
                "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256,uint256,uint256)",
            params: {
                [0]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000120",
                    "bytes32"), // Offset of the tuple from beginning 288=32*9
                [1]: staticOneOf([
                    AVATAR,
                    balancer.RELAYER,
                ],
                    "address"), // sender
                [3]: staticOneOf([
                    AVATAR,
                    balancer.RELAYER,
                ],
                    "address"), // recipient
                [9]: staticOneOf([
                    "0xffff76a3280e95dc855696111c2562da09db2ac000000000000000000000000c", // bb_ag_GNO
                    "0x41211bba6d37f5a74b22e667533f080c7c7f3f1300000000000000000000000b", // bb_ag_WXDAI
                    "0xd16f72b02da5f51231fde542a8b9e2777a478c8800000000000000000000000f", // bb_ag_USDT
                    "0xe7f88d7d4ef2eb18fcf9dd7216ba7da1c46f3dd600000000000000000000000a", // bb_ag_USDC
                ],
                    "bytes32"), // Balancer PoolId
                [10]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
                [11]: staticOneOf([
                    GNO,
                    balancer.bb_ag_GNO,
                    WXDAI,
                    balancer.bb_ag_WXDAI,
                    USDT,
                    balancer.bb_ag_USDT,
                    USDC,
                    balancer.bb_ag_USDC
                ],
                    "address"), // assetIn
                [12]: staticOneOf([
                    GNO,
                    balancer.bb_ag_GNO,
                    WXDAI,
                    balancer.bb_ag_WXDAI,
                    USDT,
                    balancer.bb_ag_USDT,
                    USDC,
                    balancer.bb_ag_USDC
                ],
                    "address"), // assetOut
                [14]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "bytes32"), // Offset of bytes from beginning of tuple 192=32*6
                [15]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"
                ), // bytes (userData) = for all current Balancer pools this can be left empty
            }
        },

        // Remove Liquidity
        {
            targetAddress: balancer.RELAYER_LIBRARY,
            signature:
                "exitPool(bytes32,uint8,address,address,(address[],uint256[],bytes,bool),(uint256,uint256)[])",
            params: {
                [0]: staticEqual(
                    "0xb973ca96a3f0d61045f53255e319aedb6ed49240000200000000000000000011",
                    "bytes32"
                ), // Balancer PoolId
                [1]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"
                ), // bytes (userData)
                [2]: staticEqual(AVATAR),
                [3]: staticEqual(balancer.RELAYER, "address"),
                [4]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "bytes32"), // Offset of the first tuple from beginning 192=32*6
                [5]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000280",
                    "bytes32"), // Offset of the second tuple from beginning 640=32*20
                [6]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000080",
                    "bytes32"), // Offset of address[] from beginning of tuple 128=32*4
                [7]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"), // Offset of uint256[] from beginning of tuple 224=32*7
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000140",
                    "bytes32"), // Offset of bytes from beginning of tuple 320=32*10
                [10]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "bytes32"
                ), // Length of address[] = 2
                [11]: staticEqual(balancer.bb_ag_USD, "address"),
                [12]: staticEqual(balancer.bb_ag_GNO, "address"),
                [13]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "bytes32"
                ), // Length of unit256[] = 2
                [16]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040",
                    "0x00000000000000000000000000000000000000000000000000000000000000c0"
                ],
                    "bytes32"
                ), // Length of bytes
                [17]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "0x0000000000000000000000000000000000000000000000000000000000000002"
                ],
                    "bytes32"
                ), // Join Kind
                [20]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "bytes32"
                ), // Length of (uint256,uint256)[] = 1
            },
        },

        // Unstake
        allow.gnosis.balancer.B_50bbagGNO_50bbagUSD_gauge["withdraw(uint256)"](),
    ],
    placeholders: { AVATAR },
} satisfies RolePreset

export default preset
