import {
  ZERO_ADDRESS,
  AAVE,
  COMP,
  DAI,
  rETH2,
  sETH2,
  SWISE,
  USDC,
  USDT,
  WBTC,
  WETH,
  wstETH,
  balancer,
  compound_v2,
  uniswapv3,
} from "../addresses"
import { staticEqual, staticOneOf } from "../../helpers/utils"
import { AVATAR } from "../../placeholders"
import { RolePreset } from "../../types"
import { allow } from "../../allow"

const preset = {
  network: 1,
  allow: [
    //All approvals have been commented since we'll be handling over the Avatar safe with all of them having been already executed

    //---------------------------------------------------------------------------------------------------------------------------------
    // LIDO
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve([stETH], [wstETH]),

    // {
    //   targetAddress: stETH,
    //   signature: "submit(address)",
    //   params: {
    //     [0]: staticEqual(ZERO_ADDRESS, "address"),
    //   },
    //   send: true,
    // },
    allow.mainnet.lido.stETH["submit"](ZERO_ADDRESS, {
      send: true,
    }),

    // { targetAddress: wstETH, signature: "wrap(uint256)" },
    allow.mainnet.lido.wstETH["wrap"](),
    // { targetAddress: wstETH, signature: "unwrap(uint256)" }
    allow.mainnet.lido.wstETH["unwrap"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Staking of AAVE in Safety Module
    //---------------------------------------------------------------------------------------------------------------------------------
    //...allowErc20Approve([AAVE], [stkAAVE]),

    // {
    //   targetAddress: stkAAVE,
    //   signature: "stake(address,uint256)",
    //   params: {
    //     [0]: staticEqual(AVATAR),
    //   },
    // },
    allow.mainnet.aave_v2.stkAave["stake"](AVATAR),

    // {
    //   targetAddress: stkAAVE,
    //   signature: "claimRewards(address,uint256)",
    //   params: {
    //     [0]: staticEqual(AVATAR),
    //   },
    // },
    allow.mainnet.aave_v2.stkAave["claimRewards"](AVATAR),

    // Initiates 10 days cooldown period, once this is over the 2 days unstaking window opens:
    // {
    //   targetAddress: stkAAVE,
    //   signature: "cooldown()",
    // },
    allow.mainnet.aave_v2.stkAave["cooldown"](),

    // Unstakes, can only be called during the 2 days unstaking window after the 10 days cooldown period
    // {
    //   targetAddress: stkAAVE,
    //   signature: "redeem(address,uint256)",
    //   params: {
    //     [0]: staticEqual(AVATAR),
    //   },
    // },
    allow.mainnet.aave_v2.stkAave["redeem"](AVATAR),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Compound V2 - USDC
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve([USDC], [cUSDC]),

    // Deposit
    // {
    //   targetAddress: cUSDC,
    //   signature: "mint(uint256)",
    // },
    allow.mainnet.compound_v2.cUSDC["mint"](),

    // Withdrawing: sender redeems uint256 cTokens, it is called when MAX is withdrawn
    // {
    //   targetAddress: cUSDC,
    //   signature: "redeem(uint256)",
    // },
    allow.mainnet.compound_v2.cUSDC["redeem"](),

    // Withdrawing: sender redeems cTokens in exchange for a specified amount of underlying asset (uint256), it is called when MAX isn't withdrawn
    // {
    //   targetAddress: cUSDC,
    //   signature: "redeemUnderlying(uint256)",
    // },
    allow.mainnet.compound_v2.cUSDC["redeemUnderlying"](),

    // We are not allowing to include it as collateral

    //---------------------------------------------------------------------------------------------------------------------------------
    // Compound V2 - DAI
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve([DAI], [cDAI]),

    // Deposit
    // {
    //   targetAddress: cDAI,
    //   signature: "mint(uint256)",
    // },
    allow.mainnet.compound_v2.cDAI["mint"](),

    // Withdrawing: sender redeems uint256 cTokens, it is called when MAX is withdrawn
    // {
    //   targetAddress: cDAI,
    //   signature: "redeem(uint256)",
    // },
    allow.mainnet.compound_v2.cDAI["redeem"](),

    // Withdrawing: sender redeems cTokens in exchange for a specified amount of underlying asset (uint256), it is called when MAX isn't withdrawn
    // {
    //   targetAddress: cDAI,
    //   signature: "redeemUnderlying(uint256)",
    // },
    allow.mainnet.compound_v2.cDAI["redeemUnderlying"](),

    // We are not allowing to include it as collateral

    //---------------------------------------------------------------------------------------------------------------------------------
    // Compound V2 - AAVE
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve([AAVE], [cAAVE]),

    // Deposit
    // {
    //   targetAddress: cAAVE,
    //   signature: "mint(uint256)",
    // },
    allow.mainnet.compound_v2.cAAVE["mint"](),

    // Withdrawing: sender redeems uint256 cTokens, it is called when MAX is withdrawn
    // {
    //   targetAddress: cAAVE,
    //   signature: "redeem(uint256)",
    // },
    allow.mainnet.compound_v2.cAAVE["redeem"](),

    // Withdrawing: sender redeems cTokens in exchange for a specified amount of underlying asset (uint256), it is called when MAX isn't withdrawn
    // {
    //   targetAddress: cAAVE,
    //   signature: "redeemUnderlying(uint256)",
    // },
    allow.mainnet.compound_v2.cAAVE["redeemUnderlying"](),

    // We are not allowing to include it as collateral

    //---------------------------------------------------------------------------------------------------------------------------------
    // Compound V2 - Claiming of rewards
    //---------------------------------------------------------------------------------------------------------------------------------

    // {
    //   targetAddress: COMPTROLLER,
    //   signature: "claimComp(address,address[])",
    //   params: {
    //     [0]: staticEqual(AVATAR),
    //     [1]: subsetOf(
    //       [cAAVE, cDAI, cUSDC].map((address) => address.toLowerCase()).sort(), // compound app will always pass tokens in ascending order
    //       "address[]",
    //       {
    //         restrictOrder: true,
    //       }
    //     ),
    //   },
    // },
    allow.mainnet.compound_v2.comptroller["claimComp(address,address[])"](
      AVATAR,
      {
        subsetOf: [compound_v2.cAAVE, compound_v2.cDAI, compound_v2.cUSDC]
          .map((address) => address.toLowerCase())
          .sort(), // compound app will always pass tokens in ascending order
        restrictOrder: true,
      }
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Uniswap V3 - WBTC + WETH, Range: 11.786 - 15.082. Fee: 0.3%.
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve([WBTC, WETH], [UV3_NFT_POSITIONS]),

    // // Adding liquidity using ETH
    // {
    //   targetAddress: uniswapv3.POSITIONS_NFT,
    //   signature:
    //     "mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))",
    //   params: {
    //     [0]: staticEqual(WBTC, "address"),
    //     [1]: staticEqual(WETH, "address"),
    //     [2]: staticEqual(3000, "uint24"), // 3000 represents the 0.3% fee
    //     [9]: staticEqual(AVATAR),
    //   },
    //   send: true
    // },

    // allow.mainnet.uniswapv3.positions_nft["refundETH"](),

    // Adding liquidity using WETH
    {
      targetAddress: uniswapv3.POSITIONS_NFT,
      signature:
        "mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))",
      params: {
        [0]: staticEqual(WBTC, "address"),
        [1]: staticEqual(WETH, "address"),
        [2]: staticEqual(3000, "uint24"), // 3000 represents the 0.3% fee
        [9]: staticEqual(AVATAR),
      },
    },

    // // Increasing liquidity using ETH: NFT ID 430246 was created in transaction with hash 0x8dc0368be4a8a28ab431a33ccf49acc85a4ca00a6c212c5d070a74af8aa0541f
    // {
    //   targetAddress: uniswapv3.POSITIONS_NFT,
    //   signature:
    //     "increaseLiquidity((uint256,uint256,uint256,uint256,uint256,uint256))",
    //   params: {
    //     [0]: staticEqual(430246, "uint256"),
    //   },
    //   send: true
    // },

    // The refundETH() function is called after the increaseLiquidity() but it has already been whitelisted

    // Increasing liquidity using WETH: NFT ID 430246 was created in transaction with hash 0x8dc0368be4a8a28ab431a33ccf49acc85a4ca00a6c212c5d070a74af8aa0541f
    {
      targetAddress: uniswapv3.POSITIONS_NFT,
      signature:
        "increaseLiquidity((uint256,uint256,uint256,uint256,uint256,uint256))",
      params: {
        [0]: staticEqual(430246, "uint256"),
      },
    },

    // Removing liquidity: to remove liquidity one has to call the decreaseLiquidity and collect functions
    // decreaseLiquidity burns the token amounts in the pool, and increases token0Owed and token1Owed which represent the uncollected fees
    {
      targetAddress: uniswapv3.POSITIONS_NFT,
      signature: "decreaseLiquidity((uint256,uint128,uint256,uint256,uint256))",
    },

    // collect collects token0Owed and token1Owed. The address argument could also be the zero address, which is used to collect ETH
    // instead of WETH. In this case, the tokens (one of them WETH) are first sent to the NFT Positions contract, and have to then be
    // claimed by calling unwrapWETH9 and sweepToken.
    {
      targetAddress: uniswapv3.POSITIONS_NFT,
      signature: "collect((uint256,address,uint128,uint128))",
      params: {
        // If the collected token is ETH then the address must be the ZERO_ADDRESS
        // [1]: staticOneOf([AVATAR, ZERO_ADDRESS], "address"),
        [1]: staticEqual(AVATAR),
      },
    },

    // // If ETH is collected instead of WETH, one has to call the unwrapWETH9 and sweepToken functions
    // allow.mainnet.uniswapv3.positions_nft["unwrapWETH9"](
    //   undefined,
    //   AVATAR
    // ),

    // allow.mainnet.uniswapv3.positions_nft["sweepToken"](
    //   WBTC,
    //   undefined,
    //   AVATAR
    // ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Stakewise
    //---------------------------------------------------------------------------------------------------------------------------------

    // When staking ETH one receives sETH2
    // {
    //   targetAddress: STAKEWISE_ETH2_STAKING,
    //   signature: "stake()",
    //   send: true,
    // },
    allow.mainnet.stakewise.eth2_staking["stake"]({
      send: true,
    }),

    // By having staked ETH one receives rETH2 as rewards that are claimed by calling the claim function
    // {
    //   targetAddress: STAKEWISE_MERKLE_DIS,
    //   signature: "claim(uint256,address,address[],uint256[],bytes32[])",
    //   params: {
    //     [1]: staticEqual(AVATAR),
    //     [2]: dynamic32Equal([rETH2, SWISE], "address[]"),
    //   },
    // },
    allow.mainnet.stakewise.merkle_distributor["claim"](undefined, AVATAR, [
      rETH2,
      SWISE,
    ]),

    // The exactInputSingle is needed for the reinvest option, which swaps rETH2 for sETH2 in the Uniswap V3 pool.
    // But as of now it is not considered within the strategy scope

    //---------------------------------------------------------------------------------------------------------------------------------
    // Stakewise - UniswapV3 WETH + sETH2, 0.3%
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve([sETH2, WETH], [uniswapv3.POSITIONS_NFT]),

    // // Add liquidity using ETH
    // {
    //   targetAddress: uniswapv3.POSITIONS_NFT,
    //   signature:
    //     "mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))",
    //   params: {
    //     [0]: staticEqual(WETH, "address"),
    //     [1]: staticEqual(sETH2, "address"),
    //     [2]: staticEqual(3000, "uint24"),
    //     [9]: staticEqual(AVATAR),
    //   },
    //   send: true
    // },

    // The refundETH() function is called after the mint() but it has already been whitelisted

    // Add liquidity using WETH
    {
      targetAddress: uniswapv3.POSITIONS_NFT,
      signature:
        "mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))",
      params: {
        [0]: staticEqual(WETH, "address"),
        [1]: staticEqual(sETH2, "address"),
        [2]: staticEqual(3000, "uint24"),
        [9]: staticEqual(AVATAR),
      },
    },

    // // Increasing liquidity using ETH: NFT ID 418686 was created in transaction with hash 0x198d10fc36ecfd2050990a5f1286d3d7ad226b4b482956d689d7216634fd7503:
    // {
    //   targetAddress: uniswapv3.POSITIONS_NFT,
    //   signature:
    //     "increaseLiquidity((uint256,uint256,uint256,uint256,uint256,uint256))",
    //   params: {
    //     [0]: staticEqual(418686, "uint256"),
    //   },
    //   send: true
    // },

    // The refundETH() function is called after the increaseLiquidity() but it has already been whitelisted

    // Increasing liquidity using WETH: NFT ID 418686 was created in transaction with hash 0x198d10fc36ecfd2050990a5f1286d3d7ad226b4b482956d689d7216634fd7503:
    {
      targetAddress: uniswapv3.POSITIONS_NFT,
      signature:
        "increaseLiquidity((uint256,uint256,uint256,uint256,uint256,uint256))",
      params: {
        [0]: staticEqual(418686, "uint256"),
      },
    },

    // Remove liquidity
    // The decreaseLiquidity and collect functions have already been whitelisted.

    // // If ETH is collected instead of WETH, one has to call the unwrapWETH9 (already whitelisted) and sweepToken functions
    // allow.mainnet.uniswapv3.positions_nft["sweepToken"](
    //   sETH2,
    //   undefined,
    //   AVATAR
    // ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Wrapping and unwrapping of ETH, WETH
    //---------------------------------------------------------------------------------------------------------------------------------
    // {
    //   targetAddress: WETH,
    //   signature: "withdraw(uint256)",
    // },
    allow.mainnet.weth["withdraw"](),

    // {
    //   targetAddress: WETH,
    //   signature: "deposit()",
    //   send: true,
    // },
    allow.mainnet.weth["deposit"]({
      send: true,
    }),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Swapping of tokens COMP, AAVE, rETH2, SWISE, sETH2, WETH, USDC, DAI, USDT and WBTC in UniswapV3
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve(
    //  [COMP, AAVE, rETH2, SWISE, sETH2, WETH, USDC, DAI, USDT, WBTC],
    //  [uniswapv3.ROUTER_2]
    //),

    // THE FUNCTION "swapExactTokensForTokens(uint256,uint256,address[],address)" USE UNISWAPV2 ROUTES
    // {
    //   targetAddress: uniswapv3.ROUTER_2,
    //   signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
    //   params: {
    //     [2]: dynamic32OneOf(
    //       [
    //         [COMP, WETH, USDC],
    //         [COMP, WETH, DAI],
    //         [COMP, WETH],
    //         [AAVE, WETH, USDC],
    //         [AAVE, WETH, DAI],
    //         [AAVE, WETH],
    //         [rETH2, sETH2, WETH, USDC],
    //         [rETH2, sETH2, WETH, DAI],
    //         [rETH2, sETH2, WETH],
    //         [SWISE, sETH2, WETH, USDC],
    //         [SWISE, sETH2, WETH, DAI],
    //         [SWISE, sETH2, WETH],
    //         [sETH2, WETH],
    //         [WETH, sETH2],
    //         [WETH, DAI],
    //         [WETH, USDC],
    //         [WETH, USDT],
    //         [WETH, WBTC],
    //         [USDC, WETH],
    //         [USDC, USDT],
    //         [USDC, WETH, USDT],
    //         [USDC, DAI],
    //         [USDC, WETH, DAI],
    //         [DAI, WETH],
    //         [DAI, USDC],
    //         [DAI, WETH, USDC],
    //         [DAI, USDT],
    //         [DAI, WETH, USDT],
    //         [USDT, WETH],
    //         [USDT, USDC],
    //         [USDT, WETH, USDC],
    //         [USDT, DAI],
    //         [USDT, WETH, DAI],
    //         [WBTC, WETH],
    //       ],
    //       "address[]"
    //     ),
    //     [3]: staticEqual(AVATAR),
    //   },
    // },
    allow.mainnet.uniswapv3.router_2["swapExactTokensForTokens"](
      undefined,
      undefined,
      {
        oneOf: [
          [COMP, WETH, USDC],
          [COMP, WETH, DAI],
          [COMP, WETH],
          [AAVE, WETH, USDC],
          [AAVE, WETH, DAI],
          [AAVE, WETH],
          [rETH2, sETH2, WETH, USDC],
          [rETH2, sETH2, WETH, DAI],
          [rETH2, sETH2, WETH],
          [SWISE, sETH2, WETH, USDC],
          [SWISE, sETH2, WETH, DAI],
          [SWISE, sETH2, WETH],
          [sETH2, WETH],
          [WETH, sETH2],
          [WETH, DAI],
          [WETH, USDC],
          [WETH, USDT],
          [WETH, WBTC],
          [USDC, WETH],
          [USDC, USDT],
          [USDC, WETH, USDT],
          [USDC, DAI],
          [USDC, WETH, DAI],
          [DAI, WETH],
          [DAI, USDC],
          [DAI, WETH, USDC],
          [DAI, USDT],
          [DAI, WETH, USDT],
          [USDT, WETH],
          [USDT, USDC],
          [USDT, WETH, USDC],
          [USDT, DAI],
          [USDT, WETH, DAI],
          [WBTC, WETH],
        ],
      },
      AVATAR
    ),

    {
      targetAddress: uniswapv3.ROUTER_2,
      signature:
        "exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))",
      params: {
        [0]: staticOneOf(
          [AAVE, COMP, DAI, rETH2, sETH2, SWISE, USDC, USDT, WBTC, WETH],
          "address"
        ),
        [1]: staticOneOf([DAI, sETH2, USDC, USDT, WBTC, WETH], "address"),
        [3]: staticEqual(AVATAR),
      },
    },

    // THIS FUNCTION CAN'T BE WHITELISTED SINCE THE ROLES MODULE V1 DOES NOT SUPPORT STRUCTS WITH DYNAMIC LENGTH PARAMETERS
    /*{
        targetAddress: uniswapv3.ROUTER_2,
        signature: "exactInput((bytes,address,uint256,uint256))",
        params: {
          [2]: staticEqual(AVATAR),
          [5]: dynamicEqual("0xfe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", "bytes")
          [6]: dynamicOneOf(
            [
              "0xfe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0xfe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0xfe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0xfe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0xc00e94cb662c3520282e6f5717214004a7f26888000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xc00e94cb662c3520282e6f5717214004a7f26888000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xc00e94cb662c3520282e6f5717214004a7f26888000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xc00e94cb662c3520282e6f5717214004a7f26888000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xc00e94cb662c3520282e6f5717214004a7f268880001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xc00e94cb662c3520282e6f5717214004a7f268880001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xc00e94cb662c3520282e6f5717214004a7f268880001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xc00e94cb662c3520282e6f5717214004a7f268880001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xc00e94cb662c3520282e6f5717214004a7f26888000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xc00e94cb662c3520282e6f5717214004a7f26888000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xc00e94cb662c3520282e6f5717214004a7f26888000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xc00e94cb662c3520282e6f5717214004a7f26888000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xc00e94cb662c3520282e6f5717214004a7f26888002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xc00e94cb662c3520282e6f5717214004a7f26888002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xc00e94cb662c3520282e6f5717214004a7f26888002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xc00e94cb662c3520282e6f5717214004a7f26888002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xc00e94cb662c3520282e6f5717214004a7f26888000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0xc00e94cb662c3520282e6f5717214004a7f26888000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0xc00e94cb662c3520282e6f5717214004a7f26888000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0xc00e94cb662c3520282e6f5717214004a7f26888000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0xc00e94cb662c3520282e6f5717214004a7f268880001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0xc00e94cb662c3520282e6f5717214004a7f268880001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0xc00e94cb662c3520282e6f5717214004a7f268880001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0xc00e94cb662c3520282e6f5717214004a7f268880001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0xc00e94cb662c3520282e6f5717214004a7f26888000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0xc00e94cb662c3520282e6f5717214004a7f26888000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0xc00e94cb662c3520282e6f5717214004a7f26888000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0xc00e94cb662c3520282e6f5717214004a7f26888000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0xc00e94cb662c3520282e6f5717214004a7f26888002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0xc00e94cb662c3520282e6f5717214004a7f26888002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0xc00e94cb662c3520282e6f5717214004a7f26888002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0xc00e94cb662c3520282e6f5717214004a7f26888002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0xc00e94cb662c3520282e6f5717214004a7f26888000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0xc00e94cb662c3520282e6f5717214004a7f268880001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0xc00e94cb662c3520282e6f5717214004a7f26888000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0xc00e94cb662c3520282e6f5717214004a7f26888002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae90001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae90001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae90001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae90001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae90001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae90001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae90001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae90001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae90001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000064fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c50001f4fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5000bb8fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x20bc832ca081b91433ff6c17f85701b6e92486c5002710fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000064fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa20001f4fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2000bb8fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2002710fe2e637202056d30016725477c5da089ab0a043a002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064fe2e637202056d30016725477c5da089ab0a043a",
              "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4fe2e637202056d30016725477c5da089ab0a043a",
              "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8fe2e637202056d30016725477c5da089ab0a043a",
              "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710fe2e637202056d30016725477c5da089ab0a043a",
              "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064dac17f958d2ee523a2206206994597c13d831ec7",
              "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4dac17f958d2ee523a2206206994597c13d831ec7",
              "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8dac17f958d2ee523a2206206994597c13d831ec7",
              "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710dac17f958d2ee523a2206206994597c13d831ec7",
              "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000642260fac5e5542a773aa44fbcfedf7c193bc2c599",
              "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f42260fac5e5542a773aa44fbcfedf7c193bc2c599",
              "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb82260fac5e5542a773aa44fbcfedf7c193bc2c599",
              "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027102260fac5e5542a773aa44fbcfedf7c193bc2c599",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb480001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000064dac17f958d2ee523a2206206994597c13d831ec7",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb480001f4dac17f958d2ee523a2206206994597c13d831ec7",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000bb8dac17f958d2ee523a2206206994597c13d831ec7",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48002710dac17f958d2ee523a2206206994597c13d831ec7",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064dac17f958d2ee523a2206206994597c13d831ec7",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4dac17f958d2ee523a2206206994597c13d831ec7",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8dac17f958d2ee523a2206206994597c13d831ec7",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710dac17f958d2ee523a2206206994597c13d831ec7",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb480001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064dac17f958d2ee523a2206206994597c13d831ec7",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb480001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4dac17f958d2ee523a2206206994597c13d831ec7",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb480001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8dac17f958d2ee523a2206206994597c13d831ec7",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb480001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710dac17f958d2ee523a2206206994597c13d831ec7",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064dac17f958d2ee523a2206206994597c13d831ec7",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4dac17f958d2ee523a2206206994597c13d831ec7",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8dac17f958d2ee523a2206206994597c13d831ec7",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710dac17f958d2ee523a2206206994597c13d831ec7",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064dac17f958d2ee523a2206206994597c13d831ec7",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4dac17f958d2ee523a2206206994597c13d831ec7",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8dac17f958d2ee523a2206206994597c13d831ec7",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710dac17f958d2ee523a2206206994597c13d831ec7",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000646b175474e89094c44da98b954eedeac495271d0f",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb480001f46b175474e89094c44da98b954eedeac495271d0f",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb480027106b175474e89094c44da98b954eedeac495271d0f",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb480001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb480001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb480001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb480001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0xdac17f958d2ee523a2206206994597c13d831ec7000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0xdac17f958d2ee523a2206206994597c13d831ec70001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0xdac17f958d2ee523a2206206994597c13d831ec7000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0xdac17f958d2ee523a2206206994597c13d831ec7002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0xdac17f958d2ee523a2206206994597c13d831ec7000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xdac17f958d2ee523a2206206994597c13d831ec70001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xdac17f958d2ee523a2206206994597c13d831ec7000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xdac17f958d2ee523a2206206994597c13d831ec7002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xdac17f958d2ee523a2206206994597c13d831ec7000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xdac17f958d2ee523a2206206994597c13d831ec7000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xdac17f958d2ee523a2206206994597c13d831ec7000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xdac17f958d2ee523a2206206994597c13d831ec7000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xdac17f958d2ee523a2206206994597c13d831ec70001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xdac17f958d2ee523a2206206994597c13d831ec70001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xdac17f958d2ee523a2206206994597c13d831ec70001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xdac17f958d2ee523a2206206994597c13d831ec70001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xdac17f958d2ee523a2206206994597c13d831ec7000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xdac17f958d2ee523a2206206994597c13d831ec7000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xdac17f958d2ee523a2206206994597c13d831ec7000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xdac17f958d2ee523a2206206994597c13d831ec7000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xdac17f958d2ee523a2206206994597c13d831ec7002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xdac17f958d2ee523a2206206994597c13d831ec7002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xdac17f958d2ee523a2206206994597c13d831ec7002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xdac17f958d2ee523a2206206994597c13d831ec7002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0xdac17f958d2ee523a2206206994597c13d831ec70000646b175474e89094c44da98b954eedeac495271d0f",
              "0xdac17f958d2ee523a2206206994597c13d831ec70001f46b175474e89094c44da98b954eedeac495271d0f",
              "0xdac17f958d2ee523a2206206994597c13d831ec7000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0xdac17f958d2ee523a2206206994597c13d831ec70027106b175474e89094c44da98b954eedeac495271d0f",
              "0xdac17f958d2ee523a2206206994597c13d831ec7000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0xdac17f958d2ee523a2206206994597c13d831ec7000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0xdac17f958d2ee523a2206206994597c13d831ec7000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0xdac17f958d2ee523a2206206994597c13d831ec7000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0xdac17f958d2ee523a2206206994597c13d831ec70001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0xdac17f958d2ee523a2206206994597c13d831ec70001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0xdac17f958d2ee523a2206206994597c13d831ec70001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0xdac17f958d2ee523a2206206994597c13d831ec70001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0xdac17f958d2ee523a2206206994597c13d831ec7000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0xdac17f958d2ee523a2206206994597c13d831ec7000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0xdac17f958d2ee523a2206206994597c13d831ec7000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0xdac17f958d2ee523a2206206994597c13d831ec7000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0xdac17f958d2ee523a2206206994597c13d831ec7002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000646b175474e89094c44da98b954eedeac495271d0f",
              "0xdac17f958d2ee523a2206206994597c13d831ec7002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f",
              "0xdac17f958d2ee523a2206206994597c13d831ec7002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb86b175474e89094c44da98b954eedeac495271d0f",
              "0xdac17f958d2ee523a2206206994597c13d831ec7002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20027106b175474e89094c44da98b954eedeac495271d0f",
              "0x6b175474e89094c44da98b954eedeac495271d0f000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x6b175474e89094c44da98b954eedeac495271d0f0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x6b175474e89094c44da98b954eedeac495271d0f000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x6b175474e89094c44da98b954eedeac495271d0f002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x6b175474e89094c44da98b954eedeac495271d0f000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x6b175474e89094c44da98b954eedeac495271d0f0001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x6b175474e89094c44da98b954eedeac495271d0f000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x6b175474e89094c44da98b954eedeac495271d0f002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x6b175474e89094c44da98b954eedeac495271d0f000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x6b175474e89094c44da98b954eedeac495271d0f000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x6b175474e89094c44da98b954eedeac495271d0f000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x6b175474e89094c44da98b954eedeac495271d0f000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x6b175474e89094c44da98b954eedeac495271d0f0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x6b175474e89094c44da98b954eedeac495271d0f0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x6b175474e89094c44da98b954eedeac495271d0f0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x6b175474e89094c44da98b954eedeac495271d0f0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x6b175474e89094c44da98b954eedeac495271d0f000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x6b175474e89094c44da98b954eedeac495271d0f000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x6b175474e89094c44da98b954eedeac495271d0f000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x6b175474e89094c44da98b954eedeac495271d0f000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x6b175474e89094c44da98b954eedeac495271d0f002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x6b175474e89094c44da98b954eedeac495271d0f002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x6b175474e89094c44da98b954eedeac495271d0f002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x6b175474e89094c44da98b954eedeac495271d0f002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "0x6b175474e89094c44da98b954eedeac495271d0f000064dac17f958d2ee523a2206206994597c13d831ec7",
              "0x6b175474e89094c44da98b954eedeac495271d0f0001f4dac17f958d2ee523a2206206994597c13d831ec7",
              "0x6b175474e89094c44da98b954eedeac495271d0f000bb8dac17f958d2ee523a2206206994597c13d831ec7",
              "0x6b175474e89094c44da98b954eedeac495271d0f002710dac17f958d2ee523a2206206994597c13d831ec7",
              "0x6b175474e89094c44da98b954eedeac495271d0f000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064dac17f958d2ee523a2206206994597c13d831ec7",
              "0x6b175474e89094c44da98b954eedeac495271d0f000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4dac17f958d2ee523a2206206994597c13d831ec7",
              "0x6b175474e89094c44da98b954eedeac495271d0f000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8dac17f958d2ee523a2206206994597c13d831ec7",
              "0x6b175474e89094c44da98b954eedeac495271d0f000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710dac17f958d2ee523a2206206994597c13d831ec7",
              "0x6b175474e89094c44da98b954eedeac495271d0f0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064dac17f958d2ee523a2206206994597c13d831ec7",
              "0x6b175474e89094c44da98b954eedeac495271d0f0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4dac17f958d2ee523a2206206994597c13d831ec7",
              "0x6b175474e89094c44da98b954eedeac495271d0f0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8dac17f958d2ee523a2206206994597c13d831ec7",
              "0x6b175474e89094c44da98b954eedeac495271d0f0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710dac17f958d2ee523a2206206994597c13d831ec7",
              "0x6b175474e89094c44da98b954eedeac495271d0f000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064dac17f958d2ee523a2206206994597c13d831ec7",
              "0x6b175474e89094c44da98b954eedeac495271d0f000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4dac17f958d2ee523a2206206994597c13d831ec7",
              "0x6b175474e89094c44da98b954eedeac495271d0f000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8dac17f958d2ee523a2206206994597c13d831ec7",
              "0x6b175474e89094c44da98b954eedeac495271d0f000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710dac17f958d2ee523a2206206994597c13d831ec7",
              "0x6b175474e89094c44da98b954eedeac495271d0f002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000064dac17f958d2ee523a2206206994597c13d831ec7",
              "0x6b175474e89094c44da98b954eedeac495271d0f002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4dac17f958d2ee523a2206206994597c13d831ec7",
              "0x6b175474e89094c44da98b954eedeac495271d0f002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb8dac17f958d2ee523a2206206994597c13d831ec7",
              "0x6b175474e89094c44da98b954eedeac495271d0f002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2002710dac17f958d2ee523a2206206994597c13d831ec7",
              "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x2260fac5e5542a773aa44fbcfedf7c193bc2c5990001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
              "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599002710c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
            ],
            "bytes",
          ),
        },
      },*/

    //---------------------------------------------------------------------------------------------------------------------------------
    // Swapping of COMP, WETH, in Balancer: https://dev.balancer.fi/guides/swaps/single-swaps
    //---------------------------------------------------------------------------------------------------------------------------------

    /*     
      swap(SingleSwap_struct,FundManagement_struct,token_limit,deadline)
  
      struct SingleSwap {
        bytes32 poolId;
        SwapKind kind;      0 = GIVEN_IN, 1 = GIVEN_OUT
        IAsset assetIn;
        IAsset assetOut;
        uint256 amount;
        bytes userData;     userData specifies the JoinKind, see https://dev.balancer.fi/resources/joins-and-exits/pool-joins
      }
      struct FundManagement {
        address sender;
        bool fromInternalBalance;
        address payable recipient;
        bool toInternalBalance;
      }
       */

    // Swap COMP for WETH
    // ...allowErc20Approve([COMP], [balancer.VAULT]),
    {
      targetAddress: balancer.VAULT,
      signature:
        "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
      params: {
        [0]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of the tuple from beginning 224=32*7
        [1]: staticEqual(AVATAR), // recipient
        [2]: staticEqual(false, "bool"),
        [3]: staticEqual(AVATAR), // sender
        [4]: staticEqual(false, "bool"),
        [7]: staticEqual(
          "0xefaa1604e82e1b3af8430b90192c1b9e8197e377000200000000000000000021",
          "bytes32"
        ), // COMP-WETH pool ID
        [8]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "bytes32"
        ), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
        [9]: staticEqual(COMP, "address"), // Asset in
        [10]: staticEqual(WETH, "address"), // Asset out
        [12]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 192=32*6
        [13]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "bytes32"
        ), // bytes (userData) = for all current Balancer pools this can be left empty
      },
    },

    // Swap WETH for DAI
    // ...allowErc20Approve([WETH], [balancer.VAULT]),
    {
      targetAddress: balancer.VAULT,
      signature:
        "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
      params: {
        [0]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of the tuple from beginning 224=32*7
        [1]: staticEqual(AVATAR), // recipient
        [2]: staticEqual(false, "bool"),
        [3]: staticEqual(AVATAR), // sender
        [4]: staticEqual(false, "bool"),
        [7]: staticEqual(
          "0x0b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a",
          "bytes32"
        ), // WETH-DAI pool ID
        [8]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "bytes32"
        ), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
        [9]: staticEqual(WETH, "address"), // Asset in
        [10]: staticEqual(DAI, "address"), // Asset out
        [12]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 192=32*6
        [13]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "bytes32"
        ), // bytes (userData) = for all current Balancer pools this can be left empty
      },
    },

    // Swap WETH for USDC
    // ...allowErc20Approve([WETH], [balancer.VAULT]),
    {
      targetAddress: balancer.VAULT,
      signature:
        "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
      params: {
        [0]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of the tuple from beginning 224=32*7
        [1]: staticEqual(AVATAR), // recipient
        [2]: staticEqual(false, "bool"),
        [3]: staticEqual(AVATAR), // sender
        [4]: staticEqual(false, "bool"),
        [7]: staticEqual(
          "0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8000200000000000000000019",
          "bytes32"
        ), //USDC-WETH pool ID
        [8]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "bytes32"
        ), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
        [9]: staticEqual(WETH, "address"), //Asset in
        [10]: staticEqual(USDC, "address"), //Asset out
        [12]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 192=32*6
        [13]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "bytes32"
        ), // bytes (userData) = for all current Balancer pools this can be left empty
      },
    },

    // Swap wstETH for WETH
    // ...allowErc20Approve([wstETH], [balancer.VAULT]),
    {
      targetAddress: balancer.VAULT,
      signature:
        "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
      params: {
        [0]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of the tuple from beginning 224=32*7
        [1]: staticEqual(AVATAR), // recipient
        [2]: staticEqual(false, "bool"),
        [3]: staticEqual(AVATAR), // sender
        [4]: staticEqual(false, "bool"),
        [7]: staticEqual(
          "0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080",
          "bytes32"
        ), // wstETH-WETH pool ID
        [8]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "bytes32"
        ), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
        [9]: staticEqual(wstETH, "address"), // Asset in
        [10]: staticEqual(WETH, "address"), // Asset out
        [12]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 192=32*6
        [13]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "bytes32"
        ), // bytes (userData) = for all current Balancer pools this can be left empty
      },
    },

    // Swap WETH for wstETH
    // ...allowErc20Approve([WETH], [balancer.VAULT]),
    {
      targetAddress: balancer.VAULT,
      signature:
        "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
      params: {
        [0]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of the tuple from beginning 224=32*7
        [1]: staticEqual(AVATAR), // recipient
        [2]: staticEqual(false, "bool"),
        [3]: staticEqual(AVATAR), // sender
        [4]: staticEqual(false, "bool"),
        [7]: staticEqual(
          "0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080",
          "bytes32"
        ), // wstETH-WETH pool ID
        [8]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "bytes32"
        ), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
        [9]: staticEqual(WETH, "address"), //Asset in
        [10]: staticEqual(wstETH, "address"), //Asset out
        [12]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 192=32*6
        [13]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "bytes32"
        ), // bytes (userData) = for all current Balancer pools this can be left empty
      },
    },
  ],
  placeholders: { AVATAR },
} satisfies RolePreset

export default preset
