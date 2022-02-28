import React, { useContext, useState } from "react"
import { Box, makeStyles, Typography } from "@material-ui/core"
import Modal from "../commons/Modal"
import { useAbi } from "../../hooks/useAbi"
import { RoleContext } from "../views/Role/RoleContext"
import { Target } from "../../typings/role"

const useStyles = makeStyles((theme) => ({
  label: {
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(0.5),
  },
}))

type ABI = any
type Address = string
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
  return (
    <Box sx={{ mt: 2 }}>
      <Typography className={classes.label}>Members</Typography>
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
  return (
    <Box sx={{ mt: 2 }}>
      <Typography className={classes.label}>Targets</Typography>
    </Box>
  )
}

export default PendingChanges
