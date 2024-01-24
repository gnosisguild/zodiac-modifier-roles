import { allow } from "../../allow"
import { auraExitStrategy2 } from "../../helpers/ExitStrategies/AuraExitStrategies"
import { AVATAR } from "../../placeholders"
import { RolePreset } from "../../types"
import { aura, balancer, WXDAI, realt } from "../addresses"

const preset = {
  network: 100,
  allow: [
    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura sBAL3 + Balancer sBAL3
    //---------------------------------------------------------------------------------------------------------------------------------

    ...auraExitStrategy2(aura.aurasBAL3_REWARDER, balancer.sBAL3_pId),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura staBAL3 + Balancer staBAL3
    //---------------------------------------------------------------------------------------------------------------------------------

    ...auraExitStrategy2(aura.aurastaBAL3_REWARDER, balancer.staBAL3_pId),

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
    // RealT
    //---------------------------------------------------------------------------------------------------------------------------------

    // Set/Unset (bool "useAsCollateral" = True / "useAsCollateral" = False) WXDAI as Collateral (Set)
    // {
    //     targetAddress: REALT_LENDING_POOL,
    //     signature: "setUserUseReserveAsCollateral(address,bool)",
    //     params: {
    //         [0]: staticEqual(WXDAI, "address")
    //     }
    // },
    allow.gnosis.realt.lending_pool["setUserUseReserveAsCollateral"](WXDAI),

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

    // Remove Liquidity
    allow.gnosis.honeyswap.router["removeLiquidity"](
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      AVATAR
    ),
  ],
  placeholders: { AVATAR },
} satisfies RolePreset

export default preset
