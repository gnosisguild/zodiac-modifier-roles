import {
    curve
} from "../addresses"
import { AVATAR } from "../../placeholders"
import { RolePreset } from "../../types"
import { allow } from "../../allow"


const preset = {
    network: 100,
    allow: [

        //---------------------------------------------------------------------------------------------------------------------------------
        // SushiSwap
        //---------------------------------------------------------------------------------------------------------------------------------

        // Claim Rewards
        allow.gnosis.sushiswap.minichef_v2["harvest"](
            undefined,
            AVATAR
        ),

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
    ],
    placeholders: { AVATAR },
} satisfies RolePreset

export default preset
