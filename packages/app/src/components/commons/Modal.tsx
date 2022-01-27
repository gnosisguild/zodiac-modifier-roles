import { makeStyles, Paper, Modal as MUIModal } from "@material-ui/core"
import { PropsWithChildren } from "react"

const useStyles = makeStyles((theme) => ({
  paper: {
    backgroundColor: "rgba(78, 72, 87, 0.8)",
    left: "50%",
    maxWidth: 400,
    padding: theme.spacing(3),
    position: "absolute",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
  },
}))

type Props = PropsWithChildren<{
  isOpen: boolean
  onClose: () => void
}>

export const Modal = ({ children, isOpen, onClose }: Props) => {
  const classes = useStyles()

  return (
    <MUIModal open={isOpen} onClose={onClose}>
      <Paper elevation={3} classes={{ root: classes.paper }}>{children}</Paper>
    </MUIModal>
  )
}

export default Modal
