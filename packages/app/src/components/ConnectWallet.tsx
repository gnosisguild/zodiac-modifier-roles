import { Button, ButtonProps, makeStyles } from "@material-ui/core"
import React from "react"

const useStyles = makeStyles((theme) => ({
  connectWallet: {
    position: "absolute",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 1,
    backgroundColor: "rgba(217, 212, 173, 0.3)",
    backdropFilter: "blur(4px)",
  },
}))
interface ConnectWalletProps {
  onClick?: ButtonProps["onClick"]
}

const ConnectWallet = ({ onClick }: ConnectWalletProps) => {
  const classes = useStyles()
  return (
    <div className={classes.connectWallet}>
      <Button size="large" variant="contained" color="secondary" onClick={onClick}>
        Connect Wallet
      </Button>
    </div>
  )
}

export default ConnectWallet
