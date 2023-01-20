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
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"

//Compound V2 contracts
const COMPTROLLER = "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b"
const cUSDC = "0x39AA39c021dfbaE8faC545936693aC917d5E7563"
const cDAI = "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"
const COMP = "0xc00e94Cb662C3520282E6f5717214004A7f26888"

//Stakewise contracts
const STAKEWISE_ETH2_STAKING = "0xC874b064f465bdD6411D45734b56fac750Cda29A"
const STAKEWISE_MERKLE_DIS = "0xA3F21010e8b9a3930996C8849Df38f9Ca3647c20"
const sETH2 = "0xFe2e637202056d30016725477c5da089Ab0A043A"
const rETH2 = "0x20BC832ca081b91433ff6c17f85701B6e92486c5"
const SWISE = "0x48C3399719B582dD63eB5AADf12A40B4C3f52FA2"

//Uniswap V3 contracts
const UV3_NFT_POSITIONS = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"
const UV3_ROUTER_2 = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"

//Lido contracts
const stETH = "0xae7ab96520de3a18e5e111b5eaab095312d7fe84"
const wstETH = "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0"
const LDO = "0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32"

//Curve contracts
const CURVE_stETH_ETH_POOL = "0xDC24316b9AE028F1497c275EB9192a3Ea0f67022"
const CURVE_stETH_ETH_LPTOKEN = "0x06325440D014e39736583c165C2963BA99fAf14E"
const CURVE_stETH_ETH_GAUGE = "0x182B723a58739a9c974cFDB385ceaDb237453c28"
const CRV = "0xD533a949740bb3306d119CC777fa900bA034cd52"
const CRV_MINTER = "0xd061D61a4d941c39E5453435B6345Dc261C2fcE0"

//Aura contracts
const AURA_REWARD_POOL_DEPOSIT_WRAPPER =
  "0xB188b1CB84Fb0bA13cb9ee1292769F903A9feC59"
const AURA_BALANCER_stETH_VAULT = "0xe4683Fe8F53da14cA5DAc4251EaDFb3aa614d528"
const AURA = "0xC0c293ce456fF0ED870ADd98a0828Dd4d2903DBF"

//Balancer contracts
const BALANCER_VAULT = "0xBA12222222228d8Ba445958a75a0704d566BF2C8"
const BAL = "0xba100000625a3754423978a60c9317c58a424e3D"

//SushiSwap contracts
const SUSHISWAP_ROUTER = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"

const preset: RolePreset = {
  network: 1,
  allow: [
    //All approvals have been commented since we'll be handling over the Avatar safe with all of them having been already executed

    //---------------------------------------------------------------------------------------------------------------------------------
    //Lido
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
    //Compound V2 - Claiming of rewards
    //---------------------------------------------------------------------------------------------------------------------------------
    {
      targetAddress: COMPTROLLER,
      signature: "claimComp(address,address[])",
      params: {
        [0]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
        [1]: subsetOf(
          [cDAI, cUSDC].map((address) => address.toLowerCase()).sort(), // compound app will always pass tokens in ascending order
          "address[]",
          {
            restrictOrder: true,
          }
        ),
      },
    },

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

    //The exactInputSingle function is needed for the reinvest option, which swaps rETH2 for sETH2 in the Uniswap V3 pool.
    //But as of now it is not considered within the strategy scope

    //---------------------------------------------------------------------------------------------------------------------------------
    //Stakewise - UniswapV3 ETH + sETH2, 0.3%
    //---------------------------------------------------------------------------------------------------------------------------------

    //...allowErc20Approve([sETH2, WETH], [UV3_NFT_POSITIONS]),

    //Add liquidity
    {
      targetAddress: UV3_NFT_POSITIONS,
      signature:
        "mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))",
      //options: ExecutionOptions.Send,
      params: {
        [0]: staticEqual(WETH, "address"),
        [1]: staticEqual(sETH2, "address"),
        [2]: staticEqual(3000, "uint24"), //3000 represents the 0.3% fee
        [9]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    //If ETH is deposited instead of WETH, one has to call the refundETH function after calling the mint function
    //We are only allowing to deposit WETH, otherwise the ETH held by the NFT Positions contract after calling the mint function could be claimed
    //by another address calling the refundETH function

    //Increase liquidity: We cannot allow the increaseLiquidity function until we know the NFT id!!!
    /*
    {
      targetAddress: UV3_NFT_POSITIONS,
      signature:
        "increaseLiquidity((uint256,uint256,uint256,uint256,uint256,uint256))",
      params: {
        [0]: staticEqual(XXXXX, "uint256"),
      },
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
    //Curve - stETH/ETH
    //---------------------------------------------------------------------------------------------------------------------------------

    //...allowErc20Approve([stETH], [CURVE_stETH_ETH_POOL]),

    //Adding liquidity
    {
      targetAddress: CURVE_stETH_ETH_POOL,
      signature: "add_liquidity(uint256[2],uint256)",
      options: ExecutionOptions.Send,
    },

    //Removing liquidity
    {
      targetAddress: CURVE_stETH_ETH_POOL,
      signature: "remove_liquidity_one_coin(uint256,int128,uint256)",
    },
    {
      targetAddress: CURVE_stETH_ETH_POOL,
      signature: "remove_liquidity(uint256,uint256[2])",
    },
    {
      targetAddress: CURVE_stETH_ETH_POOL,
      signature: "remove_liquidity_imbalance(uint256[2],uint256)",
    },

    //...allowErc20Approve([CURVE_stETH_ETH_LPTOKEN], [CURVE_stETH_ETH_GAUGE]),

    //Staking in gauge
    {
      targetAddress: CURVE_stETH_ETH_GAUGE,
      signature: "deposit(uint256)",
    },

    //Unstaking from gauge
    {
      targetAddress: CURVE_stETH_ETH_GAUGE,
      signature: "withdraw(uint256)",
    },

    //Claiming LDO rewards
    {
      targetAddress: CURVE_stETH_ETH_GAUGE,
      signature: "claim_rewards(address)",
      params: {
        [0]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    //Claiming CRV rewards
    {
      targetAddress: CRV_MINTER,
      signature: "mint(address)",
      params: {
        [0]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    //AURA wstETH-WETH
    //---------------------------------------------------------------------------------------------------------------------------------

    //...allowErc20Approve([WETH], [AURA_REWARD_POOL_DEPOSIT_WRAPPER]),

    //deposiSingle: the (address[],uint256[],bytes,bool) tuple argument represents the request data for joining the pool
    /* request=(
          address[] assets,
          uint256[] maxAmountsIn,
          bytes userData,
          bool fromInternalBalance
    )   
    */
    //userData specifies the JoinKind, see https://dev.balancer.fi/resources/joins-and-exits/pool-joins

    {
      targetAddress: AURA_REWARD_POOL_DEPOSIT_WRAPPER,
      signature:
        "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(AURA_BALANCER_stETH_VAULT, "address"),
        [1]: staticEqual(WETH, "address"),
        [3]: staticEqual(
          "0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080",
          "bytes32"
        ), //pool ID
      },
    },

    //withdrawAndUnwrap: the bool argument specifies whether rewards are claimed when withdrawing
    //When withdrawing one receives Balancer wstETH/ETH LP token
    {
      targetAddress: AURA_BALANCER_stETH_VAULT,
      signature: "withdrawAndUnwrap(uint256,bool)",
    },

    {
      targetAddress: AURA_BALANCER_stETH_VAULT,
      signature: "getReward()",
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    //Balancer wstETH - WETH pool
    //---------------------------------------------------------------------------------------------------------------------------------

    //exitPool: the (address[],uint256[],bytes,bool) tuple argument represents the request data for joining the pool
    /* request=(
          address[] assets,
          uint256[] maxAmountsIn,
          bytes userData,
          bool fromInternalBalance
    )   
    */
    //userData specifies the JoinKind, see https://dev.balancer.fi/resources/joins-and-exits/pool-joins
    {
      targetAddress: BALANCER_VAULT,
      signature:
        "exitPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080", //pool ID
          "bytes32"
        ),
        [1]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
        [2]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    //Wrapping and unwrapping of ETH, WETH
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
    //Swapping of tokens COMP, CRV, LDO, rETH2, SWISE, sETH2, WETH, USDC, DAI and USDT in UniswapV3
    //---------------------------------------------------------------------------------------------------------------------------------

    /* ...allowErc20Approve(
      [COMP, rETH2, SWISE, sETH2, CRV, LDO, WETH, USDC, DAI, USDT],
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
            [rETH2, sETH2, WETH, USDC],
            [rETH2, sETH2, WETH, DAI],
            [rETH2, sETH2, WETH],
            [SWISE, sETH2, WETH, USDC],
            [SWISE, sETH2, WETH, DAI],
            [SWISE, sETH2, WETH],
            [sETH2, WETH],
            [WETH, sETH2],
            [CRV, WETH, USDC],
            [CRV, WETH, DAI],
            [CRV, WETH],
            [LDO, WETH, USDC],
            [LDO, WETH, DAI],
            [LDO, WETH],
            [WETH, USDC],
            [WETH, DAI],
            [WETH, USDT],
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
          ],
          "address[]"
        ),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    //Swapping AURA, BAL, COMP, WETH and wstETH in Balancer: https://dev.balancer.fi/guides/swaps/single-swaps
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

    //Swap AURA for WETH
    //...allowErc20Approve([AURA], [BALANCER_VAULT]),
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
          "0xcfca23ca9ca720b6e98e3eb9b6aa0ffc4a5c08b9000200000000000000000274",
          "bytes32"
        ), //WETH-AURA pool ID
        [9]: staticEqual(AURA, "address"), //Asset in
        [10]: staticEqual(WETH, "address"), //Asset out
      },
    },

    //Swap BAL for WETH
    //...allowErc20Approve([BAL], [BALANCER_VAULT]),
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
          "0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014",
          "bytes32"
        ), //BAL-WETH pool ID
        [9]: staticEqual(BAL, "address"), //Asset in
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

    //Swap WETH for wstETH
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

    //---------------------------------------------------------------------------------------------------------------------------------
    //Swapping of COMP, LDO, WETH, CRV, BAL for USDC, DAI and WETH in SushiSwap
    //---------------------------------------------------------------------------------------------------------------------------------

    /* ...allowErc20Approve(
      [COMP, BAL, LDO, CRV, WETH, USDC, DAI, USDT],
      [SUSHISWAP_ROUTER]
    ), */

    // WETH
    {
      targetAddress: SUSHISWAP_ROUTER,
      signature:
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
      params: {
        [2]: dynamic32OneOf(
          [
            [COMP, WETH, USDC],
            [COMP, WETH, DAI],
            [COMP, WETH],
            [BAL, WETH, USDC],
            [BAL, WETH, DAI],
            [BAL, WETH],
            [LDO, WETH, USDC],
            [LDO, WETH, DAI],
            [LDO, WETH],
            [CRV, WETH, USDC],
            [CRV, WETH, DAI],
            [CRV, WETH],
            [WETH, USDC],
            [WETH, DAI],
            [WETH, USDT],
            [USDC, WETH],
            [USDC, WETH, USDT],
            [USDC, USDT],
            [USDC, WETH, DAI],
            [USDC, DAI],
            [USDT, WETH],
            [USDT, WETH, USDC],
            [USDT, USDC],
            [USDT, WETH, DAI],
            [USDT, DAI],
            [DAI, WETH],
            [DAI, WETH, USDC],
            [DAI, USDC],
            [DAI, WETH, USDT],
            [DAI, USDT],
          ],
          "address[]"
        ),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    //Swapping of ETH and stETH in Curve
    //---------------------------------------------------------------------------------------------------------------------------------

    //...allowErc20Approve([stETH], [CURVE_stETH_ETH_POOL]),
    {
      targetAddress: CURVE_stETH_ETH_POOL,
      signature: "exchange(int128,int128,uint256,uint256)",
      options: ExecutionOptions.Send,
    },
  ],
}
export default preset
