import Onboard from "bnc-onboard"
import { ethers } from "ethers"
import { REDUX_STORE, useRootSelector } from "../store"
import { useEffect, useMemo, useState } from "react"
import { getChainId } from "../store/main/selectors"
import SafeAppsSDK from "@gnosis.pm/safe-apps-sdk"
import { getNetworkRPC } from "../utils/networks"
import memoize from "lodash.memoize"
import { useParams } from "react-router-dom"
import { getAddress } from "../utils/address"
import { ExternalProvider } from "@ethersproject/providers"
import { resetConnectedAddress, setChainId, setConnectedAddress, setENS } from "../store/main/web3Slice"
import { WalletType } from "../services/rolesModifierContract"

const ONBOARD_JS_DAPP_ID = process.env.REACT_APP_ONBOARD_JS_DAPP_ID
const INFURA_KEY = process.env.REACT_APP_INFURA_KEY

export let _signer: ethers.providers.JsonRpcSigner

const safeSDK = new SafeAppsSDK()
safeSDK.safe
  .getChainInfo()
  .then(async (chainInfo) => {
    REDUX_STORE.dispatch(setChainId(parseInt(chainInfo.chainId)))
  })
  .catch(console.warn)

const configureOnboardJS = memoize(
  (networkId: number) => {
    const rpcUrl = getNetworkRPC(networkId)
    const wallets = [
      { walletName: "metamask", preferred: true },
      { walletName: "gnosis", preferred: true },
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
            setProvider(wallet.provider)
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
  const _chainId = useRootSelector(getChainId)
  const { account } = useParams()

  const chainId = useMemo(() => {
    if (account) {
      const address = getAddress(account)
      if (address && address.chainId) return address.chainId
    }
    return _chainId
  }, [_chainId, account])

  const onboard = useMemo(() => configureOnboardJS(chainId), [chainId])
  const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider>()
  const [signer, setSigner] = useState<ethers.Signer>(_signer)

  const startOnboard = async () => {
    try {
      const selected = await onboard.walletSelect()
      if (selected) {
        await onboard.walletCheck()
        setSigner(_signer)
      }
    } catch (err) {
      console.warn("startOnboard error", err)
    }
  }

  useEffect(() => {
    const rpcUrl = getNetworkRPC(chainId)
    const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl, chainId)
    setProvider(provider)
  }, [chainId])

  const walletType = onboard.getState().wallet.name === "Gnosis Safe" ? WalletType.GNOSIS_SAFE : WalletType.INJECTED

  return { provider, signer, onboard, startOnboard, walletType }
}

export function setProvider(provider: ExternalProvider) {
  const web3Provider = new ethers.providers.Web3Provider(provider)
  _signer = web3Provider.getSigner()
  return _signer
}
