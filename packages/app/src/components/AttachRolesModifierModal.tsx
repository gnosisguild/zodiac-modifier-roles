import { Button, makeStyles, Typography } from "@material-ui/core"
import { TextField } from "./commons/input/TextField"
import { ReactComponent as ArrowUp } from "../assets/icons/arrow-up.svg"
import { useState } from "react"
import { ethers } from "ethers"
import Modal from "./commons/Modal"
import { useNavigate } from "react-router-dom"
import { useQuery } from "../hooks/useQuery"

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
  const [rolesModifierAddress, _setRolesModifierAddress] = useState("")
  const navigate = useNavigate()
  const query = useQuery()

  const handleAttach = async () => {
    if (ethers.utils.isAddress(rolesModifierAddress)) {
      const chainIdParam = query.get("chainId")
      if (chainIdParam != null) {
        navigate(`/?rolesModifierAddress=${rolesModifierAddress}&chainId=${chainIdParam}`, { replace: true })
      } else {
        navigate(`/?rolesModifierAddress=${rolesModifierAddress}`, { replace: true })
      }
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose}>
      <Typography className={classes.spacing} variant="h4">
        Attach to a Roles Modifier
      </Typography>
      <Typography className={classes.spacing} variant="body1">
        Once a Role Modifier is connected you can manage roles and permissions.
      </Typography>

      <TextField
        className={classes.spacing}
        onChange={(evt: any) => _setRolesModifierAddress(evt.target.value)}
        label="Role Modifier Address"
        placeholder="0x..."
      />

      <Button
        fullWidth
        color="secondary"
        variant="contained"
        onClick={handleAttach}
        disabled={!ethers.utils.isAddress(rolesModifierAddress)}
        startIcon={<ArrowUp />}
      >
        Attach Roles Modifier
      </Button>
    </Modal>
  )
}

export default AttachRolesModifierModal
