import React, { useState } from "react"
import { Box, Button, Typography } from "@material-ui/core"
import { ethers } from "ethers"
import Modal from "../commons/Modal"
import { TextField } from "../commons/input/TextField"
import AddIcon from "@material-ui/icons/Add"

type Props = {
  type: string
  isOpen: boolean
  onClose: () => void
  onAddAddress: (address: string) => void
}

const AddAddressModal = ({ type, onAddAddress, onClose, isOpen }: Props): React.ReactElement => {
  const [address, setAddress] = useState("")
  const [isValidAddress, setIsValidAddress] = useState(false)

  const onAddressChange = (address: string) => {
    setIsValidAddress(ethers.utils.isAddress(address))
    setAddress(address)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Typography variant="h4">Add a {type}</Typography>
      <Box sx={{ mt: 1 }}>
        <Typography variant="body1">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod.
        </Typography>
      </Box>
      <Box sx={{ mt: 2 }}>
        <TextField
          onChange={(e) => onAddressChange(e.target.value)}
          label={`${type} address`}
          placeholder={`Add a new ${type} address`}
        />
      </Box>

      <Box sx={{ mt: 2 }}>
        <Button
          fullWidth
          color="secondary"
          size="large"
          variant="contained"
          onClick={() => onAddAddress(address)}
          disabled={!isValidAddress}
          startIcon={<AddIcon />}
        >
          Add {type}
        </Button>
      </Box>
    </Modal>
  )
}

export default AddAddressModal
