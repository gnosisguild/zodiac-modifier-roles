import { Role } from "../../typings/role"
import { NETWORK } from "../../utils/networks"

export interface Web3State {
  chainId: NETWORK
  connectedAddress?: string
  ens?: string
}

export interface RolesAppState {
  rolesModifierAddress?: string
  roles: Role[]
}
