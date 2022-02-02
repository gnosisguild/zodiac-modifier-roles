import React, { useState } from "react"
import { Box, Button, CircularProgress, makeStyles, Typography } from "@material-ui/core"
import { Roles__factory } from "../contracts/type/factories/Roles__factory"
import { useWallet } from "../hooks/useWallet"
import { ethers } from "ethers"
import Modal from "./commons/Modal"
import { TextField } from "./commons/input/TextField"
import AddIcon from "@material-ui/icons/Add"
import { useRootSelector } from "../store"
import { getRolesModifierAddress } from "../store/main/selectors"

type Props = {
  isOpen: boolean
  onClose: () => void
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

const AddTargetModal = ({ onClose: onCloseIn, isOpen }: Props): React.ReactElement => {
  const classes = useStyles()
  const [targetAddress, setTargetAddress] = useState("")
  const [isWaiting, setIsWaiting] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [isValidAddress, setIsValidAddress] = useState(false)
  const { provider } = useWallet()
  const rolesModifierAddress = useRootSelector(getRolesModifierAddress)

  const onClose = () => {
    onCloseIn()
    setError(undefined)
  }

  const onSubmit = async () => {
    setIsWaiting(true)
    try {
      if (!provider) {
        console.error("No provider")
        return
      }

      if (!rolesModifierAddress) {
        console.error("No rolesModifierAddress")
        return
      }

      const signer = await provider.getSigner()
      const RolesModifier = Roles__factory.connect(rolesModifierAddress, signer)

      // const txs: PopulatedTransaction[] = []
      const tx = await RolesModifier.allowTarget(Date.now().toString().slice(-4), targetAddress, "3")
      await tx.wait()
      // await sdk.txs.send({ txs: txs.map(convertTxToSafeTx) })
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsWaiting(false)
    }
    console.log("Transaction initiated")
  }

  const onTargetAddressChange = (address: string) => {
    setIsValidAddress(ethers.utils.isAddress(address))
    setTargetAddress(address)
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
          onChange={(e) => onTargetAddressChange(e.target.value)}
          label="Target Address"
          placeholder="Add a new target address"
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
          {isWaiting ? "Adding Target..." : "Add Target"}
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

export default AddTargetModal
