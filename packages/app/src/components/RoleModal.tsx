import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  makeStyles,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@material-ui/core"
import React, { useState } from "react"
import { Role } from "../hooks/useSubgraph"
import Modal from "./commons/Modal"
import clsx from "clsx"
import { DeleteOutlineSharp } from "@material-ui/icons"
import { TextField } from "./commons/input/TextField"
import { ethers } from "ethers"
import { useWallet } from "../hooks/useWallet"
import AddIcon from "@material-ui/icons/Add"
import * as rolesModifier from "../services/rolesModifier"
import { useRootSelector } from "../store"
import { getRolesModifierAddress } from "../store/main/selectors"

const useStyles = makeStyles((theme) => ({
  spacing: {
    marginBottom: theme.spacing(2),
  },
  errorSpacing: {
    marginTop: theme.spacing(2),
  },
  tableCell: {
    borderBottom: "1px solid rgba(217, 212, 173, 0.3)",
  },
  tableHeadCell: {
    borderBottom: "1px solid rgba(217, 212, 173, 0.7)",
    borderTop: "1px solid rgba(217, 212, 173, 0.7)",
    color: "rgba(217, 212, 173)",
    fontSize: 14,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  tableRow: {
    cursor: "pointer",
    "&:hover $tableCell": {
      backgroundColor: "rgba(217, 212, 173, 0.02)",
    },
  },
  iconButton: {
    borderRadius: 8,
    color: "rgba(217, 212, 173, 1)",
    width: 34,
    height: 34,
  },
  deleteButton: {
    backgroundColor: "rgba(217, 212, 173, 0.1)",
    border: "1px solid rgba(217, 212, 173, 0.3)",
    "&:hover": {
      opacity: 0.8,
    },
  },
  deleteIcon: {
    width: 16,
  },
}))

type Props = {
  isOpen: boolean
  role: Role | undefined
  onClose: () => void
}

const RoleModal = ({ isOpen, role, onClose: oncloseIn }: Props): React.ReactElement => {
  const classes = useStyles()
  const [isValidAddress, setIsValidAddress] = useState(false)
  const [memberAddress, setMemberAddress] = useState("")
  const [isWaiting, setIsWaiting] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [info, setInfo] = useState<string | undefined>(undefined)
  const { provider } = useWallet()
  const rolesModifierAddress = useRootSelector(getRolesModifierAddress)

  if (role == null) {
    return <></>
  }

  if (rolesModifierAddress == null) {
    console.error("No rolesModifierAddress")
    return <></>
  }

  const onClose = () => {
    oncloseIn()
    setError(undefined)
    setInfo(undefined)
  }

  const onMemberAddressChange = (address: string) => {
    if (ethers.utils.isAddress(address)) {
      setIsValidAddress(true)
      setMemberAddress(address)
    } else {
      setIsValidAddress(false)
      setMemberAddress(address)
    }
  }

  const onAddMember = async () => {
    setIsWaiting(true)
    try {
      await rolesModifier.addMember(provider, rolesModifierAddress, role.id, memberAddress)
      setInfo("Add member transaction initiated")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsWaiting(false)
    }
  }

  const onRemoveMember = async (memberToBeRemoved: string) => {
    setIsWaiting(true)
    try {
      await rolesModifier.removeMember(provider, rolesModifierAddress, role.id, memberToBeRemoved)
      setInfo("Remove member transaction initiated")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsWaiting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Typography className={classes.spacing} variant="h4">
        {`Role #${role.id}`}
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell className={classes.tableHeadCell}>Member Address</TableCell>
            <TableCell className={classes.tableHeadCell} />
          </TableRow>
        </TableHead>
        <TableBody>
          {role.members.length !== 0 ? (
            role.members.map(({ member }) => (
              <TableRow key={member.id} className={classes.tableRow}>
                <TableCell className={classes.tableCell}>{member.id}</TableCell>
                <TableCell className={classes.tableCell}>
                  <Box display="flex" justifyContent="flex-end">
                    <Box sx={{ mr: 1 }}>
                      <IconButton
                        size="small"
                        aria-label="Remove member"
                        className={clsx(classes.iconButton, classes.deleteButton)}
                        onClick={() => onRemoveMember(member.address)}
                      >
                        <DeleteOutlineSharp className={classes.deleteIcon} />
                      </IconButton>
                    </Box>
                  </Box>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow className={classes.tableRow}>
              <TableCell className={classes.tableCell}>No members</TableCell>
              <TableCell className={classes.tableCell}></TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TextField onChange={(e) => onMemberAddressChange(e.target.value)} label="Member Address" placeholder="0x..." />
      <Box sx={{ mt: 2 }}>
        <Button
          fullWidth
          color="secondary"
          size="large"
          variant="contained"
          onClick={onAddMember}
          disabled={!isValidAddress || isWaiting}
          startIcon={isWaiting ? <CircularProgress size={18} color="primary" /> : <AddIcon />}
        >
          {isWaiting ? "Adding member..." : "Add member"}
        </Button>
      </Box>
      {error != null && (
        <Typography align="center" color="error" className={classes.errorSpacing}>
          {error}
        </Typography>
      )}
      {info != null && <Typography align="center">{info}</Typography>}
    </Modal>
  )
}

export default RoleModal
