import React, { useState } from "react"
import { Box, Button, Link, makeStyles, Typography } from "@material-ui/core"
import { ethers } from "ethers"
import Modal from "../commons/Modal"
import { colors, ZodiacTextField } from "zodiac-ui-components"
import AddIcon from "@material-ui/icons/Add"
import { ConditionType, ExecutionOption, Target } from "../../typings/role"
import { ExecutionOptions } from "../views/Role/targets/ExecutionOptions"

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
  textField: {
    "& .MuiInputBase-root": {
      borderColor: colors.tan[300],
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
      <Box sx={{ mt: 2 }} className={classes.textField}>
        <ZodiacTextField
          onChange={(e) => onAddressChange(e.target.value)}
          label={`Target address`}
          placeholder={`Add a new target address`}
        />
      </Box>
      <Box sx={{ mt: 2 }}>
        <ExecutionOptions value={executionOptions} onChange={setExecutionOptions} />
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
