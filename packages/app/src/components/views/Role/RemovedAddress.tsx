import { Box, ButtonBase, Typography } from "@material-ui/core"
import { truncateEthAddress } from "../../../utils/address"

interface RemovedAddressProps {
  address: string

  onUndo(address: string): void
}

const RemovedAddress = ({ address, onUndo }: RemovedAddressProps) => {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", my: 2 }}>
      <Typography variant="body2" color="error">
        {truncateEthAddress(address)} will be removed.
      </Typography>
      <ButtonBase onClick={() => onUndo(address)}>
        <Typography variant="body2" color="error">
          Undo
        </Typography>
      </ButtonBase>
    </Box>
  )
}

export default RemovedAddress
