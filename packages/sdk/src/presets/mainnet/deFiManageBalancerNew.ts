import { RolePreset } from "../../types"
import { allow as allowMap, contracts } from "../allow"
import { allowErc20Approve } from "../helpers/erc20"
import { allowLido } from "../helpers/lido"
import { AVATAR_ADDRESS } from "../placeholders"

const ZERO = "0x0000000000000000000000000000000000000000"

//Tokens

const AAVE = "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9"
const stkAAVE = "0x4da27a545c0c5B758a6BA100e3a049001de870f5"
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
const cUSDC = "0x39AA39c021dfbaE8faC545936693aC917d5E7563"
const cAAVE = "0xe65cdB6479BaC1e22340E4E755fAE7E509EcD06c"
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
const cDAI = "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"
const stETH = "0xae7ab96520de3a18e5e111b5eaab095312d7fe84"
const IDLE_wstETH_AA_TRANCHE = "0x2688FC68c4eac90d9E5e1B94776cF14eADe8D877"
const WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"

const allow = allowMap.mainnet

const preset: RolePreset = {
  network: 1,
  allow: [
    //LIDO
    ...allowLido(),

    //---------------------------------------------------------------------------------------------------------------------------------
    //Staking of AAVE in Safety Module
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([AAVE], [stkAAVE]),
    allow.aave.stkAave.stake(AVATAR_ADDRESS),
    allow.aave.stkAave.claimRewards(AVATAR_ADDRESS),

    //Initiates 10 days cooldown, till the 2 days unstaking window opens
    allow.aave.stkAave.cooldown(),

    //Unstakes, can only be called during the 2 days window after the 10 days cooldown
    allow.aave.stkAave.redeem(AVATAR_ADDRESS),

    //---------------------------------------------------------------------------------------------------------------------------------
    //Compound V2 - USDC
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([USDC], [cUSDC]),
    //Deposit
    {
      targetAddress: cUSDC,
      signature: "mint(uint256)",
    },
    //Withdrawing: sender redeems uint256 cTokens
    {
      targetAddress: cUSDC,
      signature: "redeem(uint256)",
    },
    //Withdrawing: sender redeems cTokens in exchange for a specified amount of underlying asset (uint256)
    {
      targetAddress: cUSDC,
      signature: "redeemUnderlying(uint256)",
    },
    //We are not allowing to include it as collateral

    //---------------------------------------------------------------------------------------------------------------------------------
    //Compound V2 - DAI
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([DAI], [cDAI]),
    //Deposit
    {
      targetAddress: cDAI,
      signature: "mint(uint256)",
    },
    //Withdrawing: sender redeems uint256 cTokens
    {
      targetAddress: cDAI,
      signature: "redeem(uint256)",
    },
    //Withdrawing: sender redeems cTokens in exchange for a specified amount of underlying asset (uint256)
    {
      targetAddress: cDAI,
      signature: "redeemUnderlying(uint256)",
    },
    //We are not allowing to include it as collateral

    //---------------------------------------------------------------------------------------------------------------------------------
    //Compound V2 - AAVE
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([AAVE], [cAAVE]),
    //Deposit
    {
      targetAddress: cAAVE,
      signature: "mint(uint256)",
    },
    //Withdrawing: sender redeems uint256 cTokens
    {
      targetAddress: cAAVE,
      signature: "redeem(uint256)",
    },
    //Withdrawing: sender redeems cTokens in exchange for a specified amount of underlying asset (uint256)
    {
      targetAddress: cAAVE,
      signature: "redeemUnderlying(uint256)",
    },
    //Claiming of rewards

    //We are not allowing to include it as collateral

    //---------------------------------------------------------------------------------------------------------------------------------
    //Compound V2 - Claiming of rewards
    //---------------------------------------------------------------------------------------------------------------------------------
    allow.compound.comptroller["claimComp(address,address[])"](AVATAR_ADDRESS, {
      subsetOf: [cAAVE, cDAI, cUSDC]
        .map((address) => address.toLowerCase())
        .sort(), // compound app will always pass tokens in ascending order
      restrictOrder: true,
    }),

    //---------------------------------------------------------------------------------------------------------------------------------
    //Idle - Deposit stETH and stake it on "Lido - stETH - Senior Tranche"
    //---------------------------------------------------------------------------------------------------------------------------------

    //Depositing
    ...allowErc20Approve([stETH], [contracts.mainnet.idle.stEthCdo.address]),

    //Deposit in AA tranche
    allow.idle.stEthCdo.depositAA(),

    //Withdraw from AA tranche
    allow.idle.stEthCdo.withdrawAA(),

    //Staking
    ...allowErc20Approve(
      [IDLE_wstETH_AA_TRANCHE],
      [contracts.mainnet.idle.wstEthAaGauge.address]
    ),
    //Stake in AA gauge
    allow.idle.wstEthAaGauge["deposit(uint256)"](),

    //Withdraw from AA gauge
    allow.idle.wstEthAaGauge["withdraw(uint256)"](),

    //Claiming of rewards
    //Claim LIDO
    allow.idle.wstEthAaGauge["claim_rewards()"](),

    //Claim IDLE
    allow.idle.distributorProxy.distribute(
      contracts.mainnet.idle.wstEthAaGauge.address
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    //Uniswap V3 - WBTC + ETH, Range: 11.786 - 15.082. Fee: 0.3%.
    //---------------------------------------------------------------------------------------------------------------------------------

    ...allowErc20Approve(
      [WBTC],
      [contracts.mainnet.uniswap.nftPositions.address]
    ),

    //Add liquidity
    allow.uniswap.nftPositions.mint({
      token0: WBTC,
      token1: WETH,
      fee: 3000,
      recipient: AVATAR_ADDRESS,
    }),
    allow.uniswap.nftPositions.refundETH({ send: true }),

    //Increase liquidity
    allow.uniswap.nftPositions.increaseLiquidity(undefined, {
      send: true,
    }),
    //refundETH() is already whitelisted

    //Remove liquidity
    allow.uniswap.nftPositions.decreaseLiquidity(),
    allow.uniswap.nftPositions.collect({ recipient: ZERO }),
    allow.uniswap.nftPositions.unwrapWETH9(undefined, AVATAR_ADDRESS),
    allow.uniswap.nftPositions.sweepToken(WBTC),

    //Unwrapping of WETH
    {
      targetAddress: WETH,
      signature: "withdraw(uint256)",
    },
  ],
}

console.log("new", JSON.stringify(preset))

export default preset
