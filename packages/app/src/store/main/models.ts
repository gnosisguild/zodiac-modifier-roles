import { NETWORK } from "../../utils/networks"

export interface Web3State {
  chainId: NETWORK
  rolesModifierAddress?: string
  connectedAddress?: string
  ens?: string
}
