import React, { useState } from "react"
import { Box, Button, Link, makeStyles, Typography } from "@material-ui/core"
import { ethers } from "ethers"
import Modal from "../commons/Modal"
import { TextField } from "../commons/input/TextField"
import AddIcon from "@material-ui/icons/Add"
import { ConditionType, ExecutionOption, Target } from "../../typings/role"
import { ExecutionTypeSelect } from "../views/Role/targets/ExecutionTypeSelect"

const useStyles = makeStyles((theme) => ({
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
  const [executionOptions, setExecutionOptions] = useState(ExecutionOption.SEND)
  const [isValidAddress, setIsValidAddress] = useState(false)

  const onAddressChange = (address: string) => {
    setIsValidAddress(ethers.utils.isAddress(address))
    setAddress(address)
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
        <ExecutionTypeSelect value={executionOptions} onChange={setExecutionOptions} />
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
