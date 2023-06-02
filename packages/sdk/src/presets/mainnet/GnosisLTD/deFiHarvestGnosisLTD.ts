import { allow } from "../../allow"
import {
    balancer,
    compound_v2,
    compound_v3
} from "../addresses"
import { AVATAR } from "../../placeholders"
import { RolePreset } from "../../types"


const preset = {
    network: 1,
    allow: [

        //---------------------------------------------------------------------------------------------------------------------------------
        // AURA
        //---------------------------------------------------------------------------------------------------------------------------------

        // {
        //     targetAddress: aurabb_a_USD_REWARDER,
        //     signature: "getReward()",
        // },
        allow.mainnet.aura.aurabb_aV3_USD_rewarder["getReward()"](),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Aura GNO/COW
        //---------------------------------------------------------------------------------------------------------------------------------

        // {
        //     targetAddress: aura50COW_50GNO_REWARDER,
        //     signature: "getReward()",
        // },
        allow.mainnet.aura.aura50COW_50GNO_rewarder["getReward()"](),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Staking auraBAL
        //---------------------------------------------------------------------------------------------------------------------------------

        // Claiming auraBAL Staking Rewards
        // {
        //   targetAddress: auraBAL_STAKING_REWARDER,
        //   signature: "getReward()",
        // },
        allow.mainnet.aura.auraBAL_staking_rewarder["getReward()"](),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Locking AURA
        //---------------------------------------------------------------------------------------------------------------------------------

        // Claiming Locking AURA Rewards
        // {
        //   targetAddress: AURA_LOCKER,
        //   signature: "getReward(address)",
        //   params: {
        //     [0]: staticEqual(AVATAR),
        //   },
        // },
        allow.mainnet.aura.aura_locker["getReward(address)"](
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Aura - General Rewards Claiming
        //---------------------------------------------------------------------------------------------------------------------------------
        // {
        //   targetAddress: AURA_CLAIM_ZAP,
        //   signature:
        //     "claimRewards(address[],address[],address[],address[],uint256,uint256,uint256,uint256)",
        // },
        allow.mainnet.aura.claim_zap["claimRewards"](),

        //---------------------------------------------------------------------------------------------------------------------------------
        // BALANCER
        //---------------------------------------------------------------------------------------------------------------------------------

        //---------------------------------------------------------------------------------------------------------------------------------
        // Balancer Boosted Aave USD
        //---------------------------------------------------------------------------------------------------------------------------------

        // Claim Rewards
        allow.mainnet.balancer.bb_a_USD_gauge["claim_rewards()"](),

        // Claim BAL Rewards
        allow.mainnet.balancer.BAL_minter["mint"](
            balancer.bb_a_USD_GAUGE
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Balancer GNO/COW pool
        //---------------------------------------------------------------------------------------------------------------------------------

        // Claim Rewards
        allow.mainnet.balancer.B_50COW_50GNO_gauge["claim_rewards()"](),

        // Claim BAL Rewards
        allow.mainnet.balancer.BAL_minter["mint"](
            balancer.B_50COW_50GNO_GAUGE
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Compound V2
        //---------------------------------------------------------------------------------------------------------------------------------

        //---------------------------------------------------------------------------------------------------------------------------------
        // Compound V2 - Claiming of rewards
        //---------------------------------------------------------------------------------------------------------------------------------
        // {
        //     targetAddress: COMPTROLLER,
        //     signature: "claimComp(address,address[])",
        //     params: {
        //         [0]: staticEqual(AVATAR),
        //         [1]: subsetOf(
        //             [cDAI, cUSDC].map((address) => address.toLowerCase()).sort(), // compound app will always pass tokens in ascending order
        //             "address[]",
        //             {
        //                 restrictOrder: true,
        //             }
        //         ),
        //     },
        // },
        allow.mainnet.compound_v2.comptroller["claimComp(address,address[])"](
            AVATAR,
            {
                subsetOf: [compound_v2.cDAI, compound_v2.cUSDC].map((address) => address.toLowerCase()).sort(), // compound app will always pass tokens in ascending order
                restrictOrder: true,
            }
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Compound V3 - Claiming of rewards
        //---------------------------------------------------------------------------------------------------------------------------------
        allow.mainnet.compound_v3.CometRewards["claim"](
            compound_v3.cUSDCv3,
            AVATAR
        ),
    ],
    placeholders: { AVATAR },
} satisfies RolePreset

export default preset
