import { allow } from "../allow"
import { ZERO_ADDRESS } from "../gnosisChain/addresses"
import { allowErc20Approve } from "../helpers/erc20"
import {
    dynamic32Equal,
    dynamic32OneOf,
    staticEqual,
    dynamicOneOf,
    subsetOf,
    dynamicEqual,
    staticOneOf,
} from "../helpers/utils"
import { AVATAR } from "../placeholders"
import { RolePreset } from "../types"

// Balancer LP Tokens
const BB_A_USD = "0xA13a9247ea42D743238089903570127DdA72fE44"

// Aura contracts
const BOOSTER_ADDRESS = "0xA57b8d98dAE62B26Ec3bcC4a365338157060B234"

const aurabb_a_USD_REWARDER = "0xFb6b1c1A1eA5618b3CfC20F81a11A97E930fA46B"

const auraBAL_STAKING_REWARDER = "0x00A7BA8Ae7bca0B10A32Ea1f8e2a1Da980c6CAd2"

const AURA_LOCKER = "0x3Fa73f1E5d8A792C80F426fc8F84FBF7Ce9bBCAC"
const SNAPSHOT_DELEGATE_REGISTRY = "0x469788fE6E9E9681C6ebF3bF78e7Fd26Fc015446"

const AURA_CLAIM_ZAP = "0x623B83755a39B12161A63748f3f595A530917Ab2"

//Compound V2 contracts
const COMPTROLLER = "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b"
const cDAI = "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"
const cUSDC = "0x39AA39c021dfbaE8faC545936693aC917d5E7563"


const preset = {
    network: 1,
    allow: [

        //---------------------------------------------------------------------------------------------------------------------------------
        // AURA
        //---------------------------------------------------------------------------------------------------------------------------------

        //---------------------------------------------------------------------------------------------------------------------------------
        // Aura bb-aUSDT/bb-a-USDC/bb-a-DAI (Boosted Pool)
        //---------------------------------------------------------------------------------------------------------------------------------
        // {
        //     targetAddress: aurabb_a_USD_REWARDER,
        //     signature: "getReward()",
        // },
        allow.mainnet.aura.aurabb_a_USD_rewarder["getReward()"](),

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
        // General Rewards Claiming
        //---------------------------------------------------------------------------------------------------------------------------------
        // {
        //   targetAddress: AURA_CLAIM_ZAP,
        //   signature:
        //     "claimRewards(address[],address[],address[],address[],uint256,uint256,uint256,uint256)",
        // },
        allow.mainnet.aura.aura_claim_zap["claimRewards"](),

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
        allow.mainnet.compound.comptroller["claimComp(address,address[])"](
            AVATAR,
            {
                subsetOf: [cDAI, cUSDC].map((address) => address.toLowerCase()).sort(), // compound app will always pass tokens in ascending order
                restrictOrder: true,
            }
        )
    ],
    placeholders: { AVATAR },
} satisfies RolePreset

export default preset
