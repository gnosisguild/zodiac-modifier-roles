import { Box, Link, Typography, makeStyles } from "@material-ui/core"
import truncateEthAddress from "truncate-eth-address"

const useStyles = makeStyles(() => ({
  undoLink: {
    "&:hover": {
      opacity: 0.8,
    },
  },
}))
interface RemovedAddressProps {
  address: string
}

const ConnectWallet = ({ address }: RemovedAddressProps) => {
  const classes = useStyles()

  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", my: 2 }}>
      <Typography variant="body2" color="error">
        {truncateEthAddress(address)} will be removed.
      </Typography>
      <Link underline="always" className={classes.undoLink}>
        <Typography variant="body2" color="error">
          Undo
        </Typography>
      </Link>
    </Box>
  )
}

export default ConnectWallet
