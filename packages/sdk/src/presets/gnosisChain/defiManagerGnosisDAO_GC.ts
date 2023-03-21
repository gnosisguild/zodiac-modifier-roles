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
import { send } from "process"

// Tokens
const GNO = "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb"
const sGNO = "0xA4eF9Da5BA71Cc0D2e5E877a910A37eC43420445"
const rGNO = "0x6aC78efae880282396a335CA2F79863A1e6831D4"
const FLX = "0xD87eaA26dCfB0C0A6160cCf8c8a01BEB1C15fB00"
const GIV = "0x4f4F9b8D5B4d0Dc10506e5551B0513B61fD59e75"
const WATER = "0x4291f029b9e7acb02d49428458cf6fceac545f81"
const QI = "0xdFA46478F9e5EA86d57387849598dbFB2e964b02"
const BER = "0x05698e7346ea67cfb088f64ad8962b18137d17c0"
const WETH = "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1"
const wstETH = "0x6C76971f98945AE98dD7d4DFcA8711ebea946eA6"
const WBTC = "0x8e5bBbb09Ed1ebdE8674Cda39A0c169401db4252"
const x3CRV = "0x1337BedC9D22ecbe766dF105c9623922A27963EC"
const CRV = "0x712b3d230F3C1c19db860d80619288b1F0BDd0Bd"
const WXDAI = "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d"
const USDC = "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83"
const USDT = "0x4ECaBa5870353805a9F068101A40E0f32ed605C6"
const SUSHI = "0x2995D1317DcD4f0aB89f4AE60F3f020A4F17C7CE"
const AGVE = "0x3a97704a1b25F08aa230ae53B352e2e72ef52843"
const stkAGVE = "0x610525b415c1BFAeAB1a3fc3d85D87b92f048221"

// SushiSwap contracts
const SLP_SUSHI_GNO = "0xF38c5b39F29600765849cA38712F302b1522C9B8"
const SLP_WETH_wstETH = "0xE6B448c0345bF6AA52ea3A5f17aabd0e58F23912"
const SUSHISWAP_ROUTER = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506"
const MINI_CHEF_V2 = "0xdDCbf776dF3dE60163066A5ddDF2277cB445E0F3"

// Curve contracts
const sgnoCRV_LP_POOL = "0xBdF4488Dcf7165788D438b62B4C8A333879B7078"
const sgnoCRV_GAUGE = "0x2686d5E477d1AaA58BF8cE598fA95d97985c7Fb1"
const crv3crypto_POOL = "0x5633E00994896D0F472926050eCb32E38bef3e65"
const crv3crypto_LP = "0x02E7e2dd3BA409148A49D5cc9a9034D2f884F245"
const crv3crypto_GAUGE = "0x3f7693797352A321f8D532A8B297F91DD31898D8"
const crv3crypto_ZAP = "0xF182926A64C0A19234E7E1FCDfE772aA7A1CA351"
const rgnoCRV_LP_POOL = "0x5D7309a01B727d6769153fCB1dF5587858d53B9C"
const rgnoCRV_GAUGE = "0x9509A9D5C55793858FE8b1C00a99e012a7AF4aaB"
const STAKE_DEPOSIT_ZAP = "0xB7De33440B7171159a9718CBE748086cecDd9685"

// Honeyswap contracts
const HONEYSWAP_ROUTER = "0x1C232F01118CB8B424793ae03F870aa7D0ac7f77"
// const HONEYSWAP_MULTI_WITHDRAWER = "0x53f224f83b2B2365caf4178f52C234dA1ecF392f"
const HLP_WETH_GNO = "0x28Dbd35fD79f48bfA9444D330D14683e7101d817"
const HLP_GNO_FLX = "0xF0376d1faFD1ff2F1367546da622ba8F26829D7A"
const HLP_GNO_WXDAI = "0x321704900D52F44180068cAA73778d5cD60695A6"
const HLP_GIV_GNO = "0x5Aa67e24BA8A3fbDc553e308d02377E03cE9e94F"
const HLP_WATER_GNO = "0x3b74c893F62424d1C96Ce060332fd626eEaa875C"

// Swapr contracts
const SWAPR_ROUTER = "0xE43e60736b1cb4a75ad25240E2f9a62Bff65c0C0"
const DXS_WETH_GNO = "0x5fCA4cBdC182e40aeFBCb91AFBDE7AD8d3Dc18a8"
const DXS_GNO_WXDAI = "0xD7b118271B1B7d26C9e044Fc927CA31DccB22a5a"
const DXS_CRV_GNO = "0xFeDBA8b0Ccf72Ba983e5b7b5B4EE5Bc525bae339"
const DXS_GNO_QI = "0xc25F6c9622ac3096bcca122272f511b6fF94d898"
const DXS_BER_GNO = "0x1Ad6A0cFF3870b252492597B557F3e61F130663D"

// Agave contracts
const AGAVE_WXDAI_GATEWAY = "0x36A644cC38Ae257136EEca5919800f364d73FeFC"
const AGAVE_LENDING_POOL = "0x5E15d5E33d318dCEd84Bfe3F4EACe07909bE6d9c"
const agUSDC = "0x291B5957c9CBe9Ca6f0b98281594b4eB495F4ec1"
const stableDebtUSDC = "0x05c43e14d38bC5123F6408A57BE03714aB689F6e"
const variableDebtUSDC = "0xa728C8f1CF7fC4d8c6d5195945C3760c87532724"
const agWXDAI = "0xd4e420bBf00b0F409188b338c5D87Df761d6C894"
const stableDebtWXDAI = "0xF4401355B41c867edbF09C821FA7B4fffbed5C82"
const variableDebtWXDAI = "0xec72De30C3084023F7908002A2252a606CCe0B2c"
const agLINK = "0xa286Ce70FB3a6269676c8d99BD9860DE212252Ef"
const stableDebtLINK = "0x4f9401Fb52fe53de977dcbF05A0F6237AaDC7Eb1"
const variableDebtLINK = "0x5b0568531322759EAB69269a86448b39B47e2AE8"
const agGNO = "0xA26783eAd6C1f4744685c14079950622674ae8A8"
const stableDebtGNO = "0x0DfD401903bA960B2EED32A10f8aeB601Cd9A7A5"
const variableDebtGNO = "0x99272C6E2Baa601cEA8212b8fBAA7920A9f916F0"
const agWBTC = "0x4863cfaF3392F20531aa72CE19E5783f489817d6"
const stableDebtWBTC = "0xca0f3B157165FE11692a047ea14963ffAdfB31fD"
const variableDebtWBTC = "0x110C5A1494F0AB6C851abB72AA2efa3dA738aB72"
const agWETH = "0x44932e3b1E662AdDE2F7bac6D5081C5adab908c6"
const stableDebtWETH = "0x43Ae4A9474eA23b0BC04C99F9fF2A9B4c2d5554c"
const variableDebtWETH = "0x73Ada33D706085d6B93350B5e6aED6178905Fb8A"
const agFOX = "0xA916A4891D80494c6cB0B49b11FD68238AAaF617"
const stableDebtFOX = "0x6Ca958336e7A1BDCDf7762aeb81613EaDdCc3110"
const variableDebtFOX = "0x7388cbdeb284902E1e07be616F92Adb3660Ed3a4"
const agUSDT = "0x5b4Ef67c63d091083EC4d30CFc4ac685ef051046"
const stableDebtUSDT = "0xB067faD853d099EDd9c86483682e7D947B7983E5"
const variableDebtUSDT = "0x474f83d77150bDDC6a6F34eEe4F5574EAfD05938"

// Balancer contracts
const BALANCER_VAULT = "0xBA12222222228d8Ba445958a75a0704d566BF2C8"
const BALANCER_RELAYER = "0xeF606F58A4FD0fCcb066c6203d0994694d3eB2D3"
const BALANCER_RELAYER_LIBRARY = "0xD7FAD3bd59D6477cbe1BE7f646F7f1BA25b230f8"
const CHILD_CHAIN_GAUGE_REWARD_HELPER = "0xf7D5DcE55E6D47852F054697BAB6A1B48A00ddbd"
const B_50bbagGNO_50bbagWETH = "0xF48f01DCB2CbB3ee1f6AaB0e742c2D3941039d56" // LP and Pool (bb_ag_WETH, bb_ag_GNO)
const B_50bbagGNO_50bbagWETH_GAUGE = "0x2165b84b2Ae1Fc01F481fA8c9c762B695c57bB21"
const bb_ag_WETH = "0xbb9Cd48d33033F5EfFBeDec9Dd700C7D7E1dCF50"
const bb_ag_GNO = "0xFFFf76A3280e95dC855696111C2562Da09db2Ac0"
const bb_ag_USD = "0xFEdb19Ec000d38d92Af4B21436870F115db22725" // LP and Pool (bb_ag_WXDAI, bb_ag_USDT, bb_ag_USDC, bb_ag_USD)
const bb_ag_USD_GAUGE = "0x266C15970AEEeCc254117b1C366E26718Ad02cEE"
const bb_ag_WXDAI = "0x41211BBa6d37F5a74b22e667533F080C7C7f3F13"
const bb_ag_USDT = "0xd16f72b02dA5f51231fDe542A8B9E2777a478c88"
const bb_ag_USDC = "0xE7f88d7d4EF2eb18FCF9Dd7216BA7Da1c46f3dD6"
const agUSD_agWETH_agWBTC = "0x66F33Ae36dD80327744207a48122F874634B3adA"// LP and Pool (bb_ag_WETH, bb_ag_WBTC, bb_ag_USD)
const agUSD_agWETH_agWBTC_GAUGE = "0xc04672a31C5ba04912BAD418631f9b45E73619EF"
const bb_ag_WBTC = "0xd4015683b8153666190e0B2bEC352580EBC4CaCa"
const B_50bbagGNO_50bbagUSD = "0xB973Ca96a3f0D61045f53255E319AEDb6ED49240" // LP and Pool (bb_ag_USD, bb_ag_GNO)
const B_50bbagGNO_50bbagUSD_GAUGE = "0x793fAF861a78B07c0C8c0ed1450D3919F3473226" // LP and Pool (bb_ag_USD, bb_ag_GNO)


const preset = {
    network: 100,
    allow: [

        //---------------------------------------------------------------------------------------------------------------------------------
        // Curve
        //---------------------------------------------------------------------------------------------------------------------------------

        //---------------------------------------------------------------------------------------------------------------------------------
        // Curve sGNO/GNO
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([sGNO, GNO], [sgnoCRV_LP_POOL]),
        ...allowErc20Approve([sgnoCRV_LP_POOL], [sgnoCRV_GAUGE]),

        // Add Liquidity
        allow.gnosis.curve.sgnoCRV_lp_pool["add_liquidity(uint256[2],uint256)"](),

        // Remove Liquidity
        allow.gnosis.curve.sgnoCRV_lp_pool["remove_liquidity(uint256,uint256[2])"](),

        // Remove Liquidity of One Coin
        allow.gnosis.curve.sgnoCRV_lp_pool["remove_liquidity_one_coin(uint256,int128,uint256)"](),

        // Remove Liquidity Imbalance Coin
        allow.gnosis.curve.sgnoCRV_lp_pool["remove_liquidity_imbalance(uint256[2],uint256)"](),

        // Exchange
        allow.gnosis.curve.sgnoCRV_lp_pool["exchange(int128,int128,uint256,uint256)"](),

        // Stake
        allow.gnosis.curve.sgnoCRV_gauge["deposit(uint256)"](),
        // NO EVIDENCE OF BEING USED
        allow.gnosis.curve.sgnoCRV_gauge["deposit(uint256,address,bool)"](
            undefined,
            AVATAR
        ),

        // Unstake
        allow.gnosis.curve.sgnoCRV_gauge["withdraw(uint256)"](),
        // NO EVIDENCE OF BEING USED
        allow.gnosis.curve.sgnoCRV_gauge["withdraw(uint256,address,bool)"](
            undefined,
            AVATAR
        ),

        // Claim Rewards
        allow.gnosis.curve.sgnoCRV_gauge["claim_rewards()"](),

        // Deposit and Stake using a special ZAP
        allow.gnosis.curve.stake_deposit_zap["deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)"](
            sgnoCRV_LP_POOL,
            sgnoCRV_LP_POOL,
            sgnoCRV_GAUGE,
            2,
            [sGNO, GNO, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
            undefined,
            undefined,
            undefined,
            ZERO_ADDRESS
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Curve tricrypto
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([x3CRV, WBTC, WETH], [crv3crypto_POOL]),
        ...allowErc20Approve([crv3crypto_LP], [crv3crypto_GAUGE]),
        ...allowErc20Approve([WXDAI, USDC, USDT, WBTC, WETH], [crv3crypto_ZAP]),

        // Add Liquidity
        allow.gnosis.curve.crv3crypto_pool["add_liquidity"](),

        // Remove Liquidity
        allow.gnosis.curve.crv3crypto_pool["remove_liquidity"](),

        // Remove Liquidity of One Coin
        allow.gnosis.curve.crv3crypto_pool["remove_liquidity_one_coin"](),

        // Exchange
        allow.gnosis.curve.crv3crypto_pool["exchange(uint256,uint256,uint256,uint256)"](),
        allow.gnosis.curve.crv3crypto_pool["exchange(uint256,uint256,uint256,uint256,bool)"](),

        // Stake
        allow.gnosis.curve.crv3crypto_gauge["deposit(uint256)"](),
        // NO EVIDENCE OF BEING USED
        allow.gnosis.curve.crv3crypto_gauge["deposit(uint256,address,bool)"](
            undefined,
            AVATAR
        ),

        // Unstake
        allow.gnosis.curve.crv3crypto_gauge["withdraw(uint256)"](),
        // NO EVIDENCE OF BEING USED
        allow.gnosis.curve.crv3crypto_gauge["withdraw(uint256,address,bool)"](
            undefined,
            AVATAR
        ),

        // Claim Rewards
        allow.gnosis.curve.crv3crypto_gauge["claim_rewards()"](),

        // Deposit and Stake using a special ZAP
        allow.gnosis.curve.stake_deposit_zap["deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)"](
            crv3crypto_POOL,
            crv3crypto_LP,
            crv3crypto_GAUGE,
            {
                oneOf: [3, 5]
            },
            {
                oneOf: [
                    [x3CRV, WBTC, WETH, ZERO_ADDRESS, ZERO_ADDRESS],
                    [WXDAI, USDC, USDT, WBTC, WETH]
                ]
            },
            undefined,
            undefined,
            undefined,
            ZERO_ADDRESS
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Curve rGNO/sGNO
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([rGNO, sGNO], [rgnoCRV_LP_POOL]),
        ...allowErc20Approve([rgnoCRV_LP_POOL], [rgnoCRV_GAUGE]),

        // Add Liquidity
        allow.gnosis.curve.rgnoCRV_lp_pool["add_liquidity(uint256[2],uint256)"](),

        // Remove Liquidity
        allow.gnosis.curve.rgnoCRV_lp_pool["remove_liquidity(uint256,uint256[2])"](),

        // Remove Liquidity of One Coin
        allow.gnosis.curve.rgnoCRV_lp_pool["remove_liquidity_one_coin(uint256,int128,uint256)"](),

        // Remove Liquidity Imbalance Coin
        allow.gnosis.curve.rgnoCRV_lp_pool["remove_liquidity_imbalance(uint256[2],uint256)"](),

        // Exchange
        allow.gnosis.curve.rgnoCRV_lp_pool["exchange(int128,int128,uint256,uint256)"](),

        // Stake
        allow.gnosis.curve.rgnoCRV_gauge["deposit(uint256)"](),
        // NO EVIDENCE OF BEING USED
        allow.gnosis.curve.rgnoCRV_gauge["deposit(uint256,address,bool)"](
            undefined,
            AVATAR
        ),

        // Unstake
        allow.gnosis.curve.rgnoCRV_gauge["withdraw(uint256)"](),
        // NO EVIDENCE OF BEING USED
        allow.gnosis.curve.rgnoCRV_gauge["withdraw(uint256,address,bool)"](
            undefined,
            AVATAR
        ),

        // Claim Rewards
        allow.gnosis.curve.rgnoCRV_gauge["claim_rewards()"](),

        // // Deposit and Stake using a special ZAP
        allow.gnosis.curve.stake_deposit_zap["deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)"](
            rgnoCRV_LP_POOL,
            rgnoCRV_LP_POOL,
            rgnoCRV_GAUGE,
            2,
            [rGNO, sGNO, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
            undefined,
            undefined,
            undefined,
            ZERO_ADDRESS
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Honeyswap
        //---------------------------------------------------------------------------------------------------------------------------------

        //---------------------------------------------------------------------------------------------------------------------------------
        // Honeyswap WETH/GNO
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([WETH, GNO], [HONEYSWAP_ROUTER]),
        ...allowErc20Approve([HLP_WETH_GNO], [HONEYSWAP_ROUTER]),

        // Add Liquidity
        allow.gnosis.honeyswap.router["addLiquidity"](
            {
                oneOf: [WETH, GNO]
            },
            {
                oneOf: [WETH, GNO]
            },
            undefined,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        // Remove Liquidity
        allow.gnosis.honeyswap.router["removeLiquidity"](
            WETH,
            GNO,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Honeyswap GNO/FLX
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([GNO, FLX], [HONEYSWAP_ROUTER]),
        ...allowErc20Approve([HLP_GNO_FLX], [HONEYSWAP_ROUTER]),

        // Add Liquidity
        allow.gnosis.honeyswap.router["addLiquidity"](
            {
                oneOf: [GNO, FLX]
            },
            {
                oneOf: [GNO, FLX]
            },
            undefined,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        // Remove Liquidity
        allow.gnosis.honeyswap.router["removeLiquidity"](
            GNO,
            FLX,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Honeyswap GNO/WXDAI
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([GNO, WXDAI], [HONEYSWAP_ROUTER]),
        ...allowErc20Approve([HLP_GNO_WXDAI], [HONEYSWAP_ROUTER]),

        // Add Liquidity using XDAI
        allow.gnosis.honeyswap.router["addLiquidityETH"](
            GNO,
            undefined,
            undefined,
            undefined,
            AVATAR,
            undefined,
            {
                send: true
            }
        ),

        // Add Liquidity using WXDAI
        allow.gnosis.honeyswap.router["addLiquidity"](
            {
                oneOf: [GNO, WXDAI]
            },
            {
                oneOf: [GNO, WXDAI]
            },
            undefined,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        // Remove Liquidity using XDAI
        allow.gnosis.honeyswap.router["removeLiquidityETH"](
            GNO,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        // Remove Liquidity using WXDAI
        allow.gnosis.honeyswap.router["removeLiquidity"](
            GNO,
            WXDAI,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Honeyswap GIV/GNO
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([GIV, GNO], [HONEYSWAP_ROUTER]),
        ...allowErc20Approve([HLP_GIV_GNO], [HONEYSWAP_ROUTER]),

        // Add Liquidity
        allow.gnosis.honeyswap.router["addLiquidity"](
            {
                oneOf: [GIV, GNO]
            },
            {
                oneOf: [GIV, GNO]
            },
            undefined,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        // Remove Liquidity
        allow.gnosis.honeyswap.router["removeLiquidity"](
            GIV,
            GNO,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Honeyswap WATER/GNO
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([WATER, GNO], [HONEYSWAP_ROUTER]),
        ...allowErc20Approve([HLP_WATER_GNO], [HONEYSWAP_ROUTER]),

        // Add Liquidity
        allow.gnosis.honeyswap.router["addLiquidity"](
            {
                oneOf: [WATER, GNO]
            },
            {
                oneOf: [WATER, GNO]
            },
            undefined,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        // Remove Liquidity
        allow.gnosis.honeyswap.router["removeLiquidity"](
            WATER,
            GNO,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Swapr
        //---------------------------------------------------------------------------------------------------------------------------------

        //---------------------------------------------------------------------------------------------------------------------------------
        // Swapr WETH/GNO
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([WETH, GNO], [SWAPR_ROUTER]),
        ...allowErc20Approve([DXS_WETH_GNO], [SWAPR_ROUTER]),

        // Add Liquidity
        allow.gnosis.swapr.router["addLiquidity"](
            {
                oneOf: [WETH, GNO]
            },
            {
                oneOf: [WETH, GNO]
            },
            undefined,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        // Remove Liquidity
        allow.gnosis.swapr.router["removeLiquidity"](
            WETH,
            GNO,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        allow.gnosis.swapr.router["removeLiquidityWithPermit"](
            WETH,
            GNO,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Swapr GNO/WXDAI
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([GNO, WXDAI], [SWAPR_ROUTER]),
        ...allowErc20Approve([DXS_GNO_WXDAI], [SWAPR_ROUTER]),

        // Add Liquidity using XDAI
        allow.gnosis.swapr.router["addLiquidityETH"](
            GNO,
            undefined,
            undefined,
            undefined,
            AVATAR,
            undefined,
            {
                send: true
            }
        ),

        // Add Liquidity using WXDAI
        allow.gnosis.swapr.router["addLiquidity"](
            {
                oneOf: [GNO, WXDAI]
            },
            {
                oneOf: [GNO, WXDAI]
            },
            undefined,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        // Remove Liquidity using XDAI
        allow.gnosis.swapr.router["removeLiquidityETH"](
            GNO,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        allow.gnosis.swapr.router["removeLiquidityETHWithPermit"](
            GNO,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        // Remove Liquidity using WXDAI
        allow.gnosis.swapr.router["removeLiquidity"](
            GNO,
            WXDAI,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        allow.gnosis.swapr.router["removeLiquidityWithPermit"](
            GNO,
            WXDAI,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Swapr CRV/GNO
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([CRV, GNO], [SWAPR_ROUTER]),
        ...allowErc20Approve([DXS_CRV_GNO], [SWAPR_ROUTER]),

        // Add Liquidity
        allow.gnosis.swapr.router["addLiquidity"](
            {
                oneOf: [CRV, GNO]
            },
            {
                oneOf: [CRV, GNO]
            },
            undefined,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        // Remove Liquidity
        allow.gnosis.swapr.router["removeLiquidity"](
            CRV,
            GNO,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        allow.gnosis.swapr.router["removeLiquidityWithPermit"](
            CRV,
            GNO,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Swapr GNO/QI
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([GNO, QI], [SWAPR_ROUTER]),
        ...allowErc20Approve([DXS_GNO_QI], [SWAPR_ROUTER]),

        // Add Liquidity
        allow.gnosis.swapr.router["addLiquidity"](
            {
                oneOf: [GNO, QI]
            },
            {
                oneOf: [GNO, QI]
            },
            undefined,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        // Remove Liquidity
        allow.gnosis.swapr.router["removeLiquidity"](
            GNO,
            QI,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        allow.gnosis.swapr.router["removeLiquidityWithPermit"](
            GNO,
            QI,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Swapr BER/GNO
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([BER, GNO], [SWAPR_ROUTER]),
        ...allowErc20Approve([DXS_BER_GNO], [SWAPR_ROUTER]),

        // Add Liquidity
        allow.gnosis.swapr.router["addLiquidity"](
            {
                oneOf: [BER, GNO]
            },
            {
                oneOf: [BER, GNO]
            },
            undefined,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        // Remove Liquidity
        allow.gnosis.swapr.router["removeLiquidity"](
            BER,
            GNO,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        allow.gnosis.swapr.router["removeLiquidityWithPermit"](
            BER,
            GNO,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // SushiSwap
        //---------------------------------------------------------------------------------------------------------------------------------

        //---------------------------------------------------------------------------------------------------------------------------------
        // SushiSwap SUSHI/GNO
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([SUSHI, GNO], [SUSHISWAP_ROUTER]),
        ...allowErc20Approve([SLP_SUSHI_GNO], [SUSHISWAP_ROUTER]),

        // Add Liquidity
        allow.gnosis.sushiswap.router["addLiquidity"](
            SUSHI,
            GNO,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        // Remove Liquidity
        allow.gnosis.sushiswap.router["removeLiquidity"](
            SUSHI,
            GNO,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        // Remove Liquidity
        allow.gnosis.sushiswap.router["removeLiquidityWithPermit"](
            SUSHI,
            GNO,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        // Stake
        allow.gnosis.sushiswap.minichef_v2["deposit"](
            10,
            undefined,
            AVATAR
        ),

        // Unstake and Claim Rewards
        allow.gnosis.sushiswap.minichef_v2["withdrawAndHarvest"](
            10,
            undefined,
            AVATAR
        ),

        // Claim Rewards
        allow.gnosis.sushiswap.minichef_v2["harvest"](
            10,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // SushiSwap WETH/wstETH
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([WETH, wstETH], [SUSHISWAP_ROUTER]),
        ...allowErc20Approve([SLP_WETH_wstETH], [SUSHISWAP_ROUTER]),

        // Add Liquidity
        allow.gnosis.sushiswap.router["addLiquidity"](
            WETH,
            wstETH,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        // Remove Liquidity
        allow.gnosis.sushiswap.router["removeLiquidity"](
            WETH,
            wstETH,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        // Remove Liquidity
        allow.gnosis.sushiswap.router["removeLiquidityWithPermit"](
            WETH,
            wstETH,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Agave
        //---------------------------------------------------------------------------------------------------------------------------------

        //---------------------------------------------------------------------------------------------------------------------------------
        // Agave - XDAI
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([agWXDAI], [AGAVE_WXDAI_GATEWAY]),

        // Deposit
        allow.gnosis.agave.wxdai_gateway["depositETH"](
            AVATAR,
            0,
            {
                send: true
            }
        ),

        // Borrow
        // I assume that if you borrow stable debt then the same should be done with the stableDebtWXDAI token
        allow.gnosis.agave.variableDebtWXDAI["approveDelegation"](
            AGAVE_WXDAI_GATEWAY
        ),

        allow.gnosis.agave.wxdai_gateway["borrowETH"](
            undefined,
            undefined,
            0
        ),

        // Set/Unset (bool "useAsCollateral" = True / "useAsCollateral" = False) WXDAI as Collateral (Set)
        allow.gnosis.agave.lending_pool["setUserUseReserveAsCollateral"](
            WXDAI
        ),

        // Repay
        allow.gnosis.agave.wxdai_gateway["repayETH"](
            undefined,
            undefined,
            AVATAR,
            {
                send: true
            }
        ),

        // Withdraw
        allow.gnosis.agave.wxdai_gateway["withdrawETH"](
            undefined,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Agave - GNO/WETH/USDC/USDT
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([GNO, WETH, USDC, USDT], [AGAVE_LENDING_POOL]),

        // Deposit
        allow.gnosis.agave.lending_pool["deposit"](
            {
                oneOf: [GNO, WETH, USDC, USDT]
            },
            undefined,
            AVATAR,
            0
        ),

        // Borrow
        allow.gnosis.agave.lending_pool["borrow"](
            {
                oneOf: [GNO, WETH, USDC, USDT]
            },
            undefined,
            undefined,
            0,
            AVATAR
        ),

        // Set/Unset (bool "useAsCollateral" = True / "useAsCollateral" = False) the token as Collateral (Set)
        allow.gnosis.agave.lending_pool["setUserUseReserveAsCollateral"](
            {
                oneOf: [GNO, WETH, USDC, USDT]
            },
        ),

        // Repay
        allow.gnosis.agave.lending_pool["repay"](
            {
                oneOf: [GNO, WETH, USDC, USDT]
            },
            undefined,
            undefined,
            AVATAR,
        ),

        // Withdraw
        allow.gnosis.agave.lending_pool["withdraw"](
            {
                oneOf: [GNO, WETH, USDC, USDT]
            },
            undefined,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Agave - Claim Rewards (General)
        //---------------------------------------------------------------------------------------------------------------------------------
        allow.gnosis.agave.incentives_controller["claimRewards"](
            {
                subsetOf: [
                    agUSDC,
                    variableDebtUSDC,
                    agWXDAI,
                    variableDebtWXDAI,
                    agLINK,
                    variableDebtLINK,
                    agGNO,
                    variableDebtGNO,
                    agWBTC,
                    variableDebtWBTC,
                    agWETH,
                    variableDebtWETH,
                    agFOX,
                    variableDebtFOX,
                    agUSDT,
                    variableDebtUSDT,
                ]
            },
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Agave - Staking
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([AGVE], [stkAGVE]),

        // Stake
        allow.gnosis.agave.stkAGVE["stake"](
            AVATAR
        ),

        // Cooldown time (10 days / 2 days window to unstake)
        allow.gnosis.agave.stkAGVE["cooldown"](),

        // Unstake
        allow.gnosis.agave.stkAGVE["redeem"](
            AVATAR
        ),

        // Claim AGVE (from staking)
        allow.gnosis.agave.stkAGVE["claimRewards"](
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Balancer
        //---------------------------------------------------------------------------------------------------------------------------------

        // Relayer Approval (this is done only once per wallet)
        allow.gnosis.balancer.relayer_library["setRelayerApproval"](
            BALANCER_RELAYER
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Balancer Boosted Agave GNO/WETH
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([bb_ag_WETH, bb_ag_GNO], [BALANCER_VAULT]),
        ...allowErc20Approve([B_50bbagGNO_50bbagWETH], [B_50bbagGNO_50bbagWETH_GAUGE]),

        // joinPool: 0x1c6455b9e8e7cfb9a5fb81a765683be78649af98081c1c2ddec9c80ea18866ef

        // Add Liquidity
        {
            targetAddress: BALANCER_VAULT,
            signature:
                "joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
            params: {
                [0]: staticEqual(
                    "0xf48f01dcb2cbb3ee1f6aab0e742c2d3941039d56000200000000000000000012",
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
                [9]: staticEqual(bb_ag_WETH, "address"),
                [10]: staticEqual(bb_ag_GNO, "address"),
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
                    "0xf48f01dcb2cbb3ee1f6aab0e742c2d3941039d56000200000000000000000012",
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
                [9]: staticEqual(bb_ag_WETH, "address"),
                [10]: staticEqual(bb_ag_GNO, "address"),
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

        // Using the BALANCER_RELAYER and it's BALANCER_RELAYER_LIBRARY 

        ...allowErc20Approve([WETH, GNO], [BALANCER_VAULT]),

        // Swap WETH for bb_ag_WETH (for both, join and exit pool) / Swap GNO for bb_ag_GNO (for both, join and exit pool)
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
                    "0xbb9cd48d33033f5effbedec9dd700c7d7e1dcf5000000000000000000000000e", // bb_ag_WETH
                    "0xffff76a3280e95dc855696111c2562da09db2ac000000000000000000000000c", // bb_ag_GNO
                ],
                    "bytes32"), // Balancer PoolId
                [10]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
                [11]: staticOneOf([
                    WETH,
                    bb_ag_WETH,
                    GNO,
                    bb_ag_GNO
                ],
                    "address"), // assetIn
                [12]: staticOneOf([
                    WETH,
                    bb_ag_WETH,
                    GNO,
                    bb_ag_GNO
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

        // Add Liquidity
        {
            targetAddress: BALANCER_RELAYER_LIBRARY,
            signature:
                "joinPool(bytes32,uint8,address,address,(address[],uint256[],bytes,bool),uint256,uint256)",
            params: {
                [0]: staticEqual(
                    "0xf48f01dcb2cbb3ee1f6aab0e742c2d3941039d56000200000000000000000012",
                    "bytes32"
                ), // Balancer PoolId
                [1]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"
                ), // bytes (userData)
                [2]: staticEqual(BALANCER_RELAYER, "address"),
                [3]: staticEqual(AVATAR),
                [4]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"), // Offset of the tuple from beginning 224=32*7
                [7]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000080",
                    "bytes32"), // Offset of address[] from beginning of tuple 128=32*4
                [8]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"), // Offset of uint256[] from beginning of tuple 224=32*7
                [9]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000140",
                    "bytes32"), // Offset of bytes from beginning of tuple 320=32*10
                [11]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "bytes32"
                ), // Length of address[] = 2
                [12]: staticEqual(bb_ag_WETH, "address"),
                [13]: staticEqual(bb_ag_GNO, "address"),
                [14]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "bytes32"
                ), // Length of unit256[] = 2
                [17]: staticOneOf([
                    "0x00000000000000000000000000000000000000000000000000000000000000a0",
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040"
                ],
                    "bytes32"
                ), // Length of bytes
                [18]: staticOneOf([
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
                    "0xf48f01dcb2cbb3ee1f6aab0e742c2d3941039d56000200000000000000000012",
                    "bytes32"
                ), // Balancer PoolId
                [1]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"
                ), // bytes (userData)
                [2]: staticEqual(AVATAR),
                [3]: staticEqual(BALANCER_RELAYER, "address"),
                [4]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "bytes32"), // Offset of the first tuple from beginning 192=32*6
                [5]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000280",
                    "bytes32"), // Offset of the second tuple from beginning 640=32*20
                [6]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000080",
                    "bytes32"), // Offset of address[] from beginning of tuple 128=32*4
                [7]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"), // Offset of uint256[] from beginning of tuple 224=32*7
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000140",
                    "bytes32"), // Offset of bytes from beginning of tuple 320=32*10
                [10]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "bytes32"
                ), // Length of address[] = 2
                [11]: staticEqual(bb_ag_WETH, "address"),
                [12]: staticEqual(bb_ag_GNO, "address"),
                [13]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "bytes32"
                ), // Length of unit256[] = 2
                [16]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040",
                    "0x00000000000000000000000000000000000000000000000000000000000000c0"
                ],
                    "bytes32"
                ), // Length of bytes
                [17]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "0x0000000000000000000000000000000000000000000000000000000000000002"
                ],
                    "bytes32"
                ), // Join Kind
                [20]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "bytes32"
                ), // Length of (uint256,uint256)[] = 1
            },
        },

        // Stake
        allow.gnosis.balancer.B_50bbagGNO_50bbagWETH_gauge["deposit(uint256)"](),

        // Unstake
        allow.gnosis.balancer.B_50bbagGNO_50bbagWETH_gauge["withdraw(uint256)"](),

        // Claim Rewards
        allow.gnosis.balancer.B_50bbagGNO_50bbagWETH_gauge["claim_rewards()"](),

        // Claim BAL Rewards
        allow.gnosis.balancer.child_chain_gauge_reward_helper["claimRewardsFromGauge"](
            B_50bbagGNO_50bbagWETH_GAUGE,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Balancer Boosted Agave USD
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([bb_ag_WXDAI, bb_ag_USDT, bb_ag_USDC, bb_ag_USD], [BALANCER_VAULT]),
        ...allowErc20Approve([bb_ag_USD], [bb_ag_USD_GAUGE]),

        // IMPORTANT: see txn hash 0x43f480c5e0de4c4e91e92620d1d484b22c0742fbf418d8bb878c05c78151a2bc
        // joinPool: 0x65a7e204e5598d193ac24a2477166482a7147b59b84fba798e2c9700fdd2d7e3

        // Add Liquidity
        {
            targetAddress: BALANCER_VAULT,
            signature:
                "joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
            params: {
                [0]: staticEqual(
                    "0xfedb19ec000d38d92af4b21436870f115db22725000000000000000000000010",
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
                    "0x0000000000000000000000000000000000000000000000000000000000000120",
                    "bytes32"), // Offset of uint256[] from beginning of tuple 288=32*9
                [6]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000001c0",
                    "bytes32"), // Offset of bytes from beginning of tuple 448=32*14
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000004",
                    "bytes32"
                ), // Length of address[] = 4
                [9]: staticEqual(bb_ag_WXDAI, "address"),
                [10]: staticEqual(bb_ag_USDT, "address"),
                [11]: staticEqual(bb_ag_USDC, "address"),
                [12]: staticEqual(bb_ag_USD, "address"),
                [13]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000004",
                    "bytes32"
                ), // Length of unit256[] = 4
                [18]: staticOneOf([
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "0x0000000000000000000000000000000000000000000000000000000000000100",
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040"
                ],
                    "bytes32"
                ), // Length of bytes
                [19]: staticOneOf([
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
                    "0xfedb19ec000d38d92af4b21436870f115db22725000000000000000000000010",
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
                    "0x0000000000000000000000000000000000000000000000000000000000000120",
                    "bytes32"), // Offset of uint256[] from beginning of tuple 288=32*9
                [6]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000001c0",
                    "bytes32"), // Offset of bytes from beginning of tuple 448=32*14
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000004",
                    "bytes32"
                ), // Length of address[] = 4
                [9]: staticEqual(bb_ag_WXDAI, "address"),
                [10]: staticEqual(bb_ag_USDT, "address"),
                [11]: staticEqual(bb_ag_USDC, "address"),
                [12]: staticEqual(bb_ag_USD, "address"),
                [13]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000004",
                    "bytes32"
                ), // Length of unit256[] = 4
                [18]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040",
                    "0x0000000000000000000000000000000000000000000000000000000000000100",
                ],
                    "bytes32"
                ), // Length of bytes
                [19]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "0x0000000000000000000000000000000000000000000000000000000000000002"
                ],
                    "bytes32"
                ), // Join Kind
            },
        },

        // Using the BALANCER_RELAYER and it's BALANCER_RELAYER_LIBRARY 

        ...allowErc20Approve([WXDAI, USDT, USDC], [BALANCER_VAULT]),

        // Swap WXDAI for bb_ag_WXDAI (for both, join and exit pool)
        // Swap USDT for bb_ag_USDT (for both, join and exit pool)
        // Swap USDC for bb_ag_USDC (for both, join and exit pool)
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
                    "0x41211bba6d37f5a74b22e667533f080c7c7f3f1300000000000000000000000b", // bb_ag_WXDAI
                    "0xd16f72b02da5f51231fde542a8b9e2777a478c8800000000000000000000000f", // bb_ag_USDT
                    "0xe7f88d7d4ef2eb18fcf9dd7216ba7da1c46f3dd600000000000000000000000a", // bb_ag_USDC
                ],
                    "bytes32"), // Balancer PoolId
                [10]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
                [11]: staticOneOf([
                    WXDAI,
                    bb_ag_WXDAI,
                    USDT,
                    bb_ag_USDT,
                    USDC,
                    bb_ag_USDC
                ],
                    "address"), // assetIn
                [12]: staticOneOf([
                    WXDAI,
                    bb_ag_WXDAI,
                    USDT,
                    bb_ag_USDT,
                    USDC,
                    bb_ag_USDC
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

        // IMPORTANT: FOR THE "Balancer Boosted Agave USD" the joinPool and exitPool MUST BE WHITELISTED WITH BOTH THE SENDER AND 
        // RECIPIENT WITH THE POSSIBILITY OF BEING EITHER THE AVATAR OR THE BALANCER_RELAYER. WHEN YOU ADD OF REMOVE LIQUIDITY
        // FROM A POOL WITH bb_ag_USD (ie: Balancer Boosted Agave WETH/WBTC/USD) THE BALANCER_RELAYER DOES A joinPool or exitPool 
        // WITH THE BALANCER_RELAYER AS BOTH THE SENDER AND RECIPIENT.

        // Add Liquidity
        {
            targetAddress: BALANCER_RELAYER_LIBRARY,
            signature:
                "joinPool(bytes32,uint8,address,address,(address[],uint256[],bytes,bool),uint256,uint256)",
            params: {
                [0]: staticEqual(
                    "0xfedb19ec000d38d92af4b21436870f115db22725000000000000000000000010",
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
                [12]: staticEqual(bb_ag_WXDAI, "address"),
                [13]: staticEqual(bb_ag_USDT, "address"),
                [14]: staticEqual(bb_ag_USDC, "address"),
                [15]: staticEqual(bb_ag_USD, "address"),
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
                    "0xfedb19ec000d38d92af4b21436870f115db22725000000000000000000000010",
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
                [11]: staticEqual(bb_ag_WXDAI, "address"),
                [12]: staticEqual(bb_ag_USDT, "address"),
                [13]: staticEqual(bb_ag_USDC, "address"),
                [14]: staticEqual(bb_ag_USD, "address"),
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
        allow.gnosis.balancer.bb_ag_USD_gauge["deposit(uint256)"](),

        // Unstake
        allow.gnosis.balancer.bb_ag_USD_gauge["withdraw(uint256)"](),

        // Claim Rewards
        allow.gnosis.balancer.bb_ag_USD_gauge["claim_rewards()"](),

        // Claim BAL Rewards
        allow.gnosis.balancer.child_chain_gauge_reward_helper["claimRewardsFromGauge"](
            bb_ag_USD_GAUGE,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Balancer Boosted Agave WETH/WBTC/USD
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([bb_ag_WETH, bb_ag_WBTC, bb_ag_USD], [BALANCER_VAULT]),
        ...allowErc20Approve([agUSD_agWETH_agWBTC], [agUSD_agWETH_agWBTC_GAUGE]),

        // joinPool: 0x5303ea3fc917d430148c5e5aeee39e62f65ee17da29741824212201d8f1a6690

        // Add Liquidity
        {
            targetAddress: BALANCER_VAULT,
            signature:
                "joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
            params: {
                [0]: staticEqual(
                    "0x66f33ae36dd80327744207a48122f874634b3ada000100000000000000000013",
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
                    "0x0000000000000000000000000000000000000000000000000000000000000100",
                    "bytes32"), // Offset of uint256[] from beginning of tuple 256=32*8
                [6]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000180",
                    "bytes32"), // Offset of bytes from beginning of tuple 384=32*12
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000003",
                    "bytes32"
                ), // Length of address[] = 3
                [9]: staticEqual(bb_ag_WETH, "address"),
                [10]: staticEqual(bb_ag_WBTC, "address"),
                [11]: staticEqual(bb_ag_USD, "address"),
                [12]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000003",
                    "bytes32"
                ), // Length of unit256[] = 3
                [16]: staticOneOf([
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040"
                ],
                    "bytes32"
                ), // Length of bytes
                [17]: staticOneOf([
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
                    "0x66f33ae36dd80327744207a48122f874634b3ada000100000000000000000013",
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
                    "0x0000000000000000000000000000000000000000000000000000000000000100",
                    "bytes32"), // Offset of uint256[] from beginning of tuple 256=32*8
                [6]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000180",
                    "bytes32"), // Offset of bytes from beginning of tuple 384=32*12
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000003",
                    "bytes32"
                ), // Length of address[] = 3
                [9]: staticEqual(bb_ag_WETH, "address"),
                [10]: staticEqual(bb_ag_WBTC, "address"),
                [11]: staticEqual(bb_ag_USD, "address"),
                [12]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000003",
                    "bytes32"
                ), // Length of unit256[] = 3
                [16]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040",
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                ],
                    "bytes32"
                ), // Length of bytes
                [17]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "0x0000000000000000000000000000000000000000000000000000000000000002"
                ],
                    "bytes32"
                ), // Join Kind
            },
        },

        // Using the BALANCER_RELAYER and it's BALANCER_RELAYER_LIBRARY 

        ...allowErc20Approve([WETH, WBTC, WXDAI, USDT, USDC], [BALANCER_VAULT]),

        // Swap WETH for bb_ag_WETH (for both, join and exit pool)
        // Swap WBTC for bb_ag_WBTC (for both, join and exit pool)
        // Swap WXDAI for bb_ag_WXDAI (for both, join and exit pool)
        // Swap USDT for bb_ag_USDT (for both, join and exit pool)
        // Swap USDC for bb_ag_USDC (for both, join and exit pool)
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
                    "0xbb9cd48d33033f5effbedec9dd700c7d7e1dcf5000000000000000000000000e", // bb_ag_WETH
                    "0xd4015683b8153666190e0b2bec352580ebc4caca00000000000000000000000d", // bb_ag_WBTC
                    "0x41211bba6d37f5a74b22e667533f080c7c7f3f1300000000000000000000000b", // bb_ag_WXDAI
                    "0xd16f72b02da5f51231fde542a8b9e2777a478c8800000000000000000000000f", // bb_ag_USDT
                    "0xe7f88d7d4ef2eb18fcf9dd7216ba7da1c46f3dd600000000000000000000000a", // bb_ag_USDC
                ],
                    "bytes32"), // Balancer PoolId
                [10]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
                [11]: staticOneOf([
                    WETH,
                    bb_ag_WETH,
                    WBTC,
                    bb_ag_WBTC,
                    WXDAI,
                    bb_ag_WXDAI,
                    USDT,
                    bb_ag_USDT,
                    USDC,
                    bb_ag_USDC
                ],
                    "address"), // assetIn
                [12]: staticOneOf([
                    WETH,
                    bb_ag_WETH,
                    WBTC,
                    bb_ag_WBTC,
                    WXDAI,
                    bb_ag_WXDAI,
                    USDT,
                    bb_ag_USDT,
                    USDC,
                    bb_ag_USDC
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

        // Add Liquidity
        {
            targetAddress: BALANCER_RELAYER_LIBRARY,
            signature:
                "joinPool(bytes32,uint8,address,address,(address[],uint256[],bytes,bool),uint256,uint256)",
            params: {
                [0]: staticEqual(
                    "0x66f33ae36dd80327744207a48122f874634b3ada000100000000000000000013",
                    "bytes32"
                ), // Balancer PoolId
                [1]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"
                ), // bytes (userData)
                [2]: staticEqual(BALANCER_RELAYER, "address"),
                [3]: staticEqual(AVATAR),
                [4]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"), // Offset of the tuple from beginning 224=32*7
                [7]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000080",
                    "bytes32"), // Offset of address[] from beginning of tuple 128=32*4
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000100",
                    "bytes32"), // Offset of uint256[] from beginning of tuple 256=32*8
                [9]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000180",
                    "bytes32"), // Offset of bytes from beginning of tuple 384=32*12
                [11]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000003",
                    "bytes32"
                ), // Length of address[] = 3
                [12]: staticEqual(bb_ag_WETH, "address"),
                [13]: staticEqual(bb_ag_WBTC, "address"),
                [14]: staticEqual(bb_ag_USD, "address"),
                [15]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000003",
                    "bytes32"
                ), // Length of unit256[] = 3
                [19]: staticOneOf([
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040"
                ],
                    "bytes32"
                ), // Length of bytes
                [20]: staticOneOf([
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
                    "0x66f33ae36dd80327744207a48122f874634b3ada000100000000000000000013",
                    "bytes32"
                ), // Balancer PoolId
                [1]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"
                ), // bytes (userData)
                [2]: staticEqual(AVATAR),
                [3]: staticEqual(BALANCER_RELAYER, "address"),
                [4]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "bytes32"), // Offset of the first tuple from beginning 192=32*6
                [5]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000002c0",
                    "bytes32"), // Offset of the second tuple from beginning 704=32*22
                [6]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000080",
                    "bytes32"), // Offset of address[] from beginning of tuple 128=32*4
                [7]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000100",
                    "bytes32"), // Offset of uint256[] from beginning of tuple 256=32*8
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000180",
                    "bytes32"), // Offset of bytes from beginning of tuple 384=32*12
                [10]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000003",
                    "bytes32"
                ), // Length of address[] = 3
                [11]: staticEqual(bb_ag_WETH, "address"),
                [12]: staticEqual(bb_ag_WBTC, "address"),
                [13]: staticEqual(bb_ag_USD, "address"),
                [14]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000003",
                    "bytes32"
                ), // Length of unit256[] = 3
                [18]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040",
                    "0x00000000000000000000000000000000000000000000000000000000000000e0"
                ],
                    "bytes32"
                ), // Length of bytes
                [19]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "0x0000000000000000000000000000000000000000000000000000000000000002"
                ],
                    "bytes32"
                ), // Join Kind
                [22]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "bytes32"
                ), // Length of (uint256,uint256)[] = 1
            },
        },

        // Stake
        allow.gnosis.balancer.agUSD_agWETH_agWBTC_gauge["deposit(uint256)"](),

        // Unstake
        allow.gnosis.balancer.agUSD_agWETH_agWBTC_gauge["withdraw(uint256)"](),

        // Claim Rewards
        allow.gnosis.balancer.agUSD_agWETH_agWBTC_gauge["claim_rewards()"](),

        // Claim BAL Rewards
        allow.gnosis.balancer.child_chain_gauge_reward_helper["claimRewardsFromGauge"](
            agUSD_agWETH_agWBTC_GAUGE,
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Balancer Boosted Agave GNO/USD
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([bb_ag_USD, bb_ag_GNO], [BALANCER_VAULT]),
        ...allowErc20Approve([B_50bbagGNO_50bbagUSD], [B_50bbagGNO_50bbagUSD_GAUGE]),

        // joinPool: 0x85dbb47bd035476bf1c8490a466796250bc998dfcd45909fdf2aa4d4a3039776
        // exitPool: 0x1ecd4d82bbe457cdf319a138b0201338996751969b3685aeb451d1bfe84fe9b2

        // Add Liquidity
        {
            targetAddress: BALANCER_VAULT,
            signature:
                "joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
            params: {
                [0]: staticEqual(
                    "0xb973ca96a3f0d61045f53255e319aedb6ed49240000200000000000000000011",
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
                [9]: staticEqual(bb_ag_USD, "address"),
                [10]: staticEqual(bb_ag_GNO, "address"),
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
                    "0xb973ca96a3f0d61045f53255e319aedb6ed49240000200000000000000000011",
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
                [9]: staticEqual(bb_ag_USD, "address"),
                [10]: staticEqual(bb_ag_GNO, "address"),
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

        // Using the BALANCER_RELAYER and it's BALANCER_RELAYER_LIBRARY 

        ...allowErc20Approve([GNO, WXDAI, USDT, USDC], [BALANCER_VAULT]),

        // Swap GNO for bb_ag_GNO (for both, join and exit pool)
        // Swap WXDAI for bb_ag_WXDAI (for both, join and exit pool)
        // Swap USDT for bb_ag_USDT (for both, join and exit pool)
        // Swap USDC for bb_ag_USDC (for both, join and exit pool)
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
                    "0xffff76a3280e95dc855696111c2562da09db2ac000000000000000000000000c", // bb_ag_GNO
                    "0x41211bba6d37f5a74b22e667533f080c7c7f3f1300000000000000000000000b", // bb_ag_WXDAI
                    "0xd16f72b02da5f51231fde542a8b9e2777a478c8800000000000000000000000f", // bb_ag_USDT
                    "0xe7f88d7d4ef2eb18fcf9dd7216ba7da1c46f3dd600000000000000000000000a", // bb_ag_USDC
                ],
                    "bytes32"), // Balancer PoolId
                [10]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
                [11]: staticOneOf([
                    GNO,
                    bb_ag_GNO,
                    WXDAI,
                    bb_ag_WXDAI,
                    USDT,
                    bb_ag_USDT,
                    USDC,
                    bb_ag_USDC
                ],
                    "address"), // assetIn
                [12]: staticOneOf([
                    GNO,
                    bb_ag_GNO,
                    WXDAI,
                    bb_ag_WXDAI,
                    USDT,
                    bb_ag_USDT,
                    USDC,
                    bb_ag_USDC
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

        // Add Liquidity
        {
            targetAddress: BALANCER_RELAYER_LIBRARY,
            signature:
                "joinPool(bytes32,uint8,address,address,(address[],uint256[],bytes,bool),uint256,uint256)",
            params: {
                [0]: staticEqual(
                    "0xb973ca96a3f0d61045f53255e319aedb6ed49240000200000000000000000011",
                    "bytes32"
                ), // Balancer PoolId
                [1]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"
                ), // bytes (userData)
                [2]: staticEqual(BALANCER_RELAYER, "address"),
                [3]: staticEqual(AVATAR),
                [4]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"), // Offset of the tuple from beginning 224=32*7
                [7]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000080",
                    "bytes32"), // Offset of address[] from beginning of tuple 128=32*4
                [8]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"), // Offset of uint256[] from beginning of tuple 224=32*7
                [9]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000140",
                    "bytes32"), // Offset of bytes from beginning of tuple 320=32*10
                [11]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "bytes32"
                ), // Length of address[] = 2
                [12]: staticEqual(bb_ag_USD, "address"),
                [13]: staticEqual(bb_ag_GNO, "address"),
                [14]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "bytes32"
                ), // Length of unit256[] = 2
                [17]: staticOneOf([
                    "0x00000000000000000000000000000000000000000000000000000000000000a0",
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040"
                ],
                    "bytes32"
                ), // Length of bytes
                [18]: staticOneOf([
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
                    "0xb973ca96a3f0d61045f53255e319aedb6ed49240000200000000000000000011",
                    "bytes32"
                ), // Balancer PoolId
                [1]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "bytes32"
                ), // bytes (userData)
                [2]: staticEqual(AVATAR),
                [3]: staticEqual(BALANCER_RELAYER, "address"),
                [4]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "bytes32"), // Offset of the first tuple from beginning 192=32*6
                [5]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000280",
                    "bytes32"), // Offset of the second tuple from beginning 640=32*20
                [6]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000080",
                    "bytes32"), // Offset of address[] from beginning of tuple 128=32*4
                [7]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"), // Offset of uint256[] from beginning of tuple 224=32*7
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000140",
                    "bytes32"), // Offset of bytes from beginning of tuple 320=32*10
                [10]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "bytes32"
                ), // Length of address[] = 2
                [11]: staticEqual(bb_ag_USD, "address"),
                [12]: staticEqual(bb_ag_GNO, "address"),
                [13]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "bytes32"
                ), // Length of unit256[] = 2
                [16]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040",
                    "0x00000000000000000000000000000000000000000000000000000000000000c0"
                ],
                    "bytes32"
                ), // Length of bytes
                [17]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "0x0000000000000000000000000000000000000000000000000000000000000002"
                ],
                    "bytes32"
                ), // Join Kind
                [20]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "bytes32"
                ), // Length of (uint256,uint256)[] = 1
            },
        },

        // Stake
        allow.gnosis.balancer.B_50bbagGNO_50bbagUSD_gauge["deposit(uint256)"](),

        // Unstake
        allow.gnosis.balancer.B_50bbagGNO_50bbagUSD_gauge["withdraw(uint256)"](),

        // Claim Rewards
        allow.gnosis.balancer.B_50bbagGNO_50bbagUSD_gauge["claim_rewards()"](),

        // Claim BAL Rewards
        allow.gnosis.balancer.child_chain_gauge_reward_helper["claimRewardsFromGauge"](
            B_50bbagGNO_50bbagUSD_GAUGE,
            AVATAR
        ),
    ],
    placeholders: { AVATAR },
} satisfies RolePreset

export default preset
