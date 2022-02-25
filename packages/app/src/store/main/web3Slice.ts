import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { Web3State } from "./models"
import { BigNumber, ethers } from "ethers"
import { getNetwork, Network } from "../../utils/networks"

const ethereum = (window as any).ethereum
let initialChainId
try {
  const chainId: BigNumber | undefined = ethereum && ethereum.chainId && ethers.BigNumber.from(ethereum.chainId)
  if (chainId && getNetwork(chainId.toNumber())) {
    initialChainId = chainId.toNumber()
  }
} catch (err) {}

const web3InitialState: Web3State = {
  chainId: initialChainId || Network.MAINNET,
  connectedAddress: "",
  ens: "",
  networkPickerDisabled: false,
}

export const web3Slice = createSlice({
  name: "web3",
  initialState: web3InitialState,
  reducers: {
    setConnectedAddress(state, action: PayloadAction<string>) {
      state.connectedAddress = action.payload
    },
    setChainId(state, action: PayloadAction<number>) {
      console.log("chain is set to:" + action.payload)
      state.chainId = action.payload
    },
    setENS(state, action: PayloadAction<string>) {
      state.ens = action.payload
    },
    resetConnectedAddress(state) {
      state.connectedAddress = ""
      state.ens = ""
    },
    setNetworkPickerDisabled(state, action: PayloadAction<boolean>) {
      state.networkPickerDisabled = action.payload
    },
  },
})

export const { setChainId, setENS, setConnectedAddress, resetConnectedAddress, setNetworkPickerDisabled } =
  web3Slice.actions
