import {
  GNO,
  USDC,
  USDT,
  WBTC,
  WETH,
  WXDAI,
  aura,
  balancer,
} from "../addresses"
import { staticEqual, staticOneOf } from "../../helpers/utils"
import { AVATAR } from "../../placeholders"
import { RolePreset } from "../../types"
import { allow } from "../../allow"
import { HoldingsExitStrategy } from "../../helpers/ExitStrategies/HoldingsExitStrategies"
import { auraExitStrategy2 } from "../../helpers/ExitStrategies/AuraExitStrategies"
import { balancerExitStrategy1 } from "../../helpers/ExitStrategies/BalancerExitStrategies"
import { network } from "hardhat"

const preset = {
  network: 100,
  allow: [
    //---------------------------------------------------------------------------------------------------------------------------------
    // Holdings
    //---------------------------------------------------------------------------------------------------------------------------------

    ...HoldingsExitStrategy(100), // 100 = Gnosis Chain

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
    allow.gnosis.curve.crvEUReUSD_pool[
      "remove_liquidity(uint256,uint256[2])"
    ](),

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
    allow.gnosis.curve.crvEUReUSD_pool[
      "remove_liquidity_one_coin(uint256,uint256,uint256)"
    ](),

    // Remove Liquidity of One Coin (Underlying, using ZAP)
    // {
    //     targetAddress: crvEUReUSD_ZAP,
    //     signature: "remove_liquidity_one_coin(uint256,uint256,uint256)",
    // },
    allow.gnosis.curve.crvEUReUSD_zap[
      "remove_liquidity_one_coin(uint256,uint256,uint256)"
    ](),

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
    allow.gnosis.curve.sgnoCRV_lp_pool[
      "remove_liquidity(uint256,uint256[2])"
    ](),

    // Remove Liquidity of One Coin
    allow.gnosis.curve.sgnoCRV_lp_pool[
      "remove_liquidity_one_coin(uint256,int128,uint256)"
    ](),

    // Remove Liquidity Imbalance Coin
    allow.gnosis.curve.sgnoCRV_lp_pool[
      "remove_liquidity_imbalance(uint256[2],uint256)"
    ](),

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
    allow.gnosis.curve.crv3crypto_zap[
      "remove_liquidity_one_coin(uint256,uint256,uint256)"
    ](),

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
    allow.gnosis.curve.rgnoCRV_lp_pool[
      "remove_liquidity(uint256,uint256[2])"
    ](),

    // Remove Liquidity of One Coin
    allow.gnosis.curve.rgnoCRV_lp_pool[
      "remove_liquidity_one_coin(uint256,int128,uint256)"
    ](),

    // Remove Liquidity Imbalance Coin
    allow.gnosis.curve.rgnoCRV_lp_pool[
      "remove_liquidity_imbalance(uint256[2],uint256)"
    ](),

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
    allow.gnosis.curve.MAIx3CRV_lp_pool[
      "remove_liquidity(uint256,uint256[2])"
    ](),

    // Remove Liquidity (Underlying, using ZAP)
    // {
    //     targetAddress: FACTORY_METAPOOLS_ZAP,
    //     signature: "remove_liquidity(address,uint256,uint256[4])",
    // },
    allow.gnosis.curve.factory_metapools_zap[
      "remove_liquidity(address,uint256,uint256[4])"
    ](),

    // Remove Liquidity of One Coin
    // {
    //     targetAddress: MAIx3CRV_LP_POOL,
    //     signature: "remove_liquidity_one_coin(uint256,int128,uint256)",
    // },
    allow.gnosis.curve.MAIx3CRV_lp_pool[
      "remove_liquidity_one_coin(uint256,int128,uint256)"
    ](),

    // Remove Liquidity of One Coin (Underlying, using ZAP)
    // {
    //     targetAddress: FACTORY_METAPOOLS_ZAP,
    //     signature: "remove_liquidity_one_coin(address,uint256,int128,uint256)",
    // },
    allow.gnosis.curve.factory_metapools_zap[
      "remove_liquidity_one_coin(address,uint256,int128,uint256)"
    ](),

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

    //---------------------------------------------------------------------------------------------------------------------------------
    // Agave
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Agave - XDAI
    //---------------------------------------------------------------------------------------------------------------------------------

    // Set/Unset (bool "useAsCollateral" = True / "useAsCollateral" = False) WXDAI as Collateral (Set)
    allow.gnosis.agave.lending_pool["setUserUseReserveAsCollateral"](WXDAI),

    // Repay
    allow.gnosis.agave.wxdai_gateway["repayETH"](undefined, undefined, AVATAR, {
      send: true,
    }),

    // Withdraw
    allow.gnosis.agave.wxdai_gateway["withdrawETH"](undefined, AVATAR),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Agave - GNO/WETH/USDC/USDT
    //---------------------------------------------------------------------------------------------------------------------------------

    // Set/Unset (bool "useAsCollateral" = True / "useAsCollateral" = False) the token as Collateral (Set)
    allow.gnosis.agave.lending_pool["setUserUseReserveAsCollateral"]({
      oneOf: [GNO, WETH, USDC, USDT],
    }),

    // Repay
    allow.gnosis.agave.lending_pool["repay"](
      {
        oneOf: [GNO, WETH, USDC, USDT],
      },
      undefined,
      undefined,
      AVATAR
    ),

    // Withdraw
    allow.gnosis.agave.lending_pool["withdraw"](
      {
        oneOf: [GNO, WETH, USDC, USDT],
      },
      undefined,
      AVATAR
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Agave - Staking
    //---------------------------------------------------------------------------------------------------------------------------------

    // Unstake
    allow.gnosis.agave.stkAGVE["redeem"](AVATAR),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura wstETH/WETH + Balancer wstETH/WETH
    //---------------------------------------------------------------------------------------------------------------------------------

    ...auraExitStrategy2(
      aura.aurabb_WETH_wstETH_REWARDER,
      balancer.bb_WETH_wstETH_pId
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura COW/GNO + Balancer COW/GNO
    //---------------------------------------------------------------------------------------------------------------------------------

    ...auraExitStrategy2(
      aura.aura50COW_50GNO_REWARDER,
      balancer.B_50COW_50GNO_pId
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura EURe/sDAI + Balancer EURe/sDAI
    //---------------------------------------------------------------------------------------------------------------------------------

    ...auraExitStrategy2(aura.auraEURe_sDAI_REWARDER, balancer.B_EURe_sDAI_pId),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer wstETH/GNO
    //---------------------------------------------------------------------------------------------------------------------------------

    ...balancerExitStrategy1(balancer.B_50wstETH_50GNO_pId),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer wstETH/sDAI
    //---------------------------------------------------------------------------------------------------------------------------------

    ...balancerExitStrategy1(balancer.B_50sDAI_50wstETH_pId),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer WETH/wstETH
    //---------------------------------------------------------------------------------------------------------------------------------

    // Already considered (Aura)

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer staBAL3/wstETH
    //---------------------------------------------------------------------------------------------------------------------------------

    ...balancerExitStrategy1(balancer.B_50USD_50wstETH_pId),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer sBAL3
    //---------------------------------------------------------------------------------------------------------------------------------

    ...balancerExitStrategy1(balancer.sBAL3_pId),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer wstETH/BAL/AURA
    //---------------------------------------------------------------------------------------------------------------------------------

    ...balancerExitStrategy1(balancer.B_50wstETH_25BAL_25AURA_pId),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer WETH/BAL/GNO/wxDAI
    //---------------------------------------------------------------------------------------------------------------------------------

    ...balancerExitStrategy1(balancer.B_25WETH_25BAL_25GNO_25wxDAI_pId),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer wstETH/COW
    //---------------------------------------------------------------------------------------------------------------------------------

    ...balancerExitStrategy1(balancer.B_50wstETH_50COW_pId),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer stEUR/EURe
    //---------------------------------------------------------------------------------------------------------------------------------

    ...balancerExitStrategy1(balancer.B_stEUR_EURe_pId),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer AGVE/GNO
    //---------------------------------------------------------------------------------------------------------------------------------

    ...balancerExitStrategy1(balancer.B_50AGVE_50GNO_pId),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer BAL/GNO/wstETH/WETH/WXDAI
    //---------------------------------------------------------------------------------------------------------------------------------

    ...balancerExitStrategy1(balancer.BAL_GNO_wstETH_WETH_WXDAI_pId),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer EURe/staBAL3
    //---------------------------------------------------------------------------------------------------------------------------------

    ...balancerExitStrategy1(balancer.B_EURe_staBAL3_pId),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer staBAL3
    //---------------------------------------------------------------------------------------------------------------------------------

    ...balancerExitStrategy1(balancer.staBAL3_pId),
  ],
  placeholders: { AVATAR },
} satisfies RolePreset

export default preset
