import { hashMessage } from "ethers/lib/utils"
import { stat } from "fs"
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

//AAVE contracts
const stkAAVE = "0x4da27a545c0c5B758a6BA100e3a049001de870f5"

//Compound V2 contracts
const COMPTROLLER = "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b"
const cUSDC = "0x39AA39c021dfbaE8faC545936693aC917d5E7563"
const cAAVE = "0xe65cdB6479BaC1e22340E4E755fAE7E509EcD06c"
const cDAI = "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"

//Idle contracts
const IDLE_wstETH_AA_GAUGE = "0x675eC042325535F6e176638Dd2d4994F645502B9"
const IDLE_DISTRIBUTOR_PROXY = "0x074306bc6a6fc1bd02b425dd41d742adf36ca9c6"

//Uniswap V3 contracts
const UV3_NFT_POSITIONS = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"

//mStable
const stMTA = "0x8f2326316eC696F6d023E37A9931c2b2C177a3D7"

//Stakewise contracts
const STAKEWISE_MERKLE_DIS = "0xA3F21010e8b9a3930996C8849Df38f9Ca3647c20"
const rETH2 = "0x20BC832ca081b91433ff6c17f85701B6e92486c5"
const SWISE = "0x48C3399719B582dD63eB5AADf12A40B4C3f52FA2"

const preset: RolePreset = {
  network: 1,
  allow: [
    //---------------------------------------------------------------------------------------------------------------------------------
    //Staking of AAVE in Safety Module
    //---------------------------------------------------------------------------------------------------------------------------------

    {
      targetAddress: stkAAVE,
      signature: "claimRewards(address,uint256)",
      params: {
        [0]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

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
    //Idle - Deposit stETH and stake it on "Lido - stETH - Senior Tranche"
    //---------------------------------------------------------------------------------------------------------------------------------

    //Claim LIDO
    {
      targetAddress: IDLE_wstETH_AA_GAUGE,
      signature: "claim_rewards()",
    },
    //Claim IDLE
    {
      targetAddress: IDLE_DISTRIBUTOR_PROXY,
      signature: "distribute(address)",
      params: {
        [0]: staticEqual(IDLE_wstETH_AA_GAUGE, "address"),
      },
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    //Uniswap V3 - WBTC + ETH, Range: 11.786 - 15.082. Fee: 0.3%.
    //---------------------------------------------------------------------------------------------------------------------------------

    {
      targetAddress: UV3_NFT_POSITIONS,
      signature: "collect((uint256,address,uint128,uint128))",
      params: {
        [1]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    //mStable - staking of MTA
    //---------------------------------------------------------------------------------------------------------------------------------

    //Claim rewards without compounding
    {
      targetAddress: stMTA,
      signature: "claimRewards()",
    },

    //Claim compounding rewards, i.e. MTA claimed rewards are immediately staked
    {
      targetAddress: stMTA,
      signature: "compoundRewards()",
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    //Stakewise
    //---------------------------------------------------------------------------------------------------------------------------------

    {
      targetAddress: STAKEWISE_MERKLE_DIS,
      signature: "claim(uint256,address,address[],uint256[],bytes32[])",
      params: {
        [1]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
        [2]: dynamic32Equal([rETH2, SWISE], "address[]"),
      },
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    //Stakewise - UniswapV3 ETH + sETH2, 0.3%
    //---------------------------------------------------------------------------------------------------------------------------------

    //collect has already been whitelisted

    /*
    {
      targetAddress: UV3_NFT_POSITIONS,
      signature: "collect((uint256,address,uint128,uint128))",
      params: {
        [1]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    
    */
  ],
}
export default preset
