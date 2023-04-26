import { allow } from "../../allow"
import {
    COW, DAI, GNO, USDC, USDT,
    balancer,
    compound_v2,
    compound_v3
} from "../addresses"
import {
    staticEqual,
    staticOneOf,
} from "../../helpers/utils"
import { AVATAR } from "../../placeholders"
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
        // BALANCER
        //---------------------------------------------------------------------------------------------------------------------------------

        // Relayer Approval (this is done only once per wallet)
        allow.mainnet.balancer.relayer_library["setRelayerApproval"](
            balancer.RELAYER
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Balancer Boosted Aave USD
        //---------------------------------------------------------------------------------------------------------------------------------

        // Swap DAI for bb_a_DAI (for both, join and exit pool)
        // Swap USDT for bb_a_USDT (for both, join and exit pool)
        // Swap USDC for bb_a_USDC (for both, join and exit pool)
        {
            targetAddress: balancer.RELAYER_LIBRARY,
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

        // Remove Liquidity
        {
            targetAddress: balancer.RELAYER_LIBRARY,
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

        // Unstake
        allow.mainnet.balancer.bb_a_USD_gauge["withdraw(uint256)"](),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Balancer GNO/COW pool
        //---------------------------------------------------------------------------------------------------------------------------------

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

        // Unstake
        allow.mainnet.balancer.B_50COW_50GNO_gauge["withdraw(uint256)"](),

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
        allow.mainnet.compound_v2.cUSDC["redeem"](),

        // Withdrawing: sender redeems cTokens in exchange for a specified amount of underlying asset (uint256), it is called when MAX isn't withdrawn
        // {
        //     targetAddress: cUSDC,
        //     signature: "redeemUnderlying(uint256)",
        // },
        allow.mainnet.compound_v2.cUSDC["redeemUnderlying"](),

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

        // Repay specified borrowed amount of underlying asset (uint256)
        // {
        //     targetAddress: cUSDC,
        //     signature: "repayBorrow(uint256)",
        // },
        allow.mainnet.compound_v2.cUSDC["repayBorrow"](),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Compound V2 - DAI
        //---------------------------------------------------------------------------------------------------------------------------------

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

        // Repay specified borrowed amount of underlying asset (uint256)
        // {
        //     targetAddress: cDAI,
        //     signature: "repayBorrow(uint256)",
        // },
        allow.mainnet.compound_v2.cDAI["repayBorrow"](),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Compound V3
        //---------------------------------------------------------------------------------------------------------------------------------

        //---------------------------------------------------------------------------------------------------------------------------------
        // Compound V3 - USDC
        //---------------------------------------------------------------------------------------------------------------------------------

        // Withdraw/Borrow
        allow.mainnet.compound_v3.cUSDCv3["withdraw"](
            USDC
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Compound V3 - ETH
        //---------------------------------------------------------------------------------------------------------------------------------

        // Withdraw
        {
            targetAddress: compound_v3.MainnetBulker,
            signature:
                "invoke(bytes32[],bytes[])",
            params: {
                [0]: staticEqual(
                    "0000000000000000000000000000000000000000000000000000000000000040",
                    "bytes32"
                ), // Offset of bytes32[] from beginning 64=32*2
                [1]: staticEqual(
                    "0000000000000000000000000000000000000000000000000000000000000080",
                    "bytes32"
                ), // Offset of bytes[] from beginning 128=32*4
                [2]: staticEqual(
                    "0000000000000000000000000000000000000000000000000000000000000001",
                    "bytes32"
                ), // Length of bytes32[] = 1
                [3]: staticEqual(
                    "414354494f4e5f57495448445241575f4e41544956455f544f4b454e00000000",
                    "bytes32"
                ), // ACTION_WITHDRAW_NATIVE_TOKEN Encoded
                [4]: staticEqual(
                    "0000000000000000000000000000000000000000000000000000000000000001",
                    "bytes32"
                ), // Length of bytes[] = 1
                [5]: staticEqual(
                    "0000000000000000000000000000000000000000000000000000000000000020",
                    "bytes32"
                ), // Offset of the first element of the bytes[] from beginning of bytes[] 32=32*1
                [6]: staticEqual(
                    "0000000000000000000000000000000000000000000000000000000000000060",
                    "bytes32"
                ), // Length of the first element of the bytes[] 96=32*3
                [7]: staticEqual(compound_v3.cUSDCv3, "address"),
                [8]: staticEqual(AVATAR)
            },
        },
    ],
    placeholders: { AVATAR },
} satisfies RolePreset

export default preset
