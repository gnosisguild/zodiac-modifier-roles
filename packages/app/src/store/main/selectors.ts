import { RootState } from "../index"
import { createSelector } from "@reduxjs/toolkit"

const getWeb3State = (state: RootState) => state.web3
const getRolesAppState = (state: RootState) => state.rolesApp

export const getChainId = createSelector(getWeb3State, (main) => main.chainId)
export const getConnectedAddress = createSelector(getWeb3State, (main) => main.connectedAddress)
export const getENS = createSelector(getWeb3State, (main) => main.ens)
export const getNetworkPickerDisabled = createSelector(getWeb3State, (main) => main.networkPickerDisabled)

export const getRolesModifierAddress = createSelector(getRolesAppState, (main) => main.rolesModifierAddress)
export const getRoles = createSelector(getRolesAppState, (main) => main.roles)
export const getRoleById = (roleId: string) =>
  createSelector(getRolesAppState, (main) => main.roles.find((role) => role.name === roleId))
export const getTransactionError = createSelector(getRolesAppState, (main) => main.transactionError)
export const getTransactionPending = createSelector(getRolesAppState, (main) => main.transactionPending)
