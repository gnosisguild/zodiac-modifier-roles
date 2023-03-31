import {
    rETH2, SWISE,
    compound_v2,
    uniswapv3
} from "../addresses"
import {
    staticEqual,
} from "../../helpers/utils"
import { AVATAR } from "../../placeholders"
import { RolePreset } from "../../types"
import { allow } from "../../allow"


const preset = {
    network: 1,
    allow: [

        //---------------------------------------------------------------------------------------------------------------------------------
        // Staking of AAVE in Safety Module
        //---------------------------------------------------------------------------------------------------------------------------------

        // {
        //   targetAddress: stkAAVE,
        //   signature: "claimRewards(address,uint256)",
        //   params: {
        //     [0]: staticEqual(AVATAR),
        //   },
        // },
        allow.mainnet.aave.stkAave["claimRewards"](
            AVATAR
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Compound V2 - USDC
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
        allow.mainnet.compound.comptroller["claimComp(address,address[])"](
            AVATAR,
            {
                subsetOf: [compound_v2.cAAVE, compound_v2.cDAI, compound_v2.cUSDC].map((address) => address.toLowerCase()).sort(), // compound app will always pass tokens in ascending order
                restrictOrder: true,
            }
        ),

        //---------------------------------------------------------------------------------------------------------------------------------
        // Uniswap V3 - WBTC + WETH, Range: 11.786 - 15.082. Fee: 0.3%.
        //---------------------------------------------------------------------------------------------------------------------------------

        // collect collects token0Owed and token1Owed. The address argument could also be the zero address, which is used to collect ETH
        // instead of WETH. In this case, the tokens (one of them WETH) are first sent to the NFT Positions contract, and have to then be
        // claimed by calling unwrapWETH9 and sweepToken. Since this is not safe non-custodial wise, we are only allowing the collecting
        // of ETH instead of WETH
        {
            targetAddress: uniswapv3.POSITIONS_NFT,
            signature: "collect((uint256,address,uint128,uint128))",
            params: {
                [1]: staticEqual(AVATAR),
            },
        },

        // If ETH is collected instead of WETH, one has to call the unwrapWETH9 and sweepToken functions, but we are only allowing for the collecting of WETH.

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
        allow.mainnet.stakewise.merkle_distributor["claim"](
            undefined,
            AVATAR,
            [rETH2, SWISE]
        ),

        // The exactInputSingle is needed for the reinvest option, which swaps rETH2 for sETH2 in the Uniswap V3 pool.
        // But as of now it is not considered within the strategy scope
    ],
    placeholders: { AVATAR },
} satisfies RolePreset

export default preset
