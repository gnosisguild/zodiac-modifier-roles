import { PresetAllowEntry } from "../../types"
import { allow } from "../../allow"
import { AVATAR } from "../../placeholders"
import { allowErc20Approve } from "../../helpers/erc20"
import {
  cowswap,
  E_ADDRESS,
  stETH,
  wstETH,
  lido,
} from "../../mainnet/addresses"

export const lidoExitStrategy1 = (): PresetAllowEntry[] => {
  return [allow.mainnet.lido.wstETH["unwrap"]()]
}

export const lidoExitStrategy2 = (): PresetAllowEntry[] => {
  return [
    ...allowErc20Approve([stETH], [lido.unstETH]),

    // Request stETH Withdrawal - Locks your stETH in the queue. In exchange you receive an NFT, that represents your position
    // in the queue
    allow.mainnet.lido.unstETH["requestWithdrawals"](undefined, AVATAR),

    // Claim ETH - Once the request is finalized by the oracle report and becomes claimable,
    // this function claims your ether and burns the NFT
    allow.mainnet.lido.unstETH["claimWithdrawals"](),
  ]
}

export const lidoExitStrategy3 = (): PresetAllowEntry[] => {
  return [
    ...allowErc20Approve([wstETH], [lido.unstETH]),

    // Request wstETH Withdrawal - Transfers the wstETH to the unstETH to be burned in exchange for stETH. Then it locks your stETH
    // in the queue. In exchange you receive an NFT, that represents your position in the queue
    allow.mainnet.lido.unstETH["requestWithdrawalsWstETH"](undefined, AVATAR),

    // Claim ETH - Once the request is finalized by the oracle report and becomes claimable,
    // this function claims your ether and burns the NFT
    allow.mainnet.lido.unstETH["claimWithdrawals"](),
  ]
}

export const lidoExitStrategy4 = (): PresetAllowEntry[] => {
  return [
    ...allowErc20Approve([stETH], [cowswap.GPv2_VAULT_RELAYER]),

    allow.mainnet.cowswap.order_signer["signOrder"](
      stETH,
      E_ADDRESS,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        delegatecall: true,
      }
    ),
  ]
}

export const lidoExitStrategy5 = (): PresetAllowEntry[] => {
  return [
    ...allowErc20Approve([wstETH], [cowswap.GPv2_VAULT_RELAYER]),

    allow.mainnet.cowswap.order_signer["signOrder"](
      wstETH,
      E_ADDRESS,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        delegatecall: true,
      }
    ),
  ]
}
