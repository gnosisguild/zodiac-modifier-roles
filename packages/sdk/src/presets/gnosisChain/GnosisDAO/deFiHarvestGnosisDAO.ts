import {
    agave,
    balancer,
    curve,
} from "../addresses"
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

        //---------------------------------------------------------------------------------------------------------------------------------
        // Curve EURe/x3CRV
        //---------------------------------------------------------------------------------------------------------------------------------

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

        //---------------------------------------------------------------------------------------------------------------------------------
        // Curve sGNO/GNO
        //---------------------------------------------------------------------------------------------------------------------------------

        // Claim Rewards
        allow.gnosis.curve.sgnoCRV_gauge["claim_rewards()"](),

        // Claim CRV
        allow.gnosis.curve.crv_minter["mint"](
            curve.sgnoCRV_GAUGE
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Curve tricrypto
        //---------------------------------------------------------------------------------------------------------------------------------

        // Claim Rewards
        allow.gnosis.curve.crv3crypto_gauge["claim_rewards()"](),

        // Claim CRV
        allow.gnosis.curve.crv_minter["mint"](
            curve.crv3crypto_GAUGE
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Curve rGNO/sGNO
        //---------------------------------------------------------------------------------------------------------------------------------

        // Claim Rewards
        allow.gnosis.curve.rgnoCRV_gauge["claim_rewards()"](),

        // Claim CRV
        allow.gnosis.curve.crv_minter["mint"](
            curve.rgnoCRV_GAUGE
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Curve MAI/x3CRV
        //---------------------------------------------------------------------------------------------------------------------------------

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

        //---------------------------------------------------------------------------------------------------------------------------------
        // Honeyswap
        //---------------------------------------------------------------------------------------------------------------------------------

        // NO REWARDS CLAIMING

        //---------------------------------------------------------------------------------------------------------------------------------
        // Swapr
        //---------------------------------------------------------------------------------------------------------------------------------

        // DISTRIBUTORS ISSUE

        //---------------------------------------------------------------------------------------------------------------------------------
        // SushiSwap
        //---------------------------------------------------------------------------------------------------------------------------------

        // Claim Rewards
        allow.gnosis.sushiswap.minichef_v2["harvest"](
            undefined,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Agave
        //---------------------------------------------------------------------------------------------------------------------------------

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

        // Claim AGVE (from staking)
        allow.gnosis.agave.stkAGVE["claimRewards"](
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Balancer
        //---------------------------------------------------------------------------------------------------------------------------------

        //---------------------------------------------------------------------------------------------------------------------------------
        // Balancer Boosted Agave GNO/WETH
        //---------------------------------------------------------------------------------------------------------------------------------

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

        // Claim Rewards
        allow.gnosis.balancer.B_50bbagGNO_50bbagUSD_gauge["claim_rewards()"](),

        // Claim BAL Rewards
        allow.gnosis.balancer.child_chain_gauge_reward_helper["claimRewardsFromGauge"](
            balancer.B_50bbagGNO_50bbagUSD_GAUGE,
            AVATAR
        ),
    ],
    placeholders: { AVATAR },
} satisfies RolePreset

export default preset
