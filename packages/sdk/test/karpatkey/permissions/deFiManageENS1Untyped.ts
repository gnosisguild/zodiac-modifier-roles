import { c, Permission } from "../../../src"

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
const CURVE_stETH_ETH_GAUGE = "0x182B723a58739a9c974cFDB385ceaDb237453c28"
const CURVE_3POOL = "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7"
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

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

const preset = [
  //All approvals have been commented since we'll be handling over the c.avatar safe with all of them having been already executed

  //---------------------------------------------------------------------------------------------------------------------------------
  //Lido
  //---------------------------------------------------------------------------------------------------------------------------------

  //...allowErc20Approve([stETH], [wstETH]),
  {
    targetAddress: stETH,
    signature: "submit(address)",
    condition: c.calldataMatches([ZERO_ADDRESS], ["address"]),
    send: true,
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
    condition: c.calldataMatches(
      [c.avatar, c.subset([cDAI, cUSDC])],
      ["address", "address[]"]
    ),
  },

  //---------------------------------------------------------------------------------------------------------------------------------
  //Stakewise
  //---------------------------------------------------------------------------------------------------------------------------------

  //When staking ETH one receives sETH2
  {
    targetAddress: STAKEWISE_ETH2_STAKING,
    signature: "stake()",
    send: true,
  },

  //By having staked ETH one receives rETH2 as rewards that are claimed by calling the claim function
  {
    targetAddress: STAKEWISE_MERKLE_DIS,
    signature: "claim(uint256,address,address[],uint256[],bytes32[])",
    condition: c.calldataMatches(
      [undefined, c.avatar, [rETH2, SWISE]],
      ["uint256", "address", "address[]", "uint256[]", "bytes32[]"]
    ),
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
    condition: c.calldataMatches(
      [
        {
          token0: WETH,
          token1: sETH2,
          fee: 3000, //3000 represents the 0.3% fee
          recipient: c.avatar,
        },
      ],
      [
        "(address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)",
      ]
    ),
  },
  //If ETH is deposited instead of WETH, one has to call the refundETH function after calling the mint function
  //We are only allowing to deposit WETH, otherwise the ETH held by the NFT Positions contract after calling the mint function could be claimed
  //by another address calling the refundETH function

  //Increasing liquidity: NFT ID 424810 was created in transaction with hash 0x2995ba040fe1b07978428ca118d9701b5114ec7e2d3ac00f2b4df0f5747dc42e
  {
    targetAddress: UV3_NFT_POSITIONS,
    signature:
      "increaseLiquidity((uint256,uint256,uint256,uint256,uint256,uint256))",
    condition: c.calldataMatches(
      [{ tokenId: 424810 }],
      [
        "(uint256 tokenId, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, uint256 deadline)",
      ]
    ),
  },

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
    condition: c.calldataMatches(
      [c.matches([undefined, c.avatar])],
      ["(uint256,address,uint128,uint128)"]
    ),
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
    send: true,
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
    signature: "claim_rewards(address)", // IMPORTANT!: CHANGE FOR "claim_rewards()"
    condition: c.calldataMatches([c.avatar], ["address"]),
  },

  //Claiming CRV rewards
  {
    targetAddress: CRV_MINTER,
    signature: "mint(address)",
    condition: c.calldataMatches([CURVE_stETH_ETH_GAUGE], ["address"]),
  },

  //---------------------------------------------------------------------------------------------------------------------------------
  //AURA wstETH-WETH
  //---------------------------------------------------------------------------------------------------------------------------------

  //...allowErc20Approve([WETH], [AURA_REWARD_POOL_DEPOSIT_WRAPPER]),

  {
    targetAddress: AURA_REWARD_POOL_DEPOSIT_WRAPPER,
    signature:
      "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
    condition: c.calldataMatches(
      [
        AURA_BALANCER_stETH_VAULT, // rewardPoolAddress
        WETH, // inputToken
        undefined, // inputAmount
        "0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080", // balancerPoolId
      ],
      [
        "address",
        "address",
        "uint256",
        "bytes32",
        // "(address[] assets, uint256[] maxAmountsIn, bytes userData, bool fromInternalBalance)",
      ]
    ),
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
    condition: c.calldataMatches(
      [
        "0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080", // poolId
        c.avatar, // sender
        c.avatar, // recipient
      ],
      ["bytes32", "address", "address"]
    ),
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
    send: true,
  },

  //---------------------------------------------------------------------------------------------------------------------------------
  //Swapping of tokens COMP, CRV, LDO, WETH, USDC, DAI and USDT in Uniswap
  //---------------------------------------------------------------------------------------------------------------------------------

  /* ...allowErc20Approve(
      [COMP, rETH2, SWISE, sETH2, CRV, LDO, WETH, USDC, DAI, USDT],
      [UV3_ROUTER_2]
    ), */

  {
    targetAddress: UV3_ROUTER_2,
    signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
    condition: c.calldataMatches(
      [
        undefined, // amountIn
        undefined, // amountOutMin
        // path
        c.or(
          [COMP, WETH, USDC],
          [COMP, WETH, DAI],
          [COMP, WETH],
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
          [USDT, WETH, DAI]
        ),
        c.avatar, // to
      ],
      ["uint256", "uint256", "address[]", "address"]
    ),
  },

  {
    targetAddress: UV3_ROUTER_2,
    signature:
      "exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))",
    condition: c.calldataMatches(
      [
        {
          tokenIn: c.or(
            COMP,
            WETH,
            rETH2,
            sETH2,
            SWISE,
            CRV,
            LDO,
            USDC,
            DAI,
            USDT
          ),
          tokenOut: c.or(WETH, USDC, DAI, USDT, sETH2),
          recipient: c.avatar,
        },
      ],
      [
        "(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)",
      ]
    ),
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
    condition: c.calldataMatches(
      [
        {
          poolId:
            "0xcfca23ca9ca720b6e98e3eb9b6aa0ffc4a5c08b9000200000000000000000274", //WETH-AURA pool ID
          assetIn: AURA,
          assetOut: WETH,
        },
        {
          sender: c.avatar,
          fromInternalBalance: false,
          recipient: c.avatar,
          toInternalBalance: false,
        },
      ],
      [
        "(bytes32 poolId, uint8 kind, address assetIn, address assetOut, uint256 amount, bytes userData)",
        "(address sender, bool fromInternalBalance, address recipient, bool toInternalBalance)",
        "uint256",
        "uint256",
      ]
    ),
  },

  //Swap BAL for WETH
  //...allowErc20Approve([BAL], [BALANCER_VAULT]),
  {
    targetAddress: BALANCER_VAULT,
    signature:
      "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
    condition: c.calldataMatches(
      [
        {
          poolId:
            "0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014", //BAL-WETH pool ID
          assetIn: BAL,
          assetOut: WETH,
        },
        {
          sender: c.avatar,
          fromInternalBalance: false,
          recipient: c.avatar,
          toInternalBalance: false,
        },
      ],
      [
        "(bytes32 poolId, uint8 kind, address assetIn, address assetOut, uint256 amount, bytes userData)",
        "(address sender, bool fromInternalBalance, address recipient, bool toInternalBalance)",
        "uint256",
        "uint256",
      ]
    ),
  },

  //Swap WETH for DAI
  //...allowErc20Approve([WETH], [BALANCER_VAULT]),
  {
    targetAddress: BALANCER_VAULT,
    signature:
      "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
    condition: c.calldataMatches(
      [
        {
          poolId:
            "0x0b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a", //WETH-DAI pool ID
          assetIn: WETH,
          assetOut: DAI,
        },
        {
          sender: c.avatar,
          fromInternalBalance: false,
          recipient: c.avatar,
          toInternalBalance: false,
        },
      ],
      [
        "(bytes32 poolId, uint8 kind, address assetIn, address assetOut, uint256 amount, bytes userData)",
        "(address sender, bool fromInternalBalance, address recipient, bool toInternalBalance)",
        "uint256",
        "uint256",
      ]
    ),
  },

  //Swap WETH for USDC
  //...allowErc20Approve([WETH], [BALANCER_VAULT]),
  {
    targetAddress: BALANCER_VAULT,
    signature:
      "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
    condition: c.calldataMatches(
      [
        {
          poolId:
            "0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8000200000000000000000019", //USDC-WETH pool ID
          assetIn: WETH,
          assetOut: USDC,
        },
        {
          sender: c.avatar,
          fromInternalBalance: false,
          recipient: c.avatar,
          toInternalBalance: false,
        },
      ],
      [
        "(bytes32 poolId, uint8 kind, address assetIn, address assetOut, uint256 amount, bytes userData)",
        "(address sender, bool fromInternalBalance, address recipient, bool toInternalBalance)",
        "uint256",
        "uint256",
      ]
    ),
  },

  //Swap COMP for WETH
  //...allowErc20Approve([COMP], [BALANCER_VAULT]),
  {
    targetAddress: BALANCER_VAULT,
    signature:
      "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
    condition: c.calldataMatches(
      [
        {
          poolId:
            "0xefaa1604e82e1b3af8430b90192c1b9e8197e377000200000000000000000021", //COMP-WETH pool ID
          assetIn: COMP,
          assetOut: WETH,
        },
        {
          sender: c.avatar,
          fromInternalBalance: false,
          recipient: c.avatar,
          toInternalBalance: false,
        },
      ],
      [
        "(bytes32 poolId, uint8 kind, address assetIn, address assetOut, uint256 amount, bytes userData)",
        "(address sender, bool fromInternalBalance, address recipient, bool toInternalBalance)",
        "uint256",
        "uint256",
      ]
    ),
  },

  //Swap wstETH for WETH and vice versa
  //...allowErc20Approve([wstETH], [BALANCER_VAULT]),
  {
    targetAddress: BALANCER_VAULT,
    signature:
      "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
    condition: c.calldataMatches(
      [
        c.or(
          {
            poolId:
              "0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080", //wstETH-WETH pool ID
            assetIn: wstETH,
            assetOut: WETH,
          },
          {
            poolId:
              "0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080", //wstETH-WETH pool ID
            assetIn: WETH,
            assetOut: wstETH,
          }
        ),
        {
          sender: c.avatar,
          fromInternalBalance: false,
          recipient: c.avatar,
          toInternalBalance: false,
        },
      ],
      [
        "(bytes32 poolId, uint8 kind, address assetIn, address assetOut, uint256 amount, bytes userData)",
        "(address sender, bool fromInternalBalance, address recipient, bool toInternalBalance)",
        "uint256",
        "uint256",
      ]
    ),
  },

  //---------------------------------------------------------------------------------------------------------------------------------
  //Swapping of COMP, BAL, LDO, CRV, WETH, USDC, USDT and DAI in SushiSwap
  //---------------------------------------------------------------------------------------------------------------------------------

  /* ...allowErc20Approve(
      [COMP, BAL, LDO, CRV, WETH, USDC, USDT, DAI],
      [SUSHISWAP_ROUTER]
    ), */

  {
    targetAddress: SUSHISWAP_ROUTER,
    signature:
      "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
    condition: c.calldataMatches(
      [
        undefined,
        undefined,
        c.or(
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
          [DAI, USDT]
        ),
        c.avatar,
      ],
      ["uint256", "uint256", "address[]", "address", "uint256"]
    ),
  },

  //---------------------------------------------------------------------------------------------------------------------------------
  //Swapping of ETH and stETH in Curve
  //---------------------------------------------------------------------------------------------------------------------------------

  //...allowErc20Approve([stETH], [CURVE_stETH_ETH_POOL]),
  {
    targetAddress: CURVE_stETH_ETH_POOL,
    signature: "exchange(int128,int128,uint256,uint256)",
    send: true,
  },

  //---------------------------------------------------------------------------------------------------------------------------------
  //Swapping in Curve's 3pool
  //---------------------------------------------------------------------------------------------------------------------------------

  //...allowErc20Approve([DAI, USDC, USDT], [CURVE_3POOL]),
  {
    targetAddress: CURVE_3POOL,
    signature: "exchange(int128,int128,uint256,uint256)",
  },
] satisfies Permission[]

export default preset
