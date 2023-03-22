import { ZERO_ADDRESS } from "../addresses"
import { allowErc20Approve } from "../../helpers/erc20"
import {
    dynamic32Equal,
    dynamic32OneOf,
    staticEqual,
    dynamicOneOf,
    subsetOf,
    dynamicEqual,
    staticOneOf,
} from "../../helpers/utils"
import { AVATAR } from "../../placeholders"
import { RolePreset } from "../../types"
import { allow } from "../../allow"

// SushiSwap contracts
const MINI_CHEF_V2 = "0xdDCbf776dF3dE60163066A5ddDF2277cB445E0F3"

// Curve contracts
const crvEUReUSD_GAUGE = "0xd91770E868c7471a9585d1819143063A40c54D00"


const preset = {
    network: 100,
    allow: [

        //---------------------------------------------------------------------------------------------------------------------------------
        // SushiSwap
        //---------------------------------------------------------------------------------------------------------------------------------

        //---------------------------------------------------------------------------------------------------------------------------------
        // SushiSwap WETH/GNO
        //---------------------------------------------------------------------------------------------------------------------------------

        // Claim Rewards
        // {
        //     targetAddress: MINI_CHEF_V2,
        //     signature: "harvest(uint256,address)",
        //     params: {
        //         [0]: staticEqual(9, "uint256"), // SushiSwap poolId
        //         [1]: staticEqual(AVATAR),
        //     },
        // },
        allow.gnosis.sushiswap.minichef_v2["harvest"](
            9,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Curve
        //---------------------------------------------------------------------------------------------------------------------------------

        //---------------------------------------------------------------------------------------------------------------------------------
        // Curve EURe/x3CRV
        //---------------------------------------------------------------------------------------------------------------------------------

        // Claim Rewards
        // {
        //     targetAddress: crvEUReUSD_GAUGE,
        //     signature: "claim_rewards()",
        // },
        allow.gnosis.curve.crvEUReUSD_gauge["claim_rewards()"](),
    ],
    placeholders: { AVATAR },
} satisfies RolePreset

export default preset
