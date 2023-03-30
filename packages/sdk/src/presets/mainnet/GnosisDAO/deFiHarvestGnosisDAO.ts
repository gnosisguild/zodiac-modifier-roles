import { allow } from "../../allow"
import { ZERO_ADDRESS } from "../../gnosisChain/addresses"
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

// Balancer Gauges
const B_stETH_STABLE_GAUGE = "0xcD4722B7c24C29e0413BDCd9e51404B4539D14aE"
const B_auraBAL_STABLE_GAUGE = "0x0312AA8D0BA4a1969Fddb382235870bF55f7f242"
const B_rETH_STABLE_GAUGE = "0x79eF6103A513951a3b25743DB509E267685726B7"
const B_80GNO_20WETH_GAUGE = "0xCB664132622f29943f67FA56CCfD1e24CC8B4995"
const B_50COW_50GNO_GAUGE = "0xA6468eca7633246Dcb24E5599681767D27d1F978"
const B_50WSTETH_50LDO_GAUGE = "0x95201b61ef19c867da0d093df20021e1a559452c"
const B_50WETH_50AURA_GAUGE = "0x275dF57d2B23d53e20322b4bb71Bf1dCb21D0A00"
const B_50COW_50WETH_GAUGE = "0x158772F59Fe0d3b75805fC11139b46CBc89F70e5"

// Aura contracts
const auraB_stETH_STABLE_REWARDER = "0xe4683Fe8F53da14cA5DAc4251EaDFb3aa614d528"
const auraB_auraBAL_STABLE_REWARDER =
  "0xACAdA51C320947E7ed1a0D0F6b939b0FF465E4c2"
const auraB_rETH_STABLE_REWARDER = "0x001B78CEC62DcFdc660E06A91Eb1bC966541d758"
const auraB_80GNO_20WETH_REWARDER = "0x001B78CEC62DcFdc660E06A91Eb1bC966541d758"
const aura50COW_50GNO_REWARDER = "0x6256518aE9a97C408a03AAF1A244989Ce6B937F6"
const aura50WSTETH_50LDO_REWARDER = "0x6c3f6C327DE4aE51a2DfAaF3431b3c508ec8D3EB"
const aura50WETH_50AURA_REWARDER = "0x712CC5BeD99aA06fC4D5FB50Aea3750fA5161D0f"
const aura50COW_50WETH_REWARDER = "0x228054e9c056F024FC724F515A2a8764Ae175ED6"

const auraBAL_STAKING_REWARDER = "0x00A7BA8Ae7bca0B10A32Ea1f8e2a1Da980c6CAd2"

const AURA_LOCKER = "0x3Fa73f1E5d8A792C80F426fc8F84FBF7Ce9bBCAC"

const AURA_CLAIM_ZAP = "0x623B83755a39B12161A63748f3f595A530917Ab2"

const preset = {
  network: 1,
  allow: [

    //---------------------------------------------------------------------------------------------------------------------------------
    // AURA
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura wstETH/WETH pool
    //---------------------------------------------------------------------------------------------------------------------------------
    // {
    //   targetAddress: auraB_stETH_STABLE_REWARDER,
    //   signature: "getReward()",
    // },
    allow.mainnet.aura.auraB_stETH_stable_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura B-80BAL-20WETH/auraBAL
    //---------------------------------------------------------------------------------------------------------------------------------
    // {
    //   targetAddress: auraB_auraBAL_STABLE_REWARDER,
    //   signature: "getReward()",
    // },
    allow.mainnet.aura.auraB_auraBAL_stable_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura rETH/WETH
    //---------------------------------------------------------------------------------------------------------------------------------
    // {
    //   targetAddress: auraB_rETH_STABLE_REWARDER,
    //   signature: "getReward()",
    // },
    allow.mainnet.aura.auraB_rETH_stable_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura GNO/WETH
    //---------------------------------------------------------------------------------------------------------------------------------
    // {
    //   targetAddress: auraB_80GNO_20WETH_REWARDER,
    //   signature: "getReward()",
    // },
    allow.mainnet.aura.auraB_80GNO_20WETH_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura GNO/COW
    //---------------------------------------------------------------------------------------------------------------------------------
    // {
    //   targetAddress: aura50COW_50GNO_REWARDER,
    //   signature: "getReward()",
    // },
    allow.mainnet.aura.aura50COW_50GNO_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura LDO/wstETH
    //---------------------------------------------------------------------------------------------------------------------------------
    // {
    //   targetAddress: aura50WSTETH_50LDO_REWARDER,
    //   signature: "getReward()",
    // },
    allow.mainnet.aura.aura50WSTETH_50LDO_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura WETH/AURA
    //---------------------------------------------------------------------------------------------------------------------------------
    // {
    //   targetAddress: aura50WETH_50AURA_REWARDER,
    //   signature: "getReward()",
    // },
    allow.mainnet.aura.aura50WETH_50AURA_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura WETH/COW
    //---------------------------------------------------------------------------------------------------------------------------------
    // {
    //   targetAddress: aura50COW_50WETH_REWARDER,
    //   signature: "getReward()",
    // },
    allow.mainnet.aura.aura50COW_50WETH_rewarder["getReward()"](),

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
    // Balancer wstETH/WETH pool
    //---------------------------------------------------------------------------------------------------------------------------------
    // Claim Rewards
    allow.mainnet.balancer.B_stETH_stable_gauge["claim_rewards()"](),

    // Claim BAL Rewards
    allow.mainnet.balancer.BAL_minter["mint"](
      B_stETH_STABLE_GAUGE
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer B-80BAL-20WETH/auraBAL pool
    //---------------------------------------------------------------------------------------------------------------------------------
    // Claim Rewards
    allow.mainnet.balancer.B_auraBAL_stable_gauge["claim_rewards()"](),

    // Claim BAL Rewards
    allow.mainnet.balancer.BAL_minter["mint"](
      B_auraBAL_STABLE_GAUGE
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer rETH/WETH pool
    //---------------------------------------------------------------------------------------------------------------------------------
    // Claim Rewards
    allow.mainnet.balancer.B_rETH_stable_gauge["claim_rewards()"](),

    // Claim BAL Rewards
    allow.mainnet.balancer.BAL_minter["mint"](
      B_rETH_STABLE_GAUGE
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer GNO/WETH pool
    //---------------------------------------------------------------------------------------------------------------------------------
    // Claim Rewards
    allow.mainnet.balancer.B_80GNO_20WETH_gauge["claim_rewards()"](),

    // Claim BAL Rewards
    allow.mainnet.balancer.BAL_minter["mint"](
      B_80GNO_20WETH_GAUGE
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer GNO/COW pool
    //---------------------------------------------------------------------------------------------------------------------------------
    // Claim Rewards
    allow.mainnet.balancer.B_50COW_50GNO_gauge["claim_rewards()"](),

    // Claim BAL Rewards
    allow.mainnet.balancer.BAL_minter["mint"](
      B_50COW_50GNO_GAUGE
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer LDO/wstETH pool
    //---------------------------------------------------------------------------------------------------------------------------------
    // Claim Rewards
    allow.mainnet.balancer.B_50WSTETH_50LDO_gauge["claim_rewards()"](),

    // Claim BAL Rewards
    allow.mainnet.balancer.BAL_minter["mint"](
      B_50WSTETH_50LDO_GAUGE
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer WETH/AURA pool
    //---------------------------------------------------------------------------------------------------------------------------------
    // Claim Rewards
    allow.mainnet.balancer.B_50WETH_50AURA_gauge["claim_rewards()"](),

    // Claim BAL Rewards
    allow.mainnet.balancer.BAL_minter["mint"](
      B_50WETH_50AURA_GAUGE
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer WETH/COW pool
    //---------------------------------------------------------------------------------------------------------------------------------
    // Claim Rewards
    allow.mainnet.balancer.B_50COW_50WETH_gauge["claim_rewards()"](),

    // Claim BAL Rewards
    allow.mainnet.balancer.BAL_minter["mint"](
      B_50COW_50WETH_GAUGE
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer BAL/WETH pool
    //---------------------------------------------------------------------------------------------------------------------------------
    // Claim locking rewards (single token)
    allow.mainnet.balancer.fee_distributor["claimToken"](
      AVATAR
    ),

    // Claim locking rewards (multiple tokens)
    allow.mainnet.balancer.fee_distributor["claimTokens"](
      AVATAR
    ),
  ],
  placeholders: { AVATAR },
} satisfies RolePreset

export default preset
