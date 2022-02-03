import React, { useEffect } from "react"
import { Box, Table, TableHead, TableBody, TableRow, TableCell, makeStyles } from "@material-ui/core"
import classNames from "classnames"
import RoleTableRow from "./RoleTableRow"
import { useRootDispatch, useRootSelector } from "../store"
import { getRoles, getRolesModifierAddress } from "../store/main/selectors"
import { fetchRoles } from "../store/main/rolesSlice"

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
  const dispatch = useRootDispatch()
  const roles = useRootSelector(getRoles)
  const rolesModifierAddress = useRootSelector(getRolesModifierAddress)

  useEffect(() => {
    dispatch(fetchRoles())
  }, [rolesModifierAddress, dispatch])

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
