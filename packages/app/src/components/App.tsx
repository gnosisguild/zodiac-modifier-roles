import React, { useState } from "react"
import { Box, Button, Grid, InputAdornment, makeStyles } from "@material-ui/core"
import { TextField } from "./commons/input/TextField"
import { Header } from "./Header"
import SearchIcon from '@material-ui/icons/Search'
import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk"
import CreateRoleModal from "./CreateRoleModal"
import AttachSafeModal from "./AttachSafeModal"
import RoleList from "./RoleList"
import AddIcon from "../assets/icons/add.svg";

const rolesModifierAddress = "0xbdfdf9b21e18883a107d185ec80733c402357fdc" // TODO: get this for the current safe in the subgraph

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minHeight: '100vh',
    padding: theme.spacing(3),
  },
  container: {
    border: "1px solid rgba(217, 212, 173, 0.3)",
    display: 'flex',
    flexDirection: 'column',
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

export const App = (): React.ReactElement => {
  const classes = useStyles()
  const [createRoleModalIsOpen, setCreateRoleModalIsOpen] = useState(false)
  const { connected } = useSafeAppsSDK()

  return (
    <div className={classes.root}>
      <Header/>
      <Grid container spacing={1} className={classes.container}>
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
              startIcon={<img src={AddIcon} alt="add" />}
              variant="contained"
              color="secondary" onClick={() => setCreateRoleModalIsOpen(true)}
            >
              Create a role
            </Button>
          </Box>
          <RoleList modifierAddress={rolesModifierAddress} />
          <CreateRoleModal
            isOpen={createRoleModalIsOpen}
            onClose={() => setCreateRoleModalIsOpen(false)}
            rolesModifierAddress={rolesModifierAddress}
          />
        </Grid>
      </Grid>
      <AttachSafeModal isOpen={!connected} onClose={() => console.log("close")} />
    </div>
  )
}

export default App
