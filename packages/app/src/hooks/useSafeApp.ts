import { useRootDispatch } from "../store"
import { useEffect } from "react"
import SafeAppsSDK from "@gnosis.pm/safe-apps-sdk"
import { setChainId, setNetworkPickerDisabled } from "../store/main/web3Slice"

export const useSafeApp = () => {
  const dispatch = useRootDispatch()

  useEffect(() => {
    // try to get chainId from safe (if we are not in a safe that is okay too)
    const safeSDK = new SafeAppsSDK()
    safeSDK.safe
      .getChainInfo()
      .then(({ chainId }) => {
        const chainIdNumber = chainId != null ? parseInt(chainId) : null
        if (chainIdNumber != null) {
          dispatch(setChainId(chainIdNumber))
          // Block the user to change the current network
          dispatch(setNetworkPickerDisabled(true))
          console.info("[chain-picker] chain set to gnosis safe's chain: ", chainIdNumber)
        }
      })
      .catch(console.warn)
  }, [dispatch])
}
