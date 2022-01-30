import React from "react"
import { Role } from "../hooks/useSubgraph"
import { Box, Button, IconButton, TableRow, TableCell, makeStyles } from "@material-ui/core"
import KeyboardArrowRightSharp from "@material-ui/icons/KeyboardArrowRightSharp"
import DeleteOutlineSharp from "@material-ui/icons/DeleteOutlineSharp"
import clsx from "clsx"

const useStyles = makeStyles((theme) => ({
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
  tableRow: {
    cursor: "pointer",
    "&:hover $tableCell": {
      backgroundColor: "rgba(217, 212, 173, 0.02)",
    },
  },
}))

type Props = { role: Role; onClickRole: (role: Role) => void }

const RoleListItem = ({ role, onClickRole }: Props): React.ReactElement => {
  const classes = useStyles()

  return (
    <TableRow key={role.id} className={classes.tableRow} onClick={() => onClickRole(role)}>
      <TableCell className={classes.tableCell}>{`Role #${role.id}`}</TableCell>
      <TableCell className={classes.tableCell}>{`${role.members.length} Members`}</TableCell>
      <TableCell className={classes.tableCell}>
        <Box display="flex" justifyContent="flex-end">
          <Box sx={{ mr: 1 }}>
            <Button aria-label="Edit Role" className={classes.tableButton} onClick={() => onClickRole(role)}>
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
  )
}

export default RoleListItem
