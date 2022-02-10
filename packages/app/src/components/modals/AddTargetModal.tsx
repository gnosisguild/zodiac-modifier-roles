import React, { useState } from "react"
import { Box, Button, InputLabel, makeStyles, MenuItem, Select, Typography } from "@material-ui/core"
import { ethers } from "ethers"
import Modal from "../commons/Modal"
import { TextField } from "../commons/input/TextField"
import AddIcon from "@material-ui/icons/Add"
import { ExecutionOption, Target } from "../../typings/role"

const useStyles = makeStyles((theme) => ({
  label: {
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(1),
  },
}))

type Props = {
  isOpen: boolean
  onClose: () => void
  onAddTarget: (target: Target) => void
}

const AddTargetModal = ({ onAddTarget, onClose, isOpen }: Props): React.ReactElement => {
  const classes = useStyles()
  const [address, setAddress] = useState("")
  const [executionOptions, setExecutionOptions] = useState(ExecutionOption.NONE)
  const [isValidAddress, setIsValidAddress] = useState(false)

  const onAddressChange = (address: string) => {
    setIsValidAddress(ethers.utils.isAddress(address))
    setAddress(address)
  }

  const handleChangeExecutionsOptions = (value: string) => {
    setExecutionOptions(value as ExecutionOption)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Typography variant="h4">Add a Target</Typography>
      <Box sx={{ mt: 1 }}>
        <Typography variant="body1">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod.
        </Typography>
      </Box>
      <Box sx={{ mt: 2 }}>
        <TextField
          onChange={(e) => onAddressChange(e.target.value)}
          label={`target address`}
          placeholder={`Add a new target address`}
        />
      </Box>
      <Box sx={{ mt: 2 }}>
        <InputLabel className={classes.label}>Execution Type</InputLabel>
        <Select value={executionOptions} onChange={(e) => handleChangeExecutionsOptions(e.target.value as string)}>
          {Object.values(ExecutionOption).map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Button
          fullWidth
          color="secondary"
          size="large"
          variant="contained"
          onClick={() => onAddTarget({ address, executionOptions: executionOptions })}
          disabled={!isValidAddress}
          startIcon={<AddIcon />}
        >
          Add target
        </Button>
      </Box>
    </Modal>
  )
}

export default AddTargetModal
