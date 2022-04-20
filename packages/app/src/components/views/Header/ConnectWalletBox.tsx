import { HeaderAddressBox } from "./HeaderAddressBox"
import { useRootSelector } from "../../../store"
import { getConnectedAddress } from "../../../store/main/selectors"
import { HeaderBox } from "./HeaderBox"
import { makeStyles, Typography } from "@material-ui/core"
import AddIcon from "@material-ui/icons/Add"
import { useWallet } from "../../../hooks/useWallet"

const useStyles = makeStyles((theme) => ({
  root: {
    cursor: "pointer",
  },
  title: {
    marginLeft: theme.spacing(1),
    color: "#D9D4AD",
  },
  icon: {
    color: "#D9D4AD",
  },
}))

export const ConnectWalletBox = () => {
  const classes = useStyles()
  const address = useRootSelector(getConnectedAddress)

  const { startOnboard } = useWallet()

  if (!address) {
    return (
      <HeaderBox onClick={startOnboard} icon={<AddIcon className={classes.icon} />} className={classes.root}>
        <Typography variant="body1" className={classes.title}>
          Connect Wallet
        </Typography>
      </HeaderBox>
    )
  }

  return <HeaderAddressBox address={address} emptyText="No Wallet Connected" />
}
