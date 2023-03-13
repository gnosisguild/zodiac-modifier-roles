import { ExecutionOptions } from "../../types"
import { allowCurvePool } from "../helpers/curve"
import { allowErc20Approve } from "../helpers/erc20"
import { allowLido } from "../helpers/lido"
import {
  dynamic32Equal,
  dynamicEqual,
  staticEqual,
  subsetOf,
} from "../helpers/utils"
import { AVATAR } from "../placeholders"
import { RolePreset } from "../types"

//Compound V2 contracts
const COMPTROLLER = "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b"
const cUSDC = "0x39AA39c021dfbaE8faC545936693aC917d5E7563"
const cDAI = "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"

//Stakewise contracts
const STAKEWISE_MERKLE_DIS = "0xA3F21010e8b9a3930996C8849Df38f9Ca3647c20"
const rETH2 = "0x20BC832ca081b91433ff6c17f85701B6e92486c5"
const SWISE = "0x48C3399719B582dD63eB5AADf12A40B4C3f52FA2"

//Uniswap V3 contracts
const UV3_NFT_POSITIONS = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"

//Curve contracts
const CURVE_stETH_ETH_GAUGE = "0x182B723a58739a9c974cFDB385ceaDb237453c28"
const CRV_MINTER = "0xd061D61a4d941c39E5453435B6345Dc261C2fcE0"

//Aura contracts
const AURA_BALANCER_stETH_VAULT = "0xe4683Fe8F53da14cA5DAc4251EaDFb3aa614d528"

const preset = {
  network: 1,
  allow: [
    //---------------------------------------------------------------------------------------------------------------------------------
    //Compound V2 - Claiming of rewards
    //---------------------------------------------------------------------------------------------------------------------------------
    {
      targetAddress: COMPTROLLER,
      signature: "claimComp(address,address[])",
      params: {
        [0]: staticEqual(AVATAR),
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

    {
      targetAddress: STAKEWISE_MERKLE_DIS,
      signature: "claim(uint256,address,address[],uint256[],bytes32[])",
      params: {
        [1]: staticEqual(AVATAR),
        [2]: dynamic32Equal([rETH2, SWISE], "address[]"),
      },
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    //Stakewise - UniswapV3 ETH + sETH2, 0.3%
    //---------------------------------------------------------------------------------------------------------------------------------

    {
      targetAddress: UV3_NFT_POSITIONS,
      signature: "collect((uint256,address,uint128,uint128))",
      params: {
        [1]: staticEqual(AVATAR),
      },
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    //Curve - stETH/ETH
    //---------------------------------------------------------------------------------------------------------------------------------

    {
      targetAddress: CURVE_stETH_ETH_GAUGE,
      signature: "claim_rewards(address)",
      params: {
        [0]: staticEqual(AVATAR),
      },
    },
    {
      targetAddress: CRV_MINTER,
      signature: "mint(address)",
      params: {
        // [0]: staticEqual(AVATAR),
        [0]: staticEqual(CURVE_stETH_ETH_GAUGE, "address"),
      },
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    //AURA wstETH-ETH
    //---------------------------------------------------------------------------------------------------------------------------------
    {
      targetAddress: AURA_BALANCER_stETH_VAULT,
      signature: "getReward()",
    },
  ],
  placeholders: { AVATAR },
} satisfies RolePreset

export default preset
