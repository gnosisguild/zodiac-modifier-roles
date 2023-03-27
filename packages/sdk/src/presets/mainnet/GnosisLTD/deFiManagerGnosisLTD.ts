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

// Tokens
const auraBAL = "0x616e8BfA43F920657B3497DBf40D6b1A02D4608d"
const GNO = "0x6810e776880C02933D47DB1b9fc05908e5386b96"
const COW = "0xDEf1CA1fb7FBcDC777520aa7f396b4E015F497aB"
const AURA = "0xC0c293ce456fF0ED870ADd98a0828Dd4d2903DBF"
const BAL = "0xba100000625a3754423978a60c9317c58a424e3D"
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7"

// Balancer contracts
const BALANCER_VAULT = "0xBA12222222228d8Ba445958a75a0704d566BF2C8"
const BALANCER_RELAYER = "0x2536dfeecb7a0397cf98edada8486254533b1afa"
const BALANCER_RELAYER_LIBRARY = "0xd02992266BB6a6324A3aB8B62FeCBc9a3C58d1F9"

// Balancer LP Tokens
const bb_a_USD = "0xA13a9247ea42D743238089903570127DdA72fE44"
const B_50COW_50GNO = "0x92762B42A06dCDDDc5B7362Cfb01E631c4D44B40"
const B_80BAL_20WETH = "0x5c6Ee304399DBdB9C8Ef030aB642B10820DB8F56"
const bb_a_DAI = "0xae37D54Ae477268B9997d4161B96b8200755935c"
const bb_a_USDT = "0x2F4eb100552ef93840d5aDC30560E5513DFfFACb"
const bb_a_USDC = "0x82698aeCc9E28e9Bb27608Bd52cF57f704BD1B83"

// Balancer Gauges
const B_50COW_50GNO_GAUGE = "0xA6468eca7633246Dcb24E5599681767D27d1F978"
const bb_a_USD_GAUGE = "0xa6325e799d266632D347e41265a69aF111b05403"

// Aura contracts
const BOOSTER_ADDRESS = "0xA57b8d98dAE62B26Ec3bcC4a365338157060B234"
const REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS =
    "0xB188b1CB84Fb0bA13cb9ee1292769F903A9feC59"

const aurabb_a_USD_REWARDER = "0xFb6b1c1A1eA5618b3CfC20F81a11A97E930fA46B"
const aura50COW_50GNO_REWARDER = "0x6256518aE9a97C408a03AAF1A244989Ce6B937F6"

const auraBAL_STAKING_REWARDER = "0x00A7BA8Ae7bca0B10A32Ea1f8e2a1Da980c6CAd2"
const B_80BAL_20WETH_DEPOSITOR = "0xeAd792B55340Aa20181A80d6a16db6A0ECd1b827"
const BAL_DEPOSITOR = "0x68655AD9852a99C87C0934c7290BB62CFa5D4123"

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
        ...allowErc20Approve([bb_a_USD], [BOOSTER_ADDRESS]),

        // {
        //     targetAddress: BOOSTER_ADDRESS,
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
        ...allowErc20Approve([B_50COW_50GNO], [BOOSTER_ADDRESS]),
        ...allowErc20Approve([GNO, COW], [REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS]),

        // {
        //     targetAddress: BOOSTER_ADDRESS,
        //     signature: "deposit(uint256,uint256,bool)",
        //     params: {
        //         [0]: staticEqual(3, "uint256"), // Aura poolId
        //     },
        // },
        allow.mainnet.aura.booster["deposit"](
            3), // Aura poolId

        {
            targetAddress: REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS,
            signature:
                "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
            params: {
                [0]: staticEqual(aura50COW_50GNO_REWARDER, "address"),
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
        ...allowErc20Approve([auraBAL], [auraBAL_STAKING_REWARDER]),

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
        ...allowErc20Approve([B_80BAL_20WETH], [B_80BAL_20WETH_DEPOSITOR]),

        // {
        //   targetAddress: B_80BAL_20WETH_DEPOSITOR,
        //   signature: "deposit(uint256,bool,address)",
        //   params: {
        //     [2]: staticEqual(auraBAL_STAKING_REWARDER, "address"),
        //   },
        // },
        allow.mainnet.aura.B_80BAL_20WETH_depositor["deposit(uint256,bool,address)"](
            undefined,
            undefined,
            auraBAL_STAKING_REWARDER,
        ),

        // Using BAL
        ...allowErc20Approve([BAL], [BAL_DEPOSITOR]),

        // {
        //   targetAddress: BAL_DEPOSITOR,
        //   signature: "deposit(uint256,uint256,bool,address)",
        //   params: {
        //     [3]: staticEqual(auraBAL_STAKING_REWARDER, "address"),
        //   },
        // },
        allow.mainnet.aura.BAL_depositor["deposit"](
            undefined,
            undefined,
            undefined,
            auraBAL_STAKING_REWARDER,
        ),

        // Claiming auraBAL Staking Rewards
        // {
        //   targetAddress: auraBAL_STAKING_REWARDER,
        //   signature: "getReward()",
        // },
        allow.mainnet.aura.auraBAL_staking_rewarder["getReward()"](),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Locking AURA
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([AURA], [AURA_LOCKER]),

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
        allow.mainnet.aura.aura_locker["delegate"](),

        // Proposals Delegation - IMPORTANT: THE ADDRESS SHOULD BE CONSTRAINED IN ORDER TO AVOID DELEGATING THE VOTING POWER TO UNWANTED ADDRESSES
        // {
        //   targetAddress: SNAPSHOT_DELEGATE_REGISTRY,
        //   signature: "setDelegate(bytes32,address)",
        // },
        allow.mainnet.aura.snapshot_delegate_registry["setDelegate"](),

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
        // BALANCER
        //---------------------------------------------------------------------------------------------------------------------------------

        // Relayer Approval (this is done only once per wallet)
        allow.mainnet.balancer.relayer_library["setRelayerApproval"](
            BALANCER_RELAYER
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Balancer Boosted Aave USD
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([bb_a_USD], [bb_a_USD_GAUGE]),
        ...allowErc20Approve([DAI, USDT, USDC], [BALANCER_VAULT]),

        // Swap DAI for bb_a_DAI (for both, join and exit pool)
        // Swap USDT for bb_a_USDT (for both, join and exit pool)
        // Swap USDC for bb_a_USDC (for both, join and exit pool)
        {
            targetAddress: BALANCER_RELAYER_LIBRARY,
            signature:
                "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256,uint256,uint256)",
            params: {
                [0]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000120",
                    "bytes32"), // Offset of the tuple from beginning 288=32*9
                [1]: staticOneOf([
                    AVATAR,
                    BALANCER_RELAYER,
                ],
                    "address"), // sender
                [3]: staticOneOf([
                    AVATAR,
                    BALANCER_RELAYER,
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
                    bb_a_DAI,
                    USDT,
                    bb_a_USDT,
                    USDC,
                    bb_a_USDC
                ],
                    "address"), // assetIn
                [12]: staticOneOf([
                    DAI,
                    bb_a_DAI,
                    USDT,
                    bb_a_USDT,
                    USDC,
                    bb_a_USDC
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
            targetAddress: BALANCER_RELAYER_LIBRARY,
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
                    BALANCER_RELAYER,
                ],
                    "address"), // sender
                [3]: staticOneOf([
                    AVATAR,
                    BALANCER_RELAYER,
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
                [12]: staticEqual(bb_a_USDT, "address"),
                [13]: staticEqual(bb_a_USDC, "address"),
                [14]: staticEqual(bb_a_USD, "address"),
                [15]: staticEqual(bb_a_DAI, "address"),
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
            targetAddress: BALANCER_RELAYER_LIBRARY,
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
                    BALANCER_RELAYER,
                ],
                    "address"), // sender
                [3]: staticOneOf([
                    AVATAR,
                    BALANCER_RELAYER,
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
                [11]: staticEqual(bb_a_USDT, "address"),
                [12]: staticEqual(bb_a_USDC, "address"),
                [13]: staticEqual(bb_a_USD, "address"),
                [14]: staticEqual(bb_a_DAI, "address"),
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

        // Stake
        allow.mainnet.balancer.bb_a_USD_gauge["deposit(uint256)"](),

        // Unstake
        allow.mainnet.balancer.bb_a_USD_gauge["withdraw(uint256)"](),

        // Claim Rewards
        allow.mainnet.balancer.bb_a_USD_gauge["claim_rewards()"](),

        // Claim BAL Rewards
        allow.mainnet.balancer.BAL_minter["mint"](
            bb_a_USD_GAUGE
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Balancer GNO/COW pool
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([GNO, COW], [BALANCER_VAULT]),
        ...allowErc20Approve([B_50COW_50GNO], [B_50COW_50GNO_GAUGE]),

        // Add Liquidity
        {
            targetAddress: BALANCER_VAULT,
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
            targetAddress: BALANCER_VAULT,
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
            B_50COW_50GNO_GAUGE
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Compound V2
        //---------------------------------------------------------------------------------------------------------------------------------

        //---------------------------------------------------------------------------------------------------------------------------------
        // Compound V2 - USDC
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([USDC], [cUSDC]),

        // Deposit
        // {
        //     targetAddress: cUSDC,
        //     signature: "mint(uint256)",
        // },
        allow.mainnet.compound.cUSDC["mint"](),

        // Withdrawing: sender redeems uint256 cTokens, it is called when MAX is withdrawn
        // {
        //     targetAddress: cUSDC,
        //     signature: "redeem(uint256)",
        // },
        allow.mainnet.compound.cUSDC["redeem"](),

        // Withdrawing: sender redeems cTokens in exchange for a specified amount of underlying asset (uint256), it is called when MAX isn't withdrawn
        // {
        //     targetAddress: cUSDC,
        //     signature: "redeemUnderlying(uint256)",
        // },
        allow.mainnet.compound.cUSDC["redeemUnderlying"](),

        // Use as Collateral
        // We are only allowing to call this function with one single token address, since it's the way the UI does it
        {
            targetAddress: COMPTROLLER,
            signature: "enterMarkets(address[])",
            params: {
                [0]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000020",
                    "bytes32"
                ), // // Offset of address[] from beginning of tuple 64=32*2
                [1]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "bytes32"
                ), // Length of address[] = 1
                [2]: staticEqual(cUSDC, "address"),
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
        allow.mainnet.compound.comptroller["exitMarket"](
            cUSDC
        ),

        // Borrow specified amount of underlying asset (uint256)
        // {
        //     targetAddress: cUSDC,
        //     signature: "borrow(uint256)",
        // },
        allow.mainnet.compound.cUSDC["borrow"](),

        // Repay specified borrowed amount of underlying asset (uint256)
        // {
        //     targetAddress: cUSDC,
        //     signature: "repayBorrow(uint256)",
        // },
        allow.mainnet.compound.cUSDC["repayBorrow"](),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Compound V2 - DAI
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([DAI], [cDAI]),

        // Deposit
        // {
        //     targetAddress: cDAI,
        //     signature: "mint(uint256)",
        // },
        allow.mainnet.compound.cDAI["mint"](),

        // Withdrawing: sender redeems uint256 cTokens, it is called when MAX is withdrawn
        // {
        //     targetAddress: cDAI,
        //     signature: "redeem(uint256)",
        // },
        allow.mainnet.compound.cDAI["redeem"](),

        // Withdrawing: sender redeems cTokens in exchange for a specified amount of underlying asset (uint256), it is called when MAX isn't withdrawn
        // {
        //     targetAddress: cDAI,
        //     signature: "redeemUnderlying(uint256)",
        // },
        allow.mainnet.compound.cDAI["redeemUnderlying"](),

        // Use as Collateral
        // We are only allowing to call this function with one single token address, since it's the way the UI does it
        {
            targetAddress: COMPTROLLER,
            signature: "enterMarkets(address[])",
            params: {
                [0]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000020",
                    "bytes32"
                ), // // Offset of address[] from beginning of tuple 64=32*2
                [1]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "bytes32"
                ), // Length of address[] = 1
                [2]: staticEqual(cDAI, "address"),
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
        allow.mainnet.compound.comptroller["exitMarket"](
            cDAI
        ),

        // Borrow specified amount of underlying asset (uint256)
        // {
        //     targetAddress: cDAI,
        //     signature: "borrow(uint256)",
        // },
        allow.mainnet.compound.cDAI["borrow"](),

        // Repay specified borrowed amount of underlying asset (uint256)
        // {
        //     targetAddress: cDAI,
        //     signature: "repayBorrow(uint256)",
        // },
        allow.mainnet.compound.cDAI["repayBorrow"](),

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
