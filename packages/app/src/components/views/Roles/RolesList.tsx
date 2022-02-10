import { Box, Button } from "@material-ui/core"
import { Link, useParams } from "react-router-dom"
import AddIcon from "@material-ui/icons/Add"
import RoleTable from "../Role/RoleTable"
import React from "react"

export const RolesList = () => {
  const { module } = useParams()
  return (
    <>
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
    </>
  )
}
