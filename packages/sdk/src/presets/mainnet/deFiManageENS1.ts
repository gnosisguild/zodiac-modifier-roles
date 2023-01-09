import { stat } from "fs"

import { hashMessage } from "ethers/lib/utils"

import { ExecutionOptions, RolePreset } from "../../types"
import { allowCurvePool } from "../helpers/curve"
import { allowErc20Approve } from "../helpers/erc20"
import { allowLido } from "../helpers/lido"
import {
  dynamic32Equal,
  dynamicEqual,
  staticEqual,
  subsetOf,
} from "../helpers/utils"
import {
  AVATAR_ADDRESS_PLACEHOLDER,
  OMNI_BRIDGE_RECEIVER_PLACEHOLDER,
} from "../placeholders"

//Tokens
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
const UV3_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564"
const UV3_ROUTER_2 = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"

//Lido contracts
const stETH = "0xae7ab96520de3a18e5e111b5eaab095312d7fe84"
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
    //---------------------------------------------------------------------------------------------------------------------------------
    //Compound V2 - USDC
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([USDC], [cUSDC]),
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
    ...allowErc20Approve([DAI], [cDAI]),
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

    //exactInputSingle is needed for the reinvest option, which swaps rETH2 for stETH2 in the Uniswap V3 pool.
    //But as of now it is not considered in the strategy

    /* ...allowErc20Approve([rETH2], [UV3_ROUTER]),

    {
      targetAddress: UV3_ROUTER,
      signature:
        "exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160))",
      params: {
        [0]: staticEqual(rETH2, "address"),
        [1]: staticEqual(sETH2, "address"),
        [2]: staticEqual(500, "uint24"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    }, */

    //---------------------------------------------------------------------------------------------------------------------------------
    //Stakewise - UniswapV3 ETH + sETH2, 0.3%
    //---------------------------------------------------------------------------------------------------------------------------------

    ...allowErc20Approve([sETH2], [UV3_NFT_POSITIONS]),

    //Add liquidity: to create a new position in a pool one has to call both the mint and refundETH
    {
      targetAddress: UV3_NFT_POSITIONS,
      signature:
        "mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))",
      options: ExecutionOptions.Send,
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
    /* {
      targetAddress: UV3_NFT_POSITIONS,
      signature: "refundETH()",
      options: ExecutionOptions.Send,
    }, */

    //Increase liquidity: We cannot allow the increaseLiquidity function until we know the NFT id!!!
    //To increase liquidity one has to call the increaseLiquidity and refundETH functions
    /*
    {
      targetAddress: UV3_NFT_POSITIONS,
      signature:
        "increaseLiquidity((uint256,uint256,uint256,uint256,uint256,uint256))",
      options: ExecutionOptions.Send,
    },
    */

    //refundETH() is already whitelisted above
    /*
    {
      targetAddress: UV3_NFT_POSITIONS,
      signature: "refundETH()",
      options: ExecutionOptions.Send,
    },
    */
    //Removing liquidity: to remove liquidity one has to call the decreaseLiquidity and collect functions
    //decreaseLiquidity burns the token amounts in the pool, and increases token0Owed and token1Owed which represet the uncollected
    //fees

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

    //---------------------------------------------------------------------------------------------------------------------------------
    //Lido
    //---------------------------------------------------------------------------------------------------------------------------------

    //We need the stETH for the Curve stETH-ETH pool
    //We'll be getting wstETH from the Aura position, thus we need to be able to unwrap it
    //We could remove the wrapping of stETH. TO CHECK
    ...allowLido(),

    //---------------------------------------------------------------------------------------------------------------------------------
    //Curve - stETH/ETH
    //---------------------------------------------------------------------------------------------------------------------------------

    ...allowErc20Approve([stETH], [CURVE_stETH_ETH_POOL]),

    {
      targetAddress: CURVE_stETH_ETH_POOL,
      signature: "add_liquidity(uint256[2],uint256)",
      options: ExecutionOptions.Send,
    },
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

    ...allowErc20Approve([CURVE_stETH_ETH_LPTOKEN], [CURVE_stETH_ETH_GAUGE]),

    {
      targetAddress: CURVE_stETH_ETH_GAUGE,
      signature: "deposit(uint256)",
    },
    {
      targetAddress: CURVE_stETH_ETH_GAUGE,
      signature: "withdraw(uint256)",
    },
    {
      targetAddress: CURVE_stETH_ETH_GAUGE,
      signature: "claim_rewards(address)",
      params: {
        [0]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    {
      targetAddress: CRV_MINTER,
      signature: "mint(address)",
      params: {
        [0]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    //AURA wstETH-ETH
    //---------------------------------------------------------------------------------------------------------------------------------

    ...allowErc20Approve([WETH], [AURA_REWARD_POOL_DEPOSIT_WRAPPER]),

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
    //Balancer wstETH -ETH pool
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
    //Swapping of rewards COMP, CRV, rETH2, SWISE and sETH2 in UniswapV3
    //---------------------------------------------------------------------------------------------------------------------------------

    ...allowErc20Approve([COMP, rETH2, SWISE, sETH2, CRV], [UV3_ROUTER_2]),

    //Swapping of COMP for USDC
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([COMP, WETH, USDC], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    //Swapping of COMP for DAI
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([COMP, WETH, DAI], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    //Swapping of COMP for WETH
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([COMP, WETH], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    //------------------------------
    //Swapping of rETH2 for USDC
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([rETH2, sETH2, WETH, USDC], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    //Swapping of rETH2 for DAI
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([rETH2, sETH2, WETH, DAI], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    //Swapping of rETH2 for WETH
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([rETH2, sETH2, WETH], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    //------------------------------
    //Swapping of SWISE for USDC
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([SWISE, sETH2, WETH, USDC], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    //Swapping of SWISE for DAI
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([SWISE, sETH2, WETH, DAI], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    //Swapping of SWISE for WETH
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([SWISE, sETH2, WETH], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    //------------------------------
    //Swapping of sETH2 for WETH
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([sETH2, WETH], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    //------------------------------
    //Swapping of WETH for DAI
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([WETH, DAI], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    //------------------------------
    //Swapping of WETH for USDC
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([WETH, USDC], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    //------------------------------
    //Swapping of CRV for USDC
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([CRV, WETH, USDC], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    //Swapping of CRV for DAI
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([CRV, WETH, DAI], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    //Swapping of CRV for WETH
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([CRV, WETH], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    //------------------------------
    //Swapping of LDO for USDC
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([LDO, WETH, USDC], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    //Swapping of LDO for DAI
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([LDO, WETH, DAI], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    //Swapping of LDO for WETH
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([LDO, WETH], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    //Swapping of rewards AURA, BAL, COMP in Balancer: https://dev.balancer.fi/guides/swaps/single-swaps
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
    ...allowErc20Approve([AURA], [BALANCER_VAULT]),
    {
      targetAddress: BALANCER_VAULT,
      signature:
        "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
      params: {
        [0]: staticEqual(
          "0xcfca23ca9ca720b6e98e3eb9b6aa0ffc4a5c08b9000200000000000000000274",
          "bytes32"
        ), //WETH-AURA pool ID
        [2]: staticEqual(AURA, "address"), //Asset in
        [3]: staticEqual(WETH, "address"), //Asset out
        [6]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
        [7]: staticEqual(false, "bool"),
        [8]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
        [9]: staticEqual(false, "bool"),
      },
    },

    //Swap BAL for WETH
    ...allowErc20Approve([BAL], [BALANCER_VAULT]),
    {
      targetAddress: BALANCER_VAULT,
      signature:
        "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
      params: {
        [0]: staticEqual(
          "0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014",
          "bytes32"
        ), //BAL-WETH pool ID
        [2]: staticEqual(BAL, "address"), //Asset in
        [3]: staticEqual(WETH, "address"), //Asset out
        [6]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
        [7]: staticEqual(false, "bool"),
        [8]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
        [9]: staticEqual(false, "bool"),
      },
    },

    //Swap WETH for DAI
    ...allowErc20Approve([WETH], [BALANCER_VAULT]),
    {
      targetAddress: BALANCER_VAULT,
      signature:
        "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
      params: {
        [0]: staticEqual(
          "0x0b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a",
          "bytes32"
        ), //WETH-DAI pool ID
        [2]: staticEqual(WETH, "address"), //Asset in
        [3]: staticEqual(DAI, "address"), //Asset out
        [6]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
        [7]: staticEqual(false, "bool"),
        [8]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
        [9]: staticEqual(false, "bool"),
      },
    },

    //Swap WETH for USDC
    ...allowErc20Approve([WETH], [BALANCER_VAULT]),
    {
      targetAddress: BALANCER_VAULT,
      signature:
        "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
      params: {
        [0]: staticEqual(
          "0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8000200000000000000000019",
          "bytes32"
        ), //USDC-WETH pool ID
        [2]: staticEqual(WETH, "address"), //Asset in
        [3]: staticEqual(USDC, "address"), //Asset out
        [6]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
        [7]: staticEqual(false, "bool"),
        [8]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
        [9]: staticEqual(false, "bool"),
      },
    },

    //Swap COMP for WETH
    ...allowErc20Approve([COMP], [BALANCER_VAULT]),
    {
      targetAddress: BALANCER_VAULT,
      signature:
        "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
      params: {
        [0]: staticEqual(
          "0xefaa1604e82e1b3af8430b90192c1b9e8197e377000200000000000000000021",
          "bytes32"
        ), //COMP-WETH pool ID
        [2]: staticEqual(COMP, "address"), //Asset in
        [3]: staticEqual(WETH, "address"), //Asset out
        [6]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
        [7]: staticEqual(false, "bool"),
        [8]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
        [9]: staticEqual(false, "bool"),
      },
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    //Swapping of COMP, LDO, WETH, CRV, BAL for USDC, DAI and WETH in SushiSwap
    //---------------------------------------------------------------------------------------------------------------------------------

    ...allowErc20Approve([COMP, LDO, WETH, CRV, BAL], [SUSHISWAP_ROUTER]),
    // WETH
    {
      targetAddress: SUSHISWAP_ROUTER,
      signature:
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
      params: {
        [2]: dynamic32Equal([WETH, DAI], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    {
      targetAddress: SUSHISWAP_ROUTER,
      signature:
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
      params: {
        [2]: dynamic32Equal([WETH, USDC], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    // COMP
    {
      targetAddress: SUSHISWAP_ROUTER,
      signature:
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
      params: {
        [2]: dynamic32Equal([COMP, WETH], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    {
      targetAddress: SUSHISWAP_ROUTER,
      signature:
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
      params: {
        [2]: dynamic32Equal([COMP, WETH, USDC], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    {
      targetAddress: SUSHISWAP_ROUTER,
      signature:
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
      params: {
        [2]: dynamic32Equal([COMP, WETH, DAI], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    // LDO
    {
      targetAddress: SUSHISWAP_ROUTER,
      signature:
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
      params: {
        [2]: dynamic32Equal([LDO, WETH], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    {
      targetAddress: SUSHISWAP_ROUTER,
      signature:
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
      params: {
        [2]: dynamic32Equal([LDO, WETH, USDC], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    {
      targetAddress: SUSHISWAP_ROUTER,
      signature:
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
      params: {
        [2]: dynamic32Equal([LDO, WETH, DAI], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    // CRV
    {
      targetAddress: SUSHISWAP_ROUTER,
      signature:
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
      params: {
        [2]: dynamic32Equal([CRV, WETH], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    {
      targetAddress: SUSHISWAP_ROUTER,
      signature:
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
      params: {
        [2]: dynamic32Equal([CRV, WETH, USDC], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    {
      targetAddress: SUSHISWAP_ROUTER,
      signature:
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
      params: {
        [2]: dynamic32Equal([CRV, WETH, DAI], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    // BAL
    {
      targetAddress: SUSHISWAP_ROUTER,
      signature:
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
      params: {
        [2]: dynamic32Equal([BAL, WETH], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    {
      targetAddress: SUSHISWAP_ROUTER,
      signature:
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
      params: {
        [2]: dynamic32Equal([BAL, WETH, USDC], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    {
      targetAddress: SUSHISWAP_ROUTER,
      signature:
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
      params: {
        [2]: dynamic32Equal([BAL, WETH, DAI], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
  ],
}
export default preset
