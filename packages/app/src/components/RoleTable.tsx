import React from "react"
import { Role, useGetRolesForRolesModifier } from "../hooks/useSubgraph"
import { Box, Table, TableHead, TableBody, TableRow, TableCell, makeStyles } from "@material-ui/core"
import clsx from "clsx"
import RoleTableRow from "./RoleTableRow"

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: theme.spacing(2),
  },
  memberCell: {
    width: "50%",
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
            <RoleTableRow key={role.id} role={role} onClickRole={openRole} />
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}

export default RoleList
