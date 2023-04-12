import {
    ZERO_ADDRESS, E_ADDRESS, AURA, BAL, COMP, CRV, DAI, LDO, rETH2,
    sETH2, stETH, SWISE, USDC, USDT, WETH, wstETH,
    aura,
    balancer,
    compound_v2,
    curve,
    uniswapv3
} from "../addresses"
import {
    staticEqual,
    staticOneOf,
} from "../../helpers/utils"
import { AVATAR } from "../../placeholders"
import { RolePreset } from "../../types"
import { allow } from "../../allow"


const preset = {
    network: 1,
    allow: [

        //All approvals have been commented since we'll be handling over the Avatar safe with all of them having been already executed

        //---------------------------------------------------------------------------------------------------------------------------------
        // LIDO
        //---------------------------------------------------------------------------------------------------------------------------------
        // ...allowErc20Approve([stETH], [wstETH]),

        // {
        //   targetAddress: stETH,
        //   signature: "submit(address)",
        //   params: {
        //     [0]: staticEqual(ZERO_ADDRESS, "address"),
        //   },
        //   send: true,
        // },
        allow.mainnet.lido.stETH["submit"](
            ZERO_ADDRESS,
            {
                send: true
            }
        ),

        // { targetAddress: wstETH, signature: "wrap(uint256)" },
        allow.mainnet.lido.wstETH["wrap"](),
        // { targetAddress: wstETH, signature: "unwrap(uint256)" }
        allow.mainnet.lido.wstETH["unwrap"](),

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
                subsetOf: [compound_v2.cDAI, compound_v2.cUSDC].map((address) => address.toLowerCase()).sort(), // compound app will always pass tokens in ascending order
                restrictOrder: true,
            }
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Stakewise
        //---------------------------------------------------------------------------------------------------------------------------------

        // When staking ETH one receives sETH2
        // {
        //   targetAddress: STAKEWISE_ETH2_STAKING,
        //   signature: "stake()",
        //   send: true,
        // },
        allow.mainnet.stakewise.eth2_staking["stake"](
            {
                send: true
            }
        ),

        // By having staked ETH one receives rETH2 as rewards that are claimed by calling the claim function
        // {
        //   targetAddress: STAKEWISE_MERKLE_DIS,
        //   signature: "claim(uint256,address,address[],uint256[],bytes32[])",
        //   params: {
        //     [1]: staticEqual(AVATAR),
        //     [2]: dynamic32Equal([rETH2, SWISE], "address[]"),
        //   },
        // },
        allow.mainnet.stakewise.merkle_distributor["claim"](
            undefined,
            AVATAR,
            [rETH2, SWISE]
        ),

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
        // Curve - ETH/stETH
        //---------------------------------------------------------------------------------------------------------------------------------
        // ...allowErc20Approve([stETH], [curve.stETH_ETH_POOL]),
        // ...allowErc20Approve([curve.steCRV], [curve.stETH_ETH_GAUGE]),
        // ...allowErc20Approve([stETH], [curve.STAKE_DEPOSIT_ZAP]),

        // Add Liquidity
        allow.mainnet.curve.steth_eth_pool["add_liquidity"](
            undefined,
            undefined,
            {
                send: true
            }
        ),

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
        allow.mainnet.curve.crv_minter["mint"](
            curve.stETH_ETH_GAUGE
        ),

        // Deposit and Stake using a special ZAP
        allow.mainnet.curve.steth_eth_gauge["set_approve_deposit"](
            curve.STAKE_DEPOSIT_ZAP
        ),

        // Using ETH
        allow.mainnet.curve.stake_deposit_zap["deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)"](
            curve.stETH_ETH_POOL,
            curve.steCRV,
            curve.stETH_ETH_GAUGE,
            2,
            [E_ADDRESS, stETH, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
            undefined,
            undefined,
            undefined,
            ZERO_ADDRESS,
            {
                send: true
            }
        ),

        // Not using ETH
        allow.mainnet.curve.stake_deposit_zap["deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)"](
            curve.stETH_ETH_POOL,
            curve.steCRV,
            curve.stETH_ETH_GAUGE,
            2,
            [E_ADDRESS, stETH, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
            undefined,
            undefined,
            undefined,
            ZERO_ADDRESS,
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // AURA wstETH/WETH
        //---------------------------------------------------------------------------------------------------------------------------------
        //...allowErc20Approve([WETH], [AURA_REWARD_POOL_DEPOSIT_WRAPPER]),

        //deposiSingle: the (address[],uint256[],bytes,bool) tuple argument represents the request data for joining the pool
        /* request=(
              address[] assets,
              uint256[] maxAmountsIn,
              bytes userData,
              bool fromInternalBalance
        )   
        */
        //userData specifies the JoinKind, see https://dev.balancer.fi/resources/joins-and-exits/pool-joins

        // Desposit using only WETH
        {
            targetAddress: aura.REWARD_POOL_DEPOSIT_WRAPPER,
            signature:
                "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
            params: {
                [0]: staticEqual(aura.auraB_stETH_STABLE_REWARDER, "address"),
                [1]: staticEqual(WETH, "address"),
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
        allow.mainnet.aura.auraB_stETH_stable_rewarder["withdrawAndUnwrap"](),

        // {
        //   targetAddress: auraB_stETH_STABLE_REWARDER,
        //   signature: "getReward()",
        // },
        allow.mainnet.aura.auraB_stETH_stable_rewarder["getReward()"](),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Balancer wstETH/WETH pool
        //---------------------------------------------------------------------------------------------------------------------------------

        //exitPool: the (address[],uint256[],bytes,bool) tuple argument represents the request data for joining the pool
        /* request=(
              address[] assets,
              uint256[] maxAmountsIn,
              bytes userData,
              bool fromInternalBalance
        )   
        */
        //userData specifies the JoinKind, see https://dev.balancer.fi/resources/joins-and-exits/pool-joins

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
                    "bytes32"), // Offset of tuple from beginning 128=32*4
                [4]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000080",
                    "bytes32"), // Offset of address[] from beginning of tuple 128=32*4
                [5]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"), // Offset of uint256[] from beginning of tuple 224=32*7
                [6]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000140",
                    "bytes32"), // Offset of bytes from beginning of tuple 320=32*10
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
                [14]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040",
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                ],
                    "bytes32"
                ), // Length of bytes
                [15]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "0x0000000000000000000000000000000000000000000000000000000000000002"
                ],
                    "bytes32"
                ), // Join Kind
            },
        },

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
        allow.mainnet.weth["deposit"](
            {
                send: true
            }
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Swapping of tokens COMP, CRV, LDO, WETH, USDC, DAI and USDT in Uniswap
        //---------------------------------------------------------------------------------------------------------------------------------

        /* ...allowErc20Approve(
          [COMP, rETH2, SWISE, sETH2, CRV, LDO, WETH, USDC, DAI, USDT],
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
                ]
            },
            AVATAR
        ),

        {
            targetAddress: uniswapv3.ROUTER_2,
            signature:
                "exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))",
            params: {
                [0]: staticOneOf(
                    [COMP, CRV, DAI, LDO, rETH2, sETH2, SWISE, USDC, USDT, WETH],
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
                ),
                [1]: staticEqual(AVATAR), // recipient
                [2]: staticEqual(false, "bool"),
                [3]: staticEqual(AVATAR), // sender
                [4]: staticEqual(false, "bool"),
                [7]: staticEqual(
                    "0xcfca23ca9ca720b6e98e3eb9b6aa0ffc4a5c08b9000200000000000000000274",
                    "bytes32"
                ), // WETH-AURA pool ID
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
                [9]: staticEqual(AURA, "address"), // Asset in
                [10]: staticEqual(WETH, "address"), // Asset out
                [12]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "bytes32"), // Offset of bytes from beginning of tuple 192=32*6
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
                ),
                [1]: staticEqual(AVATAR), // recipient
                [2]: staticEqual(false, "bool"),
                [3]: staticEqual(AVATAR), // sender
                [4]: staticEqual(false, "bool"),
                [7]: staticEqual(
                    "0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014",
                    "bytes32"
                ), // BAL-WETH pool ID
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
                [9]: staticEqual(BAL, "address"), // Asset in
                [10]: staticEqual(WETH, "address"), // Asset out
                [12]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "bytes32"), // Offset of bytes from beginning of tuple 192=32*6
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
                ),
                [1]: staticEqual(AVATAR), // recipient
                [2]: staticEqual(false, "bool"),
                [3]: staticEqual(AVATAR), // sender
                [4]: staticEqual(false, "bool"),
                [7]: staticEqual(
                    "0x0b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a",
                    "bytes32"
                ), // WETH-DAI pool ID
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
                [9]: staticEqual(WETH, "address"), // Asset in
                [10]: staticEqual(DAI, "address"), // Asset out
                [12]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "bytes32"), // Offset of bytes from beginning of tuple 192=32*6
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
                ),
                [1]: staticEqual(AVATAR), // recipient
                [2]: staticEqual(false, "bool"),
                [3]: staticEqual(AVATAR), // sender
                [4]: staticEqual(false, "bool"),
                [7]: staticEqual(
                    "0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8000200000000000000000019",
                    "bytes32"
                ), // USDC-WETH pool ID
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
                [9]: staticEqual(WETH, "address"), // Asset in
                [10]: staticEqual(USDC, "address"), // Asset out
                [12]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "bytes32"), // Offset of bytes from beginning of tuple 192=32*6
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
                ),
                [1]: staticEqual(AVATAR), // recipient
                [2]: staticEqual(false, "bool"),
                [3]: staticEqual(AVATAR), // sender
                [4]: staticEqual(false, "bool"),
                [7]: staticEqual(
                    "0xefaa1604e82e1b3af8430b90192c1b9e8197e377000200000000000000000021",
                    "bytes32"
                ), // COMP-WETH pool ID
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
                [9]: staticEqual(COMP, "address"), // Asset in
                [10]: staticEqual(WETH, "address"), // Asset out
                [12]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "bytes32"), // Offset of bytes from beginning of tuple 192=32*6
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
                ),
                [1]: staticEqual(AVATAR), // recipient
                [2]: staticEqual(false, "bool"),
                [3]: staticEqual(AVATAR), // sender
                [4]: staticEqual(false, "bool"),
                [7]: staticEqual(
                    "0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080",
                    "bytes32"
                ), // wstETH-WETH pool ID
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
                [9]: staticEqual(wstETH, "address"), // Asset in
                [10]: staticEqual(WETH, "address"), // Asset out
                [12]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "bytes32"), // Offset of bytes from beginning of tuple 192=32*6
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
                ),
                [1]: staticEqual(AVATAR), // recipient
                [2]: staticEqual(false, "bool"),
                [3]: staticEqual(AVATAR), // sender
                [4]: staticEqual(false, "bool"),
                [7]: staticEqual(
                    "0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080",
                    "bytes32"
                ), // wstETH-WETH pool ID
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
                [9]: staticEqual(WETH, "address"), // Asset in
                [10]: staticEqual(wstETH, "address"), // Asset out
                [12]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "bytes32"), // Offset of bytes from beginning of tuple 192=32*6
                [13]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"
                ), // bytes (userData) = for all current Balancer pools this can be left empty
            },
        },

        //---------------------------------------------------------------------------------------------------------------------------------
        // Swapping of COMP, BAL, LDO, CRV, WETH, USDC, USDT and DAI in SushiSwap
        //---------------------------------------------------------------------------------------------------------------------------------

        /* ...allowErc20Approve(
          [COMP, BAL, LDO, CRV, WETH, USDC, USDT, DAI],
          [SUSHISWAP_ROUTER]
        ), */

        // {
        //     targetAddress: SUSHISWAP_ROUTER,
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
                ]
            },
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
                send: true
            }
        ),

        // Exchange not using ETH
        allow.mainnet.curve.steth_eth_pool["exchange"](),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Swapping in Curve's 3pool
        //---------------------------------------------------------------------------------------------------------------------------------

        // ...allowErc20Approve([DAI, USDC, USDT], [CURVE_3POOL]),
        // {
        //     targetAddress: CURVE_3POOL,
        //     signature: "exchange(int128,int128,uint256,uint256)",
        // },
        allow.mainnet.curve.x3CRV_pool["exchange"](),
    ],
    placeholders: { AVATAR },
} satisfies RolePreset

export default preset
