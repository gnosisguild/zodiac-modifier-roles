import React  from "react"
import { useGetRolesForRolesModifier } from "../hooks/useSubgraph"
import { Button, Box, Table, TableHead, TableBody, TableRow, TableCell, makeStyles} from "@material-ui/core"
import clsx from "clsx"

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: theme.spacing(2),
  },
  memberCell: {
    width: '50%',
  },
  tableCell: {
    borderBottom: '1px solid rgba(217, 212, 173, 0.3)',
  },
  tableHeadCell: {
    borderBottom: '1px solid rgba(217, 212, 173, 0.7)',
    borderTop: '1px solid rgba(217, 212, 173, 0.7)',
    color: 'rgba(217, 212, 173)',
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
}))

type Props = {
  modifierAddress: string
}

const RoleList = ({ modifierAddress }: Props): React.ReactElement => {
  const classes = useStyles()
  const roles = useGetRolesForRolesModifier(modifierAddress)

	console.log(roles)

  return (
    <Box className={classes.root}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell className={classes.tableHeadCell}>
              Role
            </TableCell>
            <TableCell className={clsx(classes.tableHeadCell, classes.memberCell)}>
              Members
            </TableCell>
            <TableCell className={classes.tableHeadCell} />
          </TableRow>
        </TableHead>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.id} >
              <TableCell className={classes.tableCell}>
                {`Role #${role.id}`}
              </TableCell>
              <TableCell className={classes.tableCell}>
                {`${role.members.length} Members`}
              </TableCell>
              <TableCell className={classes.tableCell}>
                <Box display="flex" justifyContent="flex-end">
                  <Button>
                    Edit
                  </Button>
                  <Button>
                    Delete
                  </Button>
                  <div>^</div>
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
