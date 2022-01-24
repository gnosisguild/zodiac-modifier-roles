import { RootState } from "../index"
import { createSelector } from "@reduxjs/toolkit"

const getWeb3State = (state: RootState) => state.web3

export const getChainId = createSelector(getWeb3State, (main) => main.chainId)
export const getSafeAddress = createSelector(getWeb3State, (main) => main.safeAddress)
export const getENS = createSelector(getWeb3State, (main) => main.ens)
export const getUserAddress = createSelector(getWeb3State, (main) => main.userAddress)
