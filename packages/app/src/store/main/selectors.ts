import { RootState } from "../index";
import { createSelector } from "@reduxjs/toolkit";

const getWeb3State = (state: RootState) => state.web3;

export const getChainId = createSelector(getWeb3State, (main) => main.chainId);
export const getWalletAddress = createSelector(
  getWeb3State,
  (main) => main.wallet
);
export const getENS = createSelector(getWeb3State, (main) => main.ens);
