import React from "react"
import { Box, Button, IconButton, TableRow, TableCell, makeStyles } from "@material-ui/core"
import KeyboardArrowRightSharp from "@material-ui/icons/KeyboardArrowRightSharp"
import { Role } from "../../../typings/role"
import { useNavigate, useParams } from "react-router-dom"

const useStyles = makeStyles(() => ({
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

type Props = { role: Role }

const RoleTableRow = ({ role }: Props): React.ReactElement => {
  const classes = useStyles()
  const { module } = useParams()
  const navigate = useNavigate()
  const handleNavigation = () => navigate(`/${module}/roles/${role.name}`)
  const targets = role.targets.filter((target) => target.type !== "None")

  return (
    <TableRow key={role.id} className={classes.tableRow} onClick={handleNavigation}>
      <TableCell className={classes.tableCell}>{`Role #${role.name}`}</TableCell>
      <TableCell className={classes.tableCell}>{`${role.members.length} Members`}</TableCell>
      <TableCell className={classes.tableCell}>{`${targets.length} Targets`}</TableCell>
      <TableCell className={classes.tableCell}>
        <Box display="flex" justifyContent="flex-end">
          <Box sx={{ mr: 1 }}>
            <Button aria-label="Edit Role" className={classes.tableButton}>
              Edit
            </Button>
          </Box>
          {/* <Box sx={{ mr: 1 }}>
            <IconButton
              size="small"
              aria-label="Delete Role"
              className={classNames(classes.iconButton, classes.deleteButton)}
            >
              <DeleteOutlineSharp className={classes.deleteIcon} />
            </IconButton>
          </Box> */}
          <IconButton size="small" aria-label="View Role" className={classes.iconButton}>
            <KeyboardArrowRightSharp className={classes.arrowIcon} />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  )
}

export default RoleTableRow
