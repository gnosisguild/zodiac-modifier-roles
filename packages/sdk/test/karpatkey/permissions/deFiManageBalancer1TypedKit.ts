import { c, Permission } from "../../../src"
import { allow as allowKit } from "../../../src/permissions/authoring/kit"

const allow = allowKit.mainnet

const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
const WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
const wstETH = "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0"
const AAVE = "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9"
const cUSDC = "0x39AA39c021dfbaE8faC545936693aC917d5E7563"
const cAAVE = "0xe65cdB6479BaC1e22340E4E755fAE7E509EcD06c"
const cDAI = "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"
const COMP = "0xc00e94Cb662C3520282E6f5717214004A7f26888"
const sETH2 = "0xFe2e637202056d30016725477c5da089Ab0A043A"
const rETH2 = "0x20BC832ca081b91433ff6c17f85701B6e92486c5"
const SWISE = "0x48C3399719B582dD63eB5AADf12A40B4C3f52FA2"

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

const preset = [
  //All approvals have been commented since we'll be handling over the Avatar safe with all of them having been already executed

  //---------------------------------------------------------------------------------------------------------------------------------
  //LIDO
  //---------------------------------------------------------------------------------------------------------------------------------

  //...allowErc20Approve([stETH], [wstETH]),
  allow.lido.stETH.submit(ZERO_ADDRESS, { send: true }),
  allow.lido.wstETH.wrap(),
  allow.lido.wstETH.unwrap(),

  //---------------------------------------------------------------------------------------------------------------------------------
  //Staking of AAVE in Safety Module
  //---------------------------------------------------------------------------------------------------------------------------------

  //...allowErc20Approve([AAVE], [stkAAVE]),
  allow.aave.stkAave.stake(c.avatar),
  allow.aave.stkAave.claimRewards(c.avatar),

  //Initiates 10 days cooldown period, once this is over the 2 days unstaking window opens:
  allow.aave.stkAave.cooldown(),

  //Unstakes, can only be called during the 2 days unstaking window after the 10 days cooldown period
  allow.aave.stkAave.redeem(c.avatar),

  //---------------------------------------------------------------------------------------------------------------------------------
  //Compound V2 - USDC
  //---------------------------------------------------------------------------------------------------------------------------------

  //...allowErc20Approve([USDC], [cUSDC]),

  //Deposit
  allow.compound.cUSDC.mint(),
  //Withdrawing: sender redeems uint256 cTokens, it is called when MAX is withdrawn
  allow.compound.cUSDC.redeem(),
  //Withdrawing: sender redeems cTokens in exchange for a specified amount of underlying asset (uint256), it is called when MAX isn't withdrawn
  allow.compound.cUSDC.redeemUnderlying(),
  //We are not allowing to include it as collateral

  //---------------------------------------------------------------------------------------------------------------------------------
  //Compound V2 - DAI
  //---------------------------------------------------------------------------------------------------------------------------------

  //...allowErc20Approve([DAI], [cDAI]),

  //Deposit
  allow.compound.cDAI.mint(),
  //Withdrawing: sender redeems uint256 cTokens, it is called when MAX is withdrawn
  allow.compound.cDAI.redeem(),
  //Withdrawing: sender redeems cTokens in exchange for a specified amount of underlying asset (uint256), it is called when MAX isn't withdrawn
  allow.compound.cDAI.redeemUnderlying(),
  //We are not allowing to include it as collateral

  //---------------------------------------------------------------------------------------------------------------------------------
  //Compound V2 - AAVE
  //---------------------------------------------------------------------------------------------------------------------------------

  //...allowErc20Approve([AAVE], [cAAVE]),

  //Deposit
  allow.compound.cAAVE.mint(),
  {
    targetAddress: cAAVE,
    signature: "mint(uint256)",
  },
  //Withdrawing: sender redeems uint256 cTokens, it is called when MAX is withdrawn
  allow.compound.cAAVE.redeem(),
  //Withdrawing: sender redeems cTokens in exchange for a specified amount of underlying asset (uint256), it is called when MAX isn't withdrawn
  allow.compound.cAAVE.redeemUnderlying(),
  //We are not allowing to include it as collateral

  //---------------------------------------------------------------------------------------------------------------------------------
  //Compound V2 - Claiming of rewards
  //---------------------------------------------------------------------------------------------------------------------------------
  allow.compound.comptroller["claimComp(address,address[])"](
    c.avatar,
    c.subset([cAAVE, cDAI, cUSDC])
  ),

  //---------------------------------------------------------------------------------------------------------------------------------
  //Uniswap V3 - WBTC + WETH, Range: 11.786 - 15.082. Fee: 0.3%.
  //---------------------------------------------------------------------------------------------------------------------------------

  //...allowErc20Approve([WBTC, WETH], [UV3_NFT_POSITIONS]),

  //Adding liquidity
  allow.uniswap.nftPositions.mint({
    token0: WBTC,
    token1: WETH,
    fee: 3000, //3000 represents the 0.3% fee
    recipient: c.avatar,
  }),
  //If ETH is deposited instead of WETH, one has to call the refundETH function after calling the mint function
  //We are only allowing to deposit WETH, otherwise the ETH held by the NFT Positions contract after calling the mint function could be claimed
  //by another address calling the refundETH function

  //Increasing liquidity: NFT ID 430246 was created in transaction with hash 0x8dc0368be4a8a28ab431a33ccf49acc85a4ca00a6c212c5d070a74af8aa0541f
  allow.uniswap.nftPositions.increaseLiquidity({ tokenId: 430246 }),

  //If ETH is deposited instead of WETH, one has to call the refundETH function after calling the increaseLiquidity function, but we are only
  //allowing for the depositing of WETH.

  //Removing liquidity: to remove liquidity one has to call the decreaseLiquidity and collect functions
  //decreaseLiquidity burns the token amounts in the pool, and increases token0Owed and token1Owed which represent the uncollected fees

  allow.uniswap.nftPositions.decreaseLiquidity(),
  //collect collects token0Owed and token1Owed. The address argument could also be the zero address, which is used to collect ETH
  //instead of WETH. In this case, the tokens (one of them WETH) are first sent to the NFT Positions contract, and have to then be
  //claimed by calling unwrapWETH9 and sweepToken. Since this is not safe non-custodial wise, we are only allowing the collecting
  //of ETH instead of WETH
  allow.uniswap.nftPositions.collect({ recipient: c.avatar }),

  //If ETH is collected instead of WETH, one has to call the unwrapWETH9 and sweepToken functions, but we are only allowing for the collecting of WETH.

  //---------------------------------------------------------------------------------------------------------------------------------
  //Stakewise
  //---------------------------------------------------------------------------------------------------------------------------------

  //When staking ETH one receives sETH2
  allow.stakewise.eth2Staking.stake({ send: true }),

  //By having staked ETH one receives rETH2 as rewards that are claimed by calling the claim function
  allow.stakewise.merkleDis.claim(undefined, c.avatar, [rETH2, SWISE]),

  //The exactInputSingle is needed for the reinvest option, which swaps rETH2 for sETH2 in the Uniswap V3 pool.
  //But as of now it is not considered within the strategy scope

  //---------------------------------------------------------------------------------------------------------------------------------
  //Stakewise - UniswapV3 WETH + sETH2, 0.3%
  //---------------------------------------------------------------------------------------------------------------------------------

  //...allowErc20Approve([sETH2, WETH], [UV3_NFT_POSITIONS]),

  //Add liquidity
  allow.uniswap.nftPositions.mint({
    token0: WETH,
    token1: sETH2,
    fee: 3000,
    recipient: c.avatar,
  }),

  //If ETH is deposited instead of WETH, one has to call the refundETH function after calling the mint function
  //We are only allowing to deposit WETH, otherwise the ETH held by the NFT Positions contract after calling the mint function could be claimed
  //by another address calling the refundETH function

  //Increasing liquidity: NFT ID 418686 was created in transaction with hash 0x198d10fc36ecfd2050990a5f1286d3d7ad226b4b482956d689d7216634fd7503:
  allow.uniswap.nftPositions.increaseLiquidity({ tokenId: 418686 }),

  //If ETH is deposited instead of WETH, one has to call the refundETH function after calling the increaseLiquidity function, but we are only
  //allowing for the depositing of WETH.

  //Remove liquidity
  //The decreaseLiquidity and collect functions have already been whitelisted.
  //See the comments above regarding unwrapETH9 and sweepToken

  //---------------------------------------------------------------------------------------------------------------------------------
  //Wrapping and unwrapping of ETH
  //---------------------------------------------------------------------------------------------------------------------------------
  {
    targetAddress: WETH,
    signature: "withdraw(uint256)",
  },
  {
    targetAddress: WETH,
    signature: "deposit()",
    send: true,
  },

  // Swap COMP/AAVE for WETH
  allow.uniswap.router2.exactInputSingle({
    tokenIn: c.or(COMP, AAVE),
    tokenOut: WETH,
    fee: c.or(100, 500, 3000, 10000),
    recipient: c.avatar,
  }),

  // Swap rETH2/SWISE for sETH2
  allow.uniswap.router2.exactInputSingle({
    tokenIn: c.or(rETH2, SWISE),
    tokenOut: sETH2,
    fee: c.or(100, 500, 3000, 10000),
    recipient: c.avatar,
  }),

  // Swap sETH2 for WETH
  allow.uniswap.router2.exactInputSingle({
    tokenIn: sETH2,
    tokenOut: WETH,
    fee: c.or(100, 500, 3000, 10000),
    recipient: c.avatar,
  }),
  // Swap WETH for sETH2/USDC/USDT/DAI/WBTC
  allow.uniswap.router2.exactInputSingle({
    tokenIn: WETH,
    tokenOut: c.or(sETH2, USDC, USDT, DAI, WBTC),
    fee: c.or(100, 500, 3000, 10000),
    recipient: c.avatar,
  }),

  // Swap USDC/DAI/USDT for WETH/USDC/USDT/DAI
  allow.uniswap.router2.exactInputSingle({
    tokenIn: c.or(USDC, USDT, DAI),
    tokenOut: c.or(WETH, USDC, USDT, DAI),
    fee: c.or(100, 500, 3000, 10000),
    recipient: c.avatar,
  }),

  // Swap WBTC for WETH
  allow.uniswap.router2.exactInputSingle({
    tokenIn: WBTC,
    tokenOut: WETH,
    fee: c.or(100, 500, 3000, 10000),
    recipient: c.avatar,
  }),

  //---------------------------------------------------------------------------------------------------------------------------------
  //Swapping of COMP, WETH, in Balancer: https://dev.balancer.fi/guides/swaps/single-swaps
  //---------------------------------------------------------------------------------------------------------------------------------

  //Swap COMP for WETH
  //...allowErc20Approve([COMP], [BALANCER_VAULT]),
  allow.balancer.vault.swap(
    {
      poolId:
        "0xefaa1604e82e1b3af8430b90192c1b9e8197e377000200000000000000000021", //COMP-WETH pool ID
      assetIn: COMP,
      assetOut: WETH,
    },
    {
      recipient: c.avatar,
      fromInternalBalance: false,
      sender: c.avatar,
      toInternalBalance: false,
    }
  ),

  //Swap WETH for DAI
  //...allowErc20Approve([WETH], [BALANCER_VAULT]),
  allow.balancer.vault.swap(
    {
      poolId:
        "0x0b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a", //WETH-DAI pool ID
      assetIn: WETH,
      assetOut: DAI,
    },
    {
      recipient: c.avatar,
      fromInternalBalance: false,
      sender: c.avatar,
      toInternalBalance: false,
    }
  ),

  //Swap WETH for USDC
  //...allowErc20Approve([WETH], [BALANCER_VAULT]),
  allow.balancer.vault.swap(
    {
      poolId:
        "0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8000200000000000000000019", //USDC-WETH pool ID
      assetIn: WETH,
      assetOut: USDC,
    },
    {
      recipient: c.avatar,
      fromInternalBalance: false,
      sender: c.avatar,
      toInternalBalance: false,
    }
  ),

  //Swap wstETH for WETH
  //...allowErc20Approve([wstETH], [BALANCER_VAULT]),
  allow.balancer.vault.swap(
    {
      poolId:
        "0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080", //wstETH-WETH pool ID
      assetIn: wstETH,
      assetOut: WETH,
    },
    {
      recipient: c.avatar,
      fromInternalBalance: false,
      sender: c.avatar,
      toInternalBalance: false,
    }
  ),

  //Swap WETH for wstETH
  //...allowErc20Approve([WETH], [BALANCER_VAULT]),
  allow.balancer.vault.swap(
    {
      poolId:
        "0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080", //wstETH-WETH pool ID
      assetIn: WETH,
      assetOut: wstETH,
    },
    {
      recipient: c.avatar,
      fromInternalBalance: false,
      sender: c.avatar,
      toInternalBalance: false,
    }
  ),
] satisfies Permission[]

export default preset
