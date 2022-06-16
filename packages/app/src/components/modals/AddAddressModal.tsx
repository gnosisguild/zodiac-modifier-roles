import React, { useState } from "react"
import { Box, Button, Link, makeStyles, Typography } from "@material-ui/core"
import { ethers } from "ethers"
import Modal from "../commons/Modal"
import { colors, ZodiacTextField } from "zodiac-ui-components"
import AddIcon from "@material-ui/icons/Add"

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
  type: string
  isOpen: boolean
  onClose: () => void
  onAddAddress: (address: string) => void
}

const AddAddressModal = ({ type, onAddAddress, onClose, isOpen }: Props): React.ReactElement => {
  const classes = useStyles()
  const [address, setAddress] = useState("")
  const [isValidAddress, setIsValidAddress] = useState(false)

  const onAddressChange = (address: string) => {
    setIsValidAddress(ethers.utils.isAddress(address))
    setAddress(address)
  }

  const handleAdd = () => {
    onAddAddress(address)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Typography variant="h4">Add a {type}</Typography>
      <Box sx={{ mt: 1 }}>
        <Typography variant="body1">Members are accounts that that the role is assigned to.</Typography>
        <Link
          href="https://gnosis.github.io/zodiac/docs/tutorial-modifier-roles/add-role#members"
          target="_blank"
          rel="noredirect"
          underline="always"
          className={classes.link}
        >
          Read more about members.
        </Link>
      </Box>
      <Box sx={{ mt: 2 }}>
        <ZodiacTextField
          className={classes.textField}
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
          onClick={handleAdd}
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
