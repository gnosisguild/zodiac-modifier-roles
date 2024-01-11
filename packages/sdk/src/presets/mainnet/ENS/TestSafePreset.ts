import { allow } from "../../allow"
import { allowErc20Approve } from "../../helpers/erc20"
import { staticEqual, staticOneOf } from "../../helpers/utils"
import { AVATAR } from "../../placeholders"
import { RolePreset } from "../../types"
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
  cowswap,
} from "../addresses"

const preset = {
  network: 1,
  allow: [
    //All approvals have been commented since we'll be handling over the Avatar safe with all of them having been already executed

    //---------------------------------------------------------------------------------------------------------------------------------
    // LIDO
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve([stETH], [wstETH]),
    // ...allowErc20Approve([stETH, wstETH], [lido.unstETH]),

    // {
    //   targetAddress: stETH,
    //   signature: "submit(address)",
    //   params: {
    //     [0]: staticEqual(ZERO_ADDRESS, "address"),
    //   },
    //   send: true,
    // },
    allow.mainnet.lido.stETH["submit"](ZERO_ADDRESS, {
      send: true,
    }),

    // { targetAddress: wstETH, signature: "wrap(uint256)" },
    allow.mainnet.lido.wstETH["wrap"](),
    // { targetAddress: wstETH, signature: "unwrap(uint256)" }
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
    // Compound V2
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Compound V2 - USDC
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve([USDC], [cUSDC]),

    // Deposit
    // {
    //   targetAddress: cUSDC,
    //   signature: "mint(uint256)",
    // },
    allow.mainnet.compound_v2.cUSDC["mint"](),

    // Withdrawing: sender redeems uint256 cTokens, it is called when MAX is withdrawn
    // {
    //   targetAddress: cUSDC,
    //   signature: "redeem(uint256)",
    // },
    allow.mainnet.compound_v2.cUSDC["redeem"](),

    // Withdrawing: sender redeems cTokens in exchange for a specified amount of underlying asset (uint256), it is called when MAX isn't withdrawn
    // {
    //   targetAddress: cUSDC,
    //   signature: "redeemUnderlying(uint256)",
    // },
    allow.mainnet.compound_v2.cUSDC["redeemUnderlying"](),

    // We are not allowing to include it as collateral

    //---------------------------------------------------------------------------------------------------------------------------------
    // Compound V2 - DAI
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve([DAI], [cDAI]),

    // Deposit
    // {
    //   targetAddress: cDAI,
    //   signature: "mint(uint256)",
    // },
    allow.mainnet.compound_v2.cDAI["mint"](),

    // Withdrawing: sender redeems uint256 cTokens, it is called when MAX is withdrawn
    // {
    //   targetAddress: cDAI,
    //   signature: "redeem(uint256)",
    // },
    allow.mainnet.compound_v2.cDAI["redeem"](),

    // Withdrawing: sender redeems cTokens in exchange for a specified amount of underlying asset (uint256), it is called when MAX isn't withdrawn
    // {
    //   targetAddress: cDAI,
    //   signature: "redeemUnderlying(uint256)",
    // },
    allow.mainnet.compound_v2.cDAI["redeemUnderlying"](),

    // We are not allowing to include it as collateral

    //---------------------------------------------------------------------------------------------------------------------------------
    // Compound V2 - Claiming of rewards
    //---------------------------------------------------------------------------------------------------------------------------------

    // {
    //   targetAddress: COMPTROLLER,
    //   signature: "claimComp(address,address[])",
    //   params: {
    //     [0]: staticEqual(AVATAR),
    //     [1]: subsetOf(
    //       [cAAVE, cDAI, cUSDC].map((address) => address.toLowerCase()).sort(), // compound app will always pass tokens in ascending order
    //       "address[]",
    //       {
    //         restrictOrder: true,
    //       }
    //     ),
    //   },
    // },
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
    // ...allowErc20Approve([USDC], [compound_v3.cUSDCv3]),

    // Supply/Repay
    allow.mainnet.compound_v3.cUSDCv3["supply"](USDC),

    // Withdraw/Borrow
    allow.mainnet.compound_v3.cUSDCv3["withdraw"](USDC),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Compound V3 - Claiming of rewards
    //---------------------------------------------------------------------------------------------------------------------------------
    allow.mainnet.compound_v3.CometRewards["claim"](
      compound_v3.cUSDCv3,
      AVATAR
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aave V3
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aave V3 - DAI
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve([DAI], [aave_v3.POOL_V3]),

    // Supply
    allow.mainnet.aave_v3.pool_v3["supply"](DAI, undefined, AVATAR),

    // Withdraw
    allow.mainnet.aave_v3.pool_v3["withdraw"](DAI, undefined, AVATAR),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aave V3 - USDC
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve([USDC], [aave_v3.POOL_V3]),

    // Supply
    allow.mainnet.aave_v3.pool_v3["supply"](USDC, undefined, AVATAR),

    // Withdraw
    allow.mainnet.aave_v3.pool_v3["withdraw"](USDC, undefined, AVATAR),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Stakewise
    //---------------------------------------------------------------------------------------------------------------------------------

    // When staking ETH one receives sETH2
    // {
    //   targetAddress: STAKEWISE_ETH2_STAKING,
    //   signature: "stake()",
    //   send: true,
    // },
    allow.mainnet.stakewise.eth2_staking["stake"]({
      send: true,
    }),

    // By having staked ETH one receives rETH2 as rewards that are claimed by calling the claim function
    // {
    //   targetAddress: STAKEWISE_MERKLE_DIS,
    //   signature: "claim(uint256,address,address[],uint256[],bytes32[])",
    //   params: {
    //     [1]: staticEqual(AVATAR),
    //     [2]: dynamic32Equal([rETH2, SWISE], "address[]"),
    //   },
    // },
    allow.mainnet.stakewise.merkle_distributor["claim"](undefined, AVATAR, [
      rETH2,
      SWISE,
    ]),

    // The exactInputSingle is needed for the reinvest option, which swaps rETH2 for sETH2 in the Uniswap V3 pool.
    // But as of now it is not considered within the strategy scope

    //---------------------------------------------------------------------------------------------------------------------------------
    // Stakewise - UniswapV3 ETH + sETH2, 0.3%
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve([sETH2, WETH], [uniswapv3.POSITIONS_NFT]),

    // Add liquidity using ETH
    // {
    //     targetAddress: uniswapv3.POSITIONS_NFT,
    //     signature:
    //         "mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))",
    //     params: {
    //         [0]: staticEqual(WETH, "address"),
    //         [1]: staticEqual(sETH2, "address"),
    //         [2]: staticEqual(3000, "uint24"),
    //         [9]: staticEqual(AVATAR),
    //     },
    //     send: true
    // },

    // allow.mainnet.uniswapv3.positions_nft["refundETH"](),

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

    // Increasing liquidity using WETH: NFT ID 424810 was created in transaction with hash 0x2995ba040fe1b07978428ca118d9701b5114ec7e2d3ac00f2b4df0f5747dc42e
    // {
    //     targetAddress: uniswapv3.POSITIONS_NFT,
    //     signature:
    //         "increaseLiquidity((uint256,uint256,uint256,uint256,uint256,uint256))",
    //     params: {
    //         [0]: staticEqual(424810, "uint256"),
    //     },
    //     send: true
    // },

    // The refundETH() function is called after the increaseLiquidity() but it has already been whitelisted

    // Increasing liquidity using WETH: NFT ID 424810 was created in transaction with hash 0x2995ba040fe1b07978428ca118d9701b5114ec7e2d3ac00f2b4df0f5747dc42e
    {
      targetAddress: uniswapv3.POSITIONS_NFT,
      signature:
        "increaseLiquidity((uint256,uint256,uint256,uint256,uint256,uint256))",
      params: {
        [0]: staticEqual(424810, "uint256"),
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

    // If ETH is collected instead of WETH, one has to call the unwrapWETH9 and sweepToken functions
    // allow.mainnet.uniswapv3.positions_nft["unwrapWETH9"](
    //     undefined,
    //     AVATAR
    // ),

    // allow.mainnet.uniswapv3.positions_nft["sweepToken"](
    //     sETH2,
    //     undefined,
    //     AVATAR
    // ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // CURVE
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Curve - ETH/stETH
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve([stETH], [curve.stETH_ETH_POOL]),
    // ...allowErc20Approve([curve.steCRV], [curve.stETH_ETH_GAUGE]),
    // ...allowErc20Approve([stETH], [curve.STAKE_DEPOSIT_ZAP]),

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

    // Stake
    allow.mainnet.curve.steth_eth_gauge["deposit(uint256)"](),

    // Unstake
    allow.mainnet.curve.steth_eth_gauge["withdraw"](),

    // Claim LDO Rewards
    allow.mainnet.curve.steth_eth_gauge["claim_rewards()"](),

    //Claim CRV Rewards
    allow.mainnet.curve.crv_minter["mint"](curve.stETH_ETH_GAUGE),

    // Deposit and Stake using a special ZAP
    allow.mainnet.curve.steth_eth_gauge["set_approve_deposit"](
      curve.STAKE_DEPOSIT_ZAP
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Curve - cDAI/cUSDC
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve([DAI, USDC, compound_v2.cDAI, compound_v2.cUSDC], [curve.cDAIcUSDC_POOL]),
    // ...allowErc20Approve([curve.crvcDAIcUSDC], [curve.cDAIcUSDC_GAUGE]),
    // ...allowErc20Approve([DAI, USDC], [curve.cDAIcUSDC_ZAP]),
    // ...allowErc20Approve([compound_v2.cDAI, compound_v2.cUSDC, DAI, USDC], [curve.STAKE_DEPOSIT_ZAP]),

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
    // AURA
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // AURA wstETH/WETH
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve([wstETH, WETH], [AURA_REWARD_POOL_DEPOSIT_WRAPPER]),
    // ...allowErc20Approve([balancer.B_stETH_STABLE], [aura.BOOSTER]),

    //deposiSingle: the (address[],uint256[],bytes,bool) tuple argument represents the request data for joining the pool
    /* request=(
                address[] assets,
                uint256[] maxAmountsIn,
                bytes userData,
                bool fromInternalBalance
          )   
          */
    //userData specifies the JoinKind, see https://dev.balancer.fi/resources/joins-and-exits/pool-joins

    allow.mainnet.aura.booster["deposit"](115), // Aura poolId

    {
      targetAddress: aura.REWARD_POOL_DEPOSIT_WRAPPER,
      signature:
        "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0x59D66C58E83A26d6a0E35114323f65c3945c89c1",
          "address"
        ),
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

    // {
    //   targetAddress: auraB_stETH_STABLE_REWARDER,
    //   signature: "withdrawAndUnwrap(uint256,bool)",
    // },
    {
      ...allow.mainnet.aura.auraB_stETH_stable_rewarder["withdrawAndUnwrap"](),
      targetAddress: "0x59D66C58E83A26d6a0E35114323f65c3945c89c1",
    },

    // {
    //   targetAddress: auraB_stETH_STABLE_REWARDER,
    //   signature: "getReward()",
    // },
    {
      ...allow.mainnet.aura.auraB_stETH_stable_rewarder["getReward()"](),
      targetAddress: "0x59D66C58E83A26d6a0E35114323f65c3945c89c1",
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura bb-aV3-USDT/bb-aV3-USDC/bb-aV3-DAI (Boosted Aave V3 Pool)
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve([balancer.bb_aV3_USD], [aura.BOOSTER]),

    allow.mainnet.aura.booster["deposit"](81), // Aura poolId

    allow.mainnet.aura.aurabb_aV3_USD_rewarder["withdrawAndUnwrap"](),

    allow.mainnet.aura.aurabb_aV3_USD_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura rETH/WETH
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve([balancer.B_rETH_STABLE], [aura.BOOSTER]),
    // ...allowErc20Approve([rETH, WETH], [aura.REWARD_POOL_DEPOSIT_WRAPPER]),

    // {
    //   targetAddress: aura.BOOSTER,
    //   signature: "deposit(uint256,uint256,bool)",
    //   params: {
    //     [0]: staticEqual(109, "uint256"), // Aura poolId
    //   },
    // },
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

    // {
    //   targetAddress: auraB_rETH_STABLE_REWARDER,
    //   signature: "withdrawAndUnwrap(uint256,bool)",
    // },
    allow.mainnet.aura.auraB_rETH_stable_rewarder["withdrawAndUnwrap"](),

    // {
    //   targetAddress: auraB_rETH_STABLE_REWARDER,
    //   signature: "getReward()",
    // },
    allow.mainnet.aura.auraB_rETH_stable_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // BALANCER
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer - wstETH/WETH pool
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve([wstETH, WETH], [balancer.VAULT]),
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

    // Stake
    {
      ...allow.mainnet.balancer.B_stETH_stable_gauge["deposit(uint256)"](),
      targetAddress: "0xcD4722B7c24C29e0413BDCd9e51404B4539D14aE",
    },

    // Unstake
    {
      ...allow.mainnet.balancer.B_stETH_stable_gauge["withdraw(uint256)"](),
      targetAddress: "0xcD4722B7c24C29e0413BDCd9e51404B4539D14aE",
    },

    // Claim Rewards
    {
      ...allow.mainnet.balancer.B_stETH_stable_gauge["claim_rewards()"](),
      targetAddress: "0xcD4722B7c24C29e0413BDCd9e51404B4539D14aE",
    },

    // Claim BAL Rewards
    allow.mainnet.balancer.BAL_minter["mint"](
      "0xcD4722B7c24C29e0413BDCd9e51404B4539D14aE"
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer - Boosted Aave V3 USD
    //---------------------------------------------------------------------------------------------------------------------------------

    // Relayer Approval (this is done only once per wallet)
    // This approval will be executed by the Avatar Safe
    // allow.mainnet.balancer.relayer["setRelayerApproval"](balancer.RELAYER),

    /*
      ...allowErc20Approve([balancer.bb_aV3_USD], [balancer.bb_aV3_USD_GAUGE]),
      ...allowErc20Approve([DAI, balancer.bb_aV3_DAI, USDT, balancer.bb_aV3_USDT, USDC, balancer.bb_aV3_USDC], [balancer.VAULT]),
      */

    // Using the BALANCER_RELAYER and it's BALANCER_RELAYER_LIBRARY
    // Adding and removing tokens in different amounts
    // Swap DAI for bb_a_DAI (for both, join and exit pool)
    // Swap USDT for bb_a_USDT (for both, join and exit pool)
    // Swap USDC for bb_a_USDC (for both, join and exit pool)
    {
      targetAddress: balancer.VAULT,
      signature:
        "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
      params: {
        [0]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of the tuple from beginning 224=32*7
        [1]: staticEqual(AVATAR), // sender
        [3]: staticEqual(AVATAR), // recipient
        [7]: staticOneOf(
          [
            "0x6667c6fa9f2b3fc1cc8d85320b62703d938e43850000000000000000000004fb", // bb_a_DAI V3
            "0xa1697f9af0875b63ddc472d6eebada8c1fab85680000000000000000000004f9", // bb_a_USDT V3
            "0xcbfa4532d8b2ade2c261d3dd5ef2a2284f7926920000000000000000000004fa", // bb_a_USDC V3
          ],
          "bytes32"
        ), // Balancer PoolId
        // [8]: staticEqual(
        //   "0x0000000000000000000000000000000000000000000000000000000000000000",
        //   "bytes32"
        // ), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
        [9]: staticOneOf(
          [
            DAI,
            balancer.bb_aV3_DAI,
            USDT,
            balancer.bb_aV3_USDT,
            USDC,
            balancer.bb_aV3_USDC,
          ],
          "address"
        ), // assetIn
        [10]: staticOneOf(
          [
            DAI,
            balancer.bb_aV3_DAI,
            USDT,
            balancer.bb_aV3_USDT,
            USDC,
            balancer.bb_aV3_USDC,
          ],
          "address"
        ), // assetOut
        [12]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 192=32*6
        [13]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "bytes32"
        ), // bytes (userData) = for all current Balancer pools this can be left empty
      },
    },

    // // IMPORTANT: FOR THE "Balancer Boosted Aave USD" the joinPool and exitPool MUST BE WHITELISTED WITH BOTH THE SENDER AND
    // // RECIPIENT WITH THE POSSIBILITY OF BEING EITHER THE AVATAR OR THE BALANCER_RELAYER. WHEN YOU ADD OR REMOVE LIQUIDITY
    // // FROM A POOL WITH bb_ag_USD (ie: Weighted Pool wstETH/bb-a-USD) THE BALANCER_RELAYER DOES A joinPool or exitPool
    // // WITH THE BALANCER_RELAYER AS BOTH THE SENDER AND RECIPIENT.

    // Add Liquidity
    {
      targetAddress: balancer.VAULT,
      signature:
        "joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0xfebb0bbf162e64fb9d0dfe186e517d84c395f016000000000000000000000502",
          "bytes32"
        ), // Balancer Boosted Aave V3 PoolId
        [1]: staticEqual(AVATAR), // sender
        [2]: staticEqual(AVATAR), // recipient
        // [3]: staticEqual(
        //   "0x0000000000000000000000000000000000000000000000000000000000000080",
        //   "bytes32"
        // ), // Offset of tuple from beginning 128=32*4
        // [4]: staticEqual(
        //   "0x0000000000000000000000000000000000000000000000000000000000000080",
        //   "bytes32"
        // ), // Offset of address[] from beginning of tuple 128=32*4
        // [5]: staticEqual(
        //   "0x0000000000000000000000000000000000000000000000000000000000000120",
        //   "bytes32"
        // ), // Offset of uint256[] from beginning of tuple 288=32*9
        // [6]: staticEqual(
        //   "0x00000000000000000000000000000000000000000000000000000000000001c0",
        //   "bytes32"
        // ), // Offset of address[] from beginning of tuple 448=32*14
        // [8]: staticEqual(
        //   "0x0000000000000000000000000000000000000000000000000000000000000004",
        //   "bytes32"
        // ), // Length of address[] = 4
        // [9]: staticEqual(balancer.bb_aV3_DAI, "address"),
        // [10]: staticEqual(balancer.bb_aV3_USDT, "address"),
        // [11]: staticEqual(balancer.bb_aV3_USDC, "address"),
        // [12]: staticEqual(balancer.bb_aV3_USD, "address"),
        // [13]: staticEqual(
        //   "0x0000000000000000000000000000000000000000000000000000000000000004",
        //   "bytes32"
        // ), // Length of unit256[] = 4
        // [17]: staticOneOf(
        //   [
        //     "0x00000000000000000000000000000000000000000000000000000000000000e0",
        //     "0x0000000000000000000000000000000000000000000000000000000000000100",
        //     "0x0000000000000000000000000000000000000000000000000000000000000060",
        //     "0x0000000000000000000000000000000000000000000000000000000000000040",
        //   ],
        //   "bytes32"
        // ), // Length of bytes
        // [18]: staticOneOf(
        //   [
        //     "0x0000000000000000000000000000000000000000000000000000000000000000",
        //     "0x0000000000000000000000000000000000000000000000000000000000000001",
        //     "0x0000000000000000000000000000000000000000000000000000000000000002",
        //     "0x0000000000000000000000000000000000000000000000000000000000000003",
        //   ],
        //   "bytes32"
        // ), // Join Kind
      },
    },

    // Remove Liquidity
    {
      targetAddress: balancer.VAULT,
      signature:
        "exitPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0xfebb0bbf162e64fb9d0dfe186e517d84c395f016000000000000000000000502",
          "bytes32"
        ), // Balancer Boosted Aave V3 PoolId
        [1]: staticEqual(AVATAR), // sender
        [2]: staticEqual(AVATAR), // recipient
        // [3]: staticEqual(
        //   "0x0000000000000000000000000000000000000000000000000000000000000080",
        //   "bytes32"
        // ), // Offset of tuple from beginning 128=32*4
        // [4]: staticEqual(
        //   "0x0000000000000000000000000000000000000000000000000000000000000080",
        //   "bytes32"
        // ), // Offset of address[] from beginning of tuple 128=32*4
        // [5]: staticEqual(
        //   "0x0000000000000000000000000000000000000000000000000000000000000120",
        //   "bytes32"
        // ), // Offset of uint256[] from beginning of tuple 288=32*9
        // [6]: staticEqual(
        //   "0x00000000000000000000000000000000000000000000000000000000000001c0",
        //   "bytes32"
        // ), // Offset of address[] from beginning of tuple 448=32*14
        // [8]: staticEqual(
        //   "0x0000000000000000000000000000000000000000000000000000000000000004",
        //   "bytes32"
        // ), // Length of address[] = 4
        // [9]: staticEqual(balancer.bb_aV3_DAI, "address"),
        // [10]: staticEqual(balancer.bb_aV3_USDT, "address"),
        // [11]: staticEqual(balancer.bb_aV3_USDC, "address"),
        // [12]: staticEqual(balancer.bb_aV3_USD, "address"),
        // [13]: staticEqual(
        //   "0x0000000000000000000000000000000000000000000000000000000000000004",
        //   "bytes32"
        // ), // Length of unit256[] = 4
        // [17]: staticOneOf(
        //   [
        //     "0x0000000000000000000000000000000000000000000000000000000000000060",
        //     "0x0000000000000000000000000000000000000000000000000000000000000040",
        //     "0x00000000000000000000000000000000000000000000000000000000000000c0",
        //   ],
        //   "bytes32"
        // ), // Length of bytes
        // [18]: staticOneOf(
        //   [
        //     "0x0000000000000000000000000000000000000000000000000000000000000000",
        //     "0x0000000000000000000000000000000000000000000000000000000000000001",
        //     "0x0000000000000000000000000000000000000000000000000000000000000002",
        //   ],
        //   "bytes32"
        // ), // Join Kind
      },
    },

    // Stake
    allow.mainnet.balancer.bb_aV3_USD_gauge["deposit(uint256)"](),

    // Unstake
    allow.mainnet.balancer.bb_aV3_USD_gauge["withdraw(uint256)"](),

    // Claim Rewards
    allow.mainnet.balancer.bb_aV3_USD_gauge["claim_rewards()"](),

    // Claim BAL Rewards
    allow.mainnet.balancer.BAL_minter["mint"](balancer.bb_aV3_USD_GAUGE),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer - rETH/WETH pool
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve([rETH, WETH], [balancer.VAULT]),
    // ...allowErc20Approve([balancer.B_rETH_STABLE], [balancer.B_rETH_STABLE_GAUGE]),

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
        // [3]: staticEqual(
        //   "0x0000000000000000000000000000000000000000000000000000000000000080",
        //   "bytes32"), // Offset of tuple from beginning 128=32*4
        // [4]: staticEqual(
        //   "0x0000000000000000000000000000000000000000000000000000000000000080",
        //   "bytes32"), // Offset of address[] from beginning of tuple 128=32*4
        // [5]: staticEqual(
        //   "0x00000000000000000000000000000000000000000000000000000000000000e0",
        //   "bytes32"), // Offset of uint256[] from beginning of tuple 224=32*7
        // [6]: staticEqual(
        //   "0x0000000000000000000000000000000000000000000000000000000000000140",
        //   "bytes32"), // Offset of bytes from beginning of tuple 320=32*10
        // [8]: staticEqual(
        //   "0x0000000000000000000000000000000000000000000000000000000000000002",
        //   "bytes32"
        // ), // Length of address[] = 2
        // [9]: staticEqual(rETH, "address"),
        // // [10]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
        // [10]: staticEqual(WETH, "address"),
        // [11]: staticEqual(
        //   "0x0000000000000000000000000000000000000000000000000000000000000002",
        //   "bytes32"
        // ), // Length of unit256[] = 2
        // [14]: staticOneOf([
        //   "0x00000000000000000000000000000000000000000000000000000000000000a0",
        //   "0x00000000000000000000000000000000000000000000000000000000000000c0",
        //   "0x0000000000000000000000000000000000000000000000000000000000000060",
        //   "0x0000000000000000000000000000000000000000000000000000000000000040"
        // ],
        //   "bytes32"
        // ), // Length of bytes
        // [15]: staticOneOf([
        //   "0x0000000000000000000000000000000000000000000000000000000000000000",
        //   "0x0000000000000000000000000000000000000000000000000000000000000001",
        //   "0x0000000000000000000000000000000000000000000000000000000000000002",
        //   "0x0000000000000000000000000000000000000000000000000000000000000003"
        // ],
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
          "0x1e19cf2d73a72ef1332c882f20534b6519be0276000200000000000000000112",
          "bytes32"
        ), // Balancer PoolId
        [1]: staticEqual(AVATAR),
        [2]: staticEqual(AVATAR),
        // [3]: staticEqual(
        //   "0x0000000000000000000000000000000000000000000000000000000000000080",
        //   "bytes32"), // Offset of tuple from beginning 128=32*4
        // [4]: staticEqual(
        //   "0x0000000000000000000000000000000000000000000000000000000000000080",
        //   "bytes32"), // Offset of address[] from beginning of tuple 128=32*4
        // [5]: staticEqual(
        //   "0x00000000000000000000000000000000000000000000000000000000000000e0",
        //   "bytes32"), // Offset of uint256[] from beginning of tuple 224=32*7
        // [6]: staticEqual(
        //   "0x0000000000000000000000000000000000000000000000000000000000000140",
        //   "bytes32"), // Offset of bytes from beginning of tuple 320=32*10
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
        // [14]: staticOneOf([
        //   "0x0000000000000000000000000000000000000000000000000000000000000060",
        //   "0x0000000000000000000000000000000000000000000000000000000000000040",
        //   "0x00000000000000000000000000000000000000000000000000000000000000c0",
        // ],
        //   "bytes32"
        // ), // Length of bytes
        // [15]: staticOneOf([
        //   "0x0000000000000000000000000000000000000000000000000000000000000000",
        //   "0x0000000000000000000000000000000000000000000000000000000000000001",
        //   "0x0000000000000000000000000000000000000000000000000000000000000002"
        // ],
        //   "bytes32"
        // ), // Join Kind
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
    // CONVEX
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Convex - ETH/stETH
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve([curve.steCRV], [convex.BOOSTER]),
    // ...allowErc20Approve([convex.cvxsteCRV], [convex.cvxsteCRV_REWARDER]),

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
    // ...allowErc20Approve([curve.crvcDAIcUSDC], [convex.BOOSTER]),
    // ...allowErc20Approve([convex.cvxcDAIcUSDC], [convex.cvxcDAIcUSDC_REWARDER]),

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
    // Wrapping and unwrapping of ETH, WETH
    //---------------------------------------------------------------------------------------------------------------------------------
    // {
    //   targetAddress: WETH,
    //   signature: "withdraw(uint256)",
    // },
    allow.mainnet.weth["withdraw"](),

    // {
    //   targetAddress: WETH,
    //   signature: "deposit()",
    //   send: true,
    // },
    allow.mainnet.weth["deposit"]({
      send: true,
    }),

    //---------------------------------------------------------------------------------------------------------------------------------
    // MAKER
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Maker - DSR (DAI Savings Rate)
    // The DsrManager provides an easy to use smart contract that allows service providers to deposit/withdraw dai into
    // the DSR contract pot, and activate/deactivate the Dai Savings Rate to start earning savings on a pool of dai in a single
    // function call.
    // https://docs.makerdao.com/smart-contract-modules/proxy-module/dsr-manager-detailed-documentation#contract-details
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve([DAI], [maker.DSR_MANAGER])

    // Deposit
    allow.mainnet.maker.dsr_manager["join"](AVATAR),

    // Withdraw an specific amount
    allow.mainnet.maker.dsr_manager["exit"](AVATAR),

    // Withdraw all
    allow.mainnet.maker.dsr_manager["exitAll"](AVATAR),

    //---------------------------------------------------------------------------------------------------------------------------------
    // ROCKET POOL
    // Current Deployments: https://docs.rocketpool.net/overview/contracts-integrations.html
    // IMPORTANT: https://docs.rocketpool.net/developers/usage/contracts/contracts.html
    // RocketStorage contract: 0x1d8f8f00cfa6758d7bE78336684788Fb0ee0Fa46
    // The central hub of the network is the RocketStorage contract, which is responsible for storing the state of the
    // entire protocol. This is implemented through the use of maps for key-value storage, and getter and setter methods for
    // reading and writing values for a key.
    // The RocketStorage contract also stores the addresses of all other network contracts (keyed by name),
    // and restricts data modification to those contracts only.
    // Because of Rocket Pool's architecture, the addresses of other contracts should not be used directly but retrieved
    // from the blockchain before use. Network upgrades may have occurred since the previous interaction, resulting in
    // outdated addresses. RocketStorage can never change address, so it is safe to store a reference to it.
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve([rETH], [rocket_pool.SWAP_ROUTER]),

    // Deposit ETH in exchange for rETH
    allow.mainnet.rocket_pool.deposit_pool["deposit"]({
      send: true,
    }),

    // Withdraw ETH - Burns rETH in exchange for ETH
    allow.mainnet.rocket_pool.rETH["burn"](),

    // Swap ETH for rETH through SWAP_ROUTER - When there is not enough rETH on the DEPOSIT_POOL in exchange for the
    // ETH you are depositing, the SWAP_ROUTER swaps the ETH for rETH in secondary markets (Balancer and Uniswap).
    allow.mainnet.rocket_pool.swap_router["swapTo"](
      undefined,
      undefined,
      undefined,
      undefined,
      {
        send: true,
      }
    ),

    // Swap rETH for ETH through SWAP_ROUTER - When there is not enough ETH on the DEPOSIT_POOL in exchange for the
    // rETH you are withdrawing, the SWAP_ROUTER swaps the rETH for ETH in secondary markets (Balancer and Uniswap).
    allow.mainnet.rocket_pool.swap_router["swapFrom"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Swapping of tokens COMP, CRV, LDO, WETH, USDC, DAI and USDT in Uniswap
    //---------------------------------------------------------------------------------------------------------------------------------

    /* ...allowErc20Approve(
            [COMP, rETH2, SWISE, sETH2, CRV, LDO, WETH, USDC, DAI, USDT, CVX],
            [uniswapv3.ROUTER_2]
          ), */

    // {
    //     targetAddress: uniswapv3.ROUTER_2,
    //     signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
    //     params: {
    //         [2]: dynamic32OneOf(
    //             [
    //                 [COMP, WETH, USDC],
    //                 [COMP, WETH, DAI],
    //                 [COMP, WETH],
    //                 [CRV, WETH, USDC],
    //                 [CRV, WETH, DAI],
    //                 [CRV, WETH],
    //                 [LDO, WETH, USDC],
    //                 [LDO, WETH, DAI],
    //                 [LDO, WETH],
    //                 [WETH, USDC],
    //                 [WETH, DAI],
    //                 [WETH, USDT],
    //                 [USDC, WETH],
    //                 [USDC, USDT],
    //                 [USDC, WETH, USDT],
    //                 [USDC, DAI],
    //                 [USDC, WETH, DAI],
    //                 [DAI, WETH],
    //                 [DAI, USDC],
    //                 [DAI, WETH, USDC],
    //                 [DAI, USDT],
    //                 [DAI, WETH, USDT],
    //                 [USDT, WETH],
    //                 [USDT, USDC],
    //                 [USDT, WETH, USDC],
    //                 [USDT, DAI],
    //                 [USDT, WETH, DAI],
    //             ],
    //             "address[]"
    //         ),
    //         [3]: staticEqual(AVATAR),
    //     },
    // },
    allow.mainnet.uniswapv3.router_2["swapExactTokensForTokens"](
      undefined,
      undefined,
      {
        oneOf: [
          [COMP, WETH, USDC],
          [COMP, WETH, DAI],
          [COMP, WETH],
          [CRV, WETH, USDC],
          [CRV, WETH, DAI],
          [CRV, WETH],
          [LDO, WETH, USDC],
          [LDO, WETH, DAI],
          [LDO, WETH],
          [WETH, USDC],
          [WETH, DAI],
          [WETH, USDT],
          [USDC, WETH],
          [USDC, USDT],
          [USDC, WETH, USDT],
          [USDC, DAI],
          [USDC, WETH, DAI],
          [DAI, WETH],
          [DAI, USDC],
          [DAI, WETH, USDC],
          [DAI, USDT],
          [DAI, WETH, USDT],
          [USDT, WETH],
          [USDT, USDC],
          [USDT, WETH, USDC],
          [USDT, DAI],
          [USDT, WETH, DAI],
        ],
      },
      AVATAR
    ),

    {
      targetAddress: uniswapv3.ROUTER_2,
      signature:
        "exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))",
      params: {
        [0]: staticOneOf(
          [COMP, CRV, CVX, DAI, LDO, rETH2, sETH2, SWISE, USDC, USDT, WETH],
          "address"
        ),
        [1]: staticOneOf([DAI, USDC, USDT, sETH2, WETH], "address"),
        [3]: staticEqual(AVATAR),
      },
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    // Swapping AURA, BAL, COMP, WETH and wstETH in Balancer: https://dev.balancer.fi/guides/swaps/single-swaps
    //---------------------------------------------------------------------------------------------------------------------------------

    /*     
          swap(SingleSwap_struct,FundManagement_struct,token_limit,deadline)
      
          struct SingleSwap {
            bytes32 poolId;
            SwapKind kind;      0 = GIVEN_IN, 1 = GIVEN_OUT
            IAsset assetIn;
            IAsset assetOut;
            uint256 amount;
            bytes userData;     userData specifies the JoinKind, see https://dev.balancer.fi/resources/joins-and-exits/pool-joins
          }
          struct FundManagement {
            address sender;
            bool fromInternalBalance;
            address payable recipient;
            bool toInternalBalance;
          }
           */

    // Swap AURA for WETH
    // ...allowErc20Approve([AURA], [balancer.VAULT]),
    {
      targetAddress: balancer.VAULT,
      signature:
        "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
      params: {
        [0]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of the tuple from beginning 224=32*7
        [1]: staticEqual(AVATAR), // recipient
        [3]: staticEqual(AVATAR), // sender
        [7]: staticEqual(
          "0xcfca23ca9ca720b6e98e3eb9b6aa0ffc4a5c08b9000200000000000000000274",
          "bytes32"
        ), // WETH-AURA pool ID
        //[8]: staticEqual(
        // "0x0000000000000000000000000000000000000000000000000000000000000000",
        //  "bytes32"
        //), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
        [9]: staticEqual(AURA, "address"), // Asset in
        [10]: staticEqual(WETH, "address"), // Asset out
        [12]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 192=32*6
        [13]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "bytes32"
        ), // bytes (userData) = for all current Balancer pools this can be left empty
      },
    },

    // Swap BAL for WETH
    // ...allowErc20Approve([BAL], [balancer.VAULT]),
    {
      targetAddress: balancer.VAULT,
      signature:
        "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
      params: {
        [0]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of the tuple from beginning 224=32*7
        [1]: staticEqual(AVATAR), // recipient
        [3]: staticEqual(AVATAR), // sender
        [7]: staticEqual(
          "0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014",
          "bytes32"
        ), // BAL-WETH pool ID
        //[8]: staticEqual(
        //  "0x0000000000000000000000000000000000000000000000000000000000000000",
        //  "bytes32"
        //), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
        [9]: staticEqual(BAL, "address"), // Asset in
        [10]: staticEqual(WETH, "address"), // Asset out
        [12]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 192=32*6
        [13]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "bytes32"
        ), // bytes (userData) = for all current Balancer pools this can be left empty
      },
    },

    // Swap WETH for DAI
    // ...allowErc20Approve([WETH], [balancer.VAULT]),
    {
      targetAddress: balancer.VAULT,
      signature:
        "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
      params: {
        [0]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of the tuple from beginning 224=32*7
        [1]: staticEqual(AVATAR), // recipient
        [3]: staticEqual(AVATAR), // sender
        [7]: staticEqual(
          "0x0b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a",
          "bytes32"
        ), // WETH-DAI pool ID
        //[8]: staticEqual(
        //  "0x0000000000000000000000000000000000000000000000000000000000000000",
        //  "bytes32"
        //), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
        [9]: staticEqual(WETH, "address"), // Asset in
        [10]: staticEqual(DAI, "address"), // Asset out
        [12]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 192=32*6
        [13]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "bytes32"
        ), // bytes (userData) = for all current Balancer pools this can be left empty
      },
    },

    // Swap WETH for USDC
    // ...allowErc20Approve([WETH], [balancer.VAULT]),
    {
      targetAddress: balancer.VAULT,
      signature:
        "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
      params: {
        [0]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of the tuple from beginning 224=32*7
        [1]: staticEqual(AVATAR), // recipient
        [3]: staticEqual(AVATAR), // sender
        [7]: staticEqual(
          "0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8000200000000000000000019",
          "bytes32"
        ), // USDC-WETH pool ID
        //[8]: staticEqual(
        //  "0x0000000000000000000000000000000000000000000000000000000000000000",
        //  "bytes32"
        //), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
        [9]: staticEqual(WETH, "address"), // Asset in
        [10]: staticEqual(USDC, "address"), // Asset out
        [12]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 192=32*6
        [13]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "bytes32"
        ), // bytes (userData) = for all current Balancer pools this can be left empty
      },
    },

    // Swap COMP for WETH
    // ...allowErc20Approve([COMP], [balancer.VAULT]),
    {
      targetAddress: balancer.VAULT,
      signature:
        "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
      params: {
        [0]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of the tuple from beginning 224=32*7
        [1]: staticEqual(AVATAR), // recipient
        [3]: staticEqual(AVATAR), // sender
        [7]: staticEqual(
          "0xefaa1604e82e1b3af8430b90192c1b9e8197e377000200000000000000000021",
          "bytes32"
        ), // COMP-WETH pool ID
        //[8]: staticEqual(
        //  "0x0000000000000000000000000000000000000000000000000000000000000000",
        //  "bytes32"
        //), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
        [9]: staticEqual(COMP, "address"), // Asset in
        [10]: staticEqual(WETH, "address"), // Asset out
        [12]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 192=32*6
        [13]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "bytes32"
        ), // bytes (userData) = for all current Balancer pools this can be left empty
      },
    },

    // Swap wstETH for WETH
    // ...allowErc20Approve([wstETH], [balancer.VAULT]),
    {
      targetAddress: balancer.VAULT,
      signature:
        "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
      params: {
        [0]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of the tuple from beginning 224=32*7
        [1]: staticEqual(AVATAR), // recipient
        [3]: staticEqual(AVATAR), // sender
        [7]: staticEqual(
          "0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080",
          "bytes32"
        ), // wstETH-WETH pool ID
        //[8]: staticEqual(
        //  "0x0000000000000000000000000000000000000000000000000000000000000000",
        //  "bytes32"
        //), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
        [9]: staticEqual(wstETH, "address"), // Asset in
        [10]: staticEqual(WETH, "address"), // Asset out
        [12]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 192=32*6
        [13]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "bytes32"
        ), // bytes (userData) = for all current Balancer pools this can be left empty
      },
    },

    // Swap WETH for wstETH
    // ...allowErc20Approve([WETH], [balancer.VAULT]),
    {
      targetAddress: balancer.VAULT,
      signature:
        "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
      params: {
        [0]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of the tuple from beginning 224=32*7
        [1]: staticEqual(AVATAR), // recipient
        [3]: staticEqual(AVATAR), // sender
        [7]: staticEqual(
          "0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080",
          "bytes32"
        ), // wstETH-WETH pool ID
        //[8]: staticEqual(
        //  "0x0000000000000000000000000000000000000000000000000000000000000000",
        //  "bytes32"
        //), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
        [9]: staticEqual(WETH, "address"), // Asset in
        [10]: staticEqual(wstETH, "address"), // Asset out
        [12]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 192=32*6
        [13]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "bytes32"
        ), // bytes (userData) = for all current Balancer pools this can be left empty
      },
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    // Swapping of COMP, BAL, LDO, CRV, WETH, USDC, USDT and DAI in SushiSwap
    //---------------------------------------------------------------------------------------------------------------------------------

    //  ...allowErc20Approve(
    //       [COMP, BAL, LDO, CRV, WETH, USDC, USDT, DAI],
    //       [sushiswap.ROUTER]
    //     ),

    // {
    //     targetAddress: sushiswap.ROUTER,
    //     signature:
    //         "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
    //     params: {
    //         [2]: dynamic32OneOf(
    //             [
    //                 [COMP, WETH, USDC],
    //                 [COMP, WETH, DAI],
    //                 [COMP, WETH],
    //                 [BAL, WETH, USDC],
    //                 [BAL, WETH, DAI],
    //                 [BAL, WETH],
    //                 [LDO, WETH, USDC],
    //                 [LDO, WETH, DAI],
    //                 [LDO, WETH],
    //                 [CRV, WETH, USDC],
    //                 [CRV, WETH, DAI],
    //                 [CRV, WETH],
    //                 [WETH, USDC],
    //                 [WETH, DAI],
    //                 [WETH, USDT],
    //                 [USDC, WETH],
    //                 [USDC, WETH, USDT],
    //                 [USDC, USDT],
    //                 [USDC, WETH, DAI],
    //                 [USDC, DAI],
    //                 [USDT, WETH],
    //                 [USDT, WETH, USDC],
    //                 [USDT, USDC],
    //                 [USDT, WETH, DAI],
    //                 [USDT, DAI],
    //                 [DAI, WETH],
    //                 [DAI, WETH, USDC],
    //                 [DAI, USDC],
    //                 [DAI, WETH, USDT],
    //                 [DAI, USDT],
    //             ],
    //             "address[]"
    //         ),
    //         [3]: staticEqual(AVATAR),
    //     },
    // },
    allow.mainnet.sushiswap.router["swapExactTokensForTokens"](
      undefined,
      undefined,
      {
        oneOf: [
          [COMP, WETH, USDC],
          [COMP, WETH, DAI],
          [COMP, WETH],
          [BAL, WETH, USDC],
          [BAL, WETH, DAI],
          [BAL, WETH],
          [LDO, WETH, USDC],
          [LDO, WETH, DAI],
          [LDO, WETH],
          [CRV, WETH, USDC],
          [CRV, WETH, DAI],
          [CRV, WETH],
          [WETH, USDC],
          [WETH, DAI],
          [WETH, USDT],
          [USDC, WETH],
          [USDC, WETH, USDT],
          [USDC, USDT],
          [USDC, WETH, DAI],
          [USDC, DAI],
          [USDT, WETH],
          [USDT, WETH, USDC],
          [USDT, USDC],
          [USDT, WETH, DAI],
          [USDT, DAI],
          [DAI, WETH],
          [DAI, WETH, USDC],
          [DAI, USDC],
          [DAI, WETH, USDT],
          [DAI, USDT],
        ],
      },
      AVATAR
    ),

    // Swaps using ROUTE_PROCESSOR_3
    // ...allowErc20Approve(
    //     [COMP, BAL, LDO, CRV, WETH, USDC, USDT, DAI],
    //     [sushiswap.ROUTE_PROCESSOR_3]
    //   ),
    allow.mainnet.sushiswap.route_processor_3["processRoute"](
      {
        oneOf: [COMP, BAL, LDO, CRV, WETH, USDC, USDT, DAI],
      },
      undefined,
      {
        oneOf: [WETH, USDC, USDT, DAI],
      },
      undefined,
      AVATAR
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Swapping of ETH and stETH in Curve
    //---------------------------------------------------------------------------------------------------------------------------------

    // // ...allowErc20Approve([stETH], [CURVE_stETH_ETH_POOL]),
    // {
    //     targetAddress: CURVE_stETH_ETH_POOL,
    //     signature: "exchange(int128,int128,uint256,uint256)",
    //     send: true,
    // },
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

    //---------------------------------------------------------------------------------------------------------------------------------
    // Swapping in Curve's 3pool
    //---------------------------------------------------------------------------------------------------------------------------------

    // ...allowErc20Approve([DAI, USDC, USDT], [CURVE_3POOL]),
    // {
    //     targetAddress: CURVE_3POOL,
    //     signature: "exchange(int128,int128,uint256,uint256)",
    // },
    allow.mainnet.curve.x3CRV_pool["exchange"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Swapping in Curve's CVX-ETH pool
    //---------------------------------------------------------------------------------------------------------------------------------

    // ...allowErc20Approve([CVX], [cvxETH_pool]),

    //Swap CVX for WETH
    allow.mainnet.curve.cvxETH_pool[
      "exchange(uint256,uint256,uint256,uint256)"
    ](1, 0),

    //Swap CVX for ETH
    //allow.mainnet.curve.cvxETH_pool["exchange_underlying"](1, 0),
    //---------------------------------------------------------------------------------------------------------------------------------
    // Cowswap
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve([AURA, BAL, COMP, CRV, CVX, DAI, LDO, rETH, SWISE, USDC, USDT, WETH, wstETH], [cowswap.GPv2_VAULT_RELAYER]),

    // allow.mainnet.cowswap.order_signer["signOrder"](
    //   {
    //     oneOf: [
    //       AURA,
    //       BAL,
    //       COMP,
    //       CRV,
    //       CVX,
    //       DAI,
    //       LDO,
    //       rETH,
    //       SWISE,
    //       USDC,
    //       USDT,
    //       WETH,
    //       wstETH,
    //     ],
    //   },
    //   {
    //     oneOf: [DAI, USDC, USDT, rETH, stETH, WETH, wstETH],
    //   }
    // ),

    {
      targetAddress: cowswap.ORDER_SIGNER,
      signature:
        "signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)",
      params: {
        [0]: staticOneOf(
          [
            AURA,
            BAL,
            COMP,
            CRV,
            CVX,
            DAI,
            LDO,
            rETH,
            SWISE,
            USDC,
            USDT,
            WETH,
            wstETH,
          ],
          "address"
        ),
        [1]: staticOneOf(
          [DAI, USDC, USDT, rETH, stETH, WETH, wstETH],
          "address"
        ),
        [2]: staticEqual(AVATAR),
      },
      delegatecall: true,
    },
  ],
  placeholders: { AVATAR },
} satisfies RolePreset

export default preset
