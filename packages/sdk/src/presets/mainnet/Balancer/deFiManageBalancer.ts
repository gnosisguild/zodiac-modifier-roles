import {
  ZERO_ADDRESS,
  AAVE,
  BAL,
  COMP,
  D2D,
  DAI,
  rETH,
  rETH2,
  stETH,
  sETH2,
  SWISE,
  USDC,
  USDT,
  WBTC,
  WETH,
  wstETH,
  aave_v3,
  across_v2,
  balancer,
  compound_v2,
  compound_v3,
  cowswap,
  curve,
  lido,
  maker,
  mstable_v2,
  rocket_pool,
  silo_v2,
  sushiswap,
  uniswapv3,
} from "../addresses"
import { staticEqual, staticOneOf } from "../../helpers/utils"
import { AVATAR } from "../../placeholders"
import { RolePreset } from "../../types"
import { allow } from "../../allow"
import { allowErc20Approve } from "../../helpers/erc20"

// mStable
const DELEGATE_ADDRESS = "0xd6e96e437b8d42406a64440226b77a51c74e26b1"

// governance.karpatkey.eth
const GOVERNANCE_KPK = "0x8787FC2De4De95c53e5E3a4e5459247D9773ea52"

const preset = {
  network: 1,
  allow: [
    //All approvals have been commented since we'll be handling over the Avatar safe with all of them having been already executed

    //---------------------------------------------------------------------------------------------------------------------------------
    // LIDO
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve([stETH], [wstETH]),
    // ...allowErc20Approve([stETH, wstETH], [lido.unstETH]),

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

    // Request stETH Withdrawal - Locks your stETH in the queue. In exchange you receive an NFT, that represents your position
    // in the queue
    allow.mainnet.lido.unstETH["requestWithdrawals"](undefined, AVATAR),

    // Request wstETH Withdrawal - Transfers the wstETH to the unstETH to be burned in exchange for stETH. Then it locks your stETH
    // in the queue. In exchange you receive an NFT, that represents your position in the queue
    allow.mainnet.lido.unstETH["requestWithdrawalsWstETH"](undefined, AVATAR),

    // Claim ETH - Once the request is finalized by the oracle report and becomes claimable,
    // this function claims your ether and burns the NFT
    allow.mainnet.lido.unstETH["claimWithdrawals"](),

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

    // Restake
    allow.mainnet.aave_v2.stkAave["claimRewardsAndStake"](AVATAR),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Delegate Aave and stkAave to governance.karpatkey.eth
    //---------------------------------------------------------------------------------------------------------------------------------
    allow.mainnet.aave_v2.aave["delegate"](GOVERNANCE_KPK),
    allow.mainnet.aave_v2.stkAave["delegate"](GOVERNANCE_KPK),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aave V3
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aave V3 - DAI
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve([DAI], [aave_v3.POOL_V3]),

    // Supply
    allow.mainnet.aave_v3.pool_v3["supply"](DAI, undefined, AVATAR),

    // Withdraw
    allow.mainnet.aave_v3.pool_v3["withdraw"](DAI, undefined, AVATAR),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aave V3 - USDC
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve([USDC], [aave_v3.POOL_V3]),

    // Supply
    allow.mainnet.aave_v3.pool_v3["supply"](USDC, undefined, AVATAR),

    // Withdraw
    allow.mainnet.aave_v3.pool_v3["withdraw"](USDC, undefined, AVATAR),

    // //---------------------------------------------------------------------------------------------------------------------------------
    // // Aave V3 - BAL
    // //---------------------------------------------------------------------------------------------------------------------------------
    // // ...allowErc20Approve([BAL], [aave_v3.POOL_V3]),

    // // Supply
    // allow.mainnet.aave_v3.pool_v3["supply"](BAL, undefined, AVATAR),

    // // Withdraw
    // allow.mainnet.aave_v3.pool_v3["withdraw"](BAL, undefined, AVATAR),

    // //---------------------------------------------------------------------------------------------------------------------------------
    // // Across V2
    // //---------------------------------------------------------------------------------------------------------------------------------

    // //---------------------------------------------------------------------------------------------------------------------------------
    // // Across V2 - BAL
    // //---------------------------------------------------------------------------------------------------------------------------------
    // // ...allowErc20Approve([BAL], [across_v2.HUB_POOL_V2]),

    // // Deposit
    // allow.mainnet.across_v2.hub_pool_v2["addLiquidity"](BAL),

    // // Withdraw
    // allow.mainnet.across_v2.hub_pool_v2["removeLiquidity"](BAL),

    // //---------------------------------------------------------------------------------------------------------------------------------
    // // Silo V2
    // //---------------------------------------------------------------------------------------------------------------------------------

    // //---------------------------------------------------------------------------------------------------------------------------------
    // // Silo V2 - BAL
    // //---------------------------------------------------------------------------------------------------------------------------------
    // // ...allowErc20Approve([BAL], [silo_v2.ROUTER]),

    // // Deposit
    // {
    //   targetAddress: silo_v2.ROUTER,
    //   signature: "execute((uint8,address,address,uint256,bool)[])",
    //   params: {
    //     [0]: staticEqual(
    //       "0x0000000000000000000000000000000000000000000000000000000000000020",
    //       "bytes32"
    //     ), // Offset of the tuple from beginning 32=32*1
    //     [1]: staticEqual(
    //       "0x0000000000000000000000000000000000000000000000000000000000000001",
    //       "bytes32"
    //     ), // Length of tuple = 1
    //     [2]: staticEqual(
    //       "0x0000000000000000000000000000000000000000000000000000000000000000",
    //       "bytes32"
    //     ), // actionType = 0 (Deposit)
    //     [3]: staticEqual(silo_v2.BAL_SILO, "address"), // BAL Silo
    //     [4]: staticEqual(BAL, "address"), // BAL Silo
    //   },
    // },

    // // Withdraw
    // {
    //   targetAddress: silo_v2.ROUTER,
    //   signature: "execute((uint8,address,address,uint256,bool)[])",
    //   params: {
    //     [0]: staticEqual(
    //       "0x0000000000000000000000000000000000000000000000000000000000000020",
    //       "bytes32"
    //     ), // Offset of the tuple from beginning 32=32*1
    //     [1]: staticEqual(
    //       "0x0000000000000000000000000000000000000000000000000000000000000001",
    //       "bytes32"
    //     ), // Length of tuple = 1
    //     [2]: staticEqual(
    //       "0x0000000000000000000000000000000000000000000000000000000000000001",
    //       "bytes32"
    //     ), // actionType = 0 (Withdraw)
    //     [3]: staticEqual(silo_v2.BAL_SILO, "address"), // BAL Silo
    //     [4]: staticEqual(BAL, "address"), // BAL Silo
    //   },
    // },

    // //---------------------------------------------------------------------------------------------------------------------------------
    // // mStable V2
    // //---------------------------------------------------------------------------------------------------------------------------------

    // //---------------------------------------------------------------------------------------------------------------------------------
    // // mStable V2 - Stake MTA
    // //---------------------------------------------------------------------------------------------------------------------------------
    // // ...allowErc20Approve([mstable_v2.MTA], [mstable_v2.stkMTA]),

    // // Staking of MTA without voting power delegation
    // allow.mainnet.mstable_v2.stkMTA["stake(uint256)"](),

    // // Staking of MTA with voting power delegation
    // allow.mainnet.mstable_v2.stkMTA["stake(uint256,address)"](
    //   undefined,
    //   DELEGATE_ADDRESS
    // ),

    // // Undelegate voting power
    // allow.mainnet.mstable_v2.stkMTA["delegate"](
    //   AVATAR
    // ),

    // // Claim rewards without compounding
    // allow.mainnet.mstable_v2.stkMTA["claimReward()"](),

    // // Claim compounding rewards, i.e. MTA claimed rewards are immediately staked
    // allow.mainnet.mstable_v2.stkMTA["compoundRewards"](),

    // // Start cooldown for withdrawal
    // allow.mainnet.mstable_v2.stkMTA["startCooldown"](),

    // // Forcefully end cooldown to be able to withdraw, at the expense of a penalty
    // allow.mainnet.mstable_v2.stkMTA["endCooldown"](),

    // // Withdraw MTA after cooldown
    // allow.mainnet.mstable_v2.stkMTA["withdraw"](
    //   undefined,
    //   AVATAR
    // ),

    // //---------------------------------------------------------------------------------------------------------------------------------
    // // Balancer
    // //---------------------------------------------------------------------------------------------------------------------------------

    // //---------------------------------------------------------------------------------------------------------------------------------
    // // Balancer - D2D + BAL
    // //---------------------------------------------------------------------------------------------------------------------------------
    // // ...allowErc20Approve([D2D, BAL], [balancer.VAULT]),

    // // Add Liquidity
    // {
    //   targetAddress: balancer.VAULT,
    //   signature:
    //     "joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
    //   params: {
    //     [0]: staticEqual(
    //       "0x8f4205e1604133d1875a3e771ae7e4f2b086563900020000000000000000010e",
    //       "bytes32"
    //     ), // Balancer PoolId
    //     [1]: staticEqual(AVATAR),
    //     [2]: staticEqual(AVATAR),
    //   },
    // },

    // // Withdraw Liquidity
    // {
    //   targetAddress: balancer.VAULT,
    //   signature:
    //     "exitPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
    //   params: {
    //     [0]: staticEqual(
    //       "0x8f4205e1604133d1875a3e771ae7e4f2b086563900020000000000000000010e",
    //       "bytes32"
    //     ), // Balancer PoolId
    //     [1]: staticEqual(AVATAR),
    //     [2]: staticEqual(AVATAR),
    //   },
    // },

    //---------------------------------------------------------------------------------------------------------------------------------
    // Compound V2
    //---------------------------------------------------------------------------------------------------------------------------------

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
    // Compound V3
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Compound V3 - USDC
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve([USDC], [compound_v3.cUSDCv3]),

    // Supply/Repay
    allow.mainnet.compound_v3.cUSDCv3["supply"](USDC),

    // Withdraw/Borrow
    allow.mainnet.compound_v3.cUSDCv3["withdraw"](USDC),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Compound V3 - Claiming of rewards
    //---------------------------------------------------------------------------------------------------------------------------------
    allow.mainnet.compound_v3.CometRewards["claim"](
      compound_v3.cUSDCv3,
      AVATAR
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Uniswap V3
    //---------------------------------------------------------------------------------------------------------------------------------

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
    // MAKER
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Maker - DSR (DAI Savings Rate)
    // The DsrManager provides an easy to use smart contract that allows service providers to deposit/withdraw dai into
    // the DSR contract pot, and activate/deactivate the Dai Savings Rate to start earning savings on a pool of dai in a single
    // function call.
    // https://docs.makerdao.com/smart-contract-modules/proxy-module/dsr-manager-detailed-documentation#contract-details
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve([DAI], [maker.DSR_MANAGER]),

    // Deposit
    allow.mainnet.maker.dsr_manager["join"](AVATAR),

    // Withdraw an specific amount
    allow.mainnet.maker.dsr_manager["exit"](AVATAR),

    // Withdraw all
    allow.mainnet.maker.dsr_manager["exitAll"](AVATAR),

    //---------------------------------------------------------------------------------------------------------------------------------
    // ROCKET POOL
    // Current Deployments: https://docs.rocketpool.net/overview/contracts-integrations.html
    // IMPORTANT: https://docs.rocketpool.net/developers/usage/contracts/contracts.html
    // RocketStorage contract: 0x1d8f8f00cfa6758d7bE78336684788Fb0ee0Fa46
    // The central hub of the network is the RocketStorage contract, which is responsible for storing the state of the
    // entire protocol. This is implemented through the use of maps for key-value storage, and getter and setter methods for
    // reading and writing values for a key.
    // The RocketStorage contract also stores the addresses of all other network contracts (keyed by name),
    // and restricts data modification to those contracts only.
    // Because of Rocket Pool's architecture, the addresses of other contracts should not be used directly but retrieved
    // from the blockchain before use. Network upgrades may have occurred since the previous interaction, resulting in
    // outdated addresses. RocketStorage can never change address, so it is safe to store a reference to it.
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve([rETH], [rocket_pool.SWAP_ROUTER]),

    // Deposit ETH in exchange for rETH
    allow.mainnet.rocket_pool.deposit_pool["deposit"]({
      send: true,
    }),

    // Withdraw ETH - Burns rETH in exchange for ETH
    allow.mainnet.rocket_pool.rETH["burn"](),

    // Swap ETH for rETH through SWAP_ROUTER - When there is not enough rETH on the DEPOSIT_POOL in exchange for the
    // ETH you are depositing, the SWAP_ROUTER swaps the ETH for rETH in secondary markets (Balancer and Uniswap).
    allow.mainnet.rocket_pool.swap_router["swapTo"](
      undefined,
      undefined,
      undefined,
      undefined,
      {
        send: true,
      }
    ),

    // Swap rETH for ETH through SWAP_ROUTER - When there is not enough ETH on the DEPOSIT_POOL in exchange for the
    // rETH you are withdrawing, the SWAP_ROUTER swaps the rETH for ETH in secondary markets (Balancer and Uniswap).
    allow.mainnet.rocket_pool.swap_router["swapFrom"](),

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
          [AAVE, COMP, DAI, rETH, rETH2, sETH2, SWISE, USDC, USDT, WBTC, WETH],
          "address"
        ),
        [1]: staticOneOf([DAI, sETH2, USDC, USDT, WBTC, WETH], "address"),
        [3]: staticEqual(AVATAR),
      },
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    // Swapping of COMP, rETH, WETH, wstETH in Balancer: https://dev.balancer.fi/guides/swaps/single-swaps
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

    // Swap rETH for WETH
    // ...allowErc20Approve([rETH], [balancer.VAULT]),
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
          "0x1e19cf2d73a72ef1332c882f20534b6519be0276000200000000000000000112",
          "bytes32"
        ), // rETH-WETH pool ID
        [8]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "bytes32"
        ), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
        [9]: staticEqual(rETH, "address"), // Asset in
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

    // Swap WETH for rETH
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
          "0x1e19cf2d73a72ef1332c882f20534b6519be0276000200000000000000000112",
          "bytes32"
        ), // rETH-WETH pool ID
        [8]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "bytes32"
        ), // enum SwapKind { GIVEN_IN, GIVEN_OUT } -> In this case GIVEN_IN
        [9]: staticEqual(WETH, "address"), // Asset in
        [10]: staticEqual(rETH, "address"), // Asset out
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

    //---------------------------------------------------------------------------------------------------------------------------------
    // Swap of COMP in SushiSwap
    //---------------------------------------------------------------------------------------------------------------------------------
    // ...allowErc20Approve(
    //   [COMP, DAI, USDC, USDT, WETH],
    //   [sushiswap.ROUTE_PROCESSOR_3_2]
    // ),

    allow.mainnet.sushiswap.route_processor_3_2["processRoute"](
      {
        oneOf: [COMP, DAI, USDC, USDT, WETH],
      },
      undefined,
      {
        oneOf: [DAI, USDC, USDT, WETH],
      },
      undefined,
      AVATAR
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Swapping of ETH and stETH in Curve
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([stETH], [curve.stETH_ETH_POOL]),
    // {
    //     targetAddress: curve.stETH_ETH_POOL,
    //     signature: "exchange(int128,int128,uint256,uint256)",
    //     send: true,
    // },
    // Exchange using ETH
    allow.mainnet.curve.steth_eth_pool["exchange"](
      undefined,
      undefined,
      undefined,
      undefined,
      {
        send: true,
      }
    ),

    // //---------------------------------------------------------------------------------------------------------------------------------
    // // Cowswap
    // //---------------------------------------------------------------------------------------------------------------------------------
    // // ...allowErc20Approve([AAVE, COMP, DAI, rETH, rETH2, sETH2, stETH, SWISE, USDC, USDT, WBTC, WETH, wstETH], [cowswap.GPv2_VAULT_RELAYER]),

    // allow.mainnet.cowswap.order_signer["signOrder"](
    //   {
    //     oneOf: [
    //       AAVE,
    //       COMP,
    //       DAI,
    //       rETH,
    //       rETH2,
    //       sETH2,
    //       stETH,
    //       SWISE,
    //       USDC,
    //       USDT,
    //       WBTC,
    //       WETH,
    //       wstETH,
    //     ],
    //   },
    //   {
    //     oneOf: [DAI, rETH, sETH2, stETH, USDC, USDT, WBTC, WETH, wstETH],
    //   },
    //   undefined,
    //   undefined,
    //   undefined,
    //   undefined,
    //   undefined,
    //   {
    //     lessThan: 2000,
    //   },
    //   undefined,
    //   undefined,
    //   undefined,
    //   undefined,
    //   {
    //     delegatecall: true,
    //   }
    // ),
  ],
  placeholders: { AVATAR },
} satisfies RolePreset

export default preset
