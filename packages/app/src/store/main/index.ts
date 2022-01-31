import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { Web3State } from "./models"
import { BigNumber, ethers } from "ethers"
import { getNetworkName, NETWORK } from "../../utils/networks"

const ethereum = (window as any).ethereum
let initialChainId
try {
  const chainId: BigNumber | undefined = ethereum && ethereum.chainId && ethers.BigNumber.from(ethereum.chainId)
  if (chainId && getNetworkName(chainId.toNumber())) {
    initialChainId = chainId.toNumber()
  }
} catch (err) {}

const web3InitialState: Web3State = {
  chainId: initialChainId || NETWORK.MAINNET,
  safeAddress: "",
  ens: "",
}

export const web3Slice = createSlice({
  name: "web3",
  initialState: web3InitialState,
  reducers: {
    setSafeAddress(state, action: PayloadAction<string>) {
      state.safeAddress = action.payload
    },
    setChainId(state, action: PayloadAction<number>) {
      state.chainId = action.payload
    },
    setENS(state, action: PayloadAction<string>) {
      state.ens = action.payload
    },
    resetSafeAddress(state) {
      state.safeAddress = ""
      state.ens = ""
    },
    setUserAddress(state, action: PayloadAction<string>) {
      state.userAddress = action.payload
    },
  },
})

export const { setChainId, setENS, setSafeAddress, resetSafeAddress, setUserAddress } = web3Slice.actions
