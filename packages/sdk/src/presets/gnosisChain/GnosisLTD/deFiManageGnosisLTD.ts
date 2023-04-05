import {
    ZERO_ADDRESS, AAVE, BAL, COW, CRV, EURe, FLX, GIV, GNO, MAI, MKR, NODE, rGNO,
    sGNO, SUSHI, USDC, USDP, USDT, WBTC, WETH, wstETH, WXDAI, x3CRV,
    OMNI_BRIDGE,
    curve,
    honeyswap,
    realt,
    sushiswap,
} from "../addresses"
import { allowErc20Approve } from "../../helpers/erc20"
import { AVATAR, BRIDGE_RECIPIENT_MAINNET } from "../../placeholders"
import { RolePreset } from "../../types"
import { allow } from "../../allow"


const preset = {
    network: 100,
    allow: [

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
        // // SushiSwap WETH/GNO
        // //---------------------------------------------------------------------------------------------------------------------------------
        // ...allowErc20Approve([WETH, GNO], [SUSHISWAP_ROUTER]),
        // ...allowErc20Approve([SLP_WETH_GNO], [SUSHISWAP_ROUTER]),

        // // Add Liquidity
        // // {
        // //     targetAddress: SUSHISWAP_ROUTER,
        // //     signature: "addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)",
        // //     params: {
        // //         [0]: staticEqual(WETH, "address"),
        // //         [1]: staticEqual(GNO, "address"),
        // //         [6]: staticEqual(AVATAR),
        // //     },
        // // },
        // allow.gnosis.sushiswap.router["addLiquidity"](
        //     WETH,
        //     GNO,
        //     undefined,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // // Remove Liquidity
        // // {
        // //     targetAddress: SUSHISWAP_ROUTER,
        // //     signature: "removeLiquidity(address,address,uint256,uint256,uint256,address,uint256)",
        // //     params: {
        // //         [0]: staticEqual(WETH, "address"),
        // //         [1]: staticEqual(GNO, "address"),
        // //         [5]: staticEqual(AVATAR),
        // //     },
        // // },
        // allow.gnosis.sushiswap.router["removeLiquidity"](
        //     WETH,
        //     GNO,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // // Remove Liquidity
        // // {
        // //     targetAddress: SUSHISWAP_ROUTER,
        // //     signature: "removeLiquidityWithPermit(address,address,uint256,uint256,uint256,address,uint256,bool,uint8,bytes32,bytes32)",
        // //     params: {
        // //         [0]: staticEqual(WETH, "address"),
        // //         [1]: staticEqual(GNO, "address"),
        // //         [5]: staticEqual(AVATAR),
        // //     },
        // // },
        // allow.gnosis.sushiswap.router["removeLiquidityWithPermit"](
        //     WETH,
        //     GNO,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // // Stake
        // // {
        // //     targetAddress: MINI_CHEF_V2,
        // //     signature: "deposit(uint256,uint256,address)",
        // //     params: {
        // //         [0]: staticEqual(9, "uint256"), // SushiSwap poolId
        // //         [2]: staticEqual(AVATAR),
        // //     },
        // // },
        // allow.gnosis.sushiswap.minichef_v2["deposit"](
        //     9,
        //     undefined,
        //     AVATAR
        // ),

        // // Unstake and Claim Rewards
        // // {
        // //     targetAddress: MINI_CHEF_V2,
        // //     signature: "withdrawAndHarvest(uint256,uint256,address)",
        // //     params: {
        // //         [0]: staticEqual(9, "uint256"), // SushiSwap poolId
        // //         [2]: staticEqual(AVATAR),
        // //     },
        // // },
        // allow.gnosis.sushiswap.minichef_v2["withdrawAndHarvest"](
        //     9,
        //     undefined,
        //     AVATAR
        // ),

        // // Claim Rewards
        // // {
        // //     targetAddress: MINI_CHEF_V2,
        // //     signature: "harvest(uint256,address)",
        // //     params: {
        // //         [0]: staticEqual(9, "uint256"), // SushiSwap poolId
        // //         [1]: staticEqual(AVATAR),
        // //     },
        // // },
        // allow.gnosis.sushiswap.minichef_v2["harvest"](
        //     9,
        //     AVATAR
        // ),

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
        // allow.gnosis.curve.stake_deposit_zap["deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)"](
        //     curve.x3CRV_POOL,
        //     curve.x3CRV_LP,
        //     curve.x3CRV_GAUGE,
        //     3,
        //     [WXDAI, USDC, USDT, ZERO_ADDRESS, ZERO_ADDRESS],
        //     undefined,
        //     undefined,
        //     undefined,
        //     ZERO_ADDRESS
        // ),

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
        // allow.gnosis.curve.stake_deposit_zap["deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)"](
        //     {
        //         oneOf: [curve.crvEUReUSD_POOL, curve.crvEUReUSD_ZAP]
        //     },
        //     curve.crvEUReUSD_LP,
        //     curve.crvEUReUSD_GAUGE,
        //     {
        //         oneOf: [2, 4]
        //     },
        //     {
        //         oneOf: [
        //             [EURe, x3CRV, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
        //             [EURe, WXDAI, USDC, USDT, ZERO_ADDRESS]
        //         ]
        //     },
        //     undefined,
        //     undefined,
        //     undefined,
        //     ZERO_ADDRESS
        // ),

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

        // // Deposit and Stake using a special ZAP
        // allow.gnosis.curve.stake_deposit_zap["deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)"](
        //     curve.sgnoCRV_LP_POOL,
        //     curve.sgnoCRV_LP_POOL,
        //     curve.sgnoCRV_GAUGE,
        //     2,
        //     [sGNO, GNO, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
        //     undefined,
        //     undefined,
        //     undefined,
        //     ZERO_ADDRESS
        // ),

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
        // allow.gnosis.curve.stake_deposit_zap["deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)"](
        //     curve.rgnoCRV_LP_POOL,
        //     curve.rgnoCRV_LP_POOL,
        //     curve.rgnoCRV_GAUGE,
        //     2,
        //     [rGNO, sGNO, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
        //     undefined,
        //     undefined,
        //     undefined,
        //     ZERO_ADDRESS
        // ),

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
        // allow.gnosis.curve.stake_deposit_zap["deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)"](
        //     {
        //         oneOf: [curve.MAIx3CRV_LP_POOL, curve.FACTORY_METAPOOLS_ZAP]
        //     },
        //     curve.MAIx3CRV_LP_POOL,
        //     curve.MAIx3CRV_GAUGE,
        //     {
        //         oneOf: [2, 4]
        //     },
        //     {
        //         oneOf: [
        //             [MAI, x3CRV, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
        //             [MAI, WXDAI, USDC, USDT, ZERO_ADDRESS]
        //         ]
        //     },
        //     undefined,
        //     undefined,
        //     undefined,
        //     ZERO_ADDRESS
        // ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Curve - Deposit and Stake using a special ZAP
        //---------------------------------------------------------------------------------------------------------------------------------

        allow.gnosis.curve.stake_deposit_zap["deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)"](
            {
                oneOf: [curve.MAIx3CRV_LP_POOL, curve.FACTORY_METAPOOLS_ZAP, curve.rgnoCRV_LP_POOL, curve.sgnoCRV_LP_POOL,
                curve.crvEUReUSD_POOL, curve.crvEUReUSD_ZAP, curve.x3CRV_POOL]
            },
            {
                oneOf: [curve.MAIx3CRV_LP_POOL, curve.rgnoCRV_LP_POOL, curve.sgnoCRV_LP_POOL, curve.crvEUReUSD_LP, curve.x3CRV_LP]
            },
            {
                oneOf: [curve.MAIx3CRV_GAUGE, curve.rgnoCRV_GAUGE, curve.sgnoCRV_GAUGE, curve.crvEUReUSD_GAUGE, curve.x3CRV_GAUGE],
            },
            {
                oneOf: [2, 3, 4]
            },
            {
                oneOf: [
                    [MAI, x3CRV, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
                    [MAI, WXDAI, USDC, USDT, ZERO_ADDRESS],
                    [rGNO, sGNO, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
                    [sGNO, GNO, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
                    [EURe, x3CRV, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
                    [EURe, WXDAI, USDC, USDT, ZERO_ADDRESS],
                    [WXDAI, USDC, USDT, ZERO_ADDRESS, ZERO_ADDRESS]
                ]
            },
            undefined,
            undefined,
            undefined,
            ZERO_ADDRESS
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // RealT
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([realt.armmWXDAI], [realt.GATEWAY]),

        // Deposit XDAI
        // {
        //     targetAddress: REALT_GATEWAY,
        //     signature: "depositETH(address,address,uint16)",
        //     params: {
        //         [0]: staticEqual(REALT_LENDING_POOL, "address"),
        //         [1]: staticEqual(AVATAR),
        //         [2]: staticEqual(0, "uint16")
        //     },
        //     send: true,
        // },
        allow.gnosis.realt.gateway["depositETH"](
            realt.LENDING_POOL,
            AVATAR,
            0,
            {
                send: true
            }
        ),

        // Set/Unset (bool "useAsCollateral" = True / "useAsCollateral" = False) WXDAI as Collateral (Set)
        // {
        //     targetAddress: REALT_LENDING_POOL,
        //     signature: "setUserUseReserveAsCollateral(address,bool)",
        //     params: {
        //         [0]: staticEqual(WXDAI, "address")
        //     }
        // },
        allow.gnosis.realt.lending_pool["setUserUseReserveAsCollateral"](
            WXDAI
        ),

        // Withdraw XDAI
        // {
        //     targetAddress: REALT_GATEWAY,
        //     signature: "withdrawETH(address,uint256,address)",
        //     params: {
        //         [0]: staticEqual(REALT_LENDING_POOL, "address"),
        //         [2]: staticEqual(AVATAR),
        //     }
        // },
        allow.gnosis.realt.gateway["withdrawETH"](
            realt.LENDING_POOL,
            undefined,
            AVATAR
        ),

        // Approve delegation (Variable APY Debt) - There's no possibility to take debt with a Stable APY by the moment
        // {
        //     targetAddress: variableDebtrmmWXDAI,
        //     signature: "approveDelegation(address,uint256)",
        //     params: {
        //         [0]: staticEqual(REALT_GATEWAY, "address")
        //     }
        // },
        allow.gnosis.realt.variableDebtrmmWXDAI["approveDelegation"](
            realt.GATEWAY
        ),

        // Borrow XDAI
        // {
        //     targetAddress: REALT_GATEWAY,
        //     signature: "borrowETH(address,uint256,uint256,uint16)",
        //     params: {
        //         [0]: staticEqual(REALT_LENDING_POOL, "address"),
        //         [3]: staticEqual(0, "uint16")
        //     }
        // },
        allow.gnosis.realt.gateway["borrowETH"](
            realt.LENDING_POOL,
            undefined,
            undefined,
            0
        ),

        // Repay Debt
        // {
        //     targetAddress: REALT_GATEWAY,
        //     signature: "repayETH(address,uint256,uint256,address)",
        //     params: {
        //         [0]: staticEqual(REALT_LENDING_POOL, "address"),
        //         [3]: staticEqual(AVATAR),
        //     }
        // },
        allow.gnosis.realt.gateway["repayETH"](
            realt.LENDING_POOL,
            undefined,
            undefined,
            AVATAR
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
        // OMNI BRIDGE
        //---------------------------------------------------------------------------------------------------------------------------------
        // TO DO: ADD CLAIMING OF BRIDGED TOKENS
        ...allowErc20Approve([AAVE, BAL, COW, CRV, EURe, GNO, MKR, NODE, SUSHI, USDC, USDP, USDT, WETH], [OMNI_BRIDGE]),
        // {
        //     targetAddress: OMNI_BRIDGE,
        //     signature: "relayTokens(address,address,uint256)",
        //     params: {
        //         [1]: staticEqual(BRIDGE_RECIPIENT_MAINNET),
        //     },
        // },
        allow.gnosis.omnibridge["relayTokens(address,address,uint256)"](
            undefined,
            BRIDGE_RECIPIENT_MAINNET
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // xDAI BRIDGE
        //---------------------------------------------------------------------------------------------------------------------------------

        allow.gnosis.xdai_bridge["relayTokens"](
            BRIDGE_RECIPIENT_MAINNET,
            {
                send: true
            }
        ),
    ],
    placeholders: { AVATAR, BRIDGE_RECIPIENT_MAINNET },
} satisfies RolePreset

export default preset
