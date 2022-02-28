import React, { useContext, useState } from "react"
import { Box, makeStyles, Typography } from "@material-ui/core"
import Modal from "../commons/Modal"
import { useAbi } from "../../hooks/useAbi"
import AddCircleIcon from "@material-ui/icons/AddCircle"
import HighlightOffIcon from "@material-ui/icons/HighlightOff"
import { RoleContext } from "../views/Role/RoleContext"
import { Target } from "../../typings/role"
import { truncateEthAddress } from "../../utils/address"

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
  console.log(members)

  const memberRow = (change: "add" | "remove") => (member: string) => {
    if (change === "add") {
      return (
        <Box className={classes.memberContainer}>
          <Box className={classes.address}>
            <Box className={classes.memberIconContainer}>
              <AddCircleIcon color="action" className={classes.memberIcon} width={16} height={16} />
            </Box>
            {truncateEthAddress(member)}
          </Box>
        </Box>
      )
    }

    if (change === "remove") {
      return (
        <Box className={classes.memberContainer}>
          <Box className={classes.address}>
            <Box className={classes.memberIconContainer}>
              <HighlightOffIcon color="error" className={classes.memberIcon} width={16} height={16} />
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
  // const { abi } = useAbi(target.address)

  const targetSection = (change: "add" | "remove") => (target: string) => {
    if (change === "add") {
      return (
        <Box className={classes.memberContainer}>
          <Box className={classes.address}>
            <Box className={classes.memberIconContainer}>
              <AddCircleIcon color="action" className={classes.memberIcon} width={16} height={16} />
            </Box>
            {truncateEthAddress(target)}
          </Box>
        </Box>
      )
    }

    if (change === "remove") {
      return (
        <Box className={classes.memberContainer}>
          <Box className={classes.address}>
            <Box className={classes.memberIconContainer}>
              <HighlightOffIcon color="error" className={classes.memberIcon} width={16} height={16} />
            </Box>
            {truncateEthAddress(target)}
          </Box>
        </Box>
      )
    }
  }

  // ToDo: add changes and more
  return (
    <Box sx={{ mt: 2 }}>
      <Typography className={classes.label}>Targets</Typography>
      {targets.add.map((target) => target.address).map(targetSection("add"))}
      {targets.remove.map(targetSection("remove"))}
    </Box>
  )
}

export default PendingChanges
