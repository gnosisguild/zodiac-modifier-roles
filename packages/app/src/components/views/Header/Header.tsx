import { Box, makeStyles, Typography } from "@material-ui/core"
import { ChainPicker } from "./ChainPicker"
import { HeaderBox } from "./HeaderBox"
import { HeaderAddressBox } from "./HeaderAddressBox"
import { useRootSelector } from "../../../store"
import { getRolesModifierAddress } from "../../../store/main/selectors"
import { ConnectWalletBox } from "./ConnectWalletBox"
import { BadgeIcon } from "zodiac-ui-components"
import { useNavigate } from "react-router-dom"

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "row",
    marginBottom: theme.spacing(2),
  },
  img: {
    display: "block",
    width: 36,
    height: 36,
  },
  title: {
    marginLeft: theme.spacing(1),
  },
  grow: {
    flexGrow: 1,
  },
  badge: {
    marginLeft: theme.spacing(2),
  },
  warning: {
    color: theme.palette.warning.main,
    textTransform: "uppercase",
  },
}))

export const Header = () => {
  const classes = useStyles()
  const navigate = useNavigate()

  const module = useRootSelector(getRolesModifierAddress)

  return (
    <Box className={classes.root}>
      <HeaderBox icon={<BadgeIcon icon="roles" />} onClick={() => navigate(`/${module}`)}>
        <Typography variant="h5" className={classes.title}>
          Roles
        </Typography>
      </HeaderBox>
      <HeaderBox className={classes.grow}>
        <div className={classes.badge}>
          <Typography className={classes.warning}>Experimental</Typography>
          <Typography variant="body2">
            Use this app with caution and carefully review all applied permissions
          </Typography>
        </div>
      </HeaderBox>
      <ChainPicker />
      <HeaderAddressBox address={module} emptyText="No Safe Attached" />
      <ConnectWalletBox />
    </Box>
  )
}
