import { InputLabel, makeStyles, MenuItem, Select } from "@material-ui/core"
import { useRootDispatch, useRootSelector } from "../../../store"
import { getChainId, getRolesModifierAddress } from "../../../store/main/selectors"
import { NETWORK_NAME } from "../../../utils/networks"
import { setChainId } from "../../../store/main/web3Slice"
import { HeaderBox } from "./HeaderBox"

const useStyles = makeStyles((theme) => ({
  networkPickerContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    flexGrow: 1,
    maxWidth: 180,
  },
  networkPicker: {
    marginTop: theme.spacing(0.5),
    padding: theme.spacing(0.5),
    fontSize: 12,
    "&:after": {
      display: "none",
    },
  },
}))

export const ChainPicker = () => {
  const classes = useStyles()
  const dispatch = useRootDispatch()

  const chainId = useRootSelector(getChainId)
  const rolesModifierAddress = useRootSelector(getRolesModifierAddress)

  const handleNetworkChange = (value: string) => dispatch(setChainId(parseInt(value)))

  return (
    <HeaderBox className={classes.networkPickerContainer}>
      <InputLabel shrink>Chain</InputLabel>
      <Select
        disableUnderline
        className={classes.networkPicker}
        disabled={!!rolesModifierAddress}
        value={chainId}
        onChange={(evt) => handleNetworkChange(evt.target.value as string)}
      >
        {Object.entries(NETWORK_NAME).map((pair) => (
          <MenuItem key={pair[0]} value={pair[0]}>
            {pair[1]}
          </MenuItem>
        ))}
      </Select>
    </HeaderBox>
  )
}
