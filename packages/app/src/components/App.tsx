import React, { useEffect } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { useRootDispatch } from "../store"
import RolesView from "./views/RolesList/RolesView"
import { useQuery } from "../hooks/useQuery"
import { setChainId } from "../store/main/web3Slice"
import SafeAppsSDK from "@gnosis.pm/safe-apps-sdk"
import AttachRolesModifierModal from "./modals/AttachRolesModifierModal"
import { setRolesModifierAddress } from "../store/main/rolesSlice"
import RoleView from "./views/Role/RoleView"
import { Root } from "./Root"

export const App = (): React.ReactElement => {
  // const { startOnboard, onboard } = useWallet()

  return (
    <BrowserRouter>
      <StateTracker />
      <Routes>
        <Route path="/" element={<Root />}>
          <Route index element={<AttachRolesModifierModal onClose={() => {}} />} />
          <Route path=":module" element={<RolesView />} />
          <Route path=":module/roles/:roleId" element={<RoleView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

const StateTracker = () => {
  const query = useQuery()
  const chainId = query.get("chainId")
  const rolesModifierAddress = query.get("rolesModifierAddress")
  const dispatch = useRootDispatch()

  useEffect(() => {
    if (chainId) {
      const chainIdNumber = parseInt(chainId)
      if (chainIdNumber != null && !isNaN(chainIdNumber)) {
        dispatch(setChainId(chainIdNumber))
      } else {
        dispatch(setChainId(1)) // defaults to mainnet
      }
    } else {
      // try to get chainId from safe (if we are not in a safe that is okay too)
      const safeSDK = new SafeAppsSDK()
      safeSDK.safe.getChainInfo().then(({ chainId }) => {
        const chainIdNumber = chainId != null ? parseInt(chainId) : null
        if (chainIdNumber != null) {
          dispatch(setChainId(chainIdNumber))
          console.log("chainIdNumber", chainIdNumber)
        }
      })
    }
  }, [chainId, dispatch])

  useEffect(() => {
    if (rolesModifierAddress != null) {
      dispatch(setRolesModifierAddress(rolesModifierAddress))
    }
  }, [rolesModifierAddress, dispatch])

  return null
}

export default App
