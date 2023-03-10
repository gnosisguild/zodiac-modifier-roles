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

// Tokens
const auraBAL = "0x616e8BfA43F920657B3497DBf40D6b1A02D4608d"
const GNO = "0x6810e776880C02933D47DB1b9fc05908e5386b96"
const COW = "0xDEf1CA1fb7FBcDC777520aa7f396b4E015F497aB"
const AURA = "0xC0c293ce456fF0ED870ADd98a0828Dd4d2903DBF"
const BAL = "0xba100000625a3754423978a60c9317c58a424e3D"
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F"

// Balancer LP Tokens
const BB_A_USD = "0xA13a9247ea42D743238089903570127DdA72fE44"
const B_50COW_50GNO = "0x92762B42A06dCDDDc5B7362Cfb01E631c4D44B40"
const B_80BAL_20WETH = "0x5c6Ee304399DBdB9C8Ef030aB642B10820DB8F56"

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
        ...allowErc20Approve([BB_A_USD], [BOOSTER_ADDRESS]),

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
                ), // Offset of tuple from beggining 160=32*5
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
