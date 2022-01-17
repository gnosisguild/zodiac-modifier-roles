import { NETWORK } from "../../utils/networks";

export interface Web3State {
  chainId: NETWORK;
  wallet?: string;
  ens?: string;
}
