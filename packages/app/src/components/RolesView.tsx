import React, { useState } from "react"
import { Box, Button, Grid, InputAdornment, makeStyles } from "@material-ui/core"
import { TextField } from "./commons/input/TextField"
import AddIcon from "@material-ui/icons/Add"
import SearchIcon from "@material-ui/icons/Search"
import CreateRoleModal from "./CreateRoleModal"
import RoleTable from "./RoleTable"
import RoleModal from "./RoleModal"
import { Role } from "../typings/role"

const useStyles = makeStyles((theme) => ({
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
  const [createRoleModalIsOpen, setCreateRoleModalIsOpen] = useState(false)
  const [openRole, setOpenRole] = useState<Role | undefined>()

  return (
    <Grid item xs={12}>
      <Box display="flex" justifyContent="space-between">
        <TextField
          placeholder="Filter by Members"
          className={classes.search}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          color="secondary"
          onClick={() => setCreateRoleModalIsOpen(true)}
        >
          Create a role
        </Button>
      </Box>
      <RoleTable />
      <CreateRoleModal isOpen={createRoleModalIsOpen} onClose={() => setCreateRoleModalIsOpen(false)} />
      <RoleModal isOpen={openRole != null} role={openRole} onClose={() => setOpenRole(undefined)} />
    </Grid>
  )
}

export default RolesView
