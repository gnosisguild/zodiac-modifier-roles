import { Button, makeStyles, Typography } from "@material-ui/core"
import { TextField } from "../commons/input/TextField"
import { ReactComponent as ArrowUp } from "../../assets/icons/arrow-up.svg"
import { useState } from "react"
import { ethers } from "ethers"
import Modal from "../commons/Modal"
import { useNavigate } from "react-router-dom"
import { formatAddressEIP3770, getAddress } from "../../utils/address"
import { useRootSelector } from "../../store"
import { getChainId, getRolesModifierAddress } from "../../store/main/selectors"
import { useSafeApp } from "../../hooks/useSafeApp"

type Props = {
  onClose: () => void
}

const useStyles = makeStyles((theme) => ({
  spacing: {
    marginBottom: theme.spacing(2),
  },
  errorSpacing: {
    marginTop: theme.spacing(2),
  },
}))

export const AttachRolesModifierModal = ({ onClose }: Props) => {
  const classes = useStyles()
  const navigate = useNavigate()

  useSafeApp()

  const chainId = useRootSelector(getChainId)
  const rolesModifierAddress = useRootSelector(getRolesModifierAddress)

  const [address, setAddress] = useState("")

  const handleAttach = async () => {
    const addressData = getAddress(address)
    if (addressData) {
      const fullAddress = addressData.fullAddress || formatAddressEIP3770(chainId, addressData.address)
      navigate(`/${fullAddress}`, { replace: true })
    }
  }

  const open = rolesModifierAddress == null || !getAddress(rolesModifierAddress)

  return (
    <Modal isOpen={open} onClose={onClose}>
      <Typography className={classes.spacing} variant="h4">
        Attach to a Roles Modifier
      </Typography>
      <Typography className={classes.spacing} variant="body1">
        Once a Role Modifier is connected you can manage roles and permissions.
      </Typography>

      <TextField
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
        disabled={!ethers.utils.isAddress(address)}
        startIcon={<ArrowUp />}
      >
        Attach Roles Modifier
      </Button>
    </Modal>
  )
}

export default AttachRolesModifierModal
