import { NETWORK } from "../../utils/networks"

export interface Web3State {
  chainId: NETWORK
  safeAddress?: string
  ens?: string
  userAddress?: string
}
