import { makeStyles, Paper } from "@material-ui/core"
import { PropsWithChildren, useState } from "react"

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    maxWidth: 400,
    marginTop: theme.spacing(16),
    padding: theme.spacing(1.5),
  },
}))

export const Modal = ({ children }: PropsWithChildren<{}>) => {
  const classes = useStyles()

  return (
    <div className={classes.root}>
      <Paper classes={{ root: classes.card }}>{children}</Paper>
    </div>
  )
}

export default Modal
