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

// Balancer LP Tokens
const BB_A_USD = "0xA13a9247ea42D743238089903570127DdA72fE44"
const B_50COW_50GNO = "0x92762B42A06dCDDDc5B7362Cfb01E631c4D44B40"
const B_80BAL_20WETH = "0x5c6Ee304399DBdB9C8Ef030aB642B10820DB8F56"

// Aura contracts
const AURA_BOOSTER = "0xA57b8d98dAE62B26Ec3bcC4a365338157060B234"
const AURA_REWARD_POOL_DEPOSIT_WRAPPER =
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

        // {
        //     targetAddress: aurabb_a_USD_REWARDER,
        //     signature: "withdrawAndUnwrap(uint256,bool)",
        // },
        allow.mainnet.aura.aurabb_a_USD_rewarder["withdrawAndUnwrap"](),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Aura GNO/COW
        //---------------------------------------------------------------------------------------------------------------------------------

        // {
        //     targetAddress: aura50COW_50GNO_REWARDER,
        //     signature: "withdrawAndUnwrap(uint256,bool)",
        // },
        allow.mainnet.aura.aura50COW_50GNO_rewarder["withdrawAndUnwrap"](),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Staking auraBAL
        //---------------------------------------------------------------------------------------------------------------------------------

        // {
        //   targetAddress: auraBAL_STAKING_REWARDER,
        //   signature: "withdraw(uint256,bool)",
        // },
        allow.mainnet.aura.auraBAL_staking_rewarder["withdraw"](),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Locking AURA
        //---------------------------------------------------------------------------------------------------------------------------------

        // Process Expired AURA Locks - True -> Relock Expired Locks / False -> Withdraw Expired Locks
        // {
        //   targetAddress: AURA_LOCKER,
        //   signature: "processExpiredLocks(bool)",
        // },
        allow.mainnet.aura.aura_locker["processExpiredLocks"](),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Compound V2
        //---------------------------------------------------------------------------------------------------------------------------------

        //---------------------------------------------------------------------------------------------------------------------------------
        // Compound V2 - USDC
        //---------------------------------------------------------------------------------------------------------------------------------

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

        // Repay specified borrowed amount of underlying asset (uint256)
        // {
        //     targetAddress: cUSDC,
        //     signature: "repayBorrow(uint256)",
        // },
        allow.mainnet.compound.cUSDC["repayBorrow"](),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Compound V2 - DAI
        //---------------------------------------------------------------------------------------------------------------------------------

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

        // Repay specified borrowed amount of underlying asset (uint256)
        // {
        //     targetAddress: cDAI,
        //     signature: "repayBorrow(uint256)",
        // },
        allow.mainnet.compound.cDAI["repayBorrow"](),
    ],
    placeholders: { AVATAR },
} satisfies RolePreset

export default preset
