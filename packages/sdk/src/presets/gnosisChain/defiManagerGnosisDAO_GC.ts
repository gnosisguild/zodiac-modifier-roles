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
const sGNO = "0xA4eF9Da5BA71Cc0D2e5E877a910A37eC43420445"
const rGNO = "0x6aC78efae880282396a335CA2F79863A1e6831D4"
const FLX = "0xD87eaA26dCfB0C0A6160cCf8c8a01BEB1C15fB00"
const WETH = "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1"
const WBTC = "0x8e5bBbb09Ed1ebdE8674Cda39A0c169401db4252"
const x3CRV = "0x1337BedC9D22ecbe766dF105c9623922A27963EC"
const WXDAI = "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d"
const USDC = "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83"
const USDT = "0x4ECaBa5870353805a9F068101A40E0f32ed605C6"

// SushiSwap contracts
const SLP_WETH_GNO = "0x15f9EEdeEBD121FBb238a8A0caE38f4b4A07A585"
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
const HLP_GNO_WETH = "0x28Dbd35fD79f48bfA9444D330D14683e7101d817"
const HLP_GNO_FLX = "0xF0376d1faFD1ff2F1367546da622ba8F26829D7A"


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

        // // Deposit and Stake using a special ZAP
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
        // Honeyswap GNO/WETH
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([GNO, WETH], [HONEYSWAP_ROUTER]),
        ...allowErc20Approve([HLP_GNO_WETH], [HONEYSWAP_ROUTER]),

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
    ],
    placeholders: { AVATAR },
} satisfies RolePreset

export default preset
