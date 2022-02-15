import { HeaderBox } from "./HeaderBox"
import { makeStyles, Typography } from "@material-ui/core"
import { EthHashInfo } from "@gnosis.pm/safe-react-components"
import { truncateEthAddress } from "../../../utils/address"
import classNames from "classnames"

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "row",
    marginBottom: theme.spacing(2),
  },
  avatar: {
    "& div": {
      margin: 0,
    },
    "& img": {
      width: 36,
      height: 36,
    },
  },
  title: {
    marginLeft: theme.spacing(1),
  },
  addressFont: {
    fontFamily: "Roboto Mono",
  },
  empty: {
    opacity: 0.5,
  },
}))

interface HeaderAddressBoxProps {
  address?: string
  emptyText: string
}

export const HeaderAddressBox = ({ address, emptyText }: HeaderAddressBoxProps) => {
  const classes = useStyles()
  return (
    <HeaderBox
      icon={
        address ? (
          <EthHashInfo
            className={classes.avatar}
            hash={address}
            showAvatar
            showCopyBtn={false}
            showHash={false}
            avatarSize="md"
          />
        ) : null
      }
    >
      <Typography
        variant="body1"
        className={classNames(classes.title, { [classes.empty]: !address, [classes.addressFont]: address })}
      >
        {address ? truncateEthAddress(address) : emptyText}
      </Typography>
    </HeaderBox>
  )
}
