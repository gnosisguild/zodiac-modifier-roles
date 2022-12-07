import { HeaderBox } from "./HeaderBox"
import { Box, Link, makeStyles, Typography } from "@material-ui/core"
import { ArrowForward } from "@material-ui/icons"
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
  zodiacArrow: {
    color: "currentColor",
    marginLeft: theme.spacing(0.5),
    width: theme.spacing(2),
  },
  zodiacLink: {
    color: "rgba(255,255,255,0.8)",
    display: "flex",
    alignItems: "center",
    "&:hover": {
      color: "white",
    },
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
  onClick?: () => void
  linkToZodiac?: boolean
}

export const HeaderAddressBox = ({ address, emptyText, onClick, linkToZodiac }: HeaderAddressBoxProps) => {
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
        ) : undefined
      }
      onClick={onClick}
    >
      <Box className={classes.title}>
        <Typography
          variant="body1"
          className={classNames({ [classes.empty]: !address, [classes.addressFont]: address })}
        >
          {address ? truncateEthAddress(address) : emptyText}
        </Typography>
        {address && linkToZodiac && (
          <Link
            rel="noredirect"
            onClick={() => {
              window.location.href = `https://zodiac.gnosisguild.org/`
            }}
            className={classes.zodiacLink}
            underline="always"
          >
            Open Zodiac
            <ArrowForward className={classes.zodiacArrow} />
          </Link>
        )}
      </Box>
    </HeaderBox>
  )
}
