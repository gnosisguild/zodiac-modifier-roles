import { NETWORK } from "../../utils/networks"

export interface Web3State {
  chainId: NETWORK
  connectedAddress?: string
  ens?: string
}
