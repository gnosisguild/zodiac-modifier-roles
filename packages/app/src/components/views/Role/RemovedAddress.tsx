import React from "react"
import { ButtonBase, ButtonBaseProps, makeStyles, Typography } from "@material-ui/core"
import { truncateEthAddress } from "../../../utils/address"

interface RemovedAddressProps {
  address: string

  onUndo?: ButtonBaseProps["onClick"]
}

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    justifyContent: "space-between",
    margin: theme.spacing(2, 0),
  },
  undo: {
    textDecoration: "underline",
    "&:hover": {
      opacity: 0.8,
    },
  },
}))

const RemovedAddress = ({ address, onUndo }: RemovedAddressProps) => {
  const classes = useStyles()
  return (
    <div className={classes.root}>
      <Typography variant="body2" color="error">
        {truncateEthAddress(address)} will be removed.
      </Typography>
      <ButtonBase onClick={onUndo}>
        <Typography variant="body2" color="error" className={classes.undo}>
          Undo
        </Typography>
      </ButtonBase>
    </div>
  )
}

export default RemovedAddress
