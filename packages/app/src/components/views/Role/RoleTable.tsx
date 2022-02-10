import React from "react"
import { Box, makeStyles, Table, TableBody, TableCell, TableHead, TableRow } from "@material-ui/core"
import classNames from "classnames"
import RoleTableRow from "./RoleTableRow"
import { useRootSelector } from "../../../store"
import { getRoles } from "../../../store/main/selectors"

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: theme.spacing(2),
  },
  actionsCell: {
    width: 200,
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
}))

const RoleTable = (): React.ReactElement => {
  const classes = useStyles()
  const roles = useRootSelector(getRoles)

  return (
    <Box className={classes.root}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell className={classes.tableHeadCell}>Role</TableCell>
            <TableCell className={classes.tableHeadCell}>Members</TableCell>
            <TableCell className={classes.tableHeadCell}>Targets</TableCell>
            <TableCell className={classNames(classes.tableHeadCell, classes.actionsCell)} />
          </TableRow>
        </TableHead>
        <TableBody>
          {roles.map((role) => (
            <RoleTableRow key={role.id} role={role} />
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}

export default RoleTable
