import { useMemo } from "react"
import { Box, IconButton, makeStyles } from "@material-ui/core"
import { DeleteOutlineSharp } from "@material-ui/icons"
import { CopyToClipboardBtn } from "@gnosis.pm/safe-react-components"
import classNames from "classnames"
import makeBlockie from "ethereum-blockies-base64"
import { truncateEthAddress } from "../../../../utils/address"
import RemovedAddress from "../RemovedAddress"
import { EntityStatus } from "../../../../typings/role"
import { colors, doubleBorder, ZodiacPaper } from "zodiac-ui-components"

const useStyles = makeStyles((theme) => ({
  container: {
    alignItems: "center",
    display: "flex",
    fontFamily: "Roboto Mono, monospace",
    justifyContent: "space-between",
    marginBottom: 10,
    padding: theme.spacing(1),
    "&::before": doubleBorder(-4, colors.tan[300]),
  },
  address: {
    alignItems: "center",
    display: "flex",
  },
  blockieContainer: {
    alignItems: "center",
    display: "flex",
    height: 20,
    justifyContent: "center",
    marginRight: theme.spacing(1),
    minWidth: 20,
  },
  blockie: {
    borderRadius: 999,
  },
  iconButton: {
    borderRadius: 4,
    color: colors.tan[1000],
    width: 24,
    height: 24,
  },
  copyButton: {
    marginLeft: theme.spacing(1),
    "&:hover": {
      backgroundColor: `${colors.tan[100]} !important`,
      opacity: 0.8,
    },
  },
  deleteButton: {
    backgroundColor: colors.tan[100],
    border: `1px solid ${colors.tan[300]}`,
    "&:hover": {
      opacity: 0.8,
    },
  },
  deleteIcon: {
    width: 12,
  },
  pending: {
    "&:before": {
      borderStyle: "dashed",
    },
  },
}))

type RoleMemberProps = {
  member: string
  status: EntityStatus
  onRemoveMember: (member: string, remove?: boolean) => void
}

const RoleMember = ({ member, status, onRemoveMember }: RoleMemberProps) => {
  const classes = useStyles()

  const blockie = useMemo(() => member && makeBlockie(member), [member])

  if (status === EntityStatus.REMOVE) {
    return <RemovedAddress onUndo={() => onRemoveMember(member, false)} address={member} />
  }

  return (
    <ZodiacPaper className={classNames(classes.container, { [classes.pending]: status === EntityStatus.PENDING })}>
      <Box className={classes.address}>
        <ZodiacPaper variant="outlined" borderStyle="single" rounded="full" className={classes.blockieContainer}>
          <img className={classes.blockie} src={blockie} alt={member} width={16} height={16} />
        </ZodiacPaper>
        {truncateEthAddress(member)}
        <CopyToClipboardBtn textToCopy={member} className={classNames(classes.copyButton, "btn")} />
      </Box>
      <IconButton
        size="small"
        aria-label="Remove member"
        className={classNames(classes.iconButton, classes.deleteButton)}
        onClick={() => onRemoveMember(member)}
      >
        <DeleteOutlineSharp className={classes.deleteIcon} />
      </IconButton>
    </ZodiacPaper>
  )
}

export default RoleMember
