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
const armmWXDAI = "0x7349c9eaa538e118725a6130e0f8341509b9f8a0"
const variableDebtrmmWXDAI = "0x6a7CeD66902D07066Ad08c81179d17d0fbE36829"

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
        ...allowErc20Approve([WETH, GNO], [SUSHISWAP_ROUTER]),
        ...allowErc20Approve([SLP_WETH_GNO], [SUSHISWAP_ROUTER]),

        // Add Liquidity
        // {
        //     targetAddress: SUSHISWAP_ROUTER,
        //     signature: "addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)",
        //     params: {
        //         [0]: staticEqual(WETH, "address"),
        //         [1]: staticEqual(GNO, "address"),
        //         [6]: staticEqual(AVATAR),
        //     },
        // },
        allow.gnosis.sushiswap.router["addLiquidity"](
            WETH,
            GNO,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

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

        // Stake
        // {
        //     targetAddress: MINI_CHEF_V2,
        //     signature: "deposit(uint256,uint256,address)",
        //     params: {
        //         [0]: staticEqual(9, "uint256"), // SushiSwap poolId
        //         [2]: staticEqual(AVATAR),
        //     },
        // },
        allow.gnosis.sushiswap.minichef_v2["deposit"](
            9,
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

        // Claim Rewards
        // {
        //     targetAddress: MINI_CHEF_V2,
        //     signature: "harvest(uint256,address)",
        //     params: {
        //         [0]: staticEqual(9, "uint256"), // SushiSwap poolId
        //         [1]: staticEqual(AVATAR),
        //     },
        // },
        allow.gnosis.sushiswap.minichef_v2["harvest"](
            9,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Curve
        //---------------------------------------------------------------------------------------------------------------------------------

        //---------------------------------------------------------------------------------------------------------------------------------
        // Curve EURe/x3CRV
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([EURe, x3CRV], [crvEUReUSD_POOL]),
        ...allowErc20Approve([crvEUReUSD_LP], [crvEUReUSD_GAUGE]),
        ...allowErc20Approve([EURe, WXDAI, USDC, USDT], [crvEUReUSD_ZAP]),
        ...allowErc20Approve([EURe, x3CRV, WXDAI, USDC, USDT], [STAKE_DEPOSIT_ZAP]),

        // Add Liquidity
        // {
        //     targetAddress: crvEUReUSD_POOL,
        //     signature: "add_liquidity(uint256[2],uint256)",
        // },
        allow.gnosis.curve.crvEUReUSD_pool["add_liquidity(uint256[2],uint256)"](),

        // Add Liquidity (Underlying, using ZAP)
        // {
        //     targetAddress: crvEUReUSD_ZAP,
        //     signature: "add_liquidity(uint256[4],uint256)",
        // },
        allow.gnosis.curve.crvEUReUSD_zap["add_liquidity(uint256[4],uint256)"](),

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

        // Exchange
        // {
        //     targetAddress: crvEUReUSD_POOL,
        //     signature: "exchange(uint256,uint256,uint256,uint256)",
        // },
        allow.gnosis.curve.crvEUReUSD_pool["exchange(uint256,uint256,uint256,uint256)"](),

        // Exchange (Underlying, using ZAP)
        // {
        //     targetAddress: crvEUReUSD_ZAP,
        //     signature: "exchange_underlying(uint256,uint256,uint256,uint256)",
        // },
        allow.gnosis.curve.crvEUReUSD_zap["exchange_underlying(uint256,uint256,uint256,uint256)"](),

        // Stake
        // {
        //     targetAddress: crvEUReUSD_GAUGE,
        //     signature: "deposit(uint256)",
        // },
        allow.gnosis.curve.crvEUReUSD_gauge["deposit(uint256)"](),

        // NO EVIDENCE OF BEING USED
        // {
        //     targetAddress: crvEUReUSD_GAUGE,
        //     signature: "deposit(uint256,address,bool)",
        //     params: {
        //         [1]: staticEqual(AVATAR),
        //     },
        // },
        allow.gnosis.curve.crvEUReUSD_gauge["deposit(uint256,address,bool)"](
            undefined,
            AVATAR
        ),

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
        allow.gnosis.curve.crvEUReUSD_gauge["withdraw(uint256,address,bool)"](
            undefined,
            AVATAR
        ),

        // Claim Rewards
        // {
        //     targetAddress: crvEUReUSD_GAUGE,
        //     signature: "claim_rewards()",
        // },
        allow.gnosis.curve.crvEUReUSD_gauge["claim_rewards()"](),

        // Deposit and Stake using a special ZAP
        // {
        //     targetAddress: STAKE_DEPOSIT_ZAP,
        //     signature: "deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)",
        //     params: {
        //         [0]: staticEqual(crvEUReUSD_POOL, "address"),
        //         [1]: staticEqual(crvEUReUSD_LP, "address"),
        //         [2]: staticEqual(crvEUReUSD_GAUGE, "address"),
        //         [3]: staticOneOf([2, 4], "uint256"),
        //         [4]: staticOneOf([
        //             [EURe, x3CRV, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
        //             [EURe, WXDAI, USDC, USDT, ZERO_ADDRESS]],
        //             "address[5]"),
        //         [8]: staticEqual(ZERO_ADDRESS, "address"),
        //     },
        // },
        allow.gnosis.curve.stake_deposit_zap["deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)"](
            crvEUReUSD_POOL,
            crvEUReUSD_LP,
            crvEUReUSD_GAUGE,
            {
                oneOf: [2, 4]
            },
            {
                oneOf: [
                    [EURe, x3CRV, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
                    [EURe, WXDAI, USDC, USDT, ZERO_ADDRESS]
                ]
            },
            undefined,
            undefined,
            undefined,
            ZERO_ADDRESS
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // RealT
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([armmWXDAI], [REALT_GATEWAY]),

        // Deposit XDAI
        // {
        //     targetAddress: REALT_GATEWAY,
        //     signature: "depositETH(address,address,uint16)",
        //     params: {
        //         [0]: staticEqual(REALT_LENDING_POOL, "address"),
        //         [1]: staticEqual(AVATAR),
        //         [2]: staticEqual(0, "uint16")
        //     },
        //     send: true,
        // },
        allow.gnosis.realt.gateway["depositETH"](
            REALT_LENDING_POOL,
            AVATAR,
            0,
            {
                send: true
            }
        ),

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

        // Approve delegation (Variable APY Debt) - There's no possibility to take debt with a Stable APY by the moment
        // {
        //     targetAddress: variableDebtrmmWXDAI,
        //     signature: "approveDelegation(address,uint256)",
        //     params: {
        //         [0]: staticEqual(REALT_GATEWAY, "address")
        //     }
        // },
        allow.gnosis.realt.variableDebtrmmWXDAI["approveDelegation"](
            REALT_GATEWAY
        ),

        // Borrow XDAI
        // {
        //     targetAddress: REALT_GATEWAY,
        //     signature: "borrowETH(address,uint256,uint256,uint16)",
        //     params: {
        //         [0]: staticEqual(REALT_LENDING_POOL, "address"),
        //         [3]: staticEqual(0, "uint16")
        //     }
        // },
        allow.gnosis.realt.gateway["borrowETH"](
            REALT_LENDING_POOL,
            undefined,
            undefined,
            0
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
        ...allowErc20Approve([COW, GNO], [HONEYSWAP_ROUTER]),
        ...allowErc20Approve([HLP_COW_GNO], [HONEYSWAP_ROUTER]),

        // Add Liquidity
        // {
        //     targetAddress: HONEYSWAP_ROUTER,
        //     signature: "addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)",
        //     params: {
        //         [0]: staticEqual(COW, "address"),
        //         [1]: staticEqual(GNO, "address"),
        //         [6]: staticEqual(AVATAR),
        //     },
        // },
        allow.gnosis.honeyswap.router["addLiquidity"](
            {
                oneOf: [COW, GNO]
            },
            {
                oneOf: [COW, GNO]
            },
            undefined,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

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

        // // Claim Rewards
        // {
        //     targetAddress: HONEYSWAP_MULTI_WITHDRAWER,
        //     signature: "withdrawRewardsFrom(uint256[])",
        // }
    ],
    placeholders: { AVATAR },
} satisfies RolePreset

export default preset
