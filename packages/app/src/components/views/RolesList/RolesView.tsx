import React from "react"
import { Box, Button, Grid, makeStyles } from "@material-ui/core"
import AddIcon from "@material-ui/icons/Add"
import RoleTable from "../Role/RoleTable"
import { Link, useParams } from "react-router-dom"

const useStyles = makeStyles((theme) => ({
  container: {
    border: "1px solid rgba(217, 212, 173, 0.3)",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    padding: theme.spacing(2),
    position: "relative",
    "&::before": {
      content: '" "',
      position: "absolute",
      zIndex: 1,
      inset: 3,
      border: "1px solid rgba(217, 212, 173, 0.3)",
      pointerEvents: "none",
    },
  },
  item: {
    border: "1px solid rgba(217, 212, 173, 0.3)",
    height: "100%",
    textAlign: "center",
  },
  search: {
    maxWidth: 240,
  },
  tableCard: {
    paddingLeft: "0px !important",
  },
}))

export const RolesView = (): React.ReactElement => {
  const classes = useStyles()
  const { module } = useParams()

  return (
    <Grid container spacing={1} className={classes.container}>
      <Grid item xs={12}>
        <Box display="flex" justifyContent="flex-end">
          {/* <TextField
            placeholder="Filter by Members"
            className={classes.search}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          /> */}
          <Link to={`/${module}/roles/new`}>
            <Button startIcon={<AddIcon />} variant="contained" color="secondary">
              Create a role
            </Button>
          </Link>
        </Box>
        <RoleTable />
      </Grid>
    </Grid>
  )
}

export default RolesView
