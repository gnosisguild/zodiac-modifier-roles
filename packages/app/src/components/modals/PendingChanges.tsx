import React, { useContext } from "react"
import { Box, makeStyles, Typography } from "@material-ui/core"
import Modal from "../commons/Modal"
import AddCircleOutlineIcon from "@material-ui/icons/AddCircleOutline"
import RemoveCircleOutlineIcon from "@material-ui/icons/RemoveCircleOutline"
import { RoleContext } from "../views/Role/RoleContext"
import { Target } from "../../typings/role"
import { truncateEthAddress } from "../../utils/address"
import classNames from "classnames"

const useStyles = makeStyles((theme) => ({
  rowItemContainer: {
    alignItems: "center",
    display: "flex",
    fontFamily: "Roboto Mono, monospace",
    justifyContent: "space-between",
    marginBottom: 10,
    padding: theme.spacing(1),
    position: "relative",
    "&::before": {
      content: '" "',
      border: "1px solid rgba(217, 212, 173, 0.3)",
      inset: -4,
      pointerEvents: "none",
      position: "absolute",
      zIndex: 1,
    },
  },
  rowIconContainer: {
    alignItems: "center",
    background: "rgba(217, 212, 173, 0.1)",
    borderRadius: 999,
    display: "flex",
    height: 20,
    justifyContent: "center",
    marginRight: theme.spacing(1),
    minWidth: 20,
  },
  add: {
    backgroundColor: "rgba(104, 195, 163, 0.1)",
  },
  remove: {
    backgroundColor: "rgba(254, 121, 104, 0.1)",
  },
  memberIcon: {},
  label: {
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(0.5),
  },
  address: {
    alignItems: "center",
    display: "flex",
  },
  targetNumberOfChanges: {
    flex: "auto",
    textAlign: "right",
  },
}))

type Props = {
  isOpen: boolean
  onClose: () => void
}

const PendingChanges = ({ onClose, isOpen }: Props): React.ReactElement => {
  const { state } = useContext(RoleContext)
  const { id: roleId, members, targets } = state
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Typography variant="h4">Pending Changes to Role #{roleId}</Typography>
      <Box sx={{ mt: 1 }}>
        <Typography variant="body1">
          The following changes will be applied to role #{roleId} when you execute the update transaction.
        </Typography>
      </Box>
      <Members members={members} />
      <Targets targets={targets} />
    </Modal>
  )
}
type MembersProps = {
  members: {
    list: string[]
    add: string[]
    remove: string[]
  }
}
const Members = ({ members }: MembersProps): React.ReactElement => {
  const classes = useStyles()

  const memberRow = (change: "add" | "remove") => (member: string) => {
    if (change === "add") {
      return (
        <Box className={classNames(classes.rowItemContainer, classes.add)} key={`add-${member}`}>
          <Box className={classes.address}>
            <Box className={classes.rowIconContainer}>
              <AddCircleOutlineIcon htmlColor="green" className={classes.memberIcon} width={16} height={16} />
            </Box>
            {truncateEthAddress(member)}
          </Box>
        </Box>
      )
    }

    if (change === "remove") {
      return (
        <Box className={classNames(classes.rowItemContainer, classes.remove)} key={`remove-${member}`}>
          <Box className={classes.address}>
            <Box className={classes.rowIconContainer}>
              <RemoveCircleOutlineIcon color="error" className={classes.memberIcon} width={16} height={16} />
            </Box>
            {truncateEthAddress(member)}
          </Box>
        </Box>
      )
    }
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography className={classes.label}>Members</Typography>
      {!members.add.length && !members.remove.length && <p>No member changes</p>}
      {members.add.map(memberRow("add"))}
      {members.remove.map(memberRow("remove"))}
    </Box>
  )
}

type TargetsProps = {
  targets: {
    list: Target[]
    add: Target[]
    remove: string[]
  }
}
const Targets = ({ targets }: TargetsProps): React.ReactElement => {
  const classes = useStyles()
  const { state } = useContext(RoleContext)

  const targetRemoveByAddress = (targetAddress: string) => (
    <Box className={classNames(classes.rowItemContainer, classes.remove)} key={`remove${targetAddress}`}>
      <Box className={classes.address}>
        <Box className={classes.rowIconContainer}>
          <RemoveCircleOutlineIcon color="error" className={classes.memberIcon} width={16} height={16} />
        </Box>
        {truncateEthAddress(targetAddress)}
      </Box>
    </Box>
  )

  const targetAddOrUpdate = (changeType: "add" | "update") => (target: Target) => {
    const changes = state.getTargetUpdate(target.id)
    console.log("changes:")
    console.log(changes)

    return (
      <Box
        className={classNames(classes.rowItemContainer, { [classes.add]: changeType === "add" })}
        key={`${changeType}-${target.address}`}
      >
        <Box className={classes.address}>
          {changeType === "add" && (
            <Box className={classes.rowIconContainer}>
              <AddCircleOutlineIcon htmlColor="green" className={classes.memberIcon} width={16} height={16} />
            </Box>
          )}
          {truncateEthAddress(target.address)}
        </Box>
        <Box className={classes.targetNumberOfChanges}>{`${changes.length} ${
          changeType === "add" ? "details" : "updates"
        }`}</Box>
      </Box>
    )
  }

  const targetsToUpdate = targets.list
    .filter(({ address }) => !targets.remove.includes(address))
    .filter(({ id }) => state.getTargetUpdate(id)?.length)

  return (
    <Box sx={{ mt: 2 }}>
      <Typography className={classes.label}>Targets</Typography>
      {!targets.add.length && !targetsToUpdate.length && !targets.remove.length && <p>No target changes</p>}
      {targets.add.map(targetAddOrUpdate("add"))}
      {targetsToUpdate.map(targetAddOrUpdate("update"))}
      {targets.remove.map(targetRemoveByAddress)}
    </Box>
  )
}

export default PendingChanges
