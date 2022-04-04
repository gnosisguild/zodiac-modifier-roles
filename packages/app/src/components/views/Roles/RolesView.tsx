import React from "react"
import { makeStyles, Paper } from "@material-ui/core"
import { RolesList } from "./RolesList"
import { useRootSelector } from "../../../store"
import { getRoles } from "../../../store/main/selectors"
import { RolesEmpty } from "./RolesEmpty"
import { useFetchRoles } from "../../../hooks/useFetchRoles"
import classNames from "classnames"

const useStyles = makeStyles((theme) => ({
  container: {
    flexGrow: 1,
    padding: theme.spacing(2),
    background: "transparent",
  },
  center: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
}))

export const RolesView = (): React.ReactElement => {
  const classes = useStyles()

  useFetchRoles()

  const roles = useRootSelector(getRoles)

  if (roles.length) {
    return (
      <Paper className={classes.container}>
        <RolesList />
      </Paper>
    )
  }
  return (
    <Paper className={classNames(classes.container, classes.center)}>
      <RolesEmpty />
    </Paper>
  )
}

export default RolesView
