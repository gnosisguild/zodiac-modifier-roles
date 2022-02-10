import { useRootDispatch } from "../store"
import { useEffect } from "react"
import SafeAppsSDK from "@gnosis.pm/safe-apps-sdk"
import { setChainId } from "../store/main/web3Slice"

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
          console.log("chainIdNumber", chainIdNumber)
        }
      })
      .catch(console.warn)
  }, [dispatch])
}
