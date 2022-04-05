import { InputLabel, makeStyles, MenuItem, Select } from "@material-ui/core"
import { useRootDispatch, useRootSelector } from "../../../store"
import { getChainId, getNetworkPickerDisabled, getRolesModifierAddress } from "../../../store/main/selectors"
import { setChainId } from "../../../store/main/web3Slice"
import { HeaderBox } from "./HeaderBox"
import { getNetwork, NETWORKS } from "../../../utils/networks"

const useStyles = makeStyles((theme) => ({
  networkPickerContainer: {
    "&.MuiPaper-root": {
      flexDirection: "column",
      alignItems: "flex-start",
      flexGrow: 1,
      maxWidth: 180,
    },
  },
  networkPicker: {
    marginTop: theme.spacing(0.5),
    padding: theme.spacing(0.5),
    fontSize: 12,
  },
}))

const networkConfigs = NETWORKS.map(getNetwork)

export const ChainPicker = () => {
  const classes = useStyles()
  const dispatch = useRootDispatch()

  const chainId = useRootSelector(getChainId)
  const disabled = useRootSelector(getNetworkPickerDisabled)
  const rolesModifierAddress = useRootSelector(getRolesModifierAddress)

  const handleNetworkChange = (value: string) => dispatch(setChainId(parseInt(value)))

  return (
    <HeaderBox className={classes.networkPickerContainer}>
      <InputLabel shrink>Chain</InputLabel>
      <Select
        disableUnderline
        className={classes.networkPicker}
        disabled={!!rolesModifierAddress || disabled}
        value={chainId}
        onChange={(evt) => handleNetworkChange(evt.target.value as string)}
      >
        {networkConfigs.map((config) => (
          <MenuItem key={config.chainId} value={config.chainId}>
            {config.name}
          </MenuItem>
        ))}
      </Select>
    </HeaderBox>
  )
}
