import Onboard from "bnc-onboard"
import { ethers } from "ethers"
import { REDUX_STORE, useRootSelector } from "../store"
import { resetConnectedAddress, setENS, setConnectedAddress } from "../store/main"
import { useEffect, useMemo, useState } from "react"
import { getChainId, getConnectedAddress } from "../store/main/selectors"
import { getNetworkRPC } from "../utils/networks"
import memoize from "lodash.memoize"

const ONBOARD_JS_DAPP_ID = process.env.REACT_APP_ONBOARD_JS_DAPP_ID
const INFURA_KEY = process.env.REACT_APP_INFURA_KEY

let _provider: ethers.providers.JsonRpcProvider | undefined

const configureOnboardJS = memoize(
  (networkId: number) => {
    const rpcUrl = getNetworkRPC(networkId)
    _provider = new ethers.providers.JsonRpcProvider(rpcUrl, networkId)

    const wallets = [
      { walletName: "gnosis", preferred: true },
      { walletName: "metamask", preferred: true },
      { walletName: "coinbase", preferred: true },
      { walletName: "ledger", rpcUrl: rpcUrl, preferred: true },
      { walletName: "walletConnect", infuraKey: INFURA_KEY, preferred: true },
      { walletName: "opera" },
      { walletName: "operaTouch" },
    ]

    return Onboard({
      networkId,
      dappId: ONBOARD_JS_DAPP_ID,
      darkMode: true,
      subscriptions: {
        wallet: (wallet) => {
          if (wallet.provider) {
            _provider = new ethers.providers.Web3Provider(wallet.provider)
          }
        },
        address(address) {
          if (address) {
            REDUX_STORE.dispatch(setConnectedAddress(address))
          } else {
            REDUX_STORE.dispatch(resetConnectedAddress())
          }
        },
        ens(ens) {
          if (ens && ens.name) {
            REDUX_STORE.dispatch(setENS(ens.name))
          }
        },
      },
      walletSelect: {
        wallets,
      },
      walletCheck: [
        { checkName: "derivationPath" },
        { checkName: "accounts" },
        { checkName: "connect" },
        { checkName: "network" },
      ],
    })
  },
  (chainId) => chainId.toString(),
)

export const useWallet = () => {
  const chainId = useRootSelector(getChainId)
  const wallet = useRootSelector(getConnectedAddress)

  const onboard = useMemo(() => configureOnboardJS(chainId), [chainId])
  const [provider, setProvider] = useState(_provider)

  const startOnboard = async () => {
    try {
      const selected = await onboard.walletSelect()
      if (selected) {
        await onboard.walletCheck()
        setProvider(_provider)
      }
    } catch (err) {
      console.warn("startOnboard error", err)
    }
  }

  useEffect(() => {
    if (_provider) setProvider(_provider)
  }, [chainId, wallet])

  return { provider, onboard, startOnboard }
}
