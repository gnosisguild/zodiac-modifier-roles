import { Header } from "./views/Header/Header"
import { Outlet } from "react-router-dom"
import React from "react"
import { makeStyles } from "@material-ui/core"

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    minHeight: "100vh",
    padding: theme.spacing(3),
  },
}))

export const Root = () => {
  const classes = useStyles()
  return (
    <div className={classes.root}>
      <Header />
      <Outlet />
      {/*{!onboard.getState().address && <ConnectWallet onClick={startOnboard} />}*/}
    </div>
  )
}
