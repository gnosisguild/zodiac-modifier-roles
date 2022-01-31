import React, { useState } from "react"
import { Box, Button, CircularProgress, makeStyles, Typography } from "@material-ui/core"
import { Roles__factory } from "../contracts/type/factories/Roles__factory"
import { useWallet } from "../hooks/useWallet"
import { ethers } from "ethers"
import RolesModuleLogo from "../assets/images/roles-module-logo.png"
import Modal from "./commons/Modal"
import { TextField } from "./commons/input/TextField"
import AddIcon from "@material-ui/icons/Add"

type Props = {
  isOpen: boolean
  onClose: () => void
  rolesModifierAddress: string
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

const CreateRoleModal = ({ onClose: onCloseIn, isOpen, rolesModifierAddress }: Props): React.ReactElement => {
  const classes = useStyles()
  const [targetAddress, setTargetAddress] = useState("")
  const [isWaiting, setIsWaiting] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [isValidAddress, setIsValidAddress] = useState(false)
  // const { sdk } = useSafeAppsSDK()
  const { provider } = useWallet()

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
    if (ethers.utils.isAddress(address)) {
      setIsValidAddress(true)
      setTargetAddress(address)
    } else {
      setIsValidAddress(false)
      setTargetAddress(address)
    }
  }

  // const convertTxToSafeTx = (tx: PopulatedTransaction): SafeTransaction => ({
  //   to: tx.to as string,
  //   value: "0",
  //   data: tx.data as string,
  // })

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Box
        display="flex"
        sx={{
          mb: 3,
        }}
      >
        <Box sx={{ mr: 2 }}>
          <img src={RolesModuleLogo} alt="Roles App Logo" className={classes.img} />
        </Box>
        <Box>
          <Typography variant="h4">Create a new role</Typography>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body1">Create a new role that allows all calls to this target</Typography>
          </Box>
        </Box>
      </Box>

      <TextField onChange={(e) => onTargetAddressChange(e.target.value)} label="Target Address" placeholder="0x..." />

      {/* <Box sx={{mt: 2}}>
        <RoleParameters />
      </Box> */}

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
          {isWaiting ? "Creating role..." : "Create role"}
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

export default CreateRoleModal
