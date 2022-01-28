import {
  Box,
  IconButton,
  makeStyles,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@material-ui/core"
import React from "react"
import { Role } from "../hooks/useSubgraph"
import Modal from "./commons/Modal"
import clsx from "clsx"
import { DeleteOutlineSharp } from "@material-ui/icons"

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
  modifierAddress: string
  isOpen: boolean
  role: Role | undefined
  onClose: () => void
}

const RoleModal = ({ modifierAddress, isOpen, role, onClose: oncloseIn }: Props): React.ReactElement => {
  const classes = useStyles()
  if (role == null) {
    return <></>
  }
  const onClose = () => {
    oncloseIn()
    // cleanup when closing
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
    </Modal>
  )
}

export default RoleModal
