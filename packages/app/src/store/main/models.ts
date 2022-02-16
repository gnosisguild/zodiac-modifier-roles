import { Role } from "../../typings/role"
import { Network } from "../../utils/networks"

export interface Web3State {
  chainId: Network
  connectedAddress?: string
  ens?: string
  networkPickerDisabled: boolean
}

export interface RolesAppState {
  rolesModifierAddress?: string
  roles: Role[]
  transactions: any[]
  transactionPending: boolean
  transactionError: string
}
