import React, { useEffect } from "react"
import { Header } from "./Header"
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom"
import { makeStyles } from "@material-ui/core"
import { useWallet } from "../hooks/useWallet"
import { useRootDispatch, useRootSelector } from "../store"
import ConnectWallet from "./ConnectWallet"
import RolesView from "./RolesView"
import { useQuery } from "../hooks/useQuery"
import { setChainId } from "../store/main/web3Slice"
import SafeAppsSDK from "@gnosis.pm/safe-apps-sdk"
import AttachRolesModifierModal from "./AttachRolesModifierModal"
import { ethers } from "ethers"
import { getRolesModifierAddress } from "../store/main/selectors"
import { setRolesModifierAddress } from "../store/main/rolesSlice"
import RoleView from "./RoleView"

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    minHeight: "100vh",
    padding: theme.spacing(3),
  },
}))

export const App = (): React.ReactElement => {
  const classes = useStyles()
  const { startOnboard, onboard } = useWallet()
  const rolesModifierAddress = useRootSelector(getRolesModifierAddress)

  return (
    <BrowserRouter>
      <StateTracker />
      <Routes>
        <Route
          path="/"
          element={
            <div className={classes.root}>
              <Header />
              <Outlet />
              {!onboard.getState().address && <ConnectWallet onClick={startOnboard} />}
              {rolesModifierAddress == null ||
                (!ethers.utils.isAddress(rolesModifierAddress) && <AttachRolesModifierModal onClose={() => {}} />)}
            </div>
          }
        >
          <Route path="/roles/:roleId" element={<RoleView />} />
          <Route path="/" element={<RolesView />} />
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
