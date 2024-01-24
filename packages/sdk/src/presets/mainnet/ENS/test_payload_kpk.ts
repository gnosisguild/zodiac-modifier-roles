import {
  ZERO_ADDRESS,
  aura,
  balancer,
  cowswap
} from "../addresses"
import { staticEqual, staticOneOf } from "../../helpers/utils"
import { allowErc20Approve } from "../../helpers/erc20"
import { lidoExitStrategy1 } from "../../helpers/ExitStrategies/LidoExitStrategies"
import { auraExitStrategy2 } from "../../helpers/ExitStrategies/AuraExitStrategies"
import { AVATAR } from "../../placeholders"
import { RolePreset } from "../../types"
import { allow } from "../../allow"

const preset = {
  network: 1,
  allow: [
    //---------------------------------------------------------------------------------------------------------------------------------
    // Lido
    //---------------------------------------------------------------------------------------------------------------------------------
    ...lidoExitStrategy1(),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura wstETH/WETH  + Balancer wstETH/WETH
    //---------------------------------------------------------------------------------------------------------------------------------

    ...auraExitStrategy2(
      aura.auraB_stETH_STABLE_REWARDER,
      balancer.B_stETH_STABLE_pId
    ),

    // allow.mainnet.lido.stETH["submit"](ZERO_ADDRESS, {
    //   send: true,
    // }),

    // //---------------------------------------------------------------------------------------------------------------------------------
    // // BALANCER
    // //---------------------------------------------------------------------------------------------------------------------------------

    // //---------------------------------------------------------------------------------------------------------------------------------
    // // Balancer - wstETH/WETH pool
    // //---------------------------------------------------------------------------------------------------------------------------------
    // // Unstake
    // allow.mainnet.balancer.B_stETH_stable_gauge["withdraw(uint256)"](),

    // //---------------------------------------------------------------------------------------------------------------------------------
    // // Cowswap
    // //---------------------------------------------------------------------------------------------------------------------------------

    // {
    //   targetAddress: cowswap.ORDER_SIGNER,
    //   signature:
    //     "signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)",
    //   params: {
    //     [2]: staticEqual(AVATAR),
    //   },
    //   delegatecall: true,
    // },
  ],
  placeholders: { AVATAR },
} satisfies RolePreset

export default preset
