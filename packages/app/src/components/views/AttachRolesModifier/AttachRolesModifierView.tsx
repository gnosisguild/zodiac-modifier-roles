import { Box, Button, makeStyles, Paper, Typography } from "@material-ui/core"
import { ZodiacTextField } from "zodiac-ui-components"
import { ReactComponent as ArrowUp } from "../../../assets/icons/arrow-up.svg"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { formatAddressEIP3770, getAddress } from "../../../utils/address"
import { useRootSelector } from "../../../store"
import { getChainId } from "../../../store/main/selectors"
import { useSafeApp } from "../../../hooks/useSafeApp"

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: theme.spacing(8),
  },
  content: {
    padding: theme.spacing(2),
    maxWidth: 400,
  },
  spacing: {
    marginBottom: theme.spacing(2),
  },
  errorSpacing: {
    marginTop: theme.spacing(2),
  },
}))

export const AttachRolesModifierView = () => {
  const classes = useStyles()
  const navigate = useNavigate()

  useSafeApp()

  const chainId = useRootSelector(getChainId)

  const [address, setAddress] = useState("")
  const addressData = getAddress(address)

  const handleAttach = async () => {
    if (addressData) {
      const fullAddress = addressData.fullAddress || formatAddressEIP3770(chainId, addressData.address)
      navigate(`/${fullAddress}`, { replace: true })
    }
  }

  return (
    <Box className={classes.root}>
      <Paper className={classes.content}>
        <Typography className={classes.spacing} variant="h4">
          Attach to a Roles Modifier
        </Typography>
        <Typography className={classes.spacing} variant="body1">
          Once a Role Modifier is connected you can manage roles and permissions.
        </Typography>

        <ZodiacTextField
          className={classes.spacing}
          onChange={(evt: any) => setAddress(evt.target.value)}
          label="Role Modifier Address"
          placeholder="0x..."
        />

        <Button
          fullWidth
          color="secondary"
          variant="contained"
          onClick={handleAttach}
          disabled={!addressData}
          startIcon={<ArrowUp />}
        >
          Attach Roles Modifier
        </Button>
      </Paper>
    </Box>
  )
}

export default AttachRolesModifierView
