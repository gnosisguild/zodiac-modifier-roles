import React from "react"
import { Header } from "./Header"
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom"
import { Grid, makeStyles } from "@material-ui/core"
import { useWallet } from "../hooks/useWallet"
import ConnectWallet from "./ConnectWallet"
import RolesView from "./RolesView"

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    minHeight: "100vh",
    padding: theme.spacing(3),
  },
  container: {
    border: "1px solid rgba(217, 212, 173, 0.3)",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    padding: theme.spacing(2),
    position: "relative",
    "&::before": {
      content: '" "',
      position: "absolute",
      zIndex: 1,
      inset: 3,
      border: "1px solid rgba(217, 212, 173, 0.3)",
      pointerEvents: "none",
    },
  },
}))

export const App = (): React.ReactElement => {
  const classes = useStyles()
  const { startOnboard, onboard } = useWallet()

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <div className={classes.root}>
              <Header />
              <Grid container spacing={1} className={classes.container}>
                <Outlet />
              </Grid>
              {!onboard.getState().address && <ConnectWallet onClick={startOnboard} />}
            </div>
          }
        >
          <Route path="/" element={<RolesView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
