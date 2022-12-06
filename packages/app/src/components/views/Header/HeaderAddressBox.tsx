import { HeaderBox } from "./HeaderBox"
import { Box, Link, makeStyles, Typography } from "@material-ui/core"
import { ArrowForward } from "@material-ui/icons"
import { EthHashInfo } from "@gnosis.pm/safe-react-components"
import { truncateEthAddress } from "../../../utils/address"
import classNames from "classnames"
import { useRootSelector } from "../../../store"
import { getChainId, getRolesModifierAddress } from "../../../store/main/selectors"
import { getNetwork, NETWORKS } from "../../../utils/networks"

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
}

const networkConfigs = NETWORKS.map(getNetwork)

export const HeaderAddressBox = ({ address, emptyText, onClick }: HeaderAddressBoxProps) => {
  const classes = useStyles()
  const network = useRootSelector(getChainId)
  const rolesModifierAddress = useRootSelector(getRolesModifierAddress)

  const networkShortname = networkConfigs.find((chain) => chain.chainId === network)?.shortName
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
        {address && (
          <Link
            target="_blank"
            rel="noredirect"
            href={`https://app.safe.global/${networkShortname}:${rolesModifierAddress}/apps?appUrl=https%3A%2F%2Fzodiac.gnosisguild.org%2F`}
            className={classes.zodiacLink}
            underline="always"
          >
            View in Zodiac
            <ArrowForward className={classes.zodiacArrow} />
          </Link>
        )}
      </Box>
    </HeaderBox>
  )
}
