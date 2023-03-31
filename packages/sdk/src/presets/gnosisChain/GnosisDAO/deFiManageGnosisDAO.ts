import {
    ZERO_ADDRESS, AGVE, BER, COW, CRV, EURe, FLX, GIV, GNO,
    MAI, QI, rGNO, sGNO, SUSHI, USDC,
    USDT, WBTC, WETH, wstETH, WXDAI, x3CRV,
    OMNI_BRIDGE,
    agave,
    balancer,
    curve,
    honeyswap,
    sushiswap,
    swapr
} from "../addresses"
import { allowErc20Approve } from "../../helpers/erc20"
import {
    staticEqual,
    staticOneOf,
} from "../../helpers/utils"
import { AVATAR, OMNI_BRIDGE_RECIPIENT_MAINNET } from "../../placeholders"
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
        ...allowErc20Approve([USDC, USDT, WXDAI], [curve.x3CRV_POOL]),
        ...allowErc20Approve([curve.x3CRV_LP], [curve.x3CRV_GAUGE]),
        ...allowErc20Approve([WXDAI, USDC, USDT], [curve.STAKE_DEPOSIT_ZAP]),

        // Add Liquidity
        // {
        //     targetAddress: x3CRV_POOL,
        //     signature: "add_liquidity(uint256[3],uint256)",
        // },
        allow.gnosis.curve.x3CRV_pool["add_liquidity"](),

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

        // Exchange
        // {
        //     targetAddress: x3CRV_POOL,
        //     signature: "exchange(int128,int128,uint256,uint256)",
        // },
        allow.gnosis.curve.x3CRV_pool["exchange"](),

        // Stake
        // {
        //     targetAddress: x3CRV_GAUGE,
        //     signature: "deposit(uint256)",
        // },
        allow.gnosis.curve.x3CRV_gauge["deposit(uint256)"](),

        // NO EVIDENCE OF BEING USED
        // {
        //     targetAddress: x3CRV_GAUGE,
        //     signature: "deposit(uint256,address,bool)",
        //     params: {
        //         [1]: staticEqual(AVATAR),
        //     },
        // },
        allow.gnosis.curve.x3CRV_gauge["deposit(uint256,address,bool)"](
            undefined,
            AVATAR
        ),

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

        // Claim Rewards
        // {
        //     targetAddress: x3CRV_GAUGE,
        //     signature: "claim_rewards()",
        // },
        allow.gnosis.curve.x3CRV_gauge["claim_rewards()"](),

        // Claim CRV
        allow.gnosis.curve.crv_minter["mint"](
            curve.x3CRV_GAUGE
        ),

        // Deposit and Stake using a special ZAP
        // {
        //     targetAddress: CURVE_STAKE_DEPOSIT_ZAP,
        //     signature: "deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)",
        //     params: {
        //         [0]: staticEqual(x3CRV_POOL, "address"),
        //         [1]: staticEqual(x3CRV_LP, "address"),
        //         [2]: staticEqual(x3CRV_GAUGE, "address"),
        //         [3]: staticEqual(3, "uint256"),
        //         [4]: staticEqual([
        //             [WXDAI, USDC, USDT, ZERO_ADDRESS, ZERO_ADDRESS]
        //         ],
        //             "address[5]"),
        //         [8]: staticEqual(ZERO_ADDRESS, "address"),
        //     },
        // },
        allow.gnosis.curve.stake_deposit_zap["deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)"](
            curve.x3CRV_POOL,
            curve.x3CRV_LP,
            curve.x3CRV_GAUGE,
            3,
            [WXDAI, USDC, USDT, ZERO_ADDRESS, ZERO_ADDRESS],
            undefined,
            undefined,
            undefined,
            ZERO_ADDRESS
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Curve EURe/x3CRV
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([EURe, x3CRV], [curve.crvEUReUSD_POOL]),
        ...allowErc20Approve([curve.crvEUReUSD_LP], [curve.crvEUReUSD_GAUGE]),
        ...allowErc20Approve([EURe, WXDAI, USDC, USDT], [curve.crvEUReUSD_ZAP]),
        ...allowErc20Approve([EURe, x3CRV, WXDAI, USDC, USDT], [curve.STAKE_DEPOSIT_ZAP]),

        // Add Liquidity
        // {
        //     targetAddress: crvEUReUSD_POOL,
        //     signature: "add_liquidity(uint256[2],uint256)",
        // },
        allow.gnosis.curve.crvEUReUSD_pool["add_liquidity(uint256[2],uint256,address)"](),

        // Add Liquidity (Underlying, using ZAP)
        // {
        //     targetAddress: crvEUReUSD_ZAP,
        //     signature: "add_liquidity(uint256[4],uint256)",
        // },
        allow.gnosis.curve.crvEUReUSD_zap["add_liquidity(uint256[4],uint256)"](),

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

        // Exchange
        // {
        //     targetAddress: crvEUReUSD_POOL,
        //     signature: "exchange(uint256,uint256,uint256,uint256)",
        // },
        allow.gnosis.curve.crvEUReUSD_pool["exchange(uint256,uint256,uint256,uint256)"](),

        // Exchange (Underlying, using ZAP)
        // {
        //     targetAddress: crvEUReUSD_ZAP,
        //     signature: "exchange_underlying(uint256,uint256,uint256,uint256)",
        // },
        allow.gnosis.curve.crvEUReUSD_zap["exchange_underlying(uint256,uint256,uint256,uint256)"](),

        // Stake
        // {
        //     targetAddress: crvEUReUSD_GAUGE,
        //     signature: "deposit(uint256)",
        // },
        allow.gnosis.curve.crvEUReUSD_gauge["deposit(uint256)"](),

        // NO EVIDENCE OF BEING USED
        // {
        //     targetAddress: crvEUReUSD_GAUGE,
        //     signature: "deposit(uint256,address,bool)",
        //     params: {
        //         [1]: staticEqual(AVATAR),
        //     },
        // },
        allow.gnosis.curve.crvEUReUSD_gauge["deposit(uint256,address,bool)"](
            undefined,
            AVATAR
        ),

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

        // Claim Rewards
        // {
        //     targetAddress: crvEUReUSD_GAUGE,
        //     signature: "claim_rewards()",
        // },
        allow.gnosis.curve.crvEUReUSD_gauge["claim_rewards()"](),

        // Claim CRV
        allow.gnosis.curve.crv_minter["mint"](
            curve.crvEUReUSD_GAUGE
        ),

        // Deposit and Stake using a special ZAP
        // {
        //     targetAddress: CURVE_STAKE_DEPOSIT_ZAP,
        //     signature: "deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)",
        //     params: {
        //         [0]: staticOneOf([crvEUReUSD_POOL, crvEUReUSD_ZAP], "address"),
        //         [1]: staticEqual(crvEUReUSD_LP, "address"),
        //         [2]: staticEqual(crvEUReUSD_GAUGE, "address"),
        //         [3]: staticOneOf([2, 4], "uint256"),
        //         [4]: staticOneOf([
        //             [EURe, x3CRV, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
        //             [EURe, WXDAI, USDC, USDT, ZERO_ADDRESS]],
        //             "address[5]"),
        //         [8]: staticEqual(ZERO_ADDRESS, "address"),
        //     },
        // },
        allow.gnosis.curve.stake_deposit_zap["deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)"](
            {
                oneOf: [curve.crvEUReUSD_POOL, curve.crvEUReUSD_ZAP]
            },
            curve.crvEUReUSD_LP,
            curve.crvEUReUSD_GAUGE,
            {
                oneOf: [2, 4]
            },
            {
                oneOf: [
                    [EURe, x3CRV, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
                    [EURe, WXDAI, USDC, USDT, ZERO_ADDRESS]
                ]
            },
            undefined,
            undefined,
            undefined,
            ZERO_ADDRESS
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Curve sGNO/GNO
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([sGNO, GNO], [curve.sgnoCRV_LP_POOL]),
        ...allowErc20Approve([curve.sgnoCRV_LP_POOL], [curve.sgnoCRV_GAUGE]),

        // Add Liquidity
        allow.gnosis.curve.sgnoCRV_lp_pool["add_liquidity(uint256[2],uint256)"](),

        // Remove Liquidity
        allow.gnosis.curve.sgnoCRV_lp_pool["remove_liquidity(uint256,uint256[2])"](),

        // Remove Liquidity of One Coin
        allow.gnosis.curve.sgnoCRV_lp_pool["remove_liquidity_one_coin(uint256,int128,uint256)"](),

        // Remove Liquidity Imbalance Coin
        allow.gnosis.curve.sgnoCRV_lp_pool["remove_liquidity_imbalance(uint256[2],uint256)"](),

        // Exchange
        allow.gnosis.curve.sgnoCRV_lp_pool["exchange(int128,int128,uint256,uint256)"](),

        // Stake
        allow.gnosis.curve.sgnoCRV_gauge["deposit(uint256)"](),
        // NO EVIDENCE OF BEING USED
        allow.gnosis.curve.sgnoCRV_gauge["deposit(uint256,address,bool)"](
            undefined,
            AVATAR
        ),

        // Unstake
        allow.gnosis.curve.sgnoCRV_gauge["withdraw(uint256)"](),
        // NO EVIDENCE OF BEING USED
        allow.gnosis.curve.sgnoCRV_gauge["withdraw(uint256,address,bool)"](
            undefined,
            AVATAR
        ),

        // Claim Rewards
        allow.gnosis.curve.sgnoCRV_gauge["claim_rewards()"](),

        // Claim CRV
        allow.gnosis.curve.crv_minter["mint"](
            curve.sgnoCRV_GAUGE
        ),

        // Deposit and Stake using a special ZAP
        allow.gnosis.curve.stake_deposit_zap["deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)"](
            curve.sgnoCRV_LP_POOL,
            curve.sgnoCRV_LP_POOL,
            curve.sgnoCRV_GAUGE,
            2,
            [sGNO, GNO, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
            undefined,
            undefined,
            undefined,
            ZERO_ADDRESS
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Curve tricrypto
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([x3CRV, WBTC, WETH], [curve.crv3crypto_POOL]),
        ...allowErc20Approve([curve.crv3crypto_LP], [curve.crv3crypto_GAUGE]),
        ...allowErc20Approve([WXDAI, USDC, USDT, WBTC, WETH], [curve.crv3crypto_ZAP]),

        // Add Liquidity
        allow.gnosis.curve.crv3crypto_pool["add_liquidity"](),

        // Add Liquidity (Underlying, using ZAP)
        allow.gnosis.curve.crv3crypto_zap["add_liquidity(uint256[5],uint256)"](),

        // Remove Liquidity
        allow.gnosis.curve.crv3crypto_pool["remove_liquidity"](),

        // Remove Liquidity (Underlying, using ZAP)
        allow.gnosis.curve.crv3crypto_zap["remove_liquidity(uint256,uint256[5])"](),

        // Remove Liquidity of One Coin
        allow.gnosis.curve.crv3crypto_pool["remove_liquidity_one_coin"](),

        // Remove Liquidity of One Coin (Underlying, using ZAP)
        allow.gnosis.curve.crv3crypto_zap["remove_liquidity_one_coin(uint256,uint256,uint256)"](),

        // Exchange
        allow.gnosis.curve.crv3crypto_pool["exchange(uint256,uint256,uint256,uint256)"](),
        // NO EVIDENCE OF BEING USED
        allow.gnosis.curve.crv3crypto_pool["exchange(uint256,uint256,uint256,uint256,bool)"](),

        // Exchange (Underlying, using ZAP)
        allow.gnosis.curve.crv3crypto_zap["exchange_underlying(uint256,uint256,uint256,uint256)"](),

        // Stake
        allow.gnosis.curve.crv3crypto_gauge["deposit(uint256)"](),
        // NO EVIDENCE OF BEING USED
        allow.gnosis.curve.crv3crypto_gauge["deposit(uint256,address,bool)"](
            undefined,
            AVATAR
        ),

        // Unstake
        allow.gnosis.curve.crv3crypto_gauge["withdraw(uint256)"](),
        // NO EVIDENCE OF BEING USED
        allow.gnosis.curve.crv3crypto_gauge["withdraw(uint256,address,bool)"](
            undefined,
            AVATAR
        ),

        // Claim Rewards
        allow.gnosis.curve.crv3crypto_gauge["claim_rewards()"](),

        // Claim CRV
        allow.gnosis.curve.crv_minter["mint"](
            curve.crv3crypto_GAUGE
        ),

        // // Deposit and Stake using a special ZAP - DOES NOT HAVE THIS OPTION THROUGH THE UI
        // allow.gnosis.curve.stake_deposit_zap["deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)"](
        //     {
        //         oneOf: [crv3crypto_POOL, crv3crypto_ZAP]
        //     },
        //     crv3crypto_LP,
        //     crv3crypto_GAUGE,
        //     {
        //         oneOf: [3, 5]
        //     },
        //     {
        //         oneOf: [
        //             [x3CRV, WBTC, WETH, ZERO_ADDRESS, ZERO_ADDRESS],
        //             [WXDAI, USDC, USDT, WBTC, WETH]
        //         ]
        //     },
        //     undefined,
        //     undefined,
        //     undefined,
        //     ZERO_ADDRESS
        // ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Curve rGNO/sGNO
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([rGNO, sGNO], [curve.rgnoCRV_LP_POOL]),
        ...allowErc20Approve([curve.rgnoCRV_LP_POOL], [curve.rgnoCRV_GAUGE]),

        // Add Liquidity
        allow.gnosis.curve.rgnoCRV_lp_pool["add_liquidity(uint256[2],uint256)"](),

        // Remove Liquidity
        allow.gnosis.curve.rgnoCRV_lp_pool["remove_liquidity(uint256,uint256[2])"](),

        // Remove Liquidity of One Coin
        allow.gnosis.curve.rgnoCRV_lp_pool["remove_liquidity_one_coin(uint256,int128,uint256)"](),

        // Remove Liquidity Imbalance Coin
        allow.gnosis.curve.rgnoCRV_lp_pool["remove_liquidity_imbalance(uint256[2],uint256)"](),

        // Exchange
        allow.gnosis.curve.rgnoCRV_lp_pool["exchange(int128,int128,uint256,uint256)"](),

        // Stake
        allow.gnosis.curve.rgnoCRV_gauge["deposit(uint256)"](),
        // NO EVIDENCE OF BEING USED
        allow.gnosis.curve.rgnoCRV_gauge["deposit(uint256,address,bool)"](
            undefined,
            AVATAR
        ),

        // Unstake
        allow.gnosis.curve.rgnoCRV_gauge["withdraw(uint256)"](),
        // NO EVIDENCE OF BEING USED
        allow.gnosis.curve.rgnoCRV_gauge["withdraw(uint256,address,bool)"](
            undefined,
            AVATAR
        ),

        // Claim Rewards
        allow.gnosis.curve.rgnoCRV_gauge["claim_rewards()"](),

        // Claim CRV
        allow.gnosis.curve.crv_minter["mint"](
            curve.rgnoCRV_GAUGE
        ),

        // // Deposit and Stake using a special ZAP
        allow.gnosis.curve.stake_deposit_zap["deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)"](
            curve.rgnoCRV_LP_POOL,
            curve.rgnoCRV_LP_POOL,
            curve.rgnoCRV_GAUGE,
            2,
            [rGNO, sGNO, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
            undefined,
            undefined,
            undefined,
            ZERO_ADDRESS
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Curve MAI/x3CRV
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([MAI, x3CRV], [curve.MAIx3CRV_LP_POOL]),
        ...allowErc20Approve([curve.MAIx3CRV_LP_POOL], [curve.MAIx3CRV_GAUGE]),
        ...allowErc20Approve([MAI, WXDAI, USDC, USDT], [curve.FACTORY_METAPOOLS_ZAP]),
        ...allowErc20Approve([MAI, x3CRV, WXDAI, USDC, USDT], [curve.STAKE_DEPOSIT_ZAP]),

        // Add Liquidity
        // {
        //     targetAddress: MAIx3CRV_LP_POOL,
        //     signature: "add_liquidity(uint256[2],uint256)",
        // },
        allow.gnosis.curve.MAIx3CRV_lp_pool["add_liquidity(uint256[2],uint256)"](),

        // Add Liquidity (Underlying, using ZAP)
        // {
        //     targetAddress: FACTORY_METAPOOLS_ZAP,
        //     signature: "add_liquidity(address,uint256[4],uint256)",
        // },
        allow.gnosis.curve.factory_metapools_zap["add_liquidity(address,uint256[4],uint256)"](
            curve.MAIx3CRV_LP_POOL
        ),

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

        // Exchange
        // {
        //     targetAddress: MAIx3CRV_LP_POOL,
        //     signature: "exchange(int128,int128,uint256,uint256)",
        // },
        allow.gnosis.curve.MAIx3CRV_lp_pool["exchange(int128,int128,uint256,uint256)"](),

        // Exchange Underlying
        // {
        //     targetAddress: MAIx3CRV_LP_POOL,
        //     signature: "exchange_underlying(int128,int128,uint256,uint256)",
        // },
        allow.gnosis.curve.MAIx3CRV_lp_pool["exchange_underlying(int128,int128,uint256,uint256)"](),

        // Stake
        // {
        //     targetAddress: MAIx3CRV_GAUGE,
        //     signature: "deposit(uint256)",
        // },
        allow.gnosis.curve.MAIx3CRV_gauge["deposit(uint256)"](),

        // NO EVIDENCE OF BEING USED
        // {
        //     targetAddress: MAIx3CRV_GAUGE,
        //     signature: "deposit(uint256,address,bool)",
        //     params: {
        //         [1]: staticEqual(AVATAR),
        //     },
        // },
        allow.gnosis.curve.crvEUReUSD_gauge["deposit(uint256,address,bool)"](
            undefined,
            AVATAR
        ),

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

        // Claim Rewards
        // {
        //     targetAddress: MAIx3CRV_GAUGE,
        //     signature: "claim_rewards()",
        // },
        allow.gnosis.curve.MAIx3CRV_gauge["claim_rewards()"](),

        // Claim CRV
        allow.gnosis.curve.crv_minter["mint"](
            curve.MAIx3CRV_GAUGE
        ),

        // Deposit and Stake using a special ZAP
        // {
        //     targetAddress: CURVE_STAKE_DEPOSIT_ZAP,
        //     signature: "deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)",
        //     params: {
        //         [0]: staticOneOf([MAIx3CRV_LP_POOL, FACTORY_METAPOOLS_ZAP], "address"),
        //         [1]: staticEqual(MAIx3CRV_LP_POOL, "address"),
        //         [2]: staticEqual(MAIx3CRV_GAUGE, "address"),
        //         [3]: staticOneOf([2, 4], "uint256"),
        //         [4]: staticOneOf([
        //             [MAI, x3CRV, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
        //             [MAI, WXDAI, USDC, USDT, ZERO_ADDRESS]],
        //             "address[5]"),
        //         [8]: staticEqual(ZERO_ADDRESS, "address"),
        //     },
        // },
        allow.gnosis.curve.stake_deposit_zap["deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)"](
            {
                oneOf: [curve.MAIx3CRV_LP_POOL, curve.FACTORY_METAPOOLS_ZAP]
            },
            curve.MAIx3CRV_LP_POOL,
            curve.MAIx3CRV_GAUGE,
            {
                oneOf: [2, 4]
            },
            {
                oneOf: [
                    [MAI, x3CRV, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
                    [MAI, WXDAI, USDC, USDT, ZERO_ADDRESS]
                ]
            },
            undefined,
            undefined,
            undefined,
            ZERO_ADDRESS
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Honeyswap
        //---------------------------------------------------------------------------------------------------------------------------------

        ...allowErc20Approve([COW, CRV, FLX, GNO, GIV, WETH, WXDAI], [honeyswap.ROUTER]),
        ...allowErc20Approve(
            [honeyswap.HLP_CRV_GNO, honeyswap.HLP_COW_GNO, honeyswap.HLP_GIV_GNO,
            honeyswap.HLP_GNO_FLX, honeyswap.HLP_GNO_WXDAI, honeyswap.HLP_WETH_GNO], [honeyswap.ROUTER]),

        // Add Liquidity
        allow.gnosis.honeyswap.router["addLiquidity"](
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

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
        ...allowErc20Approve([BER, CRV, GNO, QI, WETH, WXDAI], [swapr.ROUTER]),
        ...allowErc20Approve(
            [swapr.DXS_BER_GNO, swapr.DXS_CRV_GNO, swapr.DXS_GNO_QI,
            swapr.DXS_GNO_WXDAI, swapr.DXS_WETH_GNO], [swapr.ROUTER]),

        // Add Liquidity
        allow.gnosis.swapr.router["addLiquidity"](
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        // Add Liquidity using XDAI
        allow.gnosis.swapr.router["addLiquidityETH"](
            undefined,
            undefined,
            undefined,
            undefined,
            AVATAR,
            undefined,
            {
                send: true
            }
        ),

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
        ...allowErc20Approve([GNO, SUSHI, WETH, wstETH], [sushiswap.ROUTER]),
        ...allowErc20Approve([sushiswap.SLP_SUSHI_GNO, sushiswap.SLP_WETH_GNO, sushiswap.SLP_WETH_wstETH], [sushiswap.ROUTER]),

        // Add Liquidity
        allow.gnosis.sushiswap.router["addLiquidity"](
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

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

        // Stake
        allow.gnosis.sushiswap.minichef_v2["deposit"](
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

        // Claim Rewards
        allow.gnosis.sushiswap.minichef_v2["harvest"](
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
        ...allowErc20Approve([agave.agWXDAI], [agave.WXDAI_GATEWAY]),

        // Deposit
        allow.gnosis.agave.wxdai_gateway["depositETH"](
            AVATAR,
            0,
            {
                send: true
            }
        ),

        // Borrow
        // I assume that if you borrow stable debt then the same should be done with the stableDebtWXDAI token
        allow.gnosis.agave.variableDebtWXDAI["approveDelegation"](
            agave.WXDAI_GATEWAY
        ),

        allow.gnosis.agave.wxdai_gateway["borrowETH"](
            undefined,
            undefined,
            0
        ),

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
        ...allowErc20Approve([GNO, WETH, USDC, USDT], [agave.LENDING_POOL]),

        // Deposit
        allow.gnosis.agave.lending_pool["deposit"](
            {
                oneOf: [GNO, WETH, USDC, USDT]
            },
            undefined,
            AVATAR,
            0
        ),

        // Borrow
        allow.gnosis.agave.lending_pool["borrow"](
            {
                oneOf: [GNO, WETH, USDC, USDT]
            },
            undefined,
            undefined,
            0,
            AVATAR
        ),

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
        // Agave - Claim Rewards (General)
        //---------------------------------------------------------------------------------------------------------------------------------
        allow.gnosis.agave.incentives_controller["claimRewards"](
            [
                agave.agUSDC,
                agave.variableDebtUSDC,
                agave.agWXDAI,
                agave.variableDebtWXDAI,
                agave.agLINK,
                agave.variableDebtLINK,
                agave.agGNO,
                agave.variableDebtGNO,
                agave.agWBTC,
                agave.variableDebtWBTC,
                agave.agWETH,
                agave.variableDebtWETH,
                agave.agFOX,
                agave.variableDebtFOX,
                agave.agUSDT,
                agave.variableDebtUSDT,
                agave.agEURe,
                agave.variableDebtEURe
            ],
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Agave - Staking
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([AGVE], [agave.stkAGVE]),

        // Stake
        allow.gnosis.agave.stkAGVE["stake"](
            AVATAR
        ),

        // Cooldown time (10 days / 2 days window to unstake)
        allow.gnosis.agave.stkAGVE["cooldown"](),

        // Unstake
        allow.gnosis.agave.stkAGVE["redeem"](
            AVATAR
        ),

        // Claim AGVE (from staking)
        allow.gnosis.agave.stkAGVE["claimRewards"](
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
        ...allowErc20Approve([balancer.bb_ag_WETH, balancer.bb_ag_GNO], [balancer.VAULT]),
        ...allowErc20Approve([balancer.B_50bbagGNO_50bbagWETH], [balancer.B_50bbagGNO_50bbagWETH_GAUGE]),

        // joinPool: 0x1c6455b9e8e7cfb9a5fb81a765683be78649af98081c1c2ddec9c80ea18866ef

        // Add Liquidity
        {
            targetAddress: balancer.VAULT,
            signature:
                "joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
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
                    "0x00000000000000000000000000000000000000000000000000000000000000a0",
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040"
                ],
                    "bytes32"
                ), // Length of bytes
                [15]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "0x0000000000000000000000000000000000000000000000000000000000000003"
                ],
                    "bytes32"
                ), // Join Kind
            },
        },

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

        ...allowErc20Approve([WETH, GNO], [balancer.VAULT]),

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

        // Add Liquidity
        {
            targetAddress: balancer.RELAYER_LIBRARY,
            signature:
                "joinPool(bytes32,uint8,address,address,(address[],uint256[],bytes,bool),uint256,uint256)",
            params: {
                [0]: staticEqual(
                    "0xf48f01dcb2cbb3ee1f6aab0e742c2d3941039d56000200000000000000000012",
                    "bytes32"
                ), // Balancer PoolId
                [1]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"
                ), // bytes (userData)
                [2]: staticEqual(balancer.RELAYER, "address"),
                [3]: staticEqual(AVATAR),
                [4]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"), // Offset of the tuple from beginning 224=32*7
                [7]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000080",
                    "bytes32"), // Offset of address[] from beginning of tuple 128=32*4
                [8]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"), // Offset of uint256[] from beginning of tuple 224=32*7
                [9]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000140",
                    "bytes32"), // Offset of bytes from beginning of tuple 320=32*10
                [11]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "bytes32"
                ), // Length of address[] = 2
                [12]: staticEqual(balancer.bb_ag_WETH, "address"),
                [13]: staticEqual(balancer.bb_ag_GNO, "address"),
                [14]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "bytes32"
                ), // Length of unit256[] = 2
                [17]: staticOneOf([
                    "0x00000000000000000000000000000000000000000000000000000000000000a0",
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040"
                ],
                    "bytes32"
                ), // Length of bytes
                [18]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "0x0000000000000000000000000000000000000000000000000000000000000003"
                ],
                    "bytes32"
                ), // Join Kind
            },
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

        // Stake
        allow.gnosis.balancer.B_50bbagGNO_50bbagWETH_gauge["deposit(uint256)"](),

        // Unstake
        allow.gnosis.balancer.B_50bbagGNO_50bbagWETH_gauge["withdraw(uint256)"](),

        // Claim Rewards
        allow.gnosis.balancer.B_50bbagGNO_50bbagWETH_gauge["claim_rewards()"](),

        // Claim BAL Rewards
        allow.gnosis.balancer.child_chain_gauge_reward_helper["claimRewardsFromGauge"](
            balancer.B_50bbagGNO_50bbagWETH_GAUGE,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Balancer Boosted Agave USD
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([balancer.bb_ag_WXDAI, balancer.bb_ag_USDT, balancer.bb_ag_USDC, balancer.bb_ag_USD], [balancer.VAULT]),
        ...allowErc20Approve([balancer.bb_ag_USD], [balancer.bb_ag_USD_GAUGE]),

        // IMPORTANT: see txn hash 0x43f480c5e0de4c4e91e92620d1d484b22c0742fbf418d8bb878c05c78151a2bc
        // joinPool: 0x65a7e204e5598d193ac24a2477166482a7147b59b84fba798e2c9700fdd2d7e3

        // Add Liquidity
        {
            targetAddress: balancer.VAULT,
            signature:
                "joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
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
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "0x0000000000000000000000000000000000000000000000000000000000000100",
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040"
                ],
                    "bytes32"
                ), // Length of bytes
                [19]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "0x0000000000000000000000000000000000000000000000000000000000000003"
                ],
                    "bytes32"
                ), // Join Kind
            },
        },

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

        ...allowErc20Approve([WXDAI, USDT, USDC], [balancer.VAULT]),

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

        // Add Liquidity
        {
            targetAddress: balancer.RELAYER_LIBRARY,
            signature:
                "joinPool(bytes32,uint8,address,address,(address[],uint256[],bytes,bool),uint256,uint256)",
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
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"), // Offset of the tuple from beginning 224=32*7
                [7]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000080",
                    "bytes32"), // Offset of address[] from beginning of tuple 128=32*4
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000120",
                    "bytes32"), // Offset of uint256[] from beginning of tuple 288=32*9
                [9]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000001c0",
                    "bytes32"), // Offset of bytes from beginning of tuple 448=32*14
                [11]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000004",
                    "bytes32"
                ), // Length of address[] = 4
                [12]: staticEqual(balancer.bb_ag_WXDAI, "address"),
                [13]: staticEqual(balancer.bb_ag_USDT, "address"),
                [14]: staticEqual(balancer.bb_ag_USDC, "address"),
                [15]: staticEqual(balancer.bb_ag_USD, "address"),
                [16]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000004",
                    "bytes32"
                ), // Length of unit256[] = 4
                [21]: staticOneOf([
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "0x0000000000000000000000000000000000000000000000000000000000000100",
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040"
                ],
                    "bytes32"
                ), // Length of bytes
                [22]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "0x0000000000000000000000000000000000000000000000000000000000000003"
                ],
                    "bytes32"
                ), // Join Kind
            },
        },

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

        // Stake
        allow.gnosis.balancer.bb_ag_USD_gauge["deposit(uint256)"](),

        // Unstake
        allow.gnosis.balancer.bb_ag_USD_gauge["withdraw(uint256)"](),

        // Claim Rewards
        allow.gnosis.balancer.bb_ag_USD_gauge["claim_rewards()"](),

        // Claim BAL Rewards
        allow.gnosis.balancer.child_chain_gauge_reward_helper["claimRewardsFromGauge"](
            balancer.bb_ag_USD_GAUGE,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Balancer Boosted Agave WETH/WBTC/USD
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([balancer.bb_ag_WETH, balancer.bb_ag_WBTC, balancer.bb_ag_USD], [balancer.VAULT]),
        ...allowErc20Approve([balancer.agUSD_agWETH_agWBTC], [balancer.agUSD_agWETH_agWBTC_GAUGE]),

        // joinPool: 0x5303ea3fc917d430148c5e5aeee39e62f65ee17da29741824212201d8f1a6690

        // Add Liquidity
        {
            targetAddress: balancer.VAULT,
            signature:
                "joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
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
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040"
                ],
                    "bytes32"
                ), // Length of bytes
                [17]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "0x0000000000000000000000000000000000000000000000000000000000000003"
                ],
                    "bytes32"
                ), // Join Kind
            },
        },

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

        ...allowErc20Approve([WETH, WBTC, WXDAI, USDT, USDC], [balancer.VAULT]),

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

        // Add Liquidity
        {
            targetAddress: balancer.RELAYER_LIBRARY,
            signature:
                "joinPool(bytes32,uint8,address,address,(address[],uint256[],bytes,bool),uint256,uint256)",
            params: {
                [0]: staticEqual(
                    "0x66f33ae36dd80327744207a48122f874634b3ada000100000000000000000013",
                    "bytes32"
                ), // Balancer PoolId
                [1]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"
                ), // bytes (userData)
                [2]: staticEqual(balancer.RELAYER, "address"),
                [3]: staticEqual(AVATAR),
                [4]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"), // Offset of the tuple from beginning 224=32*7
                [7]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000080",
                    "bytes32"), // Offset of address[] from beginning of tuple 128=32*4
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000100",
                    "bytes32"), // Offset of uint256[] from beginning of tuple 256=32*8
                [9]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000180",
                    "bytes32"), // Offset of bytes from beginning of tuple 384=32*12
                [11]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000003",
                    "bytes32"
                ), // Length of address[] = 3
                [12]: staticEqual(balancer.bb_ag_WETH, "address"),
                [13]: staticEqual(balancer.bb_ag_WBTC, "address"),
                [14]: staticEqual(balancer.bb_ag_USD, "address"),
                [15]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000003",
                    "bytes32"
                ), // Length of unit256[] = 3
                [19]: staticOneOf([
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040"
                ],
                    "bytes32"
                ), // Length of bytes
                [20]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "0x0000000000000000000000000000000000000000000000000000000000000003"
                ],
                    "bytes32"
                ), // Join Kind
            },
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

        // Stake
        allow.gnosis.balancer.agUSD_agWETH_agWBTC_gauge["deposit(uint256)"](),

        // Unstake
        allow.gnosis.balancer.agUSD_agWETH_agWBTC_gauge["withdraw(uint256)"](),

        // Claim Rewards
        allow.gnosis.balancer.agUSD_agWETH_agWBTC_gauge["claim_rewards()"](),

        // Claim BAL Rewards
        allow.gnosis.balancer.child_chain_gauge_reward_helper["claimRewardsFromGauge"](
            balancer.agUSD_agWETH_agWBTC_GAUGE,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Balancer Boosted Agave GNO/USD
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([balancer.bb_ag_USD, balancer.bb_ag_GNO], [balancer.VAULT]),
        ...allowErc20Approve([balancer.B_50bbagGNO_50bbagUSD], [balancer.B_50bbagGNO_50bbagUSD_GAUGE]),

        // joinPool: 0x85dbb47bd035476bf1c8490a466796250bc998dfcd45909fdf2aa4d4a3039776
        // exitPool: 0x1ecd4d82bbe457cdf319a138b0201338996751969b3685aeb451d1bfe84fe9b2

        // Add Liquidity
        {
            targetAddress: balancer.VAULT,
            signature:
                "joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
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
                    "0x00000000000000000000000000000000000000000000000000000000000000a0",
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040"
                ],
                    "bytes32"
                ), // Length of bytes
                [15]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "0x0000000000000000000000000000000000000000000000000000000000000003"
                ],
                    "bytes32"
                ), // Join Kind
            },
        },

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

        ...allowErc20Approve([GNO, WXDAI, USDT, USDC], [balancer.VAULT]),

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

        // Add Liquidity
        {
            targetAddress: balancer.RELAYER_LIBRARY,
            signature:
                "joinPool(bytes32,uint8,address,address,(address[],uint256[],bytes,bool),uint256,uint256)",
            params: {
                [0]: staticEqual(
                    "0xb973ca96a3f0d61045f53255e319aedb6ed49240000200000000000000000011",
                    "bytes32"
                ), // Balancer PoolId
                [1]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"
                ), // bytes (userData)
                [2]: staticEqual(balancer.RELAYER, "address"),
                [3]: staticEqual(AVATAR),
                [4]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"), // Offset of the tuple from beginning 224=32*7
                [7]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000080",
                    "bytes32"), // Offset of address[] from beginning of tuple 128=32*4
                [8]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"), // Offset of uint256[] from beginning of tuple 224=32*7
                [9]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000140",
                    "bytes32"), // Offset of bytes from beginning of tuple 320=32*10
                [11]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "bytes32"
                ), // Length of address[] = 2
                [12]: staticEqual(balancer.bb_ag_USD, "address"),
                [13]: staticEqual(balancer.bb_ag_GNO, "address"),
                [14]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "bytes32"
                ), // Length of unit256[] = 2
                [17]: staticOneOf([
                    "0x00000000000000000000000000000000000000000000000000000000000000a0",
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040"
                ],
                    "bytes32"
                ), // Length of bytes
                [18]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "0x0000000000000000000000000000000000000000000000000000000000000003"
                ],
                    "bytes32"
                ), // Join Kind
            },
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

        // Stake
        allow.gnosis.balancer.B_50bbagGNO_50bbagUSD_gauge["deposit(uint256)"](),

        // Unstake
        allow.gnosis.balancer.B_50bbagGNO_50bbagUSD_gauge["withdraw(uint256)"](),

        // Claim Rewards
        allow.gnosis.balancer.B_50bbagGNO_50bbagUSD_gauge["claim_rewards()"](),

        // Claim BAL Rewards
        allow.gnosis.balancer.child_chain_gauge_reward_helper["claimRewardsFromGauge"](
            balancer.B_50bbagGNO_50bbagUSD_GAUGE,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // OMNI BRIDGE
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([WETH, COW], [OMNI_BRIDGE]),
        // {
        //     targetAddress: OMNI_BRIDGE,
        //     signature: "relayTokens(address,address,uint256)",
        //     params: {
        //         [1]: staticEqual(OMNI_BRIDGE_RECIPIENT_MAINNET),
        //     },
        // },
        allow.gnosis.omnibridge["relayTokens(address,address,uint256)"](
            undefined,
            OMNI_BRIDGE_RECIPIENT_MAINNET
        ),
    ],
    placeholders: { AVATAR },
} satisfies RolePreset

export default preset
