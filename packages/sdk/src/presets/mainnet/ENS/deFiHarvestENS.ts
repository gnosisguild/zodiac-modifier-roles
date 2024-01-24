import { allow } from "../../allow"
import { staticEqual } from "../../helpers/utils"
import { AVATAR } from "../../placeholders"
import { RolePreset } from "../../types"
import {
  rETH2,
  SWISE,
  balancer,
  compound_v2,
  compound_v3,
  curve,
  uniswapv3,
} from "../addresses"

const preset = {
  network: 1,
  allow: [
    //---------------------------------------------------------------------------------------------------------------------------------
    // Compound V2
    //---------------------------------------------------------------------------------------------------------------------------------

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
        subsetOf: [compound_v2.cDAI, compound_v2.cUSDC]
          .map((address) => address.toLowerCase())
          .sort(), // compound app will always pass tokens in ascending order
        restrictOrder: true,
      }
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Compound V3
    //---------------------------------------------------------------------------------------------------------------------------------
    //---------------------------------------------------------------------------------------------------------------------------------
    // Compound V3 - Claiming of rewards
    //---------------------------------------------------------------------------------------------------------------------------------
    allow.mainnet.compound_v3.CometRewards["claim"](
      compound_v3.cUSDCv3,
      AVATAR
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Stakewise
    //---------------------------------------------------------------------------------------------------------------------------------

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
    // Stakewise - UniswapV3 ETH + sETH2, 0.3%
    //---------------------------------------------------------------------------------------------------------------------------------

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

    // If ETH is collected instead of WETH, one has to call the unwrapWETH9 and sweepToken functions
    // allow.mainnet.uniswapv3.positions_nft["unwrapWETH9"](
    //     undefined,
    //     AVATAR
    // ),

    // allow.mainnet.uniswapv3.positions_nft["sweepToken"](
    //     sETH2,
    //     undefined,
    //     AVATAR
    // ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // CURVE
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Curve - ETH/stETH
    //---------------------------------------------------------------------------------------------------------------------------------

    // Claim LDO Rewards
    allow.mainnet.curve.steth_eth_gauge["claim_rewards()"](),

    //Claim CRV Rewards
    allow.mainnet.curve.crv_minter["mint"](curve.stETH_ETH_GAUGE),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Curve - cDAI/cUSDC
    //---------------------------------------------------------------------------------------------------------------------------------

    // Claim CRV Rewards - This pool gauge does not grant any rewards
    allow.mainnet.curve.crv_minter["mint"](curve.cDAIcUSDC_GAUGE),

    //---------------------------------------------------------------------------------------------------------------------------------
    // AURA
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // AURA - wstETH/WETH
    //---------------------------------------------------------------------------------------------------------------------------------

    // {
    //   targetAddress: auraB_stETH_STABLE_REWARDER,
    //   signature: "getReward()",
    // },
    allow.mainnet.aura.auraB_stETH_stable_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura - bb-aV3-USDT/bb-aV3-USDC/bb-aV3-DAI (Boosted Aave V3 Pool)
    //---------------------------------------------------------------------------------------------------------------------------------

    allow.mainnet.aura.aurabb_aV3_USD_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura - rETH/WETH
    //---------------------------------------------------------------------------------------------------------------------------------
    // {
    //   targetAddress: auraB_rETH_STABLE_REWARDER,
    //   signature: "getReward()",
    // },
    allow.mainnet.aura.auraB_rETH_stable_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // BALANCER
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer - wstETH/WETH pool
    //---------------------------------------------------------------------------------------------------------------------------------

    // Claim Rewards
    allow.mainnet.balancer.B_stETH_stable_gauge["claim_rewards()"](),

    // Claim BAL Rewards
    allow.mainnet.balancer.BAL_minter["mint"](balancer.B_stETH_STABLE_GAUGE),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer - rETH/WETH pool
    //---------------------------------------------------------------------------------------------------------------------------------

    // Claim Rewards
    allow.mainnet.balancer.B_rETH_stable_gauge["claim_rewards()"](),

    // Claim BAL Rewards
    allow.mainnet.balancer.BAL_minter["mint"](balancer.B_rETH_STABLE_GAUGE),

    //---------------------------------------------------------------------------------------------------------------------------------
    // CONVEX
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Convex - ETH/stETH
    //---------------------------------------------------------------------------------------------------------------------------------

    // Claim Rewards
    allow.mainnet.convex.cvxsteCRV_rewarder["getReward(address,bool)"](AVATAR),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Convex - cDAI/cUSDC
    //---------------------------------------------------------------------------------------------------------------------------------

    // Claim Rewards
    allow.mainnet.convex.cvxcDAIcUSDC_rewarder["getReward(address,bool)"](
      AVATAR
    ),
  ],
  placeholders: { AVATAR },
} satisfies RolePreset

export default preset
