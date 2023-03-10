import { ZERO_ADDRESS } from "./addresses"
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
import { allow } from "../allow"

// Tokens
const GNO = "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb"
const COW = "0x177127622c4A00F3d409B75571e12cB3c8973d3c"
const WETH = "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1"
const EURe = "0xcB444e90D8198415266c6a2724b7900fb12FC56E"
const x3CRV = "0x1337BedC9D22ecbe766dF105c9623922A27963EC"
const WXDAI = "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d"
const USDC = "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83"
const USDT = "0x4ECaBa5870353805a9F068101A40E0f32ed605C6"
const armmWXDAI = "0x7349c9eaa538e118725a6130e0f8341509b9f8a0"
const variableDebtrmmWXDAI = "0x6a7CeD66902D07066Ad08c81179d17d0fbE36829"

// SushiSwap contracts
const SLP_WETH_GNO = "0x15f9EEdeEBD121FBb238a8A0caE38f4b4A07A585"
const SUSHISWAP_ROUTER = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506"
const MINI_CHEF_V2 = "0xdDCbf776dF3dE60163066A5ddDF2277cB445E0F3"

// Curve contracts
const crvEUReUSD_LP = "0x0CA1C1eC4EBf3CC67a9f545fF90a3795b318cA4a"
const crvEUReUSD_POOL = "0x056C6C5e684CeC248635eD86033378Cc444459B0"
const crvEUReUSD_GAUGE = "0xd91770E868c7471a9585d1819143063A40c54D00"
const crvEUReUSD_ZAP = "0xE3FFF29d4DC930EBb787FeCd49Ee5963DADf60b6"
const STAKE_DEPOSIT_ZAP = "0xB7De33440B7171159a9718CBE748086cecDd9685"

// RealT contracts
const REALT_GATEWAY = "0x80Dc050A8C923C0051D438026f1192d53033728c"
const REALT_LENDING_POOL = "0x5B8D36De471880Ee21936f328AAB2383a280CB2A"

// Honeyswap contracts
const HONEYSWAP_ROUTER = "0x1C232F01118CB8B424793ae03F870aa7D0ac7f77"
// const HONEYSWAP_MULTI_WITHDRAWER = "0x53f224f83b2B2365caf4178f52C234dA1ecF392f"
const HLP_COW_GNO = "0x6a43be8A3daBf8a0A7B56773F536266aE932a451"


const preset = {
    network: 100,
    allow: [

        //---------------------------------------------------------------------------------------------------------------------------------
        // SushiSwap
        //---------------------------------------------------------------------------------------------------------------------------------

        //---------------------------------------------------------------------------------------------------------------------------------
        // SushiSwap WETH/GNO
        //---------------------------------------------------------------------------------------------------------------------------------

        // Remove Liquidity
        // {
        //     targetAddress: SUSHISWAP_ROUTER,
        //     signature: "removeLiquidity(address,address,uint256,uint256,uint256,address,uint256)",
        //     params: {
        //         [0]: staticEqual(WETH, "address"),
        //         [1]: staticEqual(GNO, "address"),
        //         [5]: staticEqual(AVATAR),
        //     },
        // },
        allow.gnosis.sushiswap.router["removeLiquidity"](
            WETH,
            GNO,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        // Remove Liquidity
        // {
        //     targetAddress: SUSHISWAP_ROUTER,
        //     signature: "removeLiquidityWithPermit(address,address,uint256,uint256,uint256,address,uint256,bool,uint8,bytes32,bytes32)",
        //     params: {
        //         [0]: staticEqual(WETH, "address"),
        //         [1]: staticEqual(GNO, "address"),
        //         [5]: staticEqual(AVATAR),
        //     },
        // },
        allow.gnosis.sushiswap.router["removeLiquidityWithPermit"](
            WETH,
            GNO,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        // Unstake and Claim Rewards
        // {
        //     targetAddress: MINI_CHEF_V2,
        //     signature: "withdrawAndHarvest(uint256,uint256,address)",
        //     params: {
        //         [0]: staticEqual(9, "uint256"), // SushiSwap poolId
        //         [2]: staticEqual(AVATAR),
        //     },
        // },
        allow.gnosis.sushiswap.minichef_v2["withdrawAndHarvest"](
            9,
            undefined,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Curve
        //---------------------------------------------------------------------------------------------------------------------------------

        //---------------------------------------------------------------------------------------------------------------------------------
        // Curve EURe/x3CRV
        //---------------------------------------------------------------------------------------------------------------------------------

        // Remove Liquidity
        // {
        //     targetAddress: crvEUReUSD_POOL,
        //     signature: "remove_liquidity(uint256,uint256[2])",
        // },
        allow.gnosis.curve.crvEUReUSD_pool["remove_liquidity(uint256,uint256[2])"](),

        // Remove Liquidity (Underlying, using ZAP)
        // {
        //     targetAddress: crvEUReUSD_ZAP,
        //     signature: "remove_liquidity(uint256,uint256[4])",
        // },
        allow.gnosis.curve.crvEUReUSD_zap["remove_liquidity(uint256,uint256[4])"](),

        // Remove Liquidity of One Coin
        // {
        //     targetAddress: crvEUReUSD_POOL,
        //     signature: "remove_liquidity_one_coin(uint256,uint256,uint256)",
        // },
        allow.gnosis.curve.crvEUReUSD_pool["remove_liquidity_one_coin(uint256,uint256,uint256)"](),

        // Remove Liquidity of One Coin (Underlying, using ZAP)
        // {
        //     targetAddress: crvEUReUSD_ZAP,
        //     signature: "remove_liquidity_one_coin(uint256,uint256,uint256)",
        // },
        allow.gnosis.curve.crvEUReUSD_zap["remove_liquidity_one_coin(uint256,uint256,uint256)"](),

        // Unstake
        // {
        //     targetAddress: crvEUReUSD_GAUGE,
        //     signature: "withdraw(uint256)",
        // },
        allow.gnosis.curve.crvEUReUSD_gauge["withdraw(uint256)"](),

        // NO EVIDENCE OF BEING USED
        // {
        //     targetAddress: crvEUReUSD_GAUGE,
        //     signature: "withdraw(uint256,address,bool)",
        //     params: {
        //         [1]: staticEqual(AVATAR),
        //     },
        // },
        // allow.gnosis.curve.crvEUReUSD_gauge["withdraw(uint256,address,bool)"](
        //     undefined,
        //     AVATAR
        // ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // RealT
        //---------------------------------------------------------------------------------------------------------------------------------

        // Set/Unset (bool "useAsCollateral" = True / "useAsCollateral" = False) WXDAI as Collateral (Set)
        // {
        //     targetAddress: REALT_LENDING_POOL,
        //     signature: "setUserUseReserveAsCollateral(address,bool)",
        //     params: {
        //         [0]: staticEqual(WXDAI, "address")
        //     }
        // },
        allow.gnosis.realt.lending_pool["setUserUseReserveAsCollateral"](
            WXDAI
        ),

        // Withdraw XDAI
        // {
        //     targetAddress: REALT_GATEWAY,
        //     signature: "withdrawETH(address,uint256,address)",
        //     params: {
        //         [0]: staticEqual(REALT_LENDING_POOL, "address"),
        //         [2]: staticEqual(AVATAR),
        //     }
        // },
        allow.gnosis.realt.gateway["withdrawETH"](
            REALT_LENDING_POOL,
            undefined,
            AVATAR
        ),

        // Repay Debt
        // {
        //     targetAddress: REALT_GATEWAY,
        //     signature: "repayETH(address,uint256,uint256,address)",
        //     params: {
        //         [0]: staticEqual(REALT_LENDING_POOL, "address"),
        //         [3]: staticEqual(AVATAR),
        //     }
        // },
        allow.gnosis.realt.gateway["repayETH"](
            REALT_LENDING_POOL,
            undefined,
            undefined,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Honeyswap
        //---------------------------------------------------------------------------------------------------------------------------------

        //---------------------------------------------------------------------------------------------------------------------------------
        // Honeyswap COW/GNO
        //---------------------------------------------------------------------------------------------------------------------------------

        // Remove Liquidity
        // {
        //     targetAddress: HONEYSWAP_ROUTER,
        //     signature: "removeLiquidity(address,address,uint256,uint256,uint256,address,uint256)",
        //     params: {
        //         [0]: staticEqual(COW, "address"),
        //         [1]: staticEqual(GNO, "address"),
        //         [5]: staticEqual(AVATAR),
        //     },
        // },
        allow.gnosis.honeyswap.router["removeLiquidity"](
            COW,
            GNO,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),
    ],
    placeholders: { AVATAR },
} satisfies RolePreset

export default preset
