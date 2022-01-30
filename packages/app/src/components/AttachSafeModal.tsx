import { Button, CircularProgress, makeStyles, Typography } from "@material-ui/core"
import { TextField } from "./commons/input/TextField"
import { ReactComponent as ArrowUp } from "../assets/icons/arrow-up.svg"
import { useRootDispatch } from "../store"
import { useState } from "react"
import { ethers } from "ethers"
import { setSafeAddress } from "../store/main"
import { useWallet } from "../hooks/useWallet"
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

export const AttachSafeModal = ({ isOpen, onClose }: Props) => {
  const classes = useStyles()
  const [invalidSafe, setInvalidSafe] = useState(false)
  const [loading, setLoading] = useState(false)
  const dispatch = useRootDispatch()
  const { provider } = useWallet()
  const [safeAddress, _setSafeAddress] = useState("")
  const isValid = ethers.utils.isAddress(safeAddress)

  const handleAttach = async () => {
    if (ethers.utils.isAddress(safeAddress) && provider) {
      setLoading(true)
      setInvalidSafe(false)
      try {
        dispatch(setSafeAddress(safeAddress))
      } catch (err) {
        console.warn("attach error", err)
        setInvalidSafe(true)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Typography className={classes.spacing} variant="h4">
        Attach an Gnosis Safe
      </Typography>
      <Typography className={classes.spacing} variant="body1">
        Once a Safe is connected you can manage roles and permissions.
      </Typography>

      <TextField
        className={classes.spacing}
        onChange={(evt: any) => _setSafeAddress(evt.target.value)}
        label="Safe Address"
        placeholder="0x59C945953C10AbC7f3716a8cECd09b5eb4d865Ca"
      />

      <Button
        fullWidth
        color="secondary"
        variant="contained"
        onClick={handleAttach}
        disabled={!isValid || loading}
        startIcon={loading ? <CircularProgress size={18} color="primary" /> : <ArrowUp />}
      >
        {loading ? "Attaching Gnosis Safe..." : "Attach Safe"}
      </Button>

      {invalidSafe && (
        <Typography align="center" color="error" className={classes.errorSpacing}>
          The address you entered is not a Gnosis Safe
        </Typography>
      )}
    </Modal>
  )
}

export default AttachSafeModal
