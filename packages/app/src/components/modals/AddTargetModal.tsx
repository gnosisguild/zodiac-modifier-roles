import React, { useState } from "react"
import { Box, Button, InputLabel, Link, makeStyles, MenuItem, Select, Typography } from "@material-ui/core"
import { ethers } from "ethers"
import Modal from "../commons/Modal"
import { TextField } from "../commons/input/TextField"
import AddIcon from "@material-ui/icons/Add"
import { ConditionType, EXECUTION_OPTIONS, ExecutionOption, Target } from "../../typings/role"

const useStyles = makeStyles((theme) => ({
  label: {
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(1),
  },
  link: {
    color: theme.palette.text.primary,
    cursor: "pointer",
    fontSize: 16,
    transition: "opacity 0.25s ease-in-out",
    "&:hover": {
      opacity: 0.8,
    },
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
    setExecutionOptions(parseInt(value) as ExecutionOption)
  }

  const handleAdd = () => {
    onAddTarget({
      id: `${address}_${Date.now()}`,
      address,
      type: ConditionType.WILDCARDED,
      executionOption: executionOptions,
      conditions: {},
    })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Typography variant="h4">Add a Target</Typography>
      <Box sx={{ mt: 1 }}>
        <Typography variant="body1">
          Targets are the accounts that the members can interact with on behalf of the avatar.
        </Typography>
        <Link
          href="https://gnosis.github.io/zodiac/docs/tutorial-modifier-roles/add-role#targets"
          target="_blank"
          rel="noredirect"
          underline="always"
          className={classes.link}
        >
          Read more about targets.
        </Link>
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
          {Object.entries(EXECUTION_OPTIONS).map(([value, label]) => (
            <MenuItem key={value} value={value}>
              {label}
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
          onClick={handleAdd}
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
