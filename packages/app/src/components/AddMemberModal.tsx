import React, { useState } from "react"
import { Box, Button, CircularProgress, makeStyles, Typography } from "@material-ui/core"
import { Roles__factory } from "../contracts/type/factories/Roles__factory"
import { useWallet } from "../hooks/useWallet"
import { ethers } from "ethers"
import Modal from "./commons/Modal"
import { TextField } from "./commons/input/TextField"
import AddIcon from "@material-ui/icons/Add"
import { useRootDispatch, useRootSelector } from "../store"
import { getRolesModifierAddress, getTransactionError, getTransactionPending } from "../store/main/selectors"
import { addRoleMember, resetTransactionError } from "../store/main/rolesSlice"
import { Role } from "../typings/role"

type Props = {
  isOpen: boolean
  onClose: () => void
  role: Role | undefined
}

const useStyles = makeStyles((theme) => ({
  errorSpacing: {
    marginTop: theme.spacing(2),
  },
  img: {
    borderRadius: "50%",
    border: "1px solid rgba(250, 132, 132, 0.2)",
    padding: 4,
    width: 68,
  },
}))

const AddMemberModal = ({ role, onClose: onCloseIn, isOpen }: Props): React.ReactElement => {
  const classes = useStyles()
  const [memberAddress, setMemberAddress] = useState("")
  const isWaiting = useRootSelector(getTransactionPending)
  const error = useRootSelector(getTransactionError)
  const [isValidAddress, setIsValidAddress] = useState(false)
  const { provider } = useWallet()
  const dispatch = useRootDispatch()

  const onClose = () => {
    onCloseIn()
    dispatch(resetTransactionError())
  }

  const onSubmit = async () => {
    if (!provider) {
      console.error("No provider")
      return
    }
    if (!role) {
      console.error("No role")
      return
    }
    dispatch(addRoleMember({ roleId: role.id, memberAddress, provider }))
  }

  const onMemberAddressChange = (address: string) => {
    setIsValidAddress(ethers.utils.isAddress(address))
    setMemberAddress(address)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Typography variant="h4">Add a Member</Typography>
      <Box sx={{ mt: 1 }}>
        <Typography variant="body1">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod.
        </Typography>
      </Box>
      <Box sx={{ mt: 2 }}>
        <TextField
          onChange={(e) => onMemberAddressChange(e.target.value)}
          label="Member Address"
          placeholder="Add a new member address"
        />
      </Box>

      <Box sx={{ mt: 2 }}>
        <Button
          fullWidth
          color="secondary"
          size="large"
          variant="contained"
          onClick={onSubmit}
          disabled={!isValidAddress || isWaiting}
          startIcon={isWaiting ? <CircularProgress size={18} color="primary" /> : <AddIcon />}
        >
          {isWaiting ? "Adding Member..." : "Add Member"}
        </Button>
      </Box>
      {error != null && (
        <Typography align="center" color="error" className={classes.errorSpacing}>
          {error}
        </Typography>
      )}
    </Modal>
  )
}

export default AddMemberModal
