import { allow } from "../../allow"
import { auraExitStrategy2 } from "../../helpers/ExitStrategies/AuraExitStrategies"
import { HoldingsExitStrategy } from "../../helpers/ExitStrategies/HoldingsExitStrategies"
import { lidoExitStrategyAll } from "../../helpers/ExitStrategies/LidoExitStrategies"
import { AVATAR } from "../../placeholders"
import { USDC, aura, balancer } from "../addresses"

const preset = {
  network: 1,
  allow: [
    //---------------------------------------------------------------------------------------------------------------------------------
    // Lido
    //---------------------------------------------------------------------------------------------------------------------------------

    ...lidoExitStrategyAll(),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Holdings
    //---------------------------------------------------------------------------------------------------------------------------------

    ...HoldingsExitStrategy(1), // 1 = mainnet

    //---------------------------------------------------------------------------------------------------------------------------------
    // AURA
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura COW/WETH + Balancer COW/WETH
    //---------------------------------------------------------------------------------------------------------------------------------

    ...auraExitStrategy2(
      aura.aura50COW_50WETH_REWARDER,
      balancer.B_50COW_50WETH_pId
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Locking AURA
    //---------------------------------------------------------------------------------------------------------------------------------

    // Process Expired AURA Locks - True -> Relock Expired Locks / False -> Withdraw Expired Locks
    allow.mainnet.aura.aura_locker["processExpiredLocks"](),

    // Withdraw funds in emergency state (isShutdown = True)
    allow.mainnet.aura.aura_locker["emergencyWithdraw"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // BALANCER
    //---------------------------------------------------------------------------------------------------------------------------------

    // //---------------------------------------------------------------------------------------------------------------------------------
    // // Compound V2
    // //---------------------------------------------------------------------------------------------------------------------------------

    // //---------------------------------------------------------------------------------------------------------------------------------
    // // Compound V2 - USDC
    // //---------------------------------------------------------------------------------------------------------------------------------

    // // Withdrawing: sender redeems uint256 cTokens, it is called when MAX is withdrawn
    // // {
    // //     targetAddress: cUSDC,
    // //     signature: "redeem(uint256)",
    // // },
    // allow.mainnet.compound_v2.cUSDC["redeem"](),

    // // Withdrawing: sender redeems cTokens in exchange for a specified amount of underlying asset (uint256), it is called when MAX isn't withdrawn
    // // {
    // //     targetAddress: cUSDC,
    // //     signature: "redeemUnderlying(uint256)",
    // // },
    // allow.mainnet.compound_v2.cUSDC["redeemUnderlying"](),

    // // Stop using as Collateral
    // // {
    // //     targetAddress: COMPTROLLER,
    // //     signature: "exitMarket(address)",
    // //     params: {
    // //         [0]: staticEqual(cUSDC, "address"),
    // //     },
    // // },
    // allow.mainnet.compound_v2.comptroller["exitMarket"](compound_v2.cUSDC),

    // // Repay specified borrowed amount of underlying asset (uint256)
    // // {
    // //     targetAddress: cUSDC,
    // //     signature: "repayBorrow(uint256)",
    // // },
    // allow.mainnet.compound_v2.cUSDC["repayBorrow"](),

    // //---------------------------------------------------------------------------------------------------------------------------------
    // // Compound V2 - DAI
    // //---------------------------------------------------------------------------------------------------------------------------------

    // // Withdrawing: sender redeems uint256 cTokens, it is called when MAX is withdrawn
    // // {
    // //     targetAddress: cDAI,
    // //     signature: "redeem(uint256)",
    // // },
    // allow.mainnet.compound_v2.cDAI["redeem"](),

    // // Withdrawing: sender redeems cTokens in exchange for a specified amount of underlying asset (uint256), it is called when MAX isn't withdrawn
    // // {
    // //     targetAddress: cDAI,
    // //     signature: "redeemUnderlying(uint256)",
    // // },
    // allow.mainnet.compound_v2.cDAI["redeemUnderlying"](),

    // // Stop using as Collateral
    // // {
    // //     targetAddress: COMPTROLLER,
    // //     signature: "exitMarket(address)",
    // //     params: {
    // //         [0]: staticEqual(cDAI, "address"),
    // //     },
    // // },
    // allow.mainnet.compound_v2.comptroller["exitMarket"](compound_v2.cDAI),

    // // Repay specified borrowed amount of underlying asset (uint256)
    // // {
    // //     targetAddress: cDAI,
    // //     signature: "repayBorrow(uint256)",
    // // },
    // allow.mainnet.compound_v2.cDAI["repayBorrow"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Compound V3
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Compound V3 - USDC
    //---------------------------------------------------------------------------------------------------------------------------------

    // Withdraw/Borrow
    allow.mainnet.compound_v3.cUSDCv3["withdraw"](USDC),

    // //---------------------------------------------------------------------------------------------------------------------------------
    // // Compound V3 - ETH
    // //---------------------------------------------------------------------------------------------------------------------------------

    // // Withdraw
    // {
    //   targetAddress: compound_v3.MainnetBulker,
    //   signature: "invoke(bytes32[],bytes[])",
    //   params: {
    //     [0]: staticEqual(
    //       "0x0000000000000000000000000000000000000000000000000000000000000040",
    //       "bytes32"
    //     ), // Offset of bytes32[] from beginning 64=32*2
    //     [1]: staticEqual(
    //       "0x0000000000000000000000000000000000000000000000000000000000000080",
    //       "bytes32"
    //     ), // Offset of bytes[] from beginning 128=32*4
    //     [2]: staticEqual(
    //       "0x0000000000000000000000000000000000000000000000000000000000000001",
    //       "bytes32"
    //     ), // Length of bytes32[] = 1
    //     [3]: staticEqual(
    //       "0x414354494f4e5f57495448445241575f4e41544956455f544f4b454e00000000",
    //       "bytes32"
    //     ), // ACTION_WITHDRAW_NATIVE_TOKEN Encoded
    //     [4]: staticEqual(
    //       "0x0000000000000000000000000000000000000000000000000000000000000001",
    //       "bytes32"
    //     ), // Length of bytes[] = 1
    //     [5]: staticEqual(
    //       "0x0000000000000000000000000000000000000000000000000000000000000020",
    //       "bytes32"
    //     ), // Offset of the first element of the bytes[] from beginning of bytes[] 32=32*1
    //     [6]: staticEqual(
    //       "0x0000000000000000000000000000000000000000000000000000000000000060",
    //       "bytes32"
    //     ), // Length of the first element of the bytes[] 96=32*3
    //     [7]: staticEqual(compound_v3.cUSDCv3, "address"),
    //     [8]: staticEqual(AVATAR),
    //   },
    // },
  ],
  placeholders: { AVATAR },
} satisfies RolePreset

export default preset
