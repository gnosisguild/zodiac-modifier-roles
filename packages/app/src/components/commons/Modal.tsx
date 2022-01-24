import { Box, makeStyles, Paper, Modal as MUIModal } from "@material-ui/core"
import { PropsWithChildren } from "react"

const useStyles = makeStyles((theme) => ({
  paper: {
    maxWidth: 400,
    padding: theme.spacing(1.5),
  },
  box: {
    position: "absolute" as "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    border: "2px solid #000",
    boxShadow: "24",
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
      <Box className={classes.box}>
        <Paper classes={{ root: classes.paper }}>{children}</Paper>
      </Box>
    </MUIModal>
  )
}

export default Modal
