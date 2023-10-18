import { allow } from "../../allow"
import {
  ZERO_ADDRESS,
  E_ADDRESS,
  AAVE,
  AURA,
  auraBAL,
  BAL,
  COW,
  CRV,
  CVX,
  DAI,
  WETH,
  GNO,
  LDO,
  rETH,
  rETH2,
  sETH2,
  stETH,
  SWISE,
  USDC,
  WBTC,
  wstETH,
  OMNI_BRIDGE,
  aave_v2,
  aave_v3,
  ankr,
  aura,
  balancer,
  compound_v2,
  compound_v3,
  convex,
  curve,
  spark,
  stakedao,
  uniswapv3,
  votium,
} from "../addresses"
import { curve as curve_gc } from "../../gnosisChain/addresses"
import { allowErc20Approve } from "../../helpers/erc20"
import { staticEqual, staticOneOf } from "../../helpers/utils"
import { AVATAR, BRIDGE_RECIPIENT_GNOSIS_CHAIN } from "../../placeholders"
import { RolePreset } from "../../types"

const preset = {
  network: 1,
  allow: [
    //---------------------------------------------------------------------------------------------------------------------------------
    // LIDO
    //---------------------------------------------------------------------------------------------------------------------------------

    ...allowErc20Approve([stETH], [wstETH]),

    allow.mainnet.lido.stETH["submit"](ZERO_ADDRESS, {
      send: true,
    }),

    allow.mainnet.lido.wstETH["wrap"](),

    allow.mainnet.lido.wstETH["unwrap"](),

    // Request stETH Withdrawal - Locks your stETH in the queue. In exchange you receive an NFT, that represents your position
    // in the queue
    allow.mainnet.lido.unstETH["requestWithdrawals"](undefined, AVATAR),

    // Request wstETH Withdrawal - Transfers the wstETH to the unstETH to be burned in exchange for stETH. Then it locks your stETH
    // in the queue. In exchange you receive an NFT, that represents your position in the queue
    allow.mainnet.lido.unstETH["requestWithdrawalsWstETH"](undefined, AVATAR),

    // Claim ETH - Once the request is finalized by the oracle report and becomes claimable,
    // this function claims your ether and burns the NFT
    allow.mainnet.lido.unstETH["claimWithdrawals"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // AURA
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura wstETH/WETH pool
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([balancer.B_stETH_STABLE], [aura.BOOSTER]),
    ...allowErc20Approve([wstETH, WETH], [aura.REWARD_POOL_DEPOSIT_WRAPPER]),

    allow.mainnet.aura.booster["deposit"](115), // Aura poolId

    {
      targetAddress: aura.REWARD_POOL_DEPOSIT_WRAPPER,
      signature:
        "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(aura.auraB_stETH_STABLE_REWARDER, "address"),
        [1]: staticOneOf([wstETH, WETH], "address"),
        [3]: staticEqual(
          "0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080",
          "bytes32"
        ), // Balancer PoolId
        [4]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000a0",
          "bytes32"
        ), // Offset of tuple from beginning 160=32*5
        [5]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [6]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 2224=32*7
        [7]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [9]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [10]: staticEqual(wstETH, "address"),
        [11]: staticEqual(WETH, "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [15]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Length of bytes 192=32*6
      },
    },

    allow.mainnet.aura.auraB_stETH_stable_rewarder["withdrawAndUnwrap"](),

    allow.mainnet.aura.auraB_stETH_stable_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura B-80BAL-20WETH/auraBAL
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([balancer.B_auraBAL_STABLE], [aura.BOOSTER]),
    ...allowErc20Approve(
      [balancer.B_80BAL_20WETH, auraBAL],
      [aura.REWARD_POOL_DEPOSIT_WRAPPER]
    ),

    allow.mainnet.aura.booster["deposit"](101), // Aura poolId

    {
      targetAddress: aura.REWARD_POOL_DEPOSIT_WRAPPER,
      signature:
        "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(aura.auraB_auraBAL_STABLE_REWARDER, "address"),
        [1]: staticOneOf([balancer.B_80BAL_20WETH, auraBAL], "address"),
        [3]: staticEqual(
          "0x3dd0843a028c86e0b760b1a76929d1c5ef93a2dd000200000000000000000249",
          "bytes32"
        ), // Balancer PoolId
        [4]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000a0",
          "bytes32"
        ), // Offset of tuple from beginning 160=32*5
        [5]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [6]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 2224=32*7
        [7]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [9]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [10]: staticEqual(balancer.B_80BAL_20WETH, "address"),
        [11]: staticEqual(auraBAL, "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [15]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Length of bytes 192=32*6
      },
    },

    allow.mainnet.aura.auraB_auraBAL_stable_rewarder["withdrawAndUnwrap"](),

    allow.mainnet.aura.auraB_auraBAL_stable_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura rETH/WETH
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([balancer.B_rETH_STABLE], [aura.BOOSTER]),
    ...allowErc20Approve([rETH, WETH], [aura.REWARD_POOL_DEPOSIT_WRAPPER]),

    allow.mainnet.aura.booster["deposit"](109), // Aura poolId

    {
      targetAddress: aura.REWARD_POOL_DEPOSIT_WRAPPER,
      signature:
        "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(aura.auraB_rETH_STABLE_REWARDER, "address"),
        [1]: staticOneOf([rETH, WETH], "address"),
        [3]: staticEqual(
          "0x1e19cf2d73a72ef1332c882f20534b6519be0276000200000000000000000112",
          "bytes32"
        ), // Balancer PoolId
        [4]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000a0",
          "bytes32"
        ), // Offset of tuple from beginning 160=32*5
        [5]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [6]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 224=32*7
        [7]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [9]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [10]: staticEqual(rETH, "address"),
        [11]: staticEqual(WETH, "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [15]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Length of bytes 192=32*6
      },
    },

    allow.mainnet.aura.auraB_rETH_stable_rewarder["withdrawAllAndUnwrap"](),

    allow.mainnet.aura.auraB_rETH_stable_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura GNO/WETH
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([balancer.B_80GNO_20WETH], [aura.BOOSTER]),
    ...allowErc20Approve([GNO, WETH], [aura.REWARD_POOL_DEPOSIT_WRAPPER]),

    allow.mainnet.aura.booster["deposit"](116), // Aura poolId

    {
      targetAddress: aura.REWARD_POOL_DEPOSIT_WRAPPER,
      signature:
        "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(aura.auraB_80GNO_20WETH_REWARDER, "address"),
        [1]: staticOneOf([GNO, WETH], "address"),
        [3]: staticEqual(
          "0xf4c0dd9b82da36c07605df83c8a416f11724d88b000200000000000000000026",
          "bytes32"
        ), // Balancer PoolId
        [4]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000a0",
          "bytes32"
        ), // Offset of tuple from beginning 160=32*5
        [5]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [6]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 224=32*7
        [7]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [9]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [10]: staticEqual(GNO, "address"),
        [11]: staticEqual(WETH, "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [15]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Length of bytes 192=32*6
      },
    },

    allow.mainnet.aura.auraB_80GNO_20WETH_rewarder["withdrawAndUnwrap"](),

    allow.mainnet.aura.auraB_80GNO_20WETH_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura GNO/COW
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([balancer.B_50COW_50GNO], [aura.BOOSTER]),
    ...allowErc20Approve([GNO, COW], [aura.REWARD_POOL_DEPOSIT_WRAPPER]),

    allow.mainnet.aura.booster["deposit"](104), // Aura poolId

    {
      targetAddress: aura.REWARD_POOL_DEPOSIT_WRAPPER,
      signature:
        "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(aura.aura50COW_50GNO_REWARDER, "address"),
        [1]: staticOneOf([GNO, COW], "address"),
        [3]: staticEqual(
          "0x92762b42a06dcdddc5b7362cfb01e631c4d44b40000200000000000000000182",
          "bytes32"
        ), // Balancer PoolId
        [4]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000a0",
          "bytes32"
        ), // Offset of tuple from beginning 160=32*5
        [5]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [6]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 224=32*7
        [7]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [9]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [10]: staticEqual(GNO, "address"),
        [11]: staticEqual(COW, "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [15]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Length of bytes 192=32*6
      },
    },

    allow.mainnet.aura.aura50COW_50GNO_rewarder["withdrawAndUnwrap"](),

    allow.mainnet.aura.aura50COW_50GNO_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura LDO/wstETH
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([balancer.B_50WSTETH_50LDO], [aura.BOOSTER]),
    ...allowErc20Approve([LDO, wstETH], [aura.REWARD_POOL_DEPOSIT_WRAPPER]),

    allow.mainnet.aura.booster["deposit"](68), // Aura poolId

    {
      targetAddress: aura.REWARD_POOL_DEPOSIT_WRAPPER,
      signature:
        "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(aura.aura50WSTETH_50LDO_REWARDER, "address"),
        [1]: staticOneOf([LDO, wstETH], "address"),
        [3]: staticEqual(
          "0x5f1f4e50ba51d723f12385a8a9606afc3a0555f5000200000000000000000465",
          "bytes32"
        ), // Balancer PoolId
        [4]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000a0",
          "bytes32"
        ), // Offset of tuple from beginning 160=32*5
        [5]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [6]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 224=32*7
        [7]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [9]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [10]: staticEqual(LDO, "address"),
        [11]: staticEqual(wstETH, "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [15]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Length of bytes 192=32*6
      },
    },

    allow.mainnet.aura.aura50WSTETH_50LDO_rewarder["withdrawAndUnwrap"](),

    allow.mainnet.aura.aura50WSTETH_50LDO_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura WETH/AURA
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([balancer.B_50WETH_50AURA], [aura.BOOSTER]),
    ...allowErc20Approve([WETH, AURA], [aura.REWARD_POOL_DEPOSIT_WRAPPER]),

    allow.mainnet.aura.booster["deposit"](100), // Aura poolId

    {
      targetAddress: aura.REWARD_POOL_DEPOSIT_WRAPPER,
      signature:
        "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(aura.aura50WETH_50AURA_REWARDER, "address"),
        [1]: staticOneOf([WETH, AURA], "address"),
        [3]: staticEqual(
          "0xcfca23ca9ca720b6e98e3eb9b6aa0ffc4a5c08b9000200000000000000000274",
          "bytes32"
        ), // Balancer PoolId
        [4]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000a0",
          "bytes32"
        ), // Offset of tuple from beginning 160=32*5
        [5]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [6]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 224=32*7
        [7]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [9]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [10]: staticEqual(WETH, "address"),
        [11]: staticEqual(AURA, "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [15]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Length of bytes 192=32*6
      },
    },

    allow.mainnet.aura.aura50WETH_50AURA_rewarder["withdrawAndUnwrap"](),

    allow.mainnet.aura.aura50WETH_50AURA_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura WETH/COW
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([balancer.B_50COW_50WETH], [aura.BOOSTER]),
    ...allowErc20Approve([WETH, COW], [aura.REWARD_POOL_DEPOSIT_WRAPPER]),

    allow.mainnet.aura.booster["deposit"](105), // Aura poolId

    {
      targetAddress: aura.REWARD_POOL_DEPOSIT_WRAPPER,
      signature:
        "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(aura.aura50COW_50WETH_REWARDER, "address"),
        [1]: staticOneOf([WETH, COW], "address"),
        [3]: staticEqual(
          "0xde8c195aa41c11a0c4787372defbbddaa31306d2000200000000000000000181",
          "bytes32"
        ), // Balancer PoolId
        [4]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000a0",
          "bytes32"
        ), // Offset of tuple from beginning 160=32*5
        [5]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [6]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 224=32*7
        [7]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [9]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [10]: staticEqual(WETH, "address"),
        [11]: staticEqual(COW, "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [15]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Length of bytes 192=32*6
      },
    },

    allow.mainnet.aura.aura50COW_50WETH_rewarder["withdrawAndUnwrap"](),

    allow.mainnet.aura.aura50COW_50WETH_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Staking auraBAL
    //---------------------------------------------------------------------------------------------------------------------------------

    // Using auraBAL
    ...allowErc20Approve([auraBAL], [aura.auraBAL_STAKING_REWARDER]),

    allow.mainnet.aura.auraBAL_staking_rewarder["stake"](),

    allow.mainnet.aura.auraBAL_staking_rewarder["withdraw"](),

    // Using 80BAL-20WETH
    ...allowErc20Approve(
      [balancer.B_80BAL_20WETH],
      [aura.auraBAL_B_80BAL_20WETH_DEPOSITOR]
    ),

    allow.mainnet.aura.auraBAL_B_80BAL_20WETH_depositor[
      "deposit(uint256,bool,address)"
    ](undefined, undefined, {
      oneOf: [
        ZERO_ADDRESS, // When Minting ONLY
        aura.auraBAL_STAKING_REWARDER, // When Minting + Staking
      ],
    }),

    // Using BAL
    ...allowErc20Approve([BAL], [aura.auraBAL_BAL_DEPOSITOR]),

    allow.mainnet.aura.auraBAL_BAL_depositor["deposit"](
      undefined,
      undefined,
      undefined,
      {
        oneOf: [
          ZERO_ADDRESS, // When Minting ONLY
          aura.auraBAL_STAKING_REWARDER, // When Minting + Staking
        ],
      }
    ),

    // Claiming auraBAL Staking Rewards
    allow.mainnet.aura.auraBAL_staking_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Compounding auraBAL
    //---------------------------------------------------------------------------------------------------------------------------------

    // Using auraBAL
    ...allowErc20Approve([auraBAL], [aura.stkauraBAL]),

    // Stake
    allow.mainnet.aura.stkauraBAL["deposit"](undefined, AVATAR),

    // Unstake
    allow.mainnet.aura.stkauraBAL["withdraw"](undefined, AVATAR, AVATAR),

    // When the MAX amount is unstaked
    allow.mainnet.aura.stkauraBAL["redeem"](undefined, AVATAR, AVATAR),

    // Mint auraBAL and Stake
    allow.mainnet.aura.auraBAL_B_80BAL_20WETH_depositor[
      "deposit(uint256,bool,address)"
    ](undefined, undefined, {
      oneOf: [
        ZERO_ADDRESS, // When Minting ONLY
        aura.auraBAL_STAKER, // When Minting + Staking
      ],
    }),

    // Mint auraBAL and Stake
    allow.mainnet.aura.auraBAL_BAL_depositor["deposit"](
      undefined,
      undefined,
      undefined,
      {
        oneOf: [
          ZERO_ADDRESS, // When Minting ONLY
          aura.auraBAL_STAKER, // When Minting + Staking
        ],
      }
    ),

    // Claiming auraBAL Compounding Rewards
    allow.mainnet.aura.auraBAL_compounding_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Locking AURA
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([AURA], [aura.AURA_LOCKER]),

    // Locking AURA
    allow.mainnet.aura.aura_locker["lock"](AVATAR),

    // Claiming Locking AURA Rewards
    allow.mainnet.aura.aura_locker["getReward(address)"](AVATAR),

    // Process Expired AURA Locks - True -> Relock Expired Locks / False -> Withdraw Expired Locks
    allow.mainnet.aura.aura_locker["processExpiredLocks"](),

    // Gauge Votes Delegation - IMPORTANT: THE ADDRESS SHOULD BE CONSTRAINED IN ORDER TO AVOID DELEGATING THE VOTING POWER TO UNWANTED ADDRESSES
    // allow.mainnet.aura.aura_locker["delegate"](),

    // Proposals Delegation - IMPORTANT: THE ADDRESS SHOULD BE CONSTRAINED IN ORDER TO AVOID DELEGATING THE VOTING POWER TO UNWANTED ADDRESSES
    // allow.mainnet.aura.snapshot_delegate_registry["setDelegate"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura - General Rewards Claiming
    //---------------------------------------------------------------------------------------------------------------------------------
    allow.mainnet.aura.claim_zap["claimRewards"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // BALANCER
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer wstETH/WETH pool
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([wstETH, WETH], [balancer.VAULT]),
    ...allowErc20Approve(
      [balancer.B_stETH_STABLE],
      [balancer.B_stETH_STABLE_GAUGE]
    ),

    // Add Liquidity (using WETH)
    {
      targetAddress: balancer.VAULT,
      signature:
        "joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080",
          "bytes32"
        ), // Balancer PoolId
        [1]: staticEqual(AVATAR),
        [2]: staticEqual(AVATAR),
        [3]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of tuple from beginning 128=32*4
        [4]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [5]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 224=32*7
        [6]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [8]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [9]: staticEqual(wstETH, "address"),
        // [10]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
        [10]: staticEqual(WETH, "address"),
        [11]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticOneOf(
          [
            "0x00000000000000000000000000000000000000000000000000000000000000a0",
            "0x00000000000000000000000000000000000000000000000000000000000000c0",
            "0x0000000000000000000000000000000000000000000000000000000000000060",
            "0x0000000000000000000000000000000000000000000000000000000000000040",
          ],
          "bytes32"
        ), // Length of bytes
        [15]: staticOneOf(
          [
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000000000000000000000000001",
            "0x0000000000000000000000000000000000000000000000000000000000000002",
            "0x0000000000000000000000000000000000000000000000000000000000000003",
          ],
          "bytes32"
        ), // Join Kind
      },
      // send: true, // IMPORTANT: we only allow WETH -> If we allow ETH and WETH we could lose the ETH we send
    },

    // Remove Liquidity
    {
      targetAddress: balancer.VAULT,
      signature:
        "exitPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080",
          "bytes32"
        ), // Balancer PoolId
        [1]: staticEqual(AVATAR),
        [2]: staticEqual(AVATAR),
        [3]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of tuple from beginning 128=32*4
        [4]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [5]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 224=32*7
        [6]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [8]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [9]: staticEqual(wstETH, "address"),
        [10]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
        [11]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticOneOf(
          [
            "0x0000000000000000000000000000000000000000000000000000000000000060",
            "0x0000000000000000000000000000000000000000000000000000000000000040",
            "0x00000000000000000000000000000000000000000000000000000000000000c0",
          ],
          "bytes32"
        ), // Length of bytes
        [15]: staticOneOf(
          [
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000000000000000000000000001",
            "0x0000000000000000000000000000000000000000000000000000000000000002",
          ],
          "bytes32"
        ), // Join Kind
      },
    },

    // Stake
    allow.mainnet.balancer.B_stETH_stable_gauge["deposit(uint256)"](),

    // Unstake
    allow.mainnet.balancer.B_stETH_stable_gauge["withdraw(uint256)"](),

    // Claim Rewards
    allow.mainnet.balancer.B_stETH_stable_gauge["claim_rewards()"](),

    // Claim BAL Rewards
    allow.mainnet.balancer.BAL_minter["mint"](balancer.B_stETH_STABLE_GAUGE),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer B-80BAL-20WETH/auraBAL pool
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([balancer.B_80BAL_20WETH, auraBAL], [balancer.VAULT]),
    ...allowErc20Approve(
      [balancer.B_auraBAL_STABLE],
      [balancer.B_auraBAL_STABLE_GAUGE]
    ),

    // Add Liquidity
    {
      targetAddress: balancer.VAULT,
      signature:
        "joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0x3dd0843a028c86e0b760b1a76929d1c5ef93a2dd000200000000000000000249",
          "bytes32"
        ), // Balancer PoolId
        [1]: staticEqual(AVATAR),
        [2]: staticEqual(AVATAR),
        [3]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of tuple from beginning 128=32*4
        [4]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [5]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 224=32*7
        [6]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [8]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [9]: staticEqual(balancer.B_80BAL_20WETH, "address"),
        [10]: staticEqual(auraBAL, "address"),
        [11]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticOneOf(
          [
            "0x00000000000000000000000000000000000000000000000000000000000000a0",
            "0x00000000000000000000000000000000000000000000000000000000000000c0",
            "0x0000000000000000000000000000000000000000000000000000000000000060",
            "0x0000000000000000000000000000000000000000000000000000000000000040",
          ],
          "bytes32"
        ), // Length of bytes
        [15]: staticOneOf(
          [
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000000000000000000000000001",
            "0x0000000000000000000000000000000000000000000000000000000000000002",
            "0x0000000000000000000000000000000000000000000000000000000000000003",
          ],
          "bytes32"
        ), // Join Kind
      },
    },

    // Remove Liquidity
    {
      targetAddress: balancer.VAULT,
      signature:
        "exitPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0x3dd0843a028c86e0b760b1a76929d1c5ef93a2dd000200000000000000000249",
          "bytes32"
        ), // Balancer PoolId
        [1]: staticEqual(AVATAR),
        [2]: staticEqual(AVATAR),
        [3]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of tuple from beginning 128=32*4
        [4]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [5]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 224=32*7
        [6]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [8]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [9]: staticEqual(balancer.B_80BAL_20WETH, "address"),
        [10]: staticEqual(auraBAL, "address"),
        [11]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticOneOf(
          [
            "0x0000000000000000000000000000000000000000000000000000000000000060",
            "0x0000000000000000000000000000000000000000000000000000000000000040",
            "0x00000000000000000000000000000000000000000000000000000000000000c0",
          ],
          "bytes32"
        ), // Length of bytes
        [15]: staticOneOf(
          [
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000000000000000000000000001",
            "0x0000000000000000000000000000000000000000000000000000000000000002",
          ],
          "bytes32"
        ), // Join Kind
      },
    },

    // Stake
    allow.mainnet.balancer.B_auraBAL_stable_gauge["deposit(uint256)"](),

    // Unstake
    allow.mainnet.balancer.B_auraBAL_stable_gauge["withdraw(uint256)"](),

    // Claim Rewards
    allow.mainnet.balancer.B_auraBAL_stable_gauge["claim_rewards()"](),

    // Claim BAL Rewards
    allow.mainnet.balancer.BAL_minter["mint"](balancer.B_auraBAL_STABLE_GAUGE),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer rETH/WETH pool
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([rETH, WETH], [balancer.VAULT]),
    ...allowErc20Approve(
      [balancer.B_rETH_STABLE],
      [balancer.B_rETH_STABLE_GAUGE]
    ),

    // Add Liquidity (using WETH)
    {
      targetAddress: balancer.VAULT,
      signature:
        "joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0x1e19cf2d73a72ef1332c882f20534b6519be0276000200000000000000000112",
          "bytes32"
        ), // Balancer PoolId
        [1]: staticEqual(AVATAR),
        [2]: staticEqual(AVATAR),
        [3]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of tuple from beginning 128=32*4
        [4]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [5]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 224=32*7
        [6]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [8]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [9]: staticEqual(rETH, "address"),
        // [10]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
        [10]: staticEqual(WETH, "address"),
        [11]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticOneOf(
          [
            "0x00000000000000000000000000000000000000000000000000000000000000a0",
            "0x00000000000000000000000000000000000000000000000000000000000000c0",
            "0x0000000000000000000000000000000000000000000000000000000000000060",
            "0x0000000000000000000000000000000000000000000000000000000000000040",
          ],
          "bytes32"
        ), // Length of bytes
        [15]: staticOneOf(
          [
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000000000000000000000000001",
            "0x0000000000000000000000000000000000000000000000000000000000000002",
            "0x0000000000000000000000000000000000000000000000000000000000000003",
          ],
          "bytes32"
        ), // Join Kind
      },
      // send: true, // IMPORTANT: we only allow WETH -> If we allow ETH and WETH we could lose the ETH we send
    },

    // Remove Liquidity
    {
      targetAddress: balancer.VAULT,
      signature:
        "exitPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0x1e19cf2d73a72ef1332c882f20534b6519be0276000200000000000000000112",
          "bytes32"
        ), // Balancer PoolId
        [1]: staticEqual(AVATAR),
        [2]: staticEqual(AVATAR),
        [3]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of tuple from beginning 128=32*4
        [4]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [5]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 224=32*7
        [6]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [8]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [9]: staticEqual(wstETH, "address"),
        [10]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
        [11]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticOneOf(
          [
            "0x0000000000000000000000000000000000000000000000000000000000000060",
            "0x0000000000000000000000000000000000000000000000000000000000000040",
            "0x00000000000000000000000000000000000000000000000000000000000000c0",
          ],
          "bytes32"
        ), // Length of bytes
        [15]: staticOneOf(
          [
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000000000000000000000000001",
            "0x0000000000000000000000000000000000000000000000000000000000000002",
          ],
          "bytes32"
        ), // Join Kind
      },
    },

    // Stake
    allow.mainnet.balancer.B_rETH_stable_gauge["deposit(uint256)"](),

    // Unstake
    allow.mainnet.balancer.B_rETH_stable_gauge["withdraw(uint256)"](),

    // Claim Rewards
    allow.mainnet.balancer.B_rETH_stable_gauge["claim_rewards()"](),

    // Claim BAL Rewards
    allow.mainnet.balancer.BAL_minter["mint"](balancer.B_rETH_STABLE_GAUGE),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer GNO/WETH pool
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([GNO, WETH], [balancer.VAULT]),
    ...allowErc20Approve(
      [balancer.B_80GNO_20WETH],
      [balancer.B_80GNO_20WETH_GAUGE]
    ),

    // Add Liquidity (using WETH)
    {
      targetAddress: balancer.VAULT,
      signature:
        "joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0xf4c0dd9b82da36c07605df83c8a416f11724d88b000200000000000000000026",
          "bytes32"
        ), // Balancer PoolId
        [1]: staticEqual(AVATAR),
        [2]: staticEqual(AVATAR),
        [3]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of tuple from beginning 128=32*4
        [4]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [5]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 224=32*7
        [6]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [8]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [9]: staticEqual(GNO, "address"),
        // [10]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
        [10]: staticEqual(WETH, "address"),
        [11]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticOneOf(
          [
            "0x00000000000000000000000000000000000000000000000000000000000000a0",
            "0x00000000000000000000000000000000000000000000000000000000000000c0",
            "0x0000000000000000000000000000000000000000000000000000000000000060",
            "0x0000000000000000000000000000000000000000000000000000000000000040",
          ],
          "bytes32"
        ), // Length of bytes
        [15]: staticOneOf(
          [
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000000000000000000000000001",
            "0x0000000000000000000000000000000000000000000000000000000000000002",
            "0x0000000000000000000000000000000000000000000000000000000000000003",
          ],
          "bytes32"
        ), // Join Kind
      },
      // send: true, // IMPORTANT: we only allow WETH -> If we allow ETH and WETH we could lose the ETH we send
    },

    // Remove Liquidity
    {
      targetAddress: balancer.VAULT,
      signature:
        "exitPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0xf4c0dd9b82da36c07605df83c8a416f11724d88b000200000000000000000026",
          "bytes32"
        ), // Balancer PoolId
        [1]: staticEqual(AVATAR),
        [2]: staticEqual(AVATAR),
        [3]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of tuple from beginning 128=32*4
        [4]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [5]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 224=32*7
        [6]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [8]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [9]: staticEqual(GNO, "address"),
        [10]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
        [11]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticOneOf(
          [
            "0x0000000000000000000000000000000000000000000000000000000000000060",
            "0x0000000000000000000000000000000000000000000000000000000000000040",
            "0x00000000000000000000000000000000000000000000000000000000000000c0",
          ],
          "bytes32"
        ), // Length of bytes
        [15]: staticOneOf(
          [
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000000000000000000000000001",
            "0x0000000000000000000000000000000000000000000000000000000000000002",
          ],
          "bytes32"
        ), // Join Kind
      },
    },

    // Stake
    allow.mainnet.balancer.B_80GNO_20WETH_gauge["deposit(uint256)"](),

    // Unstake
    allow.mainnet.balancer.B_80GNO_20WETH_gauge["withdraw(uint256)"](),

    // Claim Rewards
    allow.mainnet.balancer.B_80GNO_20WETH_gauge["claim_rewards()"](),

    // Claim BAL Rewards
    allow.mainnet.balancer.BAL_minter["mint"](balancer.B_80GNO_20WETH_GAUGE),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer GNO/COW pool
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([GNO, COW], [balancer.VAULT]),
    ...allowErc20Approve(
      [balancer.B_50COW_50GNO],
      [balancer.B_50COW_50GNO_GAUGE]
    ),

    // Add Liquidity
    {
      targetAddress: balancer.VAULT,
      signature:
        "joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0x92762b42a06dcdddc5b7362cfb01e631c4d44b40000200000000000000000182",
          "bytes32"
        ), // Balancer PoolId
        [1]: staticEqual(AVATAR),
        [2]: staticEqual(AVATAR),
        [3]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of tuple from beginning 128=32*4
        [4]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [5]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 224=32*7
        [6]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [8]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [9]: staticEqual(GNO, "address"),
        [10]: staticEqual(COW, "address"),
        [11]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticOneOf(
          [
            "0x00000000000000000000000000000000000000000000000000000000000000a0",
            "0x00000000000000000000000000000000000000000000000000000000000000c0",
            "0x0000000000000000000000000000000000000000000000000000000000000060",
            "0x0000000000000000000000000000000000000000000000000000000000000040",
          ],
          "bytes32"
        ), // Length of bytes
        [15]: staticOneOf(
          [
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000000000000000000000000001",
            "0x0000000000000000000000000000000000000000000000000000000000000002",
            "0x0000000000000000000000000000000000000000000000000000000000000003",
          ],
          "bytes32"
        ), // Join Kind
      },
    },

    // Remove Liquidity
    {
      targetAddress: balancer.VAULT,
      signature:
        "exitPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0x92762b42a06dcdddc5b7362cfb01e631c4d44b40000200000000000000000182",
          "bytes32"
        ), // Balancer PoolId
        [1]: staticEqual(AVATAR),
        [2]: staticEqual(AVATAR),
        [3]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of tuple from beginning 128=32*4
        [4]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [5]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 224=32*7
        [6]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [8]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [9]: staticEqual(GNO, "address"),
        [10]: staticEqual(COW, "address"),
        [11]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticOneOf(
          [
            "0x0000000000000000000000000000000000000000000000000000000000000060",
            "0x0000000000000000000000000000000000000000000000000000000000000040",
            "0x00000000000000000000000000000000000000000000000000000000000000c0",
          ],
          "bytes32"
        ), // Length of bytes
        [15]: staticOneOf(
          [
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000000000000000000000000001",
            "0x0000000000000000000000000000000000000000000000000000000000000002",
          ],
          "bytes32"
        ), // Join Kind
      },
    },

    // Stake
    allow.mainnet.balancer.B_50COW_50GNO_gauge["deposit(uint256)"](),

    // Unstake
    allow.mainnet.balancer.B_50COW_50GNO_gauge["withdraw(uint256)"](),

    // Claim Rewards
    allow.mainnet.balancer.B_50COW_50GNO_gauge["claim_rewards()"](),

    // Claim BAL Rewards
    allow.mainnet.balancer.BAL_minter["mint"](balancer.B_50COW_50GNO_GAUGE),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer LDO/wstETH pool
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([LDO, wstETH], [balancer.VAULT]),
    ...allowErc20Approve(
      [balancer.B_50WSTETH_50LDO],
      [balancer.B_50WSTETH_50LDO_GAUGE]
    ),

    // Add Liquidity
    {
      targetAddress: balancer.VAULT,
      signature:
        "joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0x5f1f4e50ba51d723f12385a8a9606afc3a0555f5000200000000000000000465",
          "bytes32"
        ), // Balancer PoolId
        [1]: staticEqual(AVATAR),
        [2]: staticEqual(AVATAR),
        [3]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of tuple from beginning 128=32*4
        [4]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [5]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 224=32*7
        [6]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [8]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [9]: staticEqual(LDO, "address"),
        [10]: staticEqual(wstETH, "address"),
        [11]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticOneOf(
          [
            "0x00000000000000000000000000000000000000000000000000000000000000a0",
            "0x00000000000000000000000000000000000000000000000000000000000000c0",
            "0x0000000000000000000000000000000000000000000000000000000000000060",
            "0x0000000000000000000000000000000000000000000000000000000000000040",
          ],
          "bytes32"
        ), // Length of bytes
        [15]: staticOneOf(
          [
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000000000000000000000000001",
            "0x0000000000000000000000000000000000000000000000000000000000000002",
            "0x0000000000000000000000000000000000000000000000000000000000000003",
          ],
          "bytes32"
        ), // Join Kind
      },
    },

    // Remove Liquidity
    {
      targetAddress: balancer.VAULT,
      signature:
        "exitPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0x5f1f4e50ba51d723f12385a8a9606afc3a0555f5000200000000000000000465",
          "bytes32"
        ), // Balancer PoolId
        [1]: staticEqual(AVATAR),
        [2]: staticEqual(AVATAR),
        [3]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of tuple from beginning 128=32*4
        [4]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [5]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 224=32*7
        [6]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [8]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [9]: staticEqual(LDO, "address"),
        [10]: staticEqual(wstETH, "address"),
        [11]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticOneOf(
          [
            "0x0000000000000000000000000000000000000000000000000000000000000060",
            "0x0000000000000000000000000000000000000000000000000000000000000040",
            "0x00000000000000000000000000000000000000000000000000000000000000c0",
          ],
          "bytes32"
        ), // Length of bytes
        [15]: staticOneOf(
          [
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000000000000000000000000001",
            "0x0000000000000000000000000000000000000000000000000000000000000002",
          ],
          "bytes32"
        ), // Join Kind
      },
    },

    // Stake
    allow.mainnet.balancer.B_50WSTETH_50LDO_gauge["deposit(uint256)"](),

    // Unstake
    allow.mainnet.balancer.B_50WSTETH_50LDO_gauge["withdraw(uint256)"](),

    // Claim Rewards
    allow.mainnet.balancer.B_50WSTETH_50LDO_gauge["claim_rewards()"](),

    // Claim BAL Rewards
    allow.mainnet.balancer.BAL_minter["mint"](balancer.B_50WSTETH_50LDO_GAUGE),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer WETH/AURA pool
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([WETH, AURA], [balancer.VAULT]),
    ...allowErc20Approve(
      [balancer.B_50WETH_50AURA],
      [balancer.B_50WETH_50AURA_GAUGE]
    ),

    // Add Liquidity (using WETH)
    {
      targetAddress: balancer.VAULT,
      signature:
        "joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0xcfca23ca9ca720b6e98e3eb9b6aa0ffc4a5c08b9000200000000000000000274",
          "bytes32"
        ), // Balancer PoolId
        [1]: staticEqual(AVATAR),
        [2]: staticEqual(AVATAR),
        [3]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of tuple from beginning 128=32*4
        [4]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [5]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 224=32*7
        [6]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [8]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        // [9]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
        [9]: staticEqual(WETH, "address"),
        [10]: staticEqual(AURA, "address"),
        [11]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticOneOf(
          [
            "0x00000000000000000000000000000000000000000000000000000000000000a0",
            "0x00000000000000000000000000000000000000000000000000000000000000c0",
            "0x0000000000000000000000000000000000000000000000000000000000000060",
            "0x0000000000000000000000000000000000000000000000000000000000000040",
          ],
          "bytes32"
        ), // Length of bytes
        [15]: staticOneOf(
          [
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000000000000000000000000001",
            "0x0000000000000000000000000000000000000000000000000000000000000002",
            "0x0000000000000000000000000000000000000000000000000000000000000003",
          ],
          "bytes32"
        ), // Join Kind
      },
      // send: true, // IMPORTANT: we only allow WETH -> If we allow ETH and WETH we could lose the ETH we send
    },

    // Remove Liquidity
    {
      targetAddress: balancer.VAULT,
      signature:
        "exitPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0xcfca23ca9ca720b6e98e3eb9b6aa0ffc4a5c08b9000200000000000000000274",
          "bytes32"
        ), // Balancer PoolId
        [1]: staticEqual(AVATAR),
        [2]: staticEqual(AVATAR),
        [3]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of tuple from beginning 128=32*4
        [4]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [5]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 224=32*7
        [6]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [8]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [9]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
        [10]: staticEqual(AURA, "address"),
        [11]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticOneOf(
          [
            "0x0000000000000000000000000000000000000000000000000000000000000060",
            "0x0000000000000000000000000000000000000000000000000000000000000040",
            "0x00000000000000000000000000000000000000000000000000000000000000c0",
          ],
          "bytes32"
        ), // Length of bytes
        [15]: staticOneOf(
          [
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000000000000000000000000001",
            "0x0000000000000000000000000000000000000000000000000000000000000002",
          ],
          "bytes32"
        ), // Join Kind
      },
    },

    // Stake
    allow.mainnet.balancer.B_50WETH_50AURA_gauge["deposit(uint256)"](),

    // Unstake
    allow.mainnet.balancer.B_50WETH_50AURA_gauge["withdraw(uint256)"](),

    // Claim Rewards
    allow.mainnet.balancer.B_50WETH_50AURA_gauge["claim_rewards()"](),

    // Claim BAL Rewards
    allow.mainnet.balancer.BAL_minter["mint"](balancer.B_50WETH_50AURA_GAUGE),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer WETH/COW pool
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([WETH, COW], [balancer.VAULT]),
    ...allowErc20Approve(
      [balancer.B_50COW_50WETH],
      [balancer.B_50COW_50WETH_GAUGE]
    ),

    // Add Liquidity (using WETH)
    {
      targetAddress: balancer.VAULT,
      signature:
        "joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0xde8c195aa41c11a0c4787372defbbddaa31306d2000200000000000000000181",
          "bytes32"
        ), // Balancer PoolId
        [1]: staticEqual(AVATAR),
        [2]: staticEqual(AVATAR),
        [3]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of tuple from beginning 128=32*4
        [4]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [5]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 224=32*7
        [6]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [8]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        // [9]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
        [9]: staticEqual(WETH, "address"),
        [10]: staticEqual(COW, "address"),
        [11]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticOneOf(
          [
            "0x00000000000000000000000000000000000000000000000000000000000000a0",
            "0x00000000000000000000000000000000000000000000000000000000000000c0",
            "0x0000000000000000000000000000000000000000000000000000000000000060",
            "0x0000000000000000000000000000000000000000000000000000000000000040",
          ],
          "bytes32"
        ), // Length of bytes
        [15]: staticOneOf(
          [
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000000000000000000000000001",
            "0x0000000000000000000000000000000000000000000000000000000000000002",
            "0x0000000000000000000000000000000000000000000000000000000000000003",
          ],
          "bytes32"
        ), // Join Kind
      },
      // send: true, // IMPORTANT: we only allow WETH -> If we allow ETH and WETH we could lose the ETH we send
    },

    // Remove Liquidity
    {
      targetAddress: balancer.VAULT,
      signature:
        "exitPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0xde8c195aa41c11a0c4787372defbbddaa31306d2000200000000000000000181",
          "bytes32"
        ), // Balancer PoolId
        [1]: staticEqual(AVATAR),
        [2]: staticEqual(AVATAR),
        [3]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of tuple from beginning 128=32*4
        [4]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [5]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 224=32*7
        [6]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [8]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [9]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
        [10]: staticEqual(COW, "address"),
        [11]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticOneOf(
          [
            "0x0000000000000000000000000000000000000000000000000000000000000060",
            "0x0000000000000000000000000000000000000000000000000000000000000040",
            "0x00000000000000000000000000000000000000000000000000000000000000c0",
          ],
          "bytes32"
        ), // Length of bytes
        [15]: staticOneOf(
          [
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000000000000000000000000001",
            "0x0000000000000000000000000000000000000000000000000000000000000002",
          ],
          "bytes32"
        ), // Join Kind
      },
    },

    // Stake
    allow.mainnet.balancer.B_50COW_50WETH_gauge["deposit(uint256)"](),

    // Unstake
    allow.mainnet.balancer.B_50COW_50WETH_gauge["withdraw(uint256)"](),

    // Claim Rewards
    allow.mainnet.balancer.B_50COW_50WETH_gauge["claim_rewards()"](),

    // Claim BAL Rewards
    allow.mainnet.balancer.BAL_minter["mint"](balancer.B_50COW_50WETH_GAUGE),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer BAL/WETH pool
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([BAL, WETH], [balancer.VAULT]),

    // Add Liquidity (using WETH)
    {
      targetAddress: balancer.VAULT,
      signature:
        "joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014",
          "bytes32"
        ), // Balancer PoolId
        [1]: staticEqual(AVATAR),
        [2]: staticEqual(AVATAR),
        [3]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of tuple from beginning 128=32*4
        [4]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [5]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 224=32*7
        [6]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [8]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [9]: staticEqual(BAL, "address"),
        // [10]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
        [10]: staticEqual(WETH, "address"),
        [11]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticOneOf(
          [
            "0x00000000000000000000000000000000000000000000000000000000000000a0",
            "0x00000000000000000000000000000000000000000000000000000000000000c0",
            "0x0000000000000000000000000000000000000000000000000000000000000060",
            "0x0000000000000000000000000000000000000000000000000000000000000040",
          ],
          "bytes32"
        ), // Length of bytes
        [15]: staticOneOf(
          [
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000000000000000000000000001",
            "0x0000000000000000000000000000000000000000000000000000000000000002",
            "0x0000000000000000000000000000000000000000000000000000000000000003",
          ],
          "bytes32"
        ), // Join Kind
      },
      // send: true, // IMPORTANT: we only allow WETH -> If we allow ETH and WETH we could lose the ETH we send
    },

    // Remove Liquidity
    {
      targetAddress: balancer.VAULT,
      signature:
        "exitPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014",
          "bytes32"
        ), // Balancer PoolId
        [1]: staticEqual(AVATAR),
        [2]: staticEqual(AVATAR),
        [3]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of tuple from beginning 128=32*4
        [4]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [5]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 224=32*7
        [6]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [8]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [9]: staticEqual(BAL, "address"),
        [10]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
        [11]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticOneOf(
          [
            "0x0000000000000000000000000000000000000000000000000000000000000060",
            "0x0000000000000000000000000000000000000000000000000000000000000040",
            "0x00000000000000000000000000000000000000000000000000000000000000c0",
          ],
          "bytes32"
        ), // Length of bytes
        [15]: staticOneOf(
          [
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000000000000000000000000001",
            "0x0000000000000000000000000000000000000000000000000000000000000002",
          ],
          "bytes32"
        ), // Join Kind
      },
    },

    // Create Lock
    allow.mainnet.balancer.veBAL["create_lock"](),

    // Increase locked amount
    allow.mainnet.balancer.veBAL["increase_amount"](),

    // Increase unlock time
    allow.mainnet.balancer.veBAL["increase_unlock_time"](),

    // Unlock
    allow.mainnet.balancer.veBAL["withdraw"](),

    // Claim locking rewards (single token)
    allow.mainnet.balancer.fee_distributor["claimToken"](AVATAR),

    // Claim locking rewards (multiple tokens)
    allow.mainnet.balancer.fee_distributor["claimTokens"](AVATAR),

    //---------------------------------------------------------------------------------------------------------------------------------
    // CONVEX
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Convex - ETH/stETH
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([curve.steCRV], [convex.BOOSTER]),
    ...allowErc20Approve([convex.cvxsteCRV], [convex.cvxsteCRV_REWARDER]),

    // Deposit
    allow.mainnet.convex.booster["depositAll"](
      25 // poolId (If you don't specify a poolId you can deposit funds in any pool)
    ),
    allow.mainnet.convex.booster["deposit"](
      25 // poolId (If you don't specify a poolId you can deposit funds in any pool)
    ),

    // Withdraw
    allow.mainnet.convex.booster["withdraw"](
      25 // poolId (If you don't specify a poolId you can withdraw funds in any pool)
    ),

    // Stake
    allow.mainnet.convex.cvxsteCRV_rewarder["stake"](),

    // Unstake
    allow.mainnet.convex.cvxsteCRV_rewarder["withdraw"](),

    // Unstake and Withdraw
    allow.mainnet.convex.cvxsteCRV_rewarder["withdrawAndUnwrap"](),

    // Claim Rewards
    allow.mainnet.convex.cvxsteCRV_rewarder["getReward(address,bool)"](AVATAR),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Convex - cDAI/cUSDC
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([curve.crvcDAIcUSDC], [convex.BOOSTER]),
    ...allowErc20Approve([convex.cvxcDAIcUSDC], [convex.cvxcDAIcUSDC_REWARDER]),

    // Deposit
    allow.mainnet.convex.booster["depositAll"](
      {
        oneOf: [0],
      } // poolId (If you don't specify a poolId you can deposit funds in any pool)
    ),
    allow.mainnet.convex.booster["deposit"](
      {
        oneOf: [0],
      } // poolId (If you don't specify a poolId you can deposit funds in any pool)
    ),

    // Withdraw
    allow.mainnet.convex.booster["withdraw"](
      {
        oneOf: [0],
      } // poolId (If you don't specify a poolId you can withdraw funds in any pool)
    ),

    // Stake
    allow.mainnet.convex.cvxcDAIcUSDC_rewarder["stake"](),

    // Unstake
    allow.mainnet.convex.cvxcDAIcUSDC_rewarder["withdraw"](),

    // Unstake and Withdraw
    allow.mainnet.convex.cvxcDAIcUSDC_rewarder["withdrawAndUnwrap"](),

    // Claim Rewards
    allow.mainnet.convex.cvxcDAIcUSDC_rewarder["getReward(address,bool)"](
      AVATAR
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Convex - Convert CRV to cvxCRV and Stake cvxCRV
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([CRV], [convex.CRV_DEPOSITOR]),
    ...allowErc20Approve([convex.cvxCRV], [convex.stkCvxCrv]),

    // Convert CRV to cvxCRV
    allow.mainnet.convex.crv_depositor["deposit(uint256,bool)"](),

    // Stake cvxCRV
    allow.mainnet.convex.stkCvxCrv["stake"](undefined, AVATAR),

    // Convert CRV to cvxCRV and Stake cvxCRV
    allow.mainnet.convex.crv_depositor["deposit(uint256,bool,address)"](
      undefined,
      undefined,
      convex.stkCvxCrv
    ),

    // Unstake cvxCRV
    allow.mainnet.convex.stkCvxCrv["withdraw"](),

    // Set Rewards Preferences
    allow.mainnet.convex.stkCvxCrv["setRewardWeight"](),

    // Claim Rewards
    allow.mainnet.convex.stkCvxCrv["getReward(address)"](AVATAR),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Convex - Stake CVX
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([CVX], [convex.cvxRewardPool]),

    // Stake CVX
    allow.mainnet.convex.cvxRewardPool["stake"](),

    // Unstake CVX
    allow.mainnet.convex.cvxRewardPool["withdraw"](),

    // Claim Rewards
    allow.mainnet.convex.cvxRewardPool["getReward(bool)"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Convex - Lock CVX
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([CVX], [convex.vlCVX]),

    // Lock CVX
    allow.mainnet.convex.vlCVX["lock"](AVATAR),

    // Process Expired Locks (Withdraw = False or Relock = True)
    allow.mainnet.convex.vlCVX["processExpiredLocks"](),

    // Claim Rewards
    allow.mainnet.convex.vlCVX["getReward(address,bool)"](AVATAR),

    // // Clear Delegate
    // allow.mainnet.convex.snapshot_delegation["clearDelegate"](),

    // // Set Delegate
    // allow.mainnet.convex.snapshot_delegation["setDelegate"](
    //   undefined,
    //   undefined, // Set delegate/s
    // ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Convex - General Rewards Claiming
    //---------------------------------------------------------------------------------------------------------------------------------
    allow.mainnet.convex.claim_zap["claimRewards"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // CURVE
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Curve - ETH/stETH
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([stETH], [curve.stETH_ETH_POOL]),
    ...allowErc20Approve([curve.steCRV], [curve.stETH_ETH_GAUGE]),
    ...allowErc20Approve([stETH], [curve.STAKE_DEPOSIT_ZAP]),

    // Add Liquidity
    allow.mainnet.curve.steth_eth_pool["add_liquidity"](undefined, undefined, {
      send: true,
    }),

    // Remove Liquidity
    allow.mainnet.curve.steth_eth_pool["remove_liquidity"](),

    // Removing Liquidity of One Coin
    allow.mainnet.curve.steth_eth_pool["remove_liquidity_one_coin"](),

    // Removing Liquidity Imbalance
    allow.mainnet.curve.steth_eth_pool["remove_liquidity_imbalance"](),

    // Exchange using ETH
    allow.mainnet.curve.steth_eth_pool["exchange"](
      undefined,
      undefined,
      undefined,
      undefined,
      {
        send: true,
      }
    ),

    // Stake
    allow.mainnet.curve.steth_eth_gauge["deposit(uint256)"](),

    // Unstake
    allow.mainnet.curve.steth_eth_gauge["withdraw"](),

    // Claim LDO Rewards
    allow.mainnet.curve.steth_eth_gauge["claim_rewards()"](),

    // Claim CRV Rewards
    allow.mainnet.curve.crv_minter["mint"](curve.stETH_ETH_GAUGE),

    // Deposit and Stake using a special ZAP
    allow.mainnet.curve.steth_eth_gauge["set_approve_deposit"](
      curve.STAKE_DEPOSIT_ZAP
    ),

    // Using ETH
    // allow.mainnet.curve.stake_deposit_zap["deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)"](
    //   curve.stETH_ETH_POOL,
    //   curve.steCRV,
    //   curve.stETH_ETH_GAUGE,
    //   2,
    //   [E_ADDRESS, stETH, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
    //   undefined,
    //   undefined,
    //   undefined,
    //   ZERO_ADDRESS,
    //   {
    //     send: true
    //   }
    // ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Curve - cDAI/cUSDC
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve(
      [compound_v2.cDAI, compound_v2.cUSDC],
      [curve.cDAIcUSDC_POOL]
    ),
    ...allowErc20Approve([curve.crvcDAIcUSDC], [curve.cDAIcUSDC_GAUGE]),
    ...allowErc20Approve([DAI, USDC], [curve.cDAIcUSDC_ZAP]),
    ...allowErc20Approve(
      [compound_v2.cDAI, compound_v2.cUSDC, DAI, USDC],
      [curve.STAKE_DEPOSIT_ZAP]
    ),

    // Add Liquidity
    allow.mainnet.curve.cDAIcUSDC_pool["add_liquidity"](),

    // Add Liquidity (Underlying, using ZAP)
    allow.mainnet.curve.cDAIcUSDC_zap["add_liquidity"](),

    // Remove Liquidity
    allow.mainnet.curve.cDAIcUSDC_pool["remove_liquidity"](),

    // Remove Liquidity (Underlying, using ZAP)
    allow.mainnet.curve.cDAIcUSDC_zap["remove_liquidity"](),

    // Removing Liquidity Imbalance
    allow.mainnet.curve.cDAIcUSDC_pool["remove_liquidity_imbalance"](),

    // Removing Liquidity Imbalance (Underlying, using ZAP)
    allow.mainnet.curve.cDAIcUSDC_zap["remove_liquidity_imbalance"](),

    // Removing Liquidity of One Coin (Underlying, using ZAP)
    allow.mainnet.curve.cDAIcUSDC_zap[
      "remove_liquidity_one_coin(uint256,int128,uint256)"
    ](),

    // Exchange
    allow.mainnet.curve.cDAIcUSDC_pool["exchange"](),

    // Exchange Underlying
    allow.mainnet.curve.cDAIcUSDC_pool["exchange_underlying"](),

    // Stake
    allow.mainnet.curve.cDAIcUSDC_gauge["deposit(uint256)"](),

    // Unstake
    allow.mainnet.curve.cDAIcUSDC_gauge["withdraw"](),

    // Claim CRV Rewards - This pool gauge does not grant any rewards
    allow.mainnet.curve.crv_minter["mint"](curve.cDAIcUSDC_GAUGE),

    // Deposit and Stake using a special ZAP
    allow.mainnet.curve.cDAIcUSDC_gauge["set_approve_deposit"](
      curve.STAKE_DEPOSIT_ZAP
    ),

    // Deposit and Stake using a special ZAP
    // allow.mainnet.curve.stake_deposit_zap["deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)"](
    //   {
    //     oneOf: [curve.cDAIcUSDC_POOL, curve.cDAIcUSDC_ZAP]
    //   },
    //   curve.crvcDAIcUSDC,
    //   curve.cDAIcUSDC_GAUGE,
    //   2,
    //   {
    //     oneOf: [
    //       [DAI, USDC, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
    //       [compound_v2.cUSDC, compound_v2.cDAI, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
    //     ]
    //   },
    //   undefined,
    //   undefined,
    //   undefined,
    //   ZERO_ADDRESS
    // ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Curve - Deposit and Stake using a special ZAP
    //---------------------------------------------------------------------------------------------------------------------------------
    allow.mainnet.curve.stake_deposit_zap[
      "deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)"
    ](
      {
        oneOf: [
          curve.stETH_ETH_POOL,
          curve.cDAIcUSDC_POOL,
          curve.cDAIcUSDC_ZAP,
        ],
      },
      {
        oneOf: [curve.steCRV, curve.crvcDAIcUSDC],
      },
      {
        oneOf: [curve.stETH_ETH_GAUGE, curve.cDAIcUSDC_GAUGE],
      },
      2,
      {
        oneOf: [
          [E_ADDRESS, stETH, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
          [DAI, USDC, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
          [
            compound_v2.cUSDC,
            compound_v2.cDAI,
            ZERO_ADDRESS,
            ZERO_ADDRESS,
            ZERO_ADDRESS,
          ],
        ],
      },
      undefined,
      undefined,
      undefined,
      ZERO_ADDRESS,
      {
        send: true,
      }
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Compound V2
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Compound V2 - USDC
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([USDC], [compound_v2.cUSDC]),

    // Deposit
    allow.mainnet.compound_v2.cUSDC["mint"](),

    // Withdrawing: sender redeems uint256 cTokens, it is called when MAX is withdrawn
    allow.mainnet.compound_v2.cUSDC["redeem"](),

    // Withdrawing: sender redeems cTokens in exchange for a specified amount of underlying asset (uint256), it is called when MAX isn't withdrawn
    allow.mainnet.compound_v2.cUSDC["redeemUnderlying"](),

    // Use as Collateral
    // We are only allowing to call this function with one single token address, since it's the way the UI does it
    {
      targetAddress: compound_v2.COMPTROLLER,
      signature: "enterMarkets(address[])",
      params: {
        [0]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000020",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 64=32*2
        [1]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000001",
          "bytes32"
        ), // Length of address[] = 1
        [2]: staticEqual(compound_v2.cUSDC, "address"),
      },
    },

    // Stop using as Collateral
    allow.mainnet.compound_v2.comptroller["exitMarket"](compound_v2.cUSDC),

    // Borrow specified amount of underlying asset (uint256)
    allow.mainnet.compound_v2.cUSDC["borrow"](),

    // Repay specified borrowed amount of underlying asset (uint256)
    allow.mainnet.compound_v2.cUSDC["repayBorrow"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Compound V2 - DAI
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([DAI], [compound_v2.cDAI]),

    // Deposit
    allow.mainnet.compound_v2.cDAI["mint"](),

    // Withdrawing: sender redeems uint256 cTokens, it is called when MAX is withdrawn
    allow.mainnet.compound_v2.cDAI["redeem"](),

    // Withdrawing: sender redeems cTokens in exchange for a specified amount of underlying asset (uint256), it is called when MAX isn't withdrawn
    allow.mainnet.compound_v2.cDAI["redeemUnderlying"](),

    // Use as Collateral
    // We are only allowing to call this function with one single token address, since it's the way the UI does it
    {
      targetAddress: compound_v2.COMPTROLLER,
      signature: "enterMarkets(address[])",
      params: {
        [0]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000020",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 64=32*2
        [1]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000001",
          "bytes32"
        ), // Length of address[] = 1
        [2]: staticEqual(compound_v2.cDAI, "address"),
      },
    },

    // Stop using as Collateral
    allow.mainnet.compound_v2.comptroller["exitMarket"](compound_v2.cDAI),

    // Borrow specified amount of underlying asset (uint256)
    allow.mainnet.compound_v2.cDAI["borrow"](),

    // Repay specified borrowed amount of underlying asset (uint256)
    allow.mainnet.compound_v2.cDAI["repayBorrow"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Compound V2 - Claiming of rewards
    //---------------------------------------------------------------------------------------------------------------------------------
    allow.mainnet.compound_v2.comptroller["claimComp(address,address[])"](
      AVATAR,
      {
        subsetOf: [compound_v2.cDAI, compound_v2.cUSDC]
          .map((address) => address.toLowerCase())
          .sort(), // compound app will always pass tokens in ascending order
        restrictOrder: true,
      }
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Compound V3
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Compound V3 - USDC
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([USDC], [compound_v3.cUSDCv3]),

    // Supply/Repay
    allow.mainnet.compound_v3.cUSDCv3["supply"](USDC),

    // Withdraw/Borrow
    allow.mainnet.compound_v3.cUSDCv3["withdraw"](USDC),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Compound V3 - ETH
    //---------------------------------------------------------------------------------------------------------------------------------
    // You need to approve the Compound III proxy (MainnetBulker) contract first. You only need to do this once.
    allow.mainnet.compound_v3.cUSDCv3["allow"](compound_v3.MainnetBulker),

    // Supply
    {
      targetAddress: compound_v3.MainnetBulker,
      signature: "invoke(bytes32[],bytes[])",
      params: {
        [0]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000040",
          "bytes32"
        ), // Offset of bytes32[] from beginning 64=32*2
        [1]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of bytes[] from beginning 128=32*4
        [2]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000001",
          "bytes32"
        ), // Length of bytes32[] = 1
        [3]: staticEqual(
          "0x414354494f4e5f535550504c595f4e41544956455f544f4b454e000000000000",
          "bytes32"
        ), // ACTION_SUPPLY_NATIVE_TOKEN Encoded
        [4]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000001",
          "bytes32"
        ), // Length of bytes[] = 1
        [5]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000020",
          "bytes32"
        ), // Offset of the first element of the bytes[] from beginning of bytes[] 32=32*1
        [6]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000060",
          "bytes32"
        ), // Length of the first element of the bytes[] 96=32*3
        [7]: staticEqual(compound_v3.cUSDCv3, "address"),
        [8]: staticEqual(AVATAR),
      },
      send: true,
    },

    // Withdraw
    {
      targetAddress: compound_v3.MainnetBulker,
      signature: "invoke(bytes32[],bytes[])",
      params: {
        [0]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000040",
          "bytes32"
        ), // Offset of bytes32[] from beginning 64=32*2
        [1]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of bytes[] from beginning 128=32*4
        [2]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000001",
          "bytes32"
        ), // Length of bytes32[] = 1
        [3]: staticEqual(
          "0x414354494f4e5f57495448445241575f4e41544956455f544f4b454e00000000",
          "bytes32"
        ), // ACTION_WITHDRAW_NATIVE_TOKEN Encoded
        [4]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000001",
          "bytes32"
        ), // Length of bytes[] = 1
        [5]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000020",
          "bytes32"
        ), // Offset of the first element of the bytes[] from beginning of bytes[] 32=32*1
        [6]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000060",
          "bytes32"
        ), // Length of the first element of the bytes[] 96=32*3
        [7]: staticEqual(compound_v3.cUSDCv3, "address"),
        [8]: staticEqual(AVATAR),
      },
      send: true,
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    // Compound V3 - Claiming of rewards
    //---------------------------------------------------------------------------------------------------------------------------------
    allow.mainnet.compound_v3.CometRewards["claim"](
      compound_v3.cUSDCv3,
      AVATAR
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aave V2
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aave V2 - stETH
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([stETH], [aave_v2.LENDING_POOL]),

    // Deposit
    allow.mainnet.aave_v2.lending_pool["deposit"](stETH, undefined, AVATAR),

    // Withdraw
    allow.mainnet.aave_v2.lending_pool["withdraw"](stETH, undefined, AVATAR),

    // Set/Unset Asset as Collateral
    allow.mainnet.aave_v2.lending_pool["setUserUseReserveAsCollateral"](stETH),

    // Borrow (Should we add this functionality for stETH?)
    allow.mainnet.aave_v2.lending_pool["borrow"](
      stETH,
      undefined,
      undefined,
      undefined,
      AVATAR
    ),

    // Repay (Should we add this functionality for stETH?)
    allow.mainnet.aave_v2.lending_pool["repay"](
      stETH,
      undefined,
      undefined,
      AVATAR
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aave V2 - WBTC
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([WBTC], [aave_v2.LENDING_POOL]),

    // Deposit (Should we add this functionality for WBTC?)
    allow.mainnet.aave_v2.lending_pool["deposit"](WBTC, undefined, AVATAR),

    // Withdraw (Should we add this functionality for WBTC?)
    allow.mainnet.aave_v2.lending_pool["withdraw"](WBTC, undefined, AVATAR),

    // Set/Unset Asset as Collateral (Should we add this functionality for WBTC?)
    allow.mainnet.aave_v2.lending_pool["setUserUseReserveAsCollateral"](WBTC),

    // Borrow
    allow.mainnet.aave_v2.lending_pool["borrow"](
      WBTC,
      undefined,
      undefined,
      undefined,
      AVATAR
    ),

    // Repay
    allow.mainnet.aave_v2.lending_pool["repay"](
      WBTC,
      undefined,
      undefined,
      AVATAR
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Staking of AAVE in Safety Module
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([AAVE], [aave_v2.stkAAVE]),

    // Stake
    allow.mainnet.aave_v2.stkAave["stake"](AVATAR),

    // Initiates 10 days cooldown period, once this is over the 2 days unstaking window opens:
    allow.mainnet.aave_v2.stkAave["cooldown"](),

    // Unstakes, can only be called during the 2 days unstaking window after the 10 days cooldown period
    allow.mainnet.aave_v2.stkAave["redeem"](AVATAR),

    // Claim Rewards
    allow.mainnet.aave_v2.stkAave["claimRewards"](AVATAR),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aave V3
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aave V3 - stETH
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([stETH], [aave_v3.POOL_V3]),

    // Deposit
    allow.mainnet.aave_v3.pool_v3["supply"](stETH, undefined, AVATAR),

    // Withdraw
    allow.mainnet.aave_v3.pool_v3["withdraw"](stETH, undefined, AVATAR),

    // Set/Unset Asset as Collateral
    allow.mainnet.aave_v3.pool_v3["setUserUseReserveAsCollateral"](stETH),

    // Borrow (Should we add this functionality for stETH?)
    allow.mainnet.aave_v3.pool_v3["borrow"](
      stETH,
      undefined,
      undefined,
      undefined,
      AVATAR
    ),

    // Repay (Should we add this functionality for stETH?)
    allow.mainnet.aave_v3.pool_v3["repay"](stETH, undefined, undefined, AVATAR),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aave V3 - WBTC
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([WBTC], [aave_v3.POOL_V3]),

    // Deposit (Should we add this functionality for WBTC?)
    allow.mainnet.aave_v3.pool_v3["supply"](WBTC, undefined, AVATAR),

    // Withdraw (Should we add this functionality for WBTC?)
    allow.mainnet.aave_v3.pool_v3["withdraw"](WBTC, undefined, AVATAR),

    // Set/Unset Asset as Collateral (Should we add this functionality for WBTC?)
    allow.mainnet.aave_v3.pool_v3["setUserUseReserveAsCollateral"](WBTC),

    // Borrow
    allow.mainnet.aave_v3.pool_v3["borrow"](
      WBTC,
      undefined,
      undefined,
      undefined,
      AVATAR
    ),

    // Repay
    allow.mainnet.aave_v3.pool_v3["repay"](WBTC, undefined, undefined, AVATAR),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Stakewise
    //---------------------------------------------------------------------------------------------------------------------------------

    // When staking ETH one receives sETH2
    allow.mainnet.stakewise.eth2_staking["stake"]({
      send: true,
    }),

    // By having staked ETH one receives rETH2 as rewards that are claimed by calling the claim function
    allow.mainnet.stakewise.merkle_distributor["claim"](undefined, AVATAR, [
      rETH2,
      SWISE,
    ]),

    // The exactInputSingle is needed for the reinvest option, which swaps rETH2 for sETH2 in the Uniswap V3 pool.
    // But as of now it is not considered within the strategy scope

    //---------------------------------------------------------------------------------------------------------------------------------
    // Stakewise - UniswapV3 ETH + sETH2, 0.3%
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([sETH2, WETH], [uniswapv3.POSITIONS_NFT]),

    // Add liquidity using WETH
    {
      targetAddress: uniswapv3.POSITIONS_NFT,
      signature:
        "mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))",
      params: {
        [0]: staticEqual(WETH, "address"),
        [1]: staticEqual(sETH2, "address"),
        [2]: staticEqual(3000, "uint24"), //3000 represents the 0.3% fee
        [9]: staticEqual(AVATAR),
      },
    },

    // Increasing liquidity using WETH: NFT ID 415282 was created in transaction with hash 0xc5641e5f6fb3d4497ba6a8c3a50fc0f738a2aae3247cbead859d054a3c0ddc98
    {
      targetAddress: uniswapv3.POSITIONS_NFT,
      signature:
        "increaseLiquidity((uint256,uint256,uint256,uint256,uint256,uint256))",
      params: {
        [0]: staticEqual(415282, "uint256"),
      },
    },

    // Removing liquidity: to remove liquidity one has to call the decreaseLiquidity and collect functions
    // decreaseLiquidity burns the token amounts in the pool, and increases token0Owed and token1Owed which represent the uncollected fees
    {
      targetAddress: uniswapv3.POSITIONS_NFT,
      signature: "decreaseLiquidity((uint256,uint128,uint256,uint256,uint256))",
    },

    // collect collects token0Owed and token1Owed. The address argument could also be the zero address, which is used to collect ETH
    // instead of WETH. In this case, the tokens (one of them WETH) are first sent to the NFT Positions contract, and have to then be
    // claimed by calling unwrapWETH9 and sweepToken.
    {
      targetAddress: uniswapv3.POSITIONS_NFT,
      signature: "collect((uint256,address,uint128,uint128))",
      params: {
        // If the collected token is ETH then the address must be the ZERO_ADDRESS
        // [1]: staticOneOf([AVATAR, ZERO_ADDRESS], "address"),
        [1]: staticEqual(AVATAR),
      },
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    // UniswapV3
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // UniswapV3 GNO + ETH, 0.3%
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([GNO, WETH], [uniswapv3.POSITIONS_NFT]),

    // Add liquidity using WETH
    {
      targetAddress: uniswapv3.POSITIONS_NFT,
      signature:
        "mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))",
      params: {
        [0]: staticEqual(GNO, "address"),
        [1]: staticEqual(WETH, "address"),
        [2]: staticEqual(3000, "uint24"), //3000 represents the 0.3% fee
        [9]: staticEqual(AVATAR),
      },
    },

    // Increasing liquidity using WETH: NFT ID 358770 was created in transaction with hash 0xdaeb7ce2d9373d534de8af1cc0fe2e76b00532550725188934cd14befb218840
    {
      targetAddress: uniswapv3.POSITIONS_NFT,
      signature:
        "increaseLiquidity((uint256,uint256,uint256,uint256,uint256,uint256))",
      params: {
        [0]: staticEqual(358770, "uint256"),
      },
    },

    // The decreaseLiquidity and collect functions have already been whitelisted.

    //---------------------------------------------------------------------------------------------------------------------------------
    // Spark
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Spark - GNO
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([GNO], [spark.LENDING_POOL_V3]),

    // Deposit
    allow.mainnet.spark.sparkLendingPoolV3["supply"](GNO, undefined, AVATAR),

    // Withdraw
    allow.mainnet.spark.sparkLendingPoolV3["withdraw"](GNO, undefined, AVATAR),

    // Set/Unset Asset as Collateral
    allow.mainnet.spark.sparkLendingPoolV3["setUserUseReserveAsCollateral"](
      GNO
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Spark - DAI
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([DAI], [spark.LENDING_POOL_V3]),

    // Borrow
    allow.mainnet.spark.sparkLendingPoolV3["borrow"](
      DAI,
      undefined,
      undefined,
      undefined,
      AVATAR
    ),

    // Repay
    allow.mainnet.spark.sparkLendingPoolV3["repay"](
      DAI,
      undefined,
      undefined,
      AVATAR
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Spark - sDAI
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([DAI], [spark.sDAI]),

    // Deposit
    allow.mainnet.spark.sDAI["deposit"](undefined, AVATAR),

    // Withdraw
    allow.mainnet.spark.sDAI["redeem"](undefined, AVATAR, AVATAR),

    //---------------------------------------------------------------------------------------------------------------------------------
    // OMNI BRIDGE
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([WETH, COW], [OMNI_BRIDGE]),
    // {
    //   targetAddress: OMNI_BRIDGE,
    //   signature: "relayTokens(address,address,uint256)",
    //   params: {
    //     [1]: staticEqual(BRIDGE_RECIPIENT_GNOSIS_CHAIN),
    //   },
    // },
    allow.mainnet.omnibridge["relayTokens(address,address,uint256)"](
      undefined,
      BRIDGE_RECIPIENT_GNOSIS_CHAIN
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // BRIBES
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // StakeDAO
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([GNO], [stakedao.BRIBE]),

    // Bribes for 3pool in Gnosis Chain
    allow.mainnet.stakedao.bribe["createBribe"](
      curve_gc.x3CRV_GAUGE,
      AVATAR,
      GNO,
      2,
      undefined,
      undefined,
      [convex.VOTER_PROXY],
      true
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Votium
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([GNO], [votium.BRIBE]),

    // Bribes for 3pool in Gnosis Chain
    allow.mainnet.votium.bribe["depositBribe"](
      GNO,
      undefined,
      undefined,
      undefined
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Ankr
    //---------------------------------------------------------------------------------------------------------------------------------
    // Flash unstake uses a pool to swap your Liquid Staking tokens for your original assets, which means instant release of your funds
    // While it offers instant release of your funds, it poses a few limitations:
    // 1- You have to pay a technical service fee for a flash unstake — 0.5% of the unstaked amount.
    // 2- Your unstake is limited by the current capacity of the flash-unstake pool. If you exceed it,
    // the interface switches to the standard unstake with its regular release time.
    ...allowErc20Approve([ankr.ankrETH], [ankr.SWAP_POOL]),
    allow.mainnet.ankr.swap_pool["swapEth"](undefined, AVATAR),

    // Standard unstake, it may be split into several parts, but all the parts that constitute the unstaked amount will be released
    // to your account within the 6 days days period.
    // Stake
    allow.mainnet.ankr.ETH2_Staking["stakeAndClaimAethC"]({ send: true }),

    // Unstake
    // The unstake burns the ankrETH.
    // Then once per day the distributeRewards() function is called and transfers different amounts of ETH
    // to the users on the Ethereum unstake queue, until it completes the total unstaked amount of each (within the 6 day window).
    allow.mainnet.ankr.ETH2_Staking["unstakeAETH"](),
  ],
  placeholders: { AVATAR, BRIDGE_RECIPIENT_GNOSIS_CHAIN },
} satisfies RolePreset

export default preset
