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
import { staticEqual } from "../../helpers/utils"

export const lidoExitStrategy1 = (): PresetAllowEntry[] => {
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

export const lidoExitStrategy2 = (): PresetAllowEntry[] => {
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

export const lidoExitStrategy3 = (): PresetAllowEntry[] => {
  return [
    ...allowErc20Approve([stETH], [lido.unstETH]),
    ...allowErc20Approve([stETH], [wstETH]),

    // Unwrap wstETH
    allow.mainnet.lido.wstETH["unwrap"](),

    // Request stETH Withdrawal - Locks your stETH in the queue. In exchange you receive an NFT, that represents your position
    // in the queue
    allow.mainnet.lido.unstETH["requestWithdrawals"](undefined, AVATAR),

    // Claim ETH - Once the request is finalized by the oracle report and becomes claimable,
    // this function claims your ether and burns the NFT
    allow.mainnet.lido.unstETH["claimWithdrawals"](),
  ]
}

export const lidoExitStrategy4 = (): PresetAllowEntry[] => {
  return [
    ...allowErc20Approve([stETH], [cowswap.GPv2_VAULT_RELAYER]),

    {
      targetAddress: cowswap.ORDER_SIGNER,
      signature:
        "signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)",
      params: {
        [0]: staticEqual(stETH, "address"),
        [1]: staticEqual(E_ADDRESS, "address"),
        [2]: staticEqual(AVATAR),
      },
      delegatecall: true,
    },
  ]
}

export const lidoExitStrategy5 = (): PresetAllowEntry[] => {
  return [
    ...allowErc20Approve([wstETH], [cowswap.GPv2_VAULT_RELAYER]),

    {
      targetAddress: cowswap.ORDER_SIGNER,
      signature:
        "signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)",
      params: {
        [0]: staticEqual(wstETH, "address"),
        [1]: staticEqual(E_ADDRESS, "address"),
        [2]: staticEqual(AVATAR),
      },
      delegatecall: true,
    },
  ]
}

export const lidoExitStrategyAll = (): PresetAllowEntry[] => {
  return [
    ...lidoExitStrategy1(),
    ...lidoExitStrategy2(),
    ...lidoExitStrategy3(),
    ...lidoExitStrategy4(),
    ...lidoExitStrategy5(),
  ]
}
