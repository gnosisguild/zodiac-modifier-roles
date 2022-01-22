import React, { useState } from "react"
import { Button, CircularProgress, makeStyles, TextField, Typography } from "@material-ui/core"
import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk"
import { RolesModifier__factory } from "../contracts/type"
import { Transaction as SafeTransaction } from "@gnosis.pm/safe-apps-sdk"
import { useWallet } from "../hooks/useWallet"
import { ethers, PopulatedTransaction } from "ethers"
import Modal from "./commons/Modal"

type Props = {
  isOpen: boolean
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

const CreateRoleModal = ({ onClose: onCloseIn, isOpen }: Props): React.ReactElement => {
  const classes = useStyles()
  const [targetAddress, setTargetAddress] = useState("")
  const [isWaiting, setIsWaiting] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [isValidAddress, setIsValidAddress] = useState(false)
  const { sdk } = useSafeAppsSDK()
  const { provider } = useWallet()
  const rolesModifierAddress = "0x233E94a1b2CCf51C6AF4D39ba43b128EA84E39b2" // TODO: should not be hardcoded
  // need to get it from the current safe

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

      const signer = await provider.getSigner()
      const RolesModifier = RolesModifier__factory.connect(rolesModifierAddress, signer)

      const txs: PopulatedTransaction[] = []
      txs.push(await RolesModifier.populateTransaction.allowTarget("1", targetAddress, "3"))
      await sdk.txs.send({ txs: txs.map(convertTxToSafeTx) })
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsWaiting(false)
    }
    console.log("Transaction initiated")
  }

  const onTargetAddressChange = (address: string) => {
    if (ethers.utils.isAddress(address)) {
      setIsValidAddress(true)
      setTargetAddress(address)
    } else {
      setIsValidAddress(false)
      setTargetAddress(address)
    }
  }

  const convertTxToSafeTx = (tx: PopulatedTransaction): SafeTransaction => ({
    to: tx.to as string,
    value: "0",
    data: tx.data as string,
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Typography className={classes.spacing} variant="h4">
        Create a new role
      </Typography>
      <Typography className={classes.spacing} variant="body1">
        Create a new role that allows all calls to this target
      </Typography>

      <TextField
        className={classes.spacing}
        onChange={(e) => onTargetAddressChange(e.target.value)}
        label="Target Address"
        placeholder="0x..."
      />

      <Button
        fullWidth
        color="secondary"
        variant="contained"
        onClick={onSubmit}
        disabled={!isValidAddress || isWaiting}
        startIcon={isWaiting ? <CircularProgress size={18} color="primary" /> : null}
      >
        {isWaiting ? "Creating role..." : "Create role"}
      </Button>
      {error != null ? (
        <Typography align="center" color="error" className={classes.errorSpacing}>
          {error}
        </Typography>
      ) : null}
    </Modal>
  )
}

export default CreateRoleModal
