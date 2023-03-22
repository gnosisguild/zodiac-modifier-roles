import { HeaderAddressBox } from "./HeaderAddressBox"
import { useRootSelector } from "../../../store"
import { getConnectedAddress } from "../../../store/main/selectors"
import { HeaderBox } from "./HeaderBox"
import { Box, Button, makeStyles, Typography } from "@material-ui/core"
import AddIcon from "@material-ui/icons/Add"
import { useWallet } from "../../../hooks/useWallet"
import { useState } from "react"
import { WalletType } from "../../../services/rolesModifierContract"

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
  connectWalletBoxContainer: {
    position: "relative",
    marginLeft: 16,
    zIndex: 1,
  },
  connectWalletBoxMenu: {
    position: "absolute",
    bottom: -50,
    width: "100%",
  },
}))

export const ConnectWalletBox = () => {
  const classes = useStyles()
  const address = useRootSelector(getConnectedAddress)
  const { startOnboard, onboard, walletType } = useWallet()
  const [showWalletOption, setShowWalletOption] = useState<boolean>(false)
  if (!address) {
    return (
      <HeaderBox onClick={startOnboard} icon={<AddIcon className={classes.icon} />} className={classes.root}>
        <Typography variant="body1" className={classes.title}>
          Connect Wallet
        </Typography>
      </HeaderBox>
    )
  }

  return (
    <Box className={classes.connectWalletBoxContainer}>
      <HeaderAddressBox
        address={address}
        emptyText="No Wallet Connected"
        onClick={walletType !== WalletType.GNOSIS_SAFE ? () => setShowWalletOption(!showWalletOption) : undefined}
        linkToZodiac={walletType === WalletType.GNOSIS_SAFE}
      />
      {showWalletOption && (
        <Box className={classes.connectWalletBoxMenu}>
          <Button
            size="large"
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => {
              onboard.walletReset()
              setShowWalletOption(false)
            }}
          >
            Disconnect Wallet
          </Button>
        </Box>
      )}
    </Box>
  )
}
