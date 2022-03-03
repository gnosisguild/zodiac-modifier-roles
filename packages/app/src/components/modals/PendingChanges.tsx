import React, { useContext } from "react"
import { Box, Divider, makeStyles, Typography } from "@material-ui/core"
import Modal from "../commons/Modal"
import AddCircleOutlineIcon from "@material-ui/icons/AddCircleOutline"
import HighlightOffIcon from "@material-ui/icons/HighlightOff"
import RemoveCircleOutlineIcon from "@material-ui/icons/RemoveCircleOutline"
import { Level, RoleContext } from "../views/Role/RoleContext"
import { Target } from "../../typings/role"
import { truncateEthAddress } from "../../utils/address"
import classNames from "classnames"
import { isEqual } from "lodash"

const useStyles = makeStyles((theme) => ({
  memberContainer: {
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
  memberIconContainer: {
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
    "&::before": {
      backgroundColor: "rgba(104, 195, 163, 0.1)",
    },
  },
  remove: {
    "&::before": {
      backgroundColor: "rgba(254, 121, 104, 0.1)",
    },
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
        <Box className={classNames(classes.memberContainer, classes.add)}>
          <Box className={classes.address}>
            <Box className={classes.memberIconContainer}>
              <AddCircleOutlineIcon htmlColor="green" className={classes.memberIcon} width={16} height={16} />
            </Box>
            {truncateEthAddress(member)}
          </Box>
        </Box>
      )
    }

    if (change === "remove") {
      return (
        <Box className={classNames(classes.memberContainer, classes.remove)}>
          <Box className={classes.address}>
            <Box className={classes.memberIconContainer}>
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
  /*
	- add new target
		- allow all calls
		- with detailed function and parameter configs

		- remove target
		- update target with changed function and parameter configs
	*/
  console.log(targets)

  const removedTarget = (targetAddress: string) => (
    <Box className={classNames(classes.memberContainer, classes.remove)}>
      <Box className={classes.address}>
        <Box className={classes.memberIconContainer}>
          <RemoveCircleOutlineIcon color="error" className={classes.memberIcon} width={16} height={16} />
        </Box>
        {truncateEthAddress(targetAddress)}
      </Box>
    </Box>
  )

  const targetSection = (changeType: "add" | "update") => (target: Target) => {
    const changes = state.getTargetUpdate(target.id)
    if (changeType === "update" && !changes?.length) return // there are no changes to the target
    console.log(changes)
    const updatingExecutionOptions =
      changes.filter(
        ({ value, old }: any) => old.type === "Target" && value?.executionOption !== old?.executionOption, // TODO: dirty, must be fixed once the types is set
      ).length !== 0
    return (
      <Box className={classNames(classes.memberContainer, { [classes.add]: changeType === "add" })}>
        <Box className={classes.address}>
          <Box className={classes.memberIconContainer}>
            <AddCircleOutlineIcon htmlColor="green" className={classes.memberIcon} width={16} height={16} />
          </Box>
          {truncateEthAddress(target.address)}
        </Box>
        {!updatingExecutionOptions && <Box>{"Execution Options: " + target.executionOption}</Box>}
        {/* {changes.map(change => ())} */}
      </Box>
    )
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography className={classes.label}>Targets</Typography>
      {targets.add.map(targetSection("add"))}
      {targets.list.filter((target) => !targets.remove.includes(target.address)).map(targetSection("update"))}
      {targets.remove.map(removedTarget)}
    </Box>
  )
}

export default PendingChanges
