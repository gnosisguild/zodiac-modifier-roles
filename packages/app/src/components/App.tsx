import React, { useState } from "react"
import { Grid, makeStyles, Button } from "@material-ui/core"
import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk"
import CreateRoleModal from "./CreateRoleModal"
import AttachSafeModal from "./AttachSafeModal"
import RoleList from "./RoleList"

const rolesModifierAddress = "0xbdfdf9b21e18883a107d185ec80733c402357fdc" // TODO: get this for the current safe in the subgraph

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  container: {
    minHeight: "90vh",
    position: "relative",
    "&::before": {
      content: '" "',
      position: "absolute",
      zIndex: 1,
      top: "0px",
      left: "0px",
      right: "0px",
      bottom: "0px",
      border: "1px solid rgba(217, 212, 173, 0.3)",
      pointerEvents: "none",
    },
  },
  item: {
    border: "1px solid rgba(217, 212, 173, 0.3)",
    height: "100%",
    textAlign: "center",
  },
  space: {
    marginTop: theme.spacing(3),
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
      <div className={classes.space}>
        <Grid container spacing={1} className={classes.container}>
          <Grid item xs={12}>
            <RoleList modifierAddress={rolesModifierAddress} />
            <Button size="large" variant="contained" color="secondary" onClick={() => setCreateRoleModalIsOpen(true)}>
              Create a new role
            </Button>
            <CreateRoleModal
              isOpen={createRoleModalIsOpen}
              onClose={() => setCreateRoleModalIsOpen(false)}
              rolesModifierAddress={rolesModifierAddress}
            />
          </Grid>
        </Grid>
        <AttachSafeModal isOpen={!connected} onClose={() => console.log("close")} />
      </div>
    </div>
  )
}

export default App
