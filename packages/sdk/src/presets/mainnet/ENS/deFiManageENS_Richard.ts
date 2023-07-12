import {
  ZERO_ADDRESS,
  E_ADDRESS,
  AURA,
  BAL,
  COMP,
  CRV,
  CVX,
  DAI,
  LDO,
  rETH,
  rETH2,
  sETH2,
  stETH,
  SWISE,
  USDC,
  USDT,
  WETH,
  wstETH,
  aave_v3,
  aura,
  balancer,
  compound_v2,
  compound_v3,
  curve,
  lido,
  maker,
  rocket_pool,
  sushiswap,
  uniswapv3,
} from "../addresses"
import { staticEqual, staticOneOf } from "../../helpers/utils"
import { allowErc20Approve } from "../../helpers/erc20"
import { AVATAR } from "../../placeholders"
import { RolePreset } from "../../types"
import { allow } from "../../allow"

const preset = {
  network: 1,
  allow: [
    //---------------------------------------------------------------------------------------------------------------------------------
    // AURA
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // AURA wstETH/WETH
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve([wstETH, WETH], [AURA_REWARD_POOL_DEPOSIT_WRAPPER]),
    ...allowErc20Approve([balancer.B_stETH_STABLE], [aura.BOOSTER]),

    //deposiSingle: the (address[],uint256[],bytes,bool) tuple argument represents the request data for joining the pool
    /* request=(
              address[] assets,
              uint256[] maxAmountsIn,
              bytes userData,
              bool fromInternalBalance
        )   
        */
    //userData specifies the JoinKind, see https://dev.balancer.fi/resources/joins-and-exits/pool-joins

    allow.mainnet.aura.booster["deposit"](
      115), // Aura poolId

    // {
    //   targetAddress: aura.REWARD_POOL_DEPOSIT_WRAPPER,
    //   signature:
    //     "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
    //   params: {
    //     [0]: staticEqual(aura.auraB_stETH_STABLE_REWARDER, "address"),
    //     [1]: staticOneOf([wstETH, WETH], "address"),
    //     [3]: staticEqual(
    //       "0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080",
    //       "bytes32"
    //     ), // Balancer PoolId
    //     [4]: staticEqual(
    //       "0x00000000000000000000000000000000000000000000000000000000000000a0",
    //       "bytes32"
    //     ), // Offset of tuple from beginning 160=32*5
    //     [5]: staticEqual(
    //       "0x0000000000000000000000000000000000000000000000000000000000000080",
    //       "bytes32"
    //     ), // Offset of address[] from beginning of tuple 128=32*4
    //     [6]: staticEqual(
    //       "0x00000000000000000000000000000000000000000000000000000000000000e0",
    //       "bytes32"
    //     ), // Offset of uint256[] from beginning of tuple 2224=32*7
    //     [7]: staticEqual(
    //       "0x0000000000000000000000000000000000000000000000000000000000000140",
    //       "bytes32"
    //     ), // Offset of bytes from beginning of tuple 320=32*10
    //     [9]: staticEqual(
    //       "0x0000000000000000000000000000000000000000000000000000000000000002",
    //       "bytes32"
    //     ), // Length of address[] = 2
    //     [10]: staticEqual(wstETH, "address"),
    //     [11]: staticEqual(WETH, "address"),
    //     [12]: staticEqual(
    //       "0x0000000000000000000000000000000000000000000000000000000000000002",
    //       "bytes32"
    //     ), // Length of unit256[] = 2
    //     [15]: staticEqual(
    //       "0x00000000000000000000000000000000000000000000000000000000000000c0",
    //       "bytes32"
    //     ), // Length of bytes 192=32*6
    //   },
    // },

    // {
    //   targetAddress: auraB_stETH_STABLE_REWARDER,
    //   signature: "withdrawAndUnwrap(uint256,bool)",
    // },
    allow.mainnet.aura.auraB_stETH_stable_rewarder["withdrawAndUnwrap"](),

    // {
    //   targetAddress: auraB_stETH_STABLE_REWARDER,
    //   signature: "getReward()",
    // },
    // allow.mainnet.aura.auraB_stETH_stable_rewarder["getReward()"](),


    //---------------------------------------------------------------------------------------------------------------------------------
    // BALANCER
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer - wstETH/WETH pool
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([WETH], [balancer.VAULT]),
    // ...allowErc20Approve([balancer.B_stETH_STABLE], [balancer.B_stETH_STABLE_GAUGE]),

    //exitPool: the (address[],uint256[],bytes,bool) tuple argument represents the request data for joining the pool
    /* request=(
              address[] assets,
              uint256[] maxAmountsIn,
              bytes userData,
              bool fromInternalBalance
        )   
        */
    //userData specifies the JoinKind, see https://dev.balancer.fi/resources/joins-and-exits/pool-joins

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
        // [3]: staticEqual(
        //   "0x0000000000000000000000000000000000000000000000000000000000000080",
        //   "bytes32"
        // ), // Offset of tuple from beginning 128=32*4
        // [4]: staticEqual(
        //   "0x0000000000000000000000000000000000000000000000000000000000000080",
        //   "bytes32"
        // ), // Offset of address[] from beginning of tuple 128=32*4
        // [5]: staticEqual(
        //   "0x00000000000000000000000000000000000000000000000000000000000000e0",
        //   "bytes32"
        // ), // Offset of uint256[] from beginning of tuple 224=32*7
        // [6]: staticEqual(
        //   "0x0000000000000000000000000000000000000000000000000000000000000140",
        //   "bytes32"
        // ), // Offset of bytes from beginning of tuple 320=32*10
        // [8]: staticEqual(
        //   "0x0000000000000000000000000000000000000000000000000000000000000002",
        //   "bytes32"
        // ), // Length of address[] = 2
        // [9]: staticEqual(wstETH, "address"),
        // // [10]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
        // [10]: staticEqual(WETH, "address"),
        // [11]: staticEqual(
        //   "0x0000000000000000000000000000000000000000000000000000000000000002",
        //   "bytes32"
        // ), // Length of unit256[] = 2
        // [14]: staticOneOf(
        //   [
        //     "0x00000000000000000000000000000000000000000000000000000000000000a0",
        //     "0x00000000000000000000000000000000000000000000000000000000000000c0",
        //     "0x0000000000000000000000000000000000000000000000000000000000000060",
        //     "0x0000000000000000000000000000000000000000000000000000000000000040",
        //   ],
        //   "bytes32"
        // ), // Length of bytes
        // [15]: staticOneOf(
        //   [
        //     "0x0000000000000000000000000000000000000000000000000000000000000000",
        //     "0x0000000000000000000000000000000000000000000000000000000000000001",
        //     "0x0000000000000000000000000000000000000000000000000000000000000002",
        //     "0x0000000000000000000000000000000000000000000000000000000000000003",
        //   ],
        //   "bytes32"
        // ), // Join Kind
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
        // [3]: staticEqual(
        //   "0x0000000000000000000000000000000000000000000000000000000000000080",
        //   "bytes32"
        // ), // Offset of tuple from beginning 128=32*4
        // [4]: staticEqual(
        //   "0x0000000000000000000000000000000000000000000000000000000000000080",
        //   "bytes32"
        // ), // Offset of address[] from beginning of tuple 128=32*4
        // [5]: staticEqual(
        //   "0x00000000000000000000000000000000000000000000000000000000000000e0",
        //   "bytes32"
        // ), // Offset of uint256[] from beginning of tuple 224=32*7
        // [6]: staticEqual(
        //   "0x0000000000000000000000000000000000000000000000000000000000000140",
        //   "bytes32"
        // ), // Offset of bytes from beginning of tuple 320=32*10
        // [8]: staticEqual(
        //   "0x0000000000000000000000000000000000000000000000000000000000000002",
        //   "bytes32"
        // ), // Length of address[] = 2
        // [9]: staticEqual(wstETH, "address"),
        // [10]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
        // [11]: staticEqual(
        //   "0x0000000000000000000000000000000000000000000000000000000000000002",
        //   "bytes32"
        // ), // Length of unit256[] = 2
        // [14]: staticOneOf(
        //   [
        //     "0x0000000000000000000000000000000000000000000000000000000000000060",
        //     "0x0000000000000000000000000000000000000000000000000000000000000040",
        //     "0x00000000000000000000000000000000000000000000000000000000000000c0",
        //   ],
        //   "bytes32"
        // ), // Length of bytes
        // [15]: staticOneOf(
        //   [
        //     "0x0000000000000000000000000000000000000000000000000000000000000000",
        //     "0x0000000000000000000000000000000000000000000000000000000000000001",
        //     "0x0000000000000000000000000000000000000000000000000000000000000002",
        //   ],
        //   "bytes32"
        // ), // Join Kind
      },
    },
  ],
  placeholders: { AVATAR },
} satisfies RolePreset

export default preset
