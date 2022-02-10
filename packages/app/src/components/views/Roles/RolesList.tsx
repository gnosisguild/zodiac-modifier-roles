import React from "react"
import { Box, Button, InputAdornment, makeStyles } from "@material-ui/core"
import { Link, useParams } from "react-router-dom"
import RoleTable from "../Role/RoleTable"
import { TextField } from "../../commons/input/TextField"

import AddIcon from "@material-ui/icons/Add"
import SearchIcon from "@material-ui/icons/Search"

const useStyles = makeStyles((theme) => ({
  search: {
    maxWidth: 300,
  },
  grow: {
    flexGrow: 1,
  },
}))

export const RolesList = () => {
  const classes = useStyles()
  const { module } = useParams()
  return (
    <>
      <Box display="flex">
        <TextField
          placeholder="Filter by Members or Targets"
          className={classes.search}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <div className={classes.grow} />
        <Link to={`/${module}/roles/new`}>
          <Button startIcon={<AddIcon />} variant="contained" color="secondary">
            Create a role
          </Button>
        </Link>
      </Box>
      <RoleTable />
    </>
  )
}
