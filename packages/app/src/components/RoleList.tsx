import React from "react"
import { Role, useGetRolesForRolesModifier } from "../hooks/useSubgraph"
import {
  Box,
  Button,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  makeStyles,
} from "@material-ui/core"
import KeyboardArrowRightSharp from "@material-ui/icons/KeyboardArrowRightSharp"
import DeleteOutlineSharp from "@material-ui/icons/DeleteOutlineSharp"
import clsx from "clsx"

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: theme.spacing(2),
  },
  arrowIcon: {
    color: "rgba(217, 212, 173, 1)",
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
  memberCell: {
    width: "50%",
  },
  tableButton: {
    backgroundColor: "rgba(217, 212, 173, 0.1)",
    border: "1px solid rgba(217, 212, 173, 0.3)",
    borderRadius: 8,
    color: "rgba(217, 212, 173, 1)",
    "&:before": {
      content: "none",
    },
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
}))

type Props = {
  modifierAddress: string
  openRole: (role: Role) => void
}

const RoleList = ({ modifierAddress, openRole }: Props): React.ReactElement => {
  const classes = useStyles()
  const roles = useGetRolesForRolesModifier(modifierAddress)

  console.log(roles)

  return (
    <Box className={classes.root}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell className={classes.tableHeadCell}>Role</TableCell>
            <TableCell className={clsx(classes.tableHeadCell, classes.memberCell)}>Members</TableCell>
            <TableCell className={classes.tableHeadCell} />
          </TableRow>
        </TableHead>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.id} className={classes.tableRow} onClick={() => openRole(role)}>
              <TableCell className={classes.tableCell}>{`Role #${role.id}`}</TableCell>
              <TableCell className={classes.tableCell}>{`${role.members.length} Members`}</TableCell>
              <TableCell className={classes.tableCell}>
                <Box display="flex" justifyContent="flex-end">
                  <Box sx={{ mr: 1 }}>
                    <Button aria-label="Edit Role" className={classes.tableButton} onClick={() => openRole(role)}>
                      Edit
                    </Button>
                  </Box>
                  <Box sx={{ mr: 1 }}>
                    <IconButton
                      size="small"
                      aria-label="Delete Role"
                      className={clsx(classes.iconButton, classes.deleteButton)}
                    >
                      <DeleteOutlineSharp className={classes.deleteIcon} />
                    </IconButton>
                  </Box>
                  <IconButton size="small" aria-label="View Role" className={classes.iconButton}>
                    <KeyboardArrowRightSharp className={classes.arrowIcon} />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}

export default RoleList
