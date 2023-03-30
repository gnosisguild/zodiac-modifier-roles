import { ZERO_ADDRESS } from "../addresses"
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
import { AVATAR, OMNI_BRIDGE_RECIPIENT_MAINNET } from "../../placeholders"
import { RolePreset } from "../../types"
import { allow } from "../../allow"

// Tokens
const COW = "0x177127622c4A00F3d409B75571e12cB3c8973d3c"
const CRV = "0x712b3d230F3C1c19db860d80619288b1F0BDd0Bd"
const EURe = "0xcB444e90D8198415266c6a2724b7900fb12FC56E"
const FLX = "0xD87eaA26dCfB0C0A6160cCf8c8a01BEB1C15fB00"
const GIV = "0x4f4F9b8D5B4d0Dc10506e5551B0513B61fD59e75"
const GNO = "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb"
const MAI = "0x3F56e0c36d275367b8C502090EDF38289b3dEa0d"
const rGNO = "0x6aC78efae880282396a335CA2F79863A1e6831D4"
const sGNO = "0xA4eF9Da5BA71Cc0D2e5E877a910A37eC43420445"
const SUSHI = "0x2995D1317DcD4f0aB89f4AE60F3f020A4F17C7CE"
const USDC = "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83"
const USDT = "0x4ECaBa5870353805a9F068101A40E0f32ed605C6"
const WBTC = "0x8e5bBbb09Ed1ebdE8674Cda39A0c169401db4252"
const WETH = "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1"
const wstETH = "0x6C76971f98945AE98dD7d4DFcA8711ebea946eA6"
const WXDAI = "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d"
const x3CRV = "0x1337BedC9D22ecbe766dF105c9623922A27963EC"

// SushiSwap contracts
const SLP_SUSHI_GNO = "0xF38c5b39F29600765849cA38712F302b1522C9B8"
const SLP_WETH_GNO = "0x15f9EEdeEBD121FBb238a8A0caE38f4b4A07A585"
const SLP_WETH_wstETH = "0xE6B448c0345bF6AA52ea3A5f17aabd0e58F23912"
const SUSHISWAP_ROUTER = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506"
const MINI_CHEF_V2 = "0xdDCbf776dF3dE60163066A5ddDF2277cB445E0F3"

// Curve contracts
const STAKE_DEPOSIT_ZAP = "0xB7De33440B7171159a9718CBE748086cecDd9685"
const crvEUReUSD_LP = "0x0CA1C1eC4EBf3CC67a9f545fF90a3795b318cA4a"
const crvEUReUSD_POOL = "0x056C6C5e684CeC248635eD86033378Cc444459B0"
const crvEUReUSD_GAUGE = "0xd91770E868c7471a9585d1819143063A40c54D00"
const crvEUReUSD_ZAP = "0xE3FFF29d4DC930EBb787FeCd49Ee5963DADf60b6"
const crv3crypto_POOL = "0x5633E00994896D0F472926050eCb32E38bef3e65"
const crv3crypto_LP = "0x02E7e2dd3BA409148A49D5cc9a9034D2f884F245"
const crv3crypto_GAUGE = "0x3f7693797352A321f8D532A8B297F91DD31898D8"
const crv3crypto_ZAP = "0xF182926A64C0A19234E7E1FCDfE772aA7A1CA351"
const MAIx3CRV_LP_POOL = "0xA64D8025ddA09bCE94DA2cF2DC175d1831e2dF76"
const MAIx3CRV_GAUGE = "0xa6DF868420232698c1D0bF9Aa8677D4873307A6a"
const FACTORY_METAPOOLS_ZAP = "0x87C067fAc25f123554a0E76596BF28cFa37fD5E9"
const rgnoCRV_LP_POOL = "0x5D7309a01B727d6769153fCB1dF5587858d53B9C"
const rgnoCRV_GAUGE = "0x9509A9D5C55793858FE8b1C00a99e012a7AF4aaB"
const sgnoCRV_LP_POOL = "0xBdF4488Dcf7165788D438b62B4C8A333879B7078"
const sgnoCRV_GAUGE = "0x2686d5E477d1AaA58BF8cE598fA95d97985c7Fb1"
const x3CRV_LP = "0x1337BedC9D22ecbe766dF105c9623922A27963EC"
const x3CRV_POOL = "0x7f90122BF0700F9E7e1F688fe926940E8839F353"
const x3CRV_GAUGE = "0xB721Cc32160Ab0da2614CC6aB16eD822Aeebc101"

// RealT contracts
const REALT_GATEWAY = "0x80Dc050A8C923C0051D438026f1192d53033728c"
const REALT_LENDING_POOL = "0x5B8D36De471880Ee21936f328AAB2383a280CB2A"
const armmWXDAI = "0x7349c9eaa538e118725a6130e0f8341509b9f8a0"
const variableDebtrmmWXDAI = "0x6a7CeD66902D07066Ad08c81179d17d0fbE36829"

// Honeyswap contracts
const HONEYSWAP_ROUTER = "0x1C232F01118CB8B424793ae03F870aa7D0ac7f77"
// const HONEYSWAP_MULTI_WITHDRAWER = "0x53f224f83b2B2365caf4178f52C234dA1ecF392f"
const HLP_COW_GNO = "0x6a43be8A3daBf8a0A7B56773F536266aE932a451"
const HLP_CRV_GNO = "0xac16c751f4c719a7ad54081a32ab0488b56f0ef4"
const HLP_GIV_GNO = "0x5Aa67e24BA8A3fbDc553e308d02377E03cE9e94F"
const HLP_GNO_FLX = "0xF0376d1faFD1ff2F1367546da622ba8F26829D7A"
const HLP_GNO_WXDAI = "0x321704900D52F44180068cAA73778d5cD60695A6"
const HLP_WETH_GNO = "0x28Dbd35fD79f48bfA9444D330D14683e7101d817"

// OmniBridge contracts
const OMNI_BRIDGE = "0xf6A78083ca3e2a662D6dd1703c939c8aCE2e268d"


const preset = {
    network: 100,
    allow: [

        //---------------------------------------------------------------------------------------------------------------------------------
        // SushiSwap
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([GNO, SUSHI, WETH, wstETH], [SUSHISWAP_ROUTER]),
        ...allowErc20Approve([SLP_SUSHI_GNO, SLP_WETH_GNO, SLP_WETH_wstETH], [SUSHISWAP_ROUTER]),

        // Add Liquidity
        allow.gnosis.sushiswap.router["addLiquidity"](
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        // Remove Liquidity
        allow.gnosis.sushiswap.router["removeLiquidity"](
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        allow.gnosis.sushiswap.router["removeLiquidityWithPermit"](
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        // Stake
        allow.gnosis.sushiswap.minichef_v2["deposit"](
            undefined,
            undefined,
            AVATAR
        ),

        // Unstake and Claim Rewards
        allow.gnosis.sushiswap.minichef_v2["withdrawAndHarvest"](
            undefined,
            undefined,
            AVATAR
        ),

        // Claim Rewards
        allow.gnosis.sushiswap.minichef_v2["harvest"](
            undefined,
            AVATAR
        ),

        // //---------------------------------------------------------------------------------------------------------------------------------
        // // SushiSwap WETH/GNO
        // //---------------------------------------------------------------------------------------------------------------------------------
        // ...allowErc20Approve([WETH, GNO], [SUSHISWAP_ROUTER]),
        // ...allowErc20Approve([SLP_WETH_GNO], [SUSHISWAP_ROUTER]),

        // // Add Liquidity
        // // {
        // //     targetAddress: SUSHISWAP_ROUTER,
        // //     signature: "addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)",
        // //     params: {
        // //         [0]: staticEqual(WETH, "address"),
        // //         [1]: staticEqual(GNO, "address"),
        // //         [6]: staticEqual(AVATAR),
        // //     },
        // // },
        // allow.gnosis.sushiswap.router["addLiquidity"](
        //     WETH,
        //     GNO,
        //     undefined,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // // Remove Liquidity
        // // {
        // //     targetAddress: SUSHISWAP_ROUTER,
        // //     signature: "removeLiquidity(address,address,uint256,uint256,uint256,address,uint256)",
        // //     params: {
        // //         [0]: staticEqual(WETH, "address"),
        // //         [1]: staticEqual(GNO, "address"),
        // //         [5]: staticEqual(AVATAR),
        // //     },
        // // },
        // allow.gnosis.sushiswap.router["removeLiquidity"](
        //     WETH,
        //     GNO,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // // Remove Liquidity
        // // {
        // //     targetAddress: SUSHISWAP_ROUTER,
        // //     signature: "removeLiquidityWithPermit(address,address,uint256,uint256,uint256,address,uint256,bool,uint8,bytes32,bytes32)",
        // //     params: {
        // //         [0]: staticEqual(WETH, "address"),
        // //         [1]: staticEqual(GNO, "address"),
        // //         [5]: staticEqual(AVATAR),
        // //     },
        // // },
        // allow.gnosis.sushiswap.router["removeLiquidityWithPermit"](
        //     WETH,
        //     GNO,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // // Stake
        // // {
        // //     targetAddress: MINI_CHEF_V2,
        // //     signature: "deposit(uint256,uint256,address)",
        // //     params: {
        // //         [0]: staticEqual(9, "uint256"), // SushiSwap poolId
        // //         [2]: staticEqual(AVATAR),
        // //     },
        // // },
        // allow.gnosis.sushiswap.minichef_v2["deposit"](
        //     9,
        //     undefined,
        //     AVATAR
        // ),

        // // Unstake and Claim Rewards
        // // {
        // //     targetAddress: MINI_CHEF_V2,
        // //     signature: "withdrawAndHarvest(uint256,uint256,address)",
        // //     params: {
        // //         [0]: staticEqual(9, "uint256"), // SushiSwap poolId
        // //         [2]: staticEqual(AVATAR),
        // //     },
        // // },
        // allow.gnosis.sushiswap.minichef_v2["withdrawAndHarvest"](
        //     9,
        //     undefined,
        //     AVATAR
        // ),

        // // Claim Rewards
        // // {
        // //     targetAddress: MINI_CHEF_V2,
        // //     signature: "harvest(uint256,address)",
        // //     params: {
        // //         [0]: staticEqual(9, "uint256"), // SushiSwap poolId
        // //         [1]: staticEqual(AVATAR),
        // //     },
        // // },
        // allow.gnosis.sushiswap.minichef_v2["harvest"](
        //     9,
        //     AVATAR
        // ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Curve
        //---------------------------------------------------------------------------------------------------------------------------------

        //---------------------------------------------------------------------------------------------------------------------------------
        // Curve 3pool
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([USDC, USDT, WXDAI], [x3CRV_POOL]),
        ...allowErc20Approve([x3CRV_LP], [x3CRV_GAUGE]),
        ...allowErc20Approve([WXDAI, USDC, USDT], [STAKE_DEPOSIT_ZAP]),

        // Add Liquidity
        // {
        //     targetAddress: x3CRV_POOL,
        //     signature: "add_liquidity(uint256[3],uint256)",
        // },
        allow.gnosis.curve.x3CRV_pool["add_liquidity"](),

        // Remove Liquidity
        // {
        //     targetAddress: x3CRV_POOL,
        //     signature: "remove_liquidity(uint256,uint256[3])",
        // },
        allow.gnosis.curve.x3CRV_pool["remove_liquidity"](),

        // Remove Liquidity of One Coin
        // {
        //     targetAddress: x3CRV_POOL,
        //     signature: "remove_liquidity_one_coin(uint256,int128,uint256)",
        // },
        allow.gnosis.curve.x3CRV_pool["remove_liquidity_one_coin"](),

        // Remove Liquidity Imbalance
        // {
        //     targetAddress: x3CRV_POOL,
        //     signature: "remove_liquidity_imbalance(uint256[3],uint256)",
        // },
        allow.gnosis.curve.x3CRV_pool["remove_liquidity_imbalance"](),

        // Exchange
        // {
        //     targetAddress: x3CRV_POOL,
        //     signature: "exchange(int128,int128,uint256,uint256)",
        // },
        allow.gnosis.curve.x3CRV_pool["exchange"](),

        // Stake
        // {
        //     targetAddress: x3CRV_GAUGE,
        //     signature: "deposit(uint256)",
        // },
        allow.gnosis.curve.x3CRV_gauge["deposit(uint256)"](),

        // NO EVIDENCE OF BEING USED
        // {
        //     targetAddress: x3CRV_GAUGE,
        //     signature: "deposit(uint256,address,bool)",
        //     params: {
        //         [1]: staticEqual(AVATAR),
        //     },
        // },
        allow.gnosis.curve.x3CRV_gauge["deposit(uint256,address,bool)"](
            undefined,
            AVATAR
        ),

        // Unstake
        // {
        //     targetAddress: x3CRV_GAUGE,
        //     signature: "withdraw(uint256)",
        // },
        allow.gnosis.curve.x3CRV_gauge["withdraw(uint256)"](),

        // NO EVIDENCE OF BEING USED
        // {
        //     targetAddress: x3CRV_GAUGE,
        //     signature: "withdraw(uint256,address,bool)",
        //     params: {
        //         [1]: staticEqual(AVATAR),
        //     },
        // },
        allow.gnosis.curve.x3CRV_gauge["withdraw(uint256,address,bool)"](
            undefined,
            AVATAR
        ),

        // Claim Rewards
        // {
        //     targetAddress: x3CRV_GAUGE,
        //     signature: "claim_rewards()",
        // },
        allow.gnosis.curve.x3CRV_gauge["claim_rewards()"](),

        // Claim CRV
        allow.gnosis.curve.crv_minter["mint"](
            x3CRV_GAUGE
        ),

        // Deposit and Stake using a special ZAP
        // {
        //     targetAddress: STAKE_DEPOSIT_ZAP,
        //     signature: "deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)",
        //     params: {
        //         [0]: staticEqual(x3CRV_POOL, "address"),
        //         [1]: staticEqual(x3CRV_LP, "address"),
        //         [2]: staticEqual(x3CRV_GAUGE, "address"),
        //         [3]: staticEqual(3, "uint256"),
        //         [4]: staticEqual([
        //             [WXDAI, USDC, USDT, ZERO_ADDRESS, ZERO_ADDRESS]
        //         ],
        //             "address[5]"),
        //         [8]: staticEqual(ZERO_ADDRESS, "address"),
        //     },
        // },
        allow.gnosis.curve.stake_deposit_zap["deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)"](
            x3CRV_POOL,
            x3CRV_LP,
            x3CRV_GAUGE,
            3,
            [WXDAI, USDC, USDT, ZERO_ADDRESS, ZERO_ADDRESS],
            undefined,
            undefined,
            undefined,
            ZERO_ADDRESS
        ),

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
        allow.gnosis.curve.crvEUReUSD_pool["add_liquidity(uint256[2],uint256,address)"](),

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

        // Claim CRV
        allow.gnosis.curve.crv_minter["mint"](
            crvEUReUSD_GAUGE
        ),

        // Deposit and Stake using a special ZAP
        // {
        //     targetAddress: STAKE_DEPOSIT_ZAP,
        //     signature: "deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)",
        //     params: {
        //         [0]: staticOneOf([crvEUReUSD_POOL, crvEUReUSD_ZAP], "address"),
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
            {
                oneOf: [crvEUReUSD_POOL, crvEUReUSD_ZAP]
            },
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

        // Claim CRV
        allow.gnosis.curve.crv_minter["mint"](
            sgnoCRV_GAUGE
        ),

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

        // Add Liquidity (Underlying, using ZAP)
        allow.gnosis.curve.crv3crypto_zap["add_liquidity(uint256[5],uint256)"](),

        // Remove Liquidity
        allow.gnosis.curve.crv3crypto_pool["remove_liquidity"](),

        // Remove Liquidity (Underlying, using ZAP)
        allow.gnosis.curve.crv3crypto_zap["remove_liquidity(uint256,uint256[5])"](),

        // Remove Liquidity of One Coin
        allow.gnosis.curve.crv3crypto_pool["remove_liquidity_one_coin"](),

        // Remove Liquidity of One Coin (Underlying, using ZAP)
        allow.gnosis.curve.crv3crypto_zap["remove_liquidity_one_coin(uint256,uint256,uint256)"](),

        // Exchange
        allow.gnosis.curve.crv3crypto_pool["exchange(uint256,uint256,uint256,uint256)"](),
        // NO EVIDENCE OF BEING USED
        allow.gnosis.curve.crv3crypto_pool["exchange(uint256,uint256,uint256,uint256,bool)"](),

        // Exchange (Underlying, using ZAP)
        allow.gnosis.curve.crv3crypto_zap["exchange_underlying(uint256,uint256,uint256,uint256)"](),

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

        // Claim CRV
        allow.gnosis.curve.crv_minter["mint"](
            crv3crypto_GAUGE
        ),

        // // Deposit and Stake using a special ZAP - DOES NOT HAVE THIS OPTION THROUGH THE UI
        // allow.gnosis.curve.stake_deposit_zap["deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)"](
        //     {
        //         oneOf: [crv3crypto_POOL, crv3crypto_ZAP]
        //     },
        //     crv3crypto_LP,
        //     crv3crypto_GAUGE,
        //     {
        //         oneOf: [3, 5]
        //     },
        //     {
        //         oneOf: [
        //             [x3CRV, WBTC, WETH, ZERO_ADDRESS, ZERO_ADDRESS],
        //             [WXDAI, USDC, USDT, WBTC, WETH]
        //         ]
        //     },
        //     undefined,
        //     undefined,
        //     undefined,
        //     ZERO_ADDRESS
        // ),

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

        // Claim CRV
        allow.gnosis.curve.crv_minter["mint"](
            rgnoCRV_GAUGE
        ),

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
        // Curve MAI/x3CRV
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([MAI, x3CRV], [MAIx3CRV_LP_POOL]),
        ...allowErc20Approve([MAIx3CRV_LP_POOL], [MAIx3CRV_GAUGE]),
        ...allowErc20Approve([MAI, WXDAI, USDC, USDT], [FACTORY_METAPOOLS_ZAP]),
        ...allowErc20Approve([MAI, x3CRV, WXDAI, USDC, USDT], [STAKE_DEPOSIT_ZAP]),

        // Add Liquidity
        // {
        //     targetAddress: MAIx3CRV_LP_POOL,
        //     signature: "add_liquidity(uint256[2],uint256)",
        // },
        allow.gnosis.curve.MAIx3CRV_lp_pool["add_liquidity(uint256[2],uint256)"](),

        // Add Liquidity (Underlying, using ZAP)
        // {
        //     targetAddress: FACTORY_METAPOOLS_ZAP,
        //     signature: "add_liquidity(address,uint256[4],uint256)",
        // },
        allow.gnosis.curve.factory_metapools_zap["add_liquidity(address,uint256[4],uint256)"](
            MAIx3CRV_LP_POOL
        ),

        // Remove Liquidity
        // {
        //     targetAddress: MAIx3CRV_LP_POOL,
        //     signature: "remove_liquidity(uint256,uint256[2])",
        // },
        allow.gnosis.curve.MAIx3CRV_lp_pool["remove_liquidity(uint256,uint256[2])"](),

        // Remove Liquidity (Underlying, using ZAP)
        // {
        //     targetAddress: FACTORY_METAPOOLS_ZAP,
        //     signature: "remove_liquidity(address,uint256,uint256[4])",
        // },
        allow.gnosis.curve.factory_metapools_zap["remove_liquidity(address,uint256,uint256[4])"](),

        // Remove Liquidity of One Coin
        // {
        //     targetAddress: MAIx3CRV_LP_POOL,
        //     signature: "remove_liquidity_one_coin(uint256,int128,uint256)",
        // },
        allow.gnosis.curve.MAIx3CRV_lp_pool["remove_liquidity_one_coin(uint256,int128,uint256)"](),

        // Remove Liquidity of One Coin (Underlying, using ZAP)
        // {
        //     targetAddress: FACTORY_METAPOOLS_ZAP,
        //     signature: "remove_liquidity_one_coin(address,uint256,int128,uint256)",
        // },
        allow.gnosis.curve.factory_metapools_zap["remove_liquidity_one_coin(address,uint256,int128,uint256)"](),

        // Exchange
        // {
        //     targetAddress: MAIx3CRV_LP_POOL,
        //     signature: "exchange(int128,int128,uint256,uint256)",
        // },
        allow.gnosis.curve.MAIx3CRV_lp_pool["exchange(int128,int128,uint256,uint256)"](),

        // Exchange Underlying
        // {
        //     targetAddress: MAIx3CRV_LP_POOL,
        //     signature: "exchange_underlying(int128,int128,uint256,uint256)",
        // },
        allow.gnosis.curve.MAIx3CRV_lp_pool["exchange_underlying(int128,int128,uint256,uint256)"](),

        // Stake
        // {
        //     targetAddress: MAIx3CRV_GAUGE,
        //     signature: "deposit(uint256)",
        // },
        allow.gnosis.curve.MAIx3CRV_gauge["deposit(uint256)"](),

        // NO EVIDENCE OF BEING USED
        // {
        //     targetAddress: MAIx3CRV_GAUGE,
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
        //     targetAddress: MAIx3CRV_GAUGE,
        //     signature: "withdraw(uint256)",
        // },
        allow.gnosis.curve.MAIx3CRV_gauge["withdraw(uint256)"](),

        // NO EVIDENCE OF BEING USED
        // {
        //     targetAddress: MAIx3CRV_GAUGE,
        //     signature: "withdraw(uint256,address,bool)",
        //     params: {
        //         [1]: staticEqual(AVATAR),
        //     },
        // },
        allow.gnosis.curve.MAIx3CRV_gauge["withdraw(uint256,address,bool)"](
            undefined,
            AVATAR
        ),

        // Claim Rewards
        // {
        //     targetAddress: MAIx3CRV_GAUGE,
        //     signature: "claim_rewards()",
        // },
        allow.gnosis.curve.MAIx3CRV_gauge["claim_rewards()"](),

        // Claim CRV
        allow.gnosis.curve.crv_minter["mint"](
            MAIx3CRV_GAUGE
        ),

        // Deposit and Stake using a special ZAP
        // {
        //     targetAddress: STAKE_DEPOSIT_ZAP,
        //     signature: "deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)",
        //     params: {
        //         [0]: staticOneOf([MAIx3CRV_LP_POOL, FACTORY_METAPOOLS_ZAP], "address"),
        //         [1]: staticEqual(MAIx3CRV_LP_POOL, "address"),
        //         [2]: staticEqual(MAIx3CRV_GAUGE, "address"),
        //         [3]: staticOneOf([2, 4], "uint256"),
        //         [4]: staticOneOf([
        //             [MAI, x3CRV, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
        //             [MAI, WXDAI, USDC, USDT, ZERO_ADDRESS]],
        //             "address[5]"),
        //         [8]: staticEqual(ZERO_ADDRESS, "address"),
        //     },
        // },
        allow.gnosis.curve.stake_deposit_zap["deposit_and_stake(address,address,address,uint256,address[5],uint256[5],uint256,bool,address)"](
            {
                oneOf: [MAIx3CRV_LP_POOL, FACTORY_METAPOOLS_ZAP]
            },
            MAIx3CRV_LP_POOL,
            MAIx3CRV_GAUGE,
            {
                oneOf: [2, 4]
            },
            {
                oneOf: [
                    [MAI, x3CRV, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
                    [MAI, WXDAI, USDC, USDT, ZERO_ADDRESS]
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
        ...allowErc20Approve([COW, CRV, FLX, GNO, GIV, WETH, WXDAI], [HONEYSWAP_ROUTER]),
        ...allowErc20Approve([HLP_CRV_GNO, HLP_COW_GNO, HLP_GIV_GNO, HLP_GNO_FLX, HLP_GNO_WXDAI, HLP_WETH_GNO], [HONEYSWAP_ROUTER]),

        // Add Liquidity
        allow.gnosis.honeyswap.router["addLiquidity"](
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        // Remove Liquidity
        allow.gnosis.honeyswap.router["removeLiquidity"](
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            AVATAR
        ),

        // //---------------------------------------------------------------------------------------------------------------------------------
        // // Honeyswap COW/GNO
        // //---------------------------------------------------------------------------------------------------------------------------------
        // ...allowErc20Approve([COW, GNO], [HONEYSWAP_ROUTER]),
        // ...allowErc20Approve([HLP_COW_GNO], [HONEYSWAP_ROUTER]),

        // // Add Liquidity
        // // {
        // //     targetAddress: HONEYSWAP_ROUTER,
        // //     signature: "addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)",
        // //     params: {
        // //         [0]: staticEqual(COW, "address"),
        // //         [1]: staticEqual(GNO, "address"),
        // //         [6]: staticEqual(AVATAR),
        // //     },
        // // },
        // allow.gnosis.honeyswap.router["addLiquidity"](
        //     {
        //         oneOf: [COW, GNO]
        //     },
        //     {
        //         oneOf: [COW, GNO]
        //     },
        //     undefined,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // // Remove Liquidity
        // // {
        // //     targetAddress: HONEYSWAP_ROUTER,
        // //     signature: "removeLiquidity(address,address,uint256,uint256,uint256,address,uint256)",
        // //     params: {
        // //         [0]: staticEqual(COW, "address"),
        // //         [1]: staticEqual(GNO, "address"),
        // //         [5]: staticEqual(AVATAR),
        // //     },
        // // },
        // allow.gnosis.honeyswap.router["removeLiquidity"](
        //     COW,
        //     GNO,
        //     undefined,
        //     undefined,
        //     undefined,
        //     AVATAR
        // ),

        // // // Claim Rewards
        // // {
        // //     targetAddress: HONEYSWAP_MULTI_WITHDRAWER,
        // //     signature: "withdrawRewardsFrom(uint256[])",
        // // }

        //---------------------------------------------------------------------------------------------------------------------------------
        // OMNI BRIDGE
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([WETH, COW], [OMNI_BRIDGE]),
        // {
        //     targetAddress: OMNI_BRIDGE,
        //     signature: "relayTokens(address,address,uint256)",
        //     params: {
        //         [1]: staticEqual(OMNI_BRIDGE_RECIPIENT_MAINNET),
        //     },
        // },
        allow.gnosis.omnibridge["relayTokens(address,address,uint256)"](
            undefined,
            OMNI_BRIDGE_RECIPIENT_MAINNET
        ),
    ],
    placeholders: { AVATAR, OMNI_BRIDGE_RECIPIENT_MAINNET },
} satisfies RolePreset

export default preset
