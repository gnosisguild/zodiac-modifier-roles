import { allow } from "../../allow"
import {
    ZERO_ADDRESS, AURA, auraBAL, BAL, COW, DAI, GNO, USDC, USDT,
    OMNI_BRIDGE,
    aura,
    balancer,
    compound_v2,
    compound_v3
} from "../addresses"
import { allowErc20Approve } from "../../helpers/erc20"
import {
    staticEqual,
    staticOneOf,
} from "../../helpers/utils"
import { AVATAR, BRIDGE_RECIPIENT_GNOSIS_CHAIN } from "../../placeholders"
import { RolePreset } from "../../types"


const preset = {
    network: 1,
    allow: [

        //---------------------------------------------------------------------------------------------------------------------------------
        // AURA
        //---------------------------------------------------------------------------------------------------------------------------------

        //---------------------------------------------------------------------------------------------------------------------------------
        // Aura bb-aUSDT/bb-a-USDC/bb-a-DAI (Boosted Pool)
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([balancer.bb_a_USD], [aura.BOOSTER]),

        // {
        //     targetAddress: AURA_BOOSTER,
        //     signature: "deposit(uint256,uint256,bool)",
        //     params: {
        //         [0]: staticEqual(2, "uint256"), // Aura poolId
        //     },
        // },
        allow.mainnet.aura.booster["deposit"](
            2), // Aura poolId

        // {
        //     targetAddress: aurabb_a_USD_REWARDER,
        //     signature: "withdrawAndUnwrap(uint256,bool)",
        // },
        allow.mainnet.aura.aurabb_a_USD_rewarder["withdrawAndUnwrap"](),

        // {
        //     targetAddress: aurabb_a_USD_REWARDER,
        //     signature: "getReward()",
        // },
        allow.mainnet.aura.aurabb_a_USD_rewarder["getReward()"](),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Aura GNO/COW
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([balancer.B_50COW_50GNO], [aura.BOOSTER]),
        ...allowErc20Approve([GNO, COW], [aura.REWARD_POOL_DEPOSIT_WRAPPER]),

        // {
        //     targetAddress: AURA_BOOSTER,
        //     signature: "deposit(uint256,uint256,bool)",
        //     params: {
        //         [0]: staticEqual(3, "uint256"), // Aura poolId
        //     },
        // },
        allow.mainnet.aura.booster["deposit"](
            3), // Aura poolId

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
                ), // Offset of uint256[] from beginning of tuple 24=32*7
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

        // {
        //     targetAddress: aura50COW_50GNO_REWARDER,
        //     signature: "withdrawAndUnwrap(uint256,bool)",
        // },
        allow.mainnet.aura.aura50COW_50GNO_rewarder["withdrawAndUnwrap"](),

        // {
        //     targetAddress: aura50COW_50GNO_REWARDER,
        //     signature: "getReward()",
        // },
        allow.mainnet.aura.aura50COW_50GNO_rewarder["getReward()"](),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Staking auraBAL
        //---------------------------------------------------------------------------------------------------------------------------------

        // Using auraBAL
        ...allowErc20Approve([auraBAL], [aura.auraBAL_STAKING_REWARDER]),

        // {
        //   targetAddress: auraBAL_STAKING_REWARDER,
        //   signature: "stake(uint256)",
        // },
        allow.mainnet.aura.auraBAL_staking_rewarder["stake"](),

        // {
        //   targetAddress: auraBAL_STAKING_REWARDER,
        //   signature: "withdraw(uint256,bool)",
        // },
        allow.mainnet.aura.auraBAL_staking_rewarder["withdraw"](),

        // Using 80BAL-20WETH
        ...allowErc20Approve([balancer.B_80BAL_20WETH], [aura.auraBAL_B_80BAL_20WETH_DEPOSITOR]),

        // {
        //   targetAddress: B_80BAL_20WETH_DEPOSITOR,
        //   signature: "deposit(uint256,bool,address)",
        //   params: {
        //     [2]: staticEqual(auraBAL_STAKING_REWARDER, "address"),
        //   },
        // },
        allow.mainnet.aura.auraBAL_B_80BAL_20WETH_depositor["deposit(uint256,bool,address)"](
            undefined,
            undefined,
            {
                oneOf: [
                    ZERO_ADDRESS, // When Minting ONLY
                    aura.auraBAL_STAKING_REWARDER // When Minting + Staking
                ]
            }
        ),

        // Using BAL
        ...allowErc20Approve([BAL], [aura.auraBAL_BAL_DEPOSITOR]),

        // {
        //   targetAddress: BAL_DEPOSITOR,
        //   signature: "deposit(uint256,uint256,bool,address)",
        //   params: {
        //     [3]: staticEqual(auraBAL_STAKING_REWARDER, "address"),
        //   },
        // },
        allow.mainnet.aura.auraBAL_BAL_depositor["deposit"](
            undefined,
            undefined,
            undefined,
            {
                oneOf: [
                    ZERO_ADDRESS, // When Minting ONLY
                    aura.auraBAL_STAKING_REWARDER // When Minting + Staking
                ]
            }
        ),

        // Claiming auraBAL Staking Rewards
        // {
        //   targetAddress: auraBAL_STAKING_REWARDER,
        //   signature: "getReward()",
        // },
        allow.mainnet.aura.auraBAL_staking_rewarder["getReward()"](),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Compounding auraBAL
        //---------------------------------------------------------------------------------------------------------------------------------

        // Using auraBAL
        ...allowErc20Approve([auraBAL], [aura.stkauraBAL]),

        // Stake
        allow.mainnet.aura.stkauraBAL["deposit"](
            undefined,
            AVATAR
        ),

        // Unstake
        allow.mainnet.aura.stkauraBAL["withdraw"](
            undefined,
            AVATAR,
            AVATAR
        ),

        // When the MAX amount is unstaked
        allow.mainnet.aura.stkauraBAL["redeem"](
            undefined,
            AVATAR,
            AVATAR
        ),

        // Mint auraBAL and Stake
        allow.mainnet.aura.auraBAL_B_80BAL_20WETH_depositor["deposit(uint256,bool,address)"](
            undefined,
            undefined,
            {
                oneOf: [
                    ZERO_ADDRESS, // When Minting ONLY
                    aura.auraBAL_STAKER // When Minting + Staking
                ]
            }
        ),

        // Mint auraBAL and Stake
        allow.mainnet.aura.auraBAL_BAL_depositor["deposit"](
            undefined,
            undefined,
            undefined,
            {
                oneOf: [
                    ZERO_ADDRESS, // When Minting ONLY
                    aura.auraBAL_STAKER // When Minting + Staking
                ]
            }
        ),

        // Claiming auraBAL Compounding Rewards
        allow.mainnet.aura.auraBAL_compounding_rewarder["getReward()"](),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Locking AURA
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([AURA], [aura.AURA_LOCKER]),

        // Locking AURA
        // {
        //   targetAddress: AURA_LOCKER,
        //   signature: "lock(address,uint256)",
        //   params: {
        //     [0]: staticEqual(AVATAR),
        //   },
        // },
        allow.mainnet.aura.aura_locker["lock"](
            AVATAR
        ),

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

        // Process Expired AURA Locks - True -> Relock Expired Locks / False -> Withdraw Expired Locks
        // {
        //   targetAddress: AURA_LOCKER,
        //   signature: "processExpiredLocks(bool)",
        // },
        allow.mainnet.aura.aura_locker["processExpiredLocks"](),

        // Gauge Votes Delegation - IMPORTANT: THE ADDRESS SHOULD BE CONSTRAINED IN ORDER TO AVOID DELEGATING THE VOTING POWER TO UNWANTED ADDRESSES
        // {
        //   targetAddress: AURA_LOCKER,
        //   signature: "delegate(address)",
        // },
        // allow.mainnet.aura.aura_locker["delegate"](),

        // Proposals Delegation - IMPORTANT: THE ADDRESS SHOULD BE CONSTRAINED IN ORDER TO AVOID DELEGATING THE VOTING POWER TO UNWANTED ADDRESSES
        // {
        //   targetAddress: SNAPSHOT_DELEGATE_REGISTRY,
        //   signature: "setDelegate(bytes32,address)",
        // },
        // allow.mainnet.aura.snapshot_delegate_registry["setDelegate"](),

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

        // Relayer Approval (this is done only once per wallet)
        allow.mainnet.balancer.relayer["setRelayerApproval"](
            balancer.RELAYER
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Balancer Boosted Aave USD
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([balancer.bb_a_USD], [balancer.bb_a_USD_GAUGE]),
        ...allowErc20Approve([DAI, USDT, USDC], [balancer.VAULT]),

        // Using the BALANCER_RELAYER and it's BALANCER_RELAYER_LIBRARY 
        // Adding and removing tokens in different amounts
        // Swap DAI for bb_a_DAI (for both, join and exit pool)
        // Swap USDT for bb_a_USDT (for both, join and exit pool)
        // Swap USDC for bb_a_USDC (for both, join and exit pool)
        {
            targetAddress: balancer.RELAYER,
            signature:
                "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256,uint256,uint256)",
            params: {
                [0]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000120",
                    "bytes32"), // Offset of the tuple from beginning 288=32*9
                [1]: staticOneOf([
                    AVATAR,
                    balancer.RELAYER,
                ],
                    "address"), // sender
                [3]: staticOneOf([
                    AVATAR,
                    balancer.RELAYER,
                ],
                    "address"), // recipient
                [9]: staticOneOf([
                    "0xae37d54ae477268b9997d4161b96b8200755935c000000000000000000000337", // bb_a_DAI
                    "0x2f4eb100552ef93840d5adc30560e5513dfffacb000000000000000000000334", // bb_a_USDT
                    "0x82698aecc9e28e9bb27608bd52cf57f704bd1b83000000000000000000000336", // bb_a_USDC
                ],
                    "bytes32"), // Balancer PoolId
                [10]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
                [11]: staticOneOf([
                    DAI,
                    balancer.bb_a_DAI,
                    USDT,
                    balancer.bb_a_USDT,
                    USDC,
                    balancer.bb_a_USDC
                ],
                    "address"), // assetIn
                [12]: staticOneOf([
                    DAI,
                    balancer.bb_a_DAI,
                    USDT,
                    balancer.bb_a_USDT,
                    USDC,
                    balancer.bb_a_USDC
                ],
                    "address"), // assetOut
                [14]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "bytes32"), // Offset of bytes from beginning of tuple 192=32*6
                [15]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"
                ), // bytes (userData) = for all current Balancer pools this can be left empty
            }
        },

        // IMPORTANT: FOR THE "Balancer Boosted Aave USD" the joinPool and exitPool MUST BE WHITELISTED WITH BOTH THE SENDER AND 
        // RECIPIENT WITH THE POSSIBILITY OF BEING EITHER THE AVATAR OR THE BALANCER_RELAYER. WHEN YOU ADD OR REMOVE LIQUIDITY
        // FROM A POOL WITH bb_ag_USD (ie: Weighted Pool wstETH/bb-a-USD) THE BALANCER_RELAYER DOES A joinPool or exitPool 
        // WITH THE BALANCER_RELAYER AS BOTH THE SENDER AND RECIPIENT.

        // Add Liquidity
        {
            targetAddress: balancer.RELAYER,
            signature:
                "joinPool(bytes32,uint8,address,address,(address[],uint256[],bytes,bool),uint256,uint256)",
            params: {
                [0]: staticEqual(
                    "0xa13a9247ea42d743238089903570127dda72fe4400000000000000000000035d",
                    "bytes32"
                ), // Balancer PoolId
                [1]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"
                ), // bytes (userData)
                [2]: staticOneOf([
                    AVATAR,
                    balancer.RELAYER,
                ],
                    "address"), // sender
                [3]: staticOneOf([
                    AVATAR,
                    balancer.RELAYER,
                ],
                    "address"), // recipient
                [4]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"), // Offset of the tuple from beginning 224=32*7
                [7]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000080",
                    "bytes32"), // Offset of address[] from beginning of tuple 128=32*4
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000120",
                    "bytes32"), // Offset of uint256[] from beginning of tuple 288=32*9
                [9]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000001c0",
                    "bytes32"), // Offset of bytes from beginning of tuple 448=32*14
                [11]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000004",
                    "bytes32"
                ), // Length of address[] = 4
                [12]: staticEqual(balancer.bb_a_USDT, "address"),
                [13]: staticEqual(balancer.bb_a_USDC, "address"),
                [14]: staticEqual(balancer.bb_a_USD, "address"),
                [15]: staticEqual(balancer.bb_a_DAI, "address"),
                [16]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000004",
                    "bytes32"
                ), // Length of unit256[] = 4
                [21]: staticOneOf([
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "0x0000000000000000000000000000000000000000000000000000000000000100",
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040"
                ],
                    "bytes32"
                ), // Length of bytes
                [22]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "0x0000000000000000000000000000000000000000000000000000000000000003"
                ],
                    "bytes32"
                ), // Join Kind
            },
        },

        // Remove Liquidity
        {
            targetAddress: balancer.RELAYER,
            signature:
                "exitPool(bytes32,uint8,address,address,(address[],uint256[],bytes,bool),(uint256,uint256)[])",
            params: {
                [0]: staticEqual(
                    "0xa13a9247ea42d743238089903570127dda72fe4400000000000000000000035d",
                    "bytes32"
                ), // Balancer PoolId
                [1]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"
                ), // bytes (userData)
                [2]: staticOneOf([
                    AVATAR,
                    balancer.RELAYER,
                ],
                    "address"), // sender
                [3]: staticOneOf([
                    AVATAR,
                    balancer.RELAYER,
                ],
                    "address"), // recipient
                [4]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "bytes32"), // Offset of the first tuple from beginning 192=32*6
                [5]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000300",
                    "bytes32"), // Offset of the second tuple from beginning 768=32*24
                [6]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000080",
                    "bytes32"), // Offset of address[] from beginning of tuple 128=32*4
                [7]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000120",
                    "bytes32"), // Offset of uint256[] from beginning of tuple 288=32*9
                [8]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000001c0",
                    "bytes32"), // Offset of bytes from beginning of tuple 448=32*14
                [10]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000004",
                    "bytes32"
                ), // Length of address[] = 4
                [11]: staticEqual(balancer.bb_a_USDT, "address"),
                [12]: staticEqual(balancer.bb_a_USDC, "address"),
                [13]: staticEqual(balancer.bb_a_USD, "address"),
                [14]: staticEqual(balancer.bb_a_DAI, "address"),
                [15]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000004",
                    "bytes32"
                ), // Length of unit256[] = 4
                [20]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040",
                    "0x0000000000000000000000000000000000000000000000000000000000000100"
                ],
                    "bytes32"
                ), // Length of bytes
                [21]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "0x0000000000000000000000000000000000000000000000000000000000000002"
                ],
                    "bytes32"
                ), // Join Kind
                [24]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "bytes32"
                ), // Length of (uint256,uint256)[] = 1
            },
        },

        // WE CAN'T WHITELIST THIS FUNCTIONS BECAUSE WE DON'T KNOW HOW THE SWAPS WILL BE ROUTED
        // // Adding and removing single tokens (batchSwap)
        // {
        //     targetAddress: balancer.VAULT,
        //     signature:
        //         "batchSwap(uint8,(bytes32,uint256,uint256,uint256,bytes)[],address[],(address,bool,address,bool),int256[],uint256)",
        //     params: {
        //         [0]: staticEqual(
        //             "0x0000000000000000000000000000000000000000000000000000000000000000",
        //             "bytes32"), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
        //         [1]: staticEqual(
        //             "0x0000000000000000000000000000000000000000000000000000000000000120",
        //             "bytes32"), // Offset of the first tuple from beginning of tuple 288=32*9
        //         [2]: staticEqual(
        //             "0x0000000000000000000000000000000000000000000000000000000000000300",
        //             "bytes32"), // Offset of the address[] from beginning 768=32*24
        //         [3]: staticEqual(AVATAR),
        //         [5]: staticEqual(AVATAR),
        //         [7]: staticEqual(
        //             "0x0000000000000000000000000000000000000000000000000000000000000380",
        //             "bytes32"), // Offset of the int256[] from beginning 896=32*28
        //         [9]: staticEqual(
        //             "0x0000000000000000000000000000000000000000000000000000000000000002",
        //             "bytes32"
        //         ), // Length of (bytes32,uint256,uint256,uint256,bytes)[] = 2
        //         [10]: staticEqual(
        //             "0x0000000000000000000000000000000000000000000000000000000000000040",
        //             "bytes32"
        //         ), // Offset of the first element of the tuple from beginning of tuple 64=32*2
        //         [11]: staticEqual(
        //             "0x0000000000000000000000000000000000000000000000000000000000000100",
        //             "bytes32"
        //         ), // Offset of the second element of the tuple from beginning of tuple 256=32*8
        //         [12]: staticOneOf([
        //             "0xae37d54ae477268b9997d4161b96b8200755935c000000000000000000000337", // bb_a_DAI (Add Liquidity)
        //             "0x2f4eb100552ef93840d5adc30560e5513dfffacb000000000000000000000334", // bb_a_USDT (Add Liquidity)
        //             "0x82698aecc9e28e9bb27608bd52cf57f704bd1b83000000000000000000000336", // bb_a_USDC (Add Liquidity)
        //             "0xa13a9247ea42d743238089903570127dda72fe4400000000000000000000035d" // bb_a_USD (Remove Liquidity)
        //         ],
        //             "bytes32"), // Balancer PoolId
        //         [16]: staticEqual(
        //             "0x00000000000000000000000000000000000000000000000000000000000000a0",
        //             "bytes32"
        //         ), // Offset of the bytes from the beggining of the first element 160=32*5
        //         [17]: staticEqual(
        //             "0x0000000000000000000000000000000000000000000000000000000000000000",
        //             "bytes32"), // userData of the first element - for all current Balancer pools this can be left empty
        //         [18]: staticOneOf([
        //             "0xae37d54ae477268b9997d4161b96b8200755935c000000000000000000000337", // bb_a_DAI (Remove Liquidity)
        //             "0x2f4eb100552ef93840d5adc30560e5513dfffacb000000000000000000000334", // bb_a_USDT (Remove Liquidity)
        //             "0x82698aecc9e28e9bb27608bd52cf57f704bd1b83000000000000000000000336", // bb_a_USDC (Remove Liquidity)
        //             "0xa13a9247ea42d743238089903570127dda72fe4400000000000000000000035d" // bb_a_USD (Add Liquidity)
        //         ],
        //             "bytes32"), // Balancer PoolId
        //         [22]: staticEqual(
        //             "0x00000000000000000000000000000000000000000000000000000000000000a0",
        //             "bytes32"
        //         ), // Offset of the bytes from the beggining of the second element 160=32*5
        //         [23]: staticEqual(
        //             "0x0000000000000000000000000000000000000000000000000000000000000000",
        //             "bytes32"), // userData of the second element - for all current Balancer pools this can be left empty
        //         [24]: staticEqual(
        //             "0x0000000000000000000000000000000000000000000000000000000000000003",
        //             "bytes32"
        //         ), // Length of address[] = 3
        //         [25]: staticOneOf([
        //             DAI, // Add Liquidity
        //             USDT, // Add Liquidity
        //             USDC, // Add Liquidity
        //             balancer.bb_a_USD, // Remove Liquidity
        //         ],
        //             "address"), // assetIn
        //         [26]: staticOneOf([
        //             balancer.bb_a_DAI,
        //             balancer.bb_a_USDT,
        //             balancer.bb_a_USDC,
        //         ],
        //             "address"),
        //         [27]: staticOneOf([
        //             DAI, // Remove Liquidity
        //             USDT, // Remove Liquidity
        //             USDC, // Remove Liquidity
        //             balancer.bb_a_USD, // Add Liquidity
        //         ],
        //             "address"), // assetOut
        //         [28]: staticEqual(
        //             "0x0000000000000000000000000000000000000000000000000000000000000003",
        //             "bytes32"
        //         ), // Length of int256[] = 3
        //     }
        // },

        // Stake
        allow.mainnet.balancer.bb_a_USD_gauge["deposit(uint256)"](),

        // Unstake
        allow.mainnet.balancer.bb_a_USD_gauge["withdraw(uint256)"](),

        // Claim Rewards
        allow.mainnet.balancer.bb_a_USD_gauge["claim_rewards()"](),

        // Claim BAL Rewards
        allow.mainnet.balancer.BAL_minter["mint"](
            balancer.bb_a_USD_GAUGE
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Balancer GNO/COW pool
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([GNO, COW], [balancer.VAULT]),
        ...allowErc20Approve([balancer.B_50COW_50GNO], [balancer.B_50COW_50GNO_GAUGE]),

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
                [9]: staticEqual(GNO, "address"),
                [10]: staticEqual(COW, "address"),
                [11]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "bytes32"
                ), // Length of unit256[] = 2
                [14]: staticOneOf([
                    "0x00000000000000000000000000000000000000000000000000000000000000a0",
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040"
                ],
                    "bytes32"
                ), // Length of bytes
                [15]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "0x0000000000000000000000000000000000000000000000000000000000000003"
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
                [9]: staticEqual(GNO, "address"),
                [10]: staticEqual(COW, "address"),
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

        // Stake
        allow.mainnet.balancer.B_50COW_50GNO_gauge["deposit(uint256)"](),

        // Unstake
        allow.mainnet.balancer.B_50COW_50GNO_gauge["withdraw(uint256)"](),

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
        // Compound V2 - USDC
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([USDC], [compound_v2.cUSDC]),

        // Deposit
        // {
        //     targetAddress: cUSDC,
        //     signature: "mint(uint256)",
        // },
        allow.mainnet.compound_v2.cUSDC["mint"](),

        // Withdrawing: sender redeems uint256 cTokens, it is called when MAX is withdrawn
        // {
        //     targetAddress: cUSDC,
        //     signature: "redeem(uint256)",
        // },
        allow.mainnet.compound_v2.cUSDC["redeem"](),

        // Withdrawing: sender redeems cTokens in exchange for a specified amount of underlying asset (uint256), it is called when MAX isn't withdrawn
        // {
        //     targetAddress: cUSDC,
        //     signature: "redeemUnderlying(uint256)",
        // },
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
        // {
        //     targetAddress: COMPTROLLER,
        //     signature: "exitMarket(address)",
        //     params: {
        //         [0]: staticEqual(cUSDC, "address"),
        //     },
        // },
        allow.mainnet.compound_v2.comptroller["exitMarket"](
            compound_v2.cUSDC
        ),

        // Borrow specified amount of underlying asset (uint256)
        // {
        //     targetAddress: cUSDC,
        //     signature: "borrow(uint256)",
        // },
        allow.mainnet.compound_v2.cUSDC["borrow"](),

        // Repay specified borrowed amount of underlying asset (uint256)
        // {
        //     targetAddress: cUSDC,
        //     signature: "repayBorrow(uint256)",
        // },
        allow.mainnet.compound_v2.cUSDC["repayBorrow"](),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Compound V2 - DAI
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([DAI], [compound_v2.cDAI]),

        // Deposit
        // {
        //     targetAddress: cDAI,
        //     signature: "mint(uint256)",
        // },
        allow.mainnet.compound_v2.cDAI["mint"](),

        // Withdrawing: sender redeems uint256 cTokens, it is called when MAX is withdrawn
        // {
        //     targetAddress: cDAI,
        //     signature: "redeem(uint256)",
        // },
        allow.mainnet.compound_v2.cDAI["redeem"](),

        // Withdrawing: sender redeems cTokens in exchange for a specified amount of underlying asset (uint256), it is called when MAX isn't withdrawn
        // {
        //     targetAddress: cDAI,
        //     signature: "redeemUnderlying(uint256)",
        // },
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
        // {
        //     targetAddress: COMPTROLLER,
        //     signature: "exitMarket(address)",
        //     params: {
        //         [0]: staticEqual(cDAI, "address"),
        //     },
        // },
        allow.mainnet.compound_v2.comptroller["exitMarket"](
            compound_v2.cDAI
        ),

        // Borrow specified amount of underlying asset (uint256)
        // {
        //     targetAddress: cDAI,
        //     signature: "borrow(uint256)",
        // },
        allow.mainnet.compound_v2.cDAI["borrow"](),

        // Repay specified borrowed amount of underlying asset (uint256)
        // {
        //     targetAddress: cDAI,
        //     signature: "repayBorrow(uint256)",
        // },
        allow.mainnet.compound_v2.cDAI["repayBorrow"](),

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
        // Compound V3
        //---------------------------------------------------------------------------------------------------------------------------------

        //---------------------------------------------------------------------------------------------------------------------------------
        // Compound V3 - USDC
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([USDC], [compound_v3.cUSDCv3]),

        // Supply/Repay
        allow.mainnet.compound_v3.cUSDCv3["supply"](
            USDC
        ),

        // Withdraw/Borrow
        allow.mainnet.compound_v3.cUSDCv3["withdraw"](
            USDC
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Compound V3 - ETH
        //---------------------------------------------------------------------------------------------------------------------------------
        // You need to approve the Compound III proxy (MainnetBulker) contract first. You only need to do this once.
        allow.mainnet.compound_v3.cUSDCv3["allow"](
            compound_v3.MainnetBulker
        ),

        // Supply
        {
            targetAddress: compound_v3.MainnetBulker,
            signature:
                "invoke(bytes32[],bytes[])",
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
                [8]: staticEqual(AVATAR)
            },
            send: true,
        },

        // Withdraw
        {
            targetAddress: compound_v3.MainnetBulker,
            signature:
                "invoke(bytes32[],bytes[])",
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
                [8]: staticEqual(AVATAR)
            },
            send: true
        },

        //---------------------------------------------------------------------------------------------------------------------------------
        // Compound V3 - Claiming of rewards
        //---------------------------------------------------------------------------------------------------------------------------------
        allow.mainnet.compound_v3.CometRewards["claim"](
            compound_v3.cUSDCv3,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // OMNI BRIDGE
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([GNO, COW], [OMNI_BRIDGE]),
        // {
        //     targetAddress: OMNI_BRIDGE,
        //     signature: "relayTokens(address,address,uint256)",
        //     params: {
        //         [1]: staticEqual(BRIDGE_RECIPIENT_GNOSIS_CHAIN),
        //     },
        // },
        allow.mainnet.omnibridge["relayTokens(address,address,uint256)"](
            undefined,
            BRIDGE_RECIPIENT_GNOSIS_CHAIN
        )
    ],
    placeholders: { AVATAR, BRIDGE_RECIPIENT_GNOSIS_CHAIN },
} satisfies RolePreset

export default preset
