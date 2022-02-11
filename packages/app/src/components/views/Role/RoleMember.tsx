import { useMemo } from "react"
import { Box, IconButton, makeStyles } from "@material-ui/core"
import { DeleteOutlineSharp } from "@material-ui/icons"
import classNames from "classnames"
import makeBlockie from "ethereum-blockies-base64"
import { truncateEthAddress } from "../../../utils/address"
import RemovedAddress from "./RemovedAddress"
import { EntityStatus } from "../../../typings/role"

const useStyles = makeStyles((theme) => ({
  container: {
    alignItems: "center",
    border: "1px solid rgba(217, 212, 173, 0.3)",
    display: "flex",
    fontFamily: "Roboto Mono, monospace",
    justifyContent: "space-between",
    marginBottom: 10,
    padding: theme.spacing(1),
    position: "relative",
    "&::before": {
      content: '" "',
      backgroundColor: "rgba(217, 212, 173, 0.1)",
      border: "1px solid rgba(217, 212, 173, 0.3)",
      inset: -4,
      pointerEvents: "none",
      position: "absolute",
      zIndex: 1,
    },
  },
  address: {
    alignItems: "center",
    display: "flex",
  },
  blockieContainer: {
    alignItems: "center",
    background: "rgba(217, 212, 173, 0.1)",
    border: "1px solid rgba(217, 212, 173, 0.3)",
    borderRadius: 999,
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
    color: "rgba(217, 212, 173, 1)",
    width: 24,
    height: 24,
  },
  deleteButton: {
    backgroundColor: "rgba(217, 212, 173, 0.1)",
    border: "1px solid rgba(217, 212, 173, 0.3)",
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
    return <RemovedAddress onUndo={(address) => onRemoveMember(address, false)} address={member} />
  }

  return (
    <Box className={classNames(classes.container, { [classes.pending]: status === EntityStatus.PENDING })}>
      <Box className={classes.address}>
        <Box className={classes.blockieContainer}>
          <img className={classes.blockie} src={blockie} alt={member} width={16} height={16} />
        </Box>
        {truncateEthAddress(member)}
      </Box>
      <IconButton
        size="small"
        aria-label="Remove member"
        className={classNames(classes.iconButton, classes.deleteButton)}
        onClick={() => onRemoveMember(member)}
      >
        <DeleteOutlineSharp className={classes.deleteIcon} />
      </IconButton>
    </Box>
  )
}

export default RoleMember
