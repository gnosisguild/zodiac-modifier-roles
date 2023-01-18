import { stat } from "fs"

import { hashMessage } from "ethers/lib/utils"

import { ExecutionOptions, RolePreset } from "../../types"
import { allowErc20Approve } from "../helpers/erc20"
import {
  dynamic32Equal,
  dynamic32OneOf,
  staticEqual,
  subsetOf,
} from "../helpers/utils"
import { AVATAR_ADDRESS_PLACEHOLDER } from "../placeholders"
import { ZERO_ADDRESS } from "../gnosisChain/addresses"

//Tokens
const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
const WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"

//Lido contracts
const stETH = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84"
const wstETH = "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0"

//AAVE contracts
const AAVE = "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9"
const stkAAVE = "0x4da27a545c0c5B758a6BA100e3a049001de870f5"

//Compound V2 contracts
const COMPTROLLER = "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b"
const cUSDC = "0x39AA39c021dfbaE8faC545936693aC917d5E7563"
const cAAVE = "0xe65cdB6479BaC1e22340E4E755fAE7E509EcD06c"
const cDAI = "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"
const COMP = "0xc00e94Cb662C3520282E6f5717214004A7f26888"

//Uniswap V3 contracts
const UV3_NFT_POSITIONS = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"
const UV3_ROUTER_2 = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"

//Balancer contracts
const BALANCER_VAULT = "0xBA12222222228d8Ba445958a75a0704d566BF2C8"

//Stakewise contracts
const STAKEWISE_ETH2_STAKING = "0xC874b064f465bdD6411D45734b56fac750Cda29A"
const STAKEWISE_MERKLE_DIS = "0xA3F21010e8b9a3930996C8849Df38f9Ca3647c20"
const sETH2 = "0xFe2e637202056d30016725477c5da089Ab0A043A"
const rETH2 = "0x20BC832ca081b91433ff6c17f85701B6e92486c5"
const SWISE = "0x48C3399719B582dD63eB5AADf12A40B4C3f52FA2"

const preset: RolePreset = {
  network: 1,
  allow: [
    //All approvals have been commented since we'll be handling over the Avatar safe with all of them having been already executed

    //---------------------------------------------------------------------------------------------------------------------------------
    //LIDO
    //---------------------------------------------------------------------------------------------------------------------------------

    //...allowErc20Approve([stETH], [wstETH]),
    {
      targetAddress: stETH,
      signature: "submit(address)",
      params: {
        [0]: staticEqual(ZERO_ADDRESS, "address"),
      },
      options: ExecutionOptions.Send,
    },
    { targetAddress: wstETH, signature: "wrap(uint256)" },
    { targetAddress: wstETH, signature: "unwrap(uint256)" },

    //---------------------------------------------------------------------------------------------------------------------------------
    //Staking of AAVE in Safety Module
    //---------------------------------------------------------------------------------------------------------------------------------

    //...allowErc20Approve([AAVE], [stkAAVE]),
    {
      targetAddress: stkAAVE,
      signature: "stake(address,uint256)",
      params: {
        [0]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    {
      targetAddress: stkAAVE,
      signature: "claimRewards(address,uint256)",
      params: {
        [0]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    //Initiates 10 days cooldown period, once this is over the 2 days unstaking window opens:
    {
      targetAddress: stkAAVE,
      signature: "cooldown()",
    },

    //Unstakes, can only be called during the 2 days unstaking window after the 10 days cooldown period
    {
      targetAddress: stkAAVE,
      signature: "redeem(address,uint256)",
      params: {
        [0]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    //Compound V2 - USDC
    //---------------------------------------------------------------------------------------------------------------------------------

    //...allowErc20Approve([USDC], [cUSDC]),

    //Deposit
    {
      targetAddress: cUSDC,
      signature: "mint(uint256)",
    },
    //Withdrawing: sender redeems uint256 cTokens, it is called when MAX is withdrawn
    {
      targetAddress: cUSDC,
      signature: "redeem(uint256)",
    },
    //Withdrawing: sender redeems cTokens in exchange for a specified amount of underlying asset (uint256), it is called when MAX isn't withdrawn
    {
      targetAddress: cUSDC,
      signature: "redeemUnderlying(uint256)",
    },
    //We are not allowing to include it as collateral

    //---------------------------------------------------------------------------------------------------------------------------------
    //Compound V2 - DAI
    //---------------------------------------------------------------------------------------------------------------------------------

    //...allowErc20Approve([DAI], [cDAI]),

    //Deposit
    {
      targetAddress: cDAI,
      signature: "mint(uint256)",
    },
    //Withdrawing: sender redeems uint256 cTokens, it is called when MAX is withdrawn
    {
      targetAddress: cDAI,
      signature: "redeem(uint256)",
    },
    //Withdrawing: sender redeems cTokens in exchange for a specified amount of underlying asset (uint256), it is called when MAX isn't withdrawn
    {
      targetAddress: cDAI,
      signature: "redeemUnderlying(uint256)",
    },
    //We are not allowing to include it as collateral

    //---------------------------------------------------------------------------------------------------------------------------------
    //Compound V2 - AAVE
    //---------------------------------------------------------------------------------------------------------------------------------

    //...allowErc20Approve([AAVE], [cAAVE]),

    //Deposit
    {
      targetAddress: cAAVE,
      signature: "mint(uint256)",
    },
    //Withdrawing: sender redeems uint256 cTokens, it is called when MAX is withdrawn
    {
      targetAddress: cAAVE,
      signature: "redeem(uint256)",
    },
    //Withdrawing: sender redeems cTokens in exchange for a specified amount of underlying asset (uint256), it is called when MAX isn't withdrawn
    {
      targetAddress: cAAVE,
      signature: "redeemUnderlying(uint256)",
    },

    //We are not allowing to include it as collateral

    //---------------------------------------------------------------------------------------------------------------------------------
    //Compound V2 - Claiming of rewards
    //---------------------------------------------------------------------------------------------------------------------------------
    {
      targetAddress: COMPTROLLER,
      signature: "claimComp(address,address[])",
      params: {
        [0]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
        [1]: subsetOf(
          [cAAVE, cDAI, cUSDC].map((address) => address.toLowerCase()).sort(), // compound app will always pass tokens in ascending order
          "address[]",
          {
            restrictOrder: true,
          }
        ),
      },
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    //Uniswap V3 - WBTC + WETH, Range: 11.786 - 15.082. Fee: 0.3%.
    //---------------------------------------------------------------------------------------------------------------------------------

    //...allowErc20Approve([WBTC, WETH], [UV3_NFT_POSITIONS]),

    //Adding liquidity
    {
      targetAddress: UV3_NFT_POSITIONS,
      signature:
        "mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))",
      params: {
        [0]: staticEqual(WBTC, "address"),
        [1]: staticEqual(WETH, "address"),
        [2]: staticEqual(3000, "uint24"), //3000 represents the 0.3% fee
        [9]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    //If ETH is deposited instead of WETH, one has to call the refundETH function after calling the mint function
    //We are only allowing to deposit WETH, otherwise the ETH held by the NFT Positions contract after calling the mint function could be claimed
    //by another address calling the refundETH function

    //Increasing liquidity: We cannot allow the increaseLiquidity function until we know the NFT id!
    /*
    {
      targetAddress: UV3_NFT_POSITIONS,
      signature:
        "increaseLiquidity((uint256,uint256,uint256,uint256,uint256,uint256))",
      options: ExecutionOptions.Send,
    },
    */
    //If ETH is deposited instead of WETH, one has to call the refundETH function after calling the increaseLiquidity function, but we are only
    //allowing for the depositing of WETH.

    //Removing liquidity: to remove liquidity one has to call the decreaseLiquidity and collect functions
    //decreaseLiquidity burns the token amounts in the pool, and increases token0Owed and token1Owed which represent the uncollected fees

    {
      targetAddress: UV3_NFT_POSITIONS,
      signature: "decreaseLiquidity((uint256,uint128,uint256,uint256,uint256))",
    },
    //collect collects token0Owed and token1Owed. The address argument could also be the zero address, which is used to collect ETH
    //instead of WETH. In this case, the tokens (one of them WETH) are first sent to the NFT Positions contract, and have to then be
    //claimed by calling unwrapWETH9 and sweepToken. Since this is not safe non-custodial wise, we are only allowing the collecting
    //of ETH instead of WETH
    {
      targetAddress: UV3_NFT_POSITIONS,
      signature: "collect((uint256,address,uint128,uint128))",
      params: {
        [1]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    //If ETH is collected instead of WETH, one has to call the unwrapWETH9 and sweepToken functions, but we are only allowing for the collecting of WETH.

    //---------------------------------------------------------------------------------------------------------------------------------
    //Stakewise
    //---------------------------------------------------------------------------------------------------------------------------------

    //When staking ETH one receives sETH2
    {
      targetAddress: STAKEWISE_ETH2_STAKING,
      signature: "stake()",
      options: ExecutionOptions.Send,
    },

    //By having staked ETH one receives rETH2 as rewards that are claimed by calling the claim function
    {
      targetAddress: STAKEWISE_MERKLE_DIS,
      signature: "claim(uint256,address,address[],uint256[],bytes32[])",
      params: {
        [1]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
        [2]: dynamic32Equal([rETH2, SWISE], "address[]"),
      },
    },

    //The exactInputSingle is needed for the reinvest option, which swaps rETH2 for sETH2 in the Uniswap V3 pool.
    //But as of now it is not considered within the strategy scope

    //---------------------------------------------------------------------------------------------------------------------------------
    //Stakewise - UniswapV3 WETH + sETH2, 0.3%
    //---------------------------------------------------------------------------------------------------------------------------------

    //...allowErc20Approve([sETH2, WETH], [UV3_NFT_POSITIONS]),

    //Add liquidity
    {
      targetAddress: UV3_NFT_POSITIONS,
      signature:
        "mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))",
      params: {
        [0]: staticEqual(WETH, "address"),
        [1]: staticEqual(sETH2, "address"),
        [2]: staticEqual(3000, "uint24"),
        [9]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    //If ETH is deposited instead of WETH, one has to call the refundETH function after calling the mint function
    //We are only allowing to deposit WETH, otherwise the ETH held by the NFT Positions contract after calling the mint function could be claimed
    //by another address calling the refundETH function

    //Increasing liquidity: We cannot allow the increaseLiquidity function until we know the NFT id!
    /*
    {
      targetAddress: UV3_NFT_POSITIONS,
      signature:
        "increaseLiquidity((uint256,uint256,uint256,uint256,uint256,uint256))",
      options: ExecutionOptions.Send,
    },
    */
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
      options: ExecutionOptions.Send,
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    //Swapping of tokens COMP, AAVE, rETH2, SWISE, sETH2, WETH, USDC, DAI, USDT and WBTC in UniswapV3
    //---------------------------------------------------------------------------------------------------------------------------------

    /* ...allowErc20Approve(
      [COMP, AAVE, rETH2, SWISE, sETH2, WETH, USDC, DAI, USDT, WBTC],
      [UV3_ROUTER_2]
    ), */

    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32OneOf(
          [
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
          "address[]"
        ),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    //Swapping of COMP, WETH, in Balancer: https://dev.balancer.fi/guides/swaps/single-swaps
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

    //Swap COMP for WETH
    //...allowErc20Approve([COMP], [BALANCER_VAULT]),
    {
      targetAddress: BALANCER_VAULT,
      signature:
        "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
      params: {
        [1]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // recipient
        [2]: staticEqual(false, "bool"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // sender
        [4]: staticEqual(false, "bool"),
        [7]: staticEqual(
          "0xefaa1604e82e1b3af8430b90192c1b9e8197e377000200000000000000000021",
          "bytes32"
        ), //COMP-WETH pool ID
        [9]: staticEqual(COMP, "address"), //Asset in
        [10]: staticEqual(WETH, "address"), //Asset out
      },
    },

    //Swap WETH for DAI
    //...allowErc20Approve([WETH], [BALANCER_VAULT]),
    {
      targetAddress: BALANCER_VAULT,
      signature:
        "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
      params: {
        [1]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // recipient
        [2]: staticEqual(false, "bool"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // sender
        [4]: staticEqual(false, "bool"),
        [7]: staticEqual(
          "0x0b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a",
          "bytes32"
        ), //WETH-DAI pool ID
        [9]: staticEqual(WETH, "address"), //Asset in
        [10]: staticEqual(DAI, "address"), //Asset out
      },
    },

    //Swap WETH for USDC
    //...allowErc20Approve([WETH], [BALANCER_VAULT]),
    {
      targetAddress: BALANCER_VAULT,
      signature:
        "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
      params: {
        [1]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // recipient
        [2]: staticEqual(false, "bool"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // sender
        [4]: staticEqual(false, "bool"),
        [7]: staticEqual(
          "0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8000200000000000000000019",
          "bytes32"
        ), //USDC-WETH pool ID
        [9]: staticEqual(WETH, "address"), //Asset in
        [10]: staticEqual(USDC, "address"), //Asset out
      },
    },

    //Swap wstETH for WETH
    //...allowErc20Approve([wstETH], [BALANCER_VAULT]),
    {
      targetAddress: BALANCER_VAULT,
      signature:
        "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
      params: {
        [1]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // recipient
        [2]: staticEqual(false, "bool"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // sender
        [4]: staticEqual(false, "bool"),
        [7]: staticEqual(
          "0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080",
          "bytes32"
        ), //wstETH-WETH pool ID
        [9]: staticEqual(wstETH, "address"), //Asset in
        [10]: staticEqual(WETH, "address"), //Asset out
      },
    },

    //Swap wstETH for WETH
    //...allowErc20Approve([WETH], [BALANCER_VAULT]),
    {
      targetAddress: BALANCER_VAULT,
      signature:
        "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
      params: {
        [1]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // recipient
        [2]: staticEqual(false, "bool"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // sender
        [4]: staticEqual(false, "bool"),
        [7]: staticEqual(
          "0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080",
          "bytes32"
        ), //wstETH-WETH pool ID
        [9]: staticEqual(WETH, "address"), //Asset in
        [10]: staticEqual(wstETH, "address"), //Asset out
      },
    },
  ],
}
export default preset
