import { stat } from "fs"

import { hashMessage } from "ethers/lib/utils"

import { ExecutionOptions, RolePreset } from "../../types"
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
import { AVATAR_ADDRESS_PLACEHOLDER } from "../placeholders"
import { ZERO_ADDRESS } from "../gnosisChain/addresses"

// Balancer LP Tokens
const B_stETH_STABLE = "0x32296969Ef14EB0c6d29669C550D4a0449130230"
const B_auraBAL_STABLE = "0x3dd0843A028C86e0b760b1A76929d1C5Ef93a2dd"
const B_rETH_STABLE = "0x1E19CF2D73a72Ef1332C882F20534B6519Be0276"
const B_80GNO_20WETH = "0xF4C0DD9B82DA36C07605df83c8a416F11724d88b"
const B_50COW_50GNO = "0x92762B42A06dCDDDc5B7362Cfb01E631c4D44B40"
const B_50WSTETH_50LDO = "0x6a5EaD5433a50472642Cd268E584dafa5a394490"
const B_50WETH_50AURA = "0xCfCA23cA9CA720B6E98E3Eb9B6aa0fFC4a5C08B9"
const B_50COW_50WETH = "0xde8C195Aa41C11a0c4787372deFBbDdAa31306D2"

// Tokens
const wstETH = "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0"
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
const B_80BAL_20WETH = "0x5c6Ee304399DBdB9C8Ef030aB642B10820DB8F56"
const auraBAL = "0x616e8BfA43F920657B3497DBf40D6b1A02D4608d"
const rETH = "0xae78736Cd615f374D3085123A210448E74Fc6393"
const GNO = "0x6810e776880C02933D47DB1b9fc05908e5386b96"
const COW = "0xDEf1CA1fb7FBcDC777520aa7f396b4E015F497aB"
const LDO = "0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32"
const AURA = "0xC0c293ce456fF0ED870ADd98a0828Dd4d2903DBF"
const BAL = "0xba100000625a3754423978a60c9317c58a424e3D"

// Aura contracts
const BOOSTER_ADDRESS = "0xA57b8d98dAE62B26Ec3bcC4a365338157060B234"
const REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS = "0xB188b1CB84Fb0bA13cb9ee1292769F903A9feC59"

const auraB_stETH_STABLE_REWARDER = "0xe4683Fe8F53da14cA5DAc4251EaDFb3aa614d528"
const auraB_auraBAL_STABLE_REWARDER = "0xACAdA51C320947E7ed1a0D0F6b939b0FF465E4c2"
const auraB_rETH_STABLE_REWARDER = "0x001B78CEC62DcFdc660E06A91Eb1bC966541d758"
const auraB_80GNO_20WETH_REWARDER = "0x001B78CEC62DcFdc660E06A91Eb1bC966541d758"
const aura50COW_50GNO_REWARDER = "0x6256518aE9a97C408a03AAF1A244989Ce6B937F6"
const aura50WSTETH_50LDO_REWARDER = "0x6c3f6C327DE4aE51a2DfAaF3431b3c508ec8D3EB"
const aura50WETH_50AURA_REWARDER = "0x712CC5BeD99aA06fC4D5FB50Aea3750fA5161D0f"
const aura50COW_50WETH_REWARDER = "0x228054e9c056F024FC724F515A2a8764Ae175ED6"

const auraBAL_STAKING_REWARDER = "0x00A7BA8Ae7bca0B10A32Ea1f8e2a1Da980c6CAd2"
const B_80BAL_20WETH_DEPOSITOR = "0xeAd792B55340Aa20181A80d6a16db6A0ECd1b827"
const BAL_DEPOSITOR = "0x68655AD9852a99C87C0934c7290BB62CFa5D4123"

const AURA_LOCKER = "0x3Fa73f1E5d8A792C80F426fc8F84FBF7Ce9bBCAC"
const SNAPSHOT_DELEGATE_REGISTRY = "0x469788fE6E9E9681C6ebF3bF78e7Fd26Fc015446"

const AURA_CLAIM_ZAP = "0x623B83755a39B12161A63748f3f595A530917Ab2"


const preset: RolePreset = {
  network: 1,
  allow: [
    // All approvals have been commented since we'll be handling over the Avatar safe with all of them having been already executed

    //---------------------------------------------------------------------------------------------------------------------------------
    // AURA
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura wstETH/WETH pool
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([B_stETH_STABLE], [BOOSTER_ADDRESS]),
    ...allowErc20Approve([wstETH, WETH], [REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS]),
    {
      targetAddress: BOOSTER_ADDRESS,
      signature: "deposit(uint256,uint256,bool)",
      params: {
        [0]: staticEqual(29, "uint256"), // Aura poolId
      },
    },
    {
      targetAddress: REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS,
      signature: "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(auraB_stETH_STABLE_REWARDER, "address"),
        [1]: staticOneOf([wstETH, WETH], "address"),
        [3]: staticEqual("0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080", "bytes32"), // Balancer PoolId
        [10]: staticEqual(wstETH, "address"),
        [11]: staticEqual(WETH, "address"),
      },
    },
    {
      targetAddress: auraB_stETH_STABLE_REWARDER,
      signature: "withdrawAndUnwrap(uint256,bool)",
    },
    {
      targetAddress: auraB_stETH_STABLE_REWARDER,
      signature: "getReward()",
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura B-80BAL-20WETH/auraBAL
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([B_auraBAL_STABLE], [BOOSTER_ADDRESS]),
    ...allowErc20Approve([B_80BAL_20WETH, auraBAL], [REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS]),
    {
      targetAddress: BOOSTER_ADDRESS,
      signature: "deposit(uint256,uint256,bool)",
      params: {
        [0]: staticEqual(1, "uint256"), // Aura poolId
      },
    },
    {
      targetAddress: REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS,
      signature: "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(auraB_auraBAL_STABLE_REWARDER, "address"),
        [1]: staticOneOf([B_80BAL_20WETH, auraBAL], "address"),
        [3]: staticEqual("0x3dd0843a028c86e0b760b1a76929d1c5ef93a2dd000200000000000000000249", "bytes32"), // Balancer PoolId
        [10]: staticEqual(B_80BAL_20WETH, "address"),
        [11]: staticEqual(auraBAL, "address"),
      },
    },
    {
      targetAddress: auraB_auraBAL_STABLE_REWARDER,
      signature: "withdrawAndUnwrap(uint256,bool)",
    },
    {
      targetAddress: auraB_auraBAL_STABLE_REWARDER,
      signature: "getReward()",
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura rETH/WETH
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([B_rETH_STABLE], [BOOSTER_ADDRESS]),
    ...allowErc20Approve([rETH, WETH], [REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS]),
    {
      targetAddress: BOOSTER_ADDRESS,
      signature: "deposit(uint256,uint256,bool)",
      params: {
        [0]: staticEqual(15, "uint256"), // Aura poolId
      },
    },
    {
      targetAddress: REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS,
      signature: "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(auraB_rETH_STABLE_REWARDER, "address"),
        [1]: staticOneOf([rETH, WETH], "address"),
        [3]: staticEqual("0x1e19cf2d73a72ef1332c882f20534b6519be0276000200000000000000000112", "bytes32"), // Balancer PoolId
        [10]: staticEqual(rETH, "address"),
        [11]: staticEqual(WETH, "address"),
      },
    },
    {
      targetAddress: auraB_rETH_STABLE_REWARDER,
      signature: "withdrawAndUnwrap(uint256,bool)",
    },
    {
      targetAddress: auraB_rETH_STABLE_REWARDER,
      signature: "getReward()",
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura GNO/WETH
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([B_80GNO_20WETH], [BOOSTER_ADDRESS]),
    ...allowErc20Approve([GNO, WETH], [REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS]),
    {
      targetAddress: BOOSTER_ADDRESS,
      signature: "deposit(uint256,uint256,bool)",
      params: {
        [0]: staticEqual(33, "uint256"), // Aura poolId
      },
    },
    {
      targetAddress: REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS,
      signature: "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(auraB_80GNO_20WETH_REWARDER, "address"),
        [1]: staticOneOf([GNO, WETH], "address"),
        [3]: staticEqual("0xf4c0dd9b82da36c07605df83c8a416f11724d88b000200000000000000000026", "bytes32"), // Balancer PoolId
        [10]: staticEqual(GNO, "address"),
        [11]: staticEqual(WETH, "address"),
      },
    },
    {
      targetAddress: auraB_80GNO_20WETH_REWARDER,
      signature: "withdrawAndUnwrap(uint256,bool)",
    },
    {
      targetAddress: auraB_80GNO_20WETH_REWARDER,
      signature: "getReward()",
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura GNO/COW
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([B_50COW_50GNO], [BOOSTER_ADDRESS]),
    ...allowErc20Approve([GNO, COW], [REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS]),
    {
      targetAddress: BOOSTER_ADDRESS,
      signature: "deposit(uint256,uint256,bool)",
      params: {
        [0]: staticEqual(3, "uint256"), // Aura poolId
      },
    },
    {
      targetAddress: REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS,
      signature: "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(aura50COW_50GNO_REWARDER, "address"),
        [1]: staticOneOf([GNO, COW], "address"),
        [3]: staticEqual("0x92762b42a06dcdddc5b7362cfb01e631c4d44b40000200000000000000000182", "bytes32"), // Balancer PoolId
        [10]: staticEqual(GNO, "address"),
        [11]: staticEqual(COW, "address"),
      },
    },
    {
      targetAddress: aura50COW_50GNO_REWARDER,
      signature: "withdrawAndUnwrap(uint256,bool)",
    },
    {
      targetAddress: aura50COW_50GNO_REWARDER,
      signature: "getReward()",
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura LDO/wstETH
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([B_50WSTETH_50LDO], [BOOSTER_ADDRESS]),
    ...allowErc20Approve([LDO, wstETH], [REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS]),
    {
      targetAddress: BOOSTER_ADDRESS,
      signature: "deposit(uint256,uint256,bool)",
      params: {
        [0]: staticEqual(20, "uint256"), // Aura poolId
      },
    },
    {
      targetAddress: REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS,
      signature: "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(aura50WSTETH_50LDO_REWARDER, "address"),
        [1]: staticOneOf([LDO, wstETH], "address"),
        [3]: staticEqual("0x6a5ead5433a50472642cd268e584dafa5a394490000200000000000000000366", "bytes32"), // Balancer PoolId
        [10]: staticEqual(LDO, "address"),
        [11]: staticEqual(wstETH, "address"),
      },
    },
    {
      targetAddress: aura50WSTETH_50LDO_REWARDER,
      signature: "withdrawAndUnwrap(uint256,bool)",
    },
    {
      targetAddress: aura50WSTETH_50LDO_REWARDER,
      signature: "getReward()",
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura WETH/AURA
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([B_50WETH_50AURA], [BOOSTER_ADDRESS]),
    ...allowErc20Approve([WETH, AURA], [REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS]),
    {
      targetAddress: BOOSTER_ADDRESS,
      signature: "deposit(uint256,uint256,bool)",
      params: {
        [0]: staticEqual(0, "uint256"), // Aura poolId
      },
    },
    {
      targetAddress: REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS,
      signature: "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(aura50WETH_50AURA_REWARDER, "address"),
        [1]: staticOneOf([WETH, AURA], "address"),
        [3]: staticEqual("0xcfca23ca9ca720b6e98e3eb9b6aa0ffc4a5c08b9000200000000000000000274", "bytes32"), // Balancer PoolId
        [10]: staticEqual(WETH, "address"),
        [11]: staticEqual(AURA, "address"),
      },
    },
    {
      targetAddress: aura50WETH_50AURA_REWARDER,
      signature: "withdrawAndUnwrap(uint256,bool)",
    },
    {
      targetAddress: aura50WETH_50AURA_REWARDER,
      signature: "getReward()",
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura WETH/COW
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([B_50COW_50WETH], [BOOSTER_ADDRESS]),
    ...allowErc20Approve([WETH, COW], [REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS]),
    {
      targetAddress: BOOSTER_ADDRESS,
      signature: "deposit(uint256,uint256,bool)",
      params: {
        [0]: staticEqual(4, "uint256"), // Aura poolId
      },
    },
    {
      targetAddress: REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS,
      signature: "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(aura50COW_50WETH_REWARDER, "address"),
        [1]: staticOneOf([WETH, COW], "address"),
        [3]: staticEqual("0xde8c195aa41c11a0c4787372defbbddaa31306d2000200000000000000000181", "bytes32"), // Balancer PoolId
        [10]: staticEqual(WETH, "address"),
        [11]: staticEqual(COW, "address"),
      },
    },
    {
      targetAddress: aura50COW_50WETH_REWARDER,
      signature: "withdrawAndUnwrap(uint256,bool)",
    },
    {
      targetAddress: aura50COW_50WETH_REWARDER,
      signature: "getReward()",
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    // Staking auraBAL
    //---------------------------------------------------------------------------------------------------------------------------------

    // Using auraBAL
    ...allowErc20Approve([auraBAL], [auraBAL_STAKING_REWARDER]),
    {
      targetAddress: auraBAL_STAKING_REWARDER,
      signature: "stake(uint256)",
    },
    {
      targetAddress: auraBAL_STAKING_REWARDER,
      signature: "withdraw(uint256,bool)",
    },

    // Using 80BAL-20WETH
    ...allowErc20Approve([B_80BAL_20WETH], [B_80BAL_20WETH_DEPOSITOR]),
    {
      targetAddress: B_80BAL_20WETH_DEPOSITOR,
      signature: "deposit(uint256,bool,address)",
      params: {
        [2]: staticEqual(auraBAL_STAKING_REWARDER, "address"),
      },
    },

    // Using BAL
    ...allowErc20Approve([BAL], [BAL_DEPOSITOR]),
    {
      targetAddress: BAL_DEPOSITOR,
      signature: "deposit(uint256,uint256,bool,address)",
      params: {
        [3]: staticEqual(auraBAL_STAKING_REWARDER, "address"),
      },
    },

    // Claiming auraBAL Staking Rewards
    {
      targetAddress: auraBAL_STAKING_REWARDER,
      signature: "getReward()",
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    // Locking AURA
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([AURA], [AURA_LOCKER]),

    // Locking AURA
    {
      targetAddress: AURA_LOCKER,
      signature: "lock(address,uint256)",
      params: {
        [0]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    // Claiming Locking AURA Rewards
    {
      targetAddress: AURA_LOCKER,
      signature: "getReward(address)",
      params: {
        [0]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    // Process Expired AURA Locks - True -> Relock Expired Locks / False -> Withdraw Expired Locks
    {
      targetAddress: AURA_LOCKER,
      signature: "processExpiredLocks(bool)",
    },

    // Gauge Votes Delegation - IMPORTANT: THE ADDRESS SHOULD BE CONSTRAINED IN ORDER TO AVOID DELEGATING THE VOTING POWER TO UNWANTED ADDRESSES
    {
      targetAddress: AURA_LOCKER,
      signature: "delegate(address)",
    },

    // Proposals Delegation - IMPORTANT: THE ADDRESS SHOULD BE CONSTRAINED IN ORDER TO AVOID DELEGATING THE VOTING POWER TO UNWANTED ADDRESSES
    {
      targetAddress: SNAPSHOT_DELEGATE_REGISTRY,
      signature: "setDelegate(bytes32,address)",
    },


    //---------------------------------------------------------------------------------------------------------------------------------
    // General Rewards Claiming
    //---------------------------------------------------------------------------------------------------------------------------------
    {
      targetAddress: AURA_CLAIM_ZAP,
      signature: "claimRewards(address[],address[],address[],address[],uint256,uint256,uint256,uint256)",
    },
  ],
}
export default preset
