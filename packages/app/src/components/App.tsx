import React, { useState } from "react"
import { Grid, makeStyles } from "@material-ui/core"
import { useRootSelector } from "../store"
import { getSafeAddress } from "../store/main/selectors"
import AttachSafe from "./AttachSafe/AttachSafe"
import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk"
import { Button, GenericModal, Icon, ModalFooterConfirmation, Text } from "@gnosis.pm/safe-react-components"
import CreateRoleModal from "./CreateRoleModal"

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  container: {
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
  const [isOpen, setIsOpen] = useState(false)
  const { sdk, connected, safe } = useSafeAppsSDK()

  const content = connected ? (
    <Grid container spacing={1} className={classes.container}>
      <Grid item xs={12}>
        <div className={classes.item}>
          <Text size="xl">Attacked Safe: {safe.safeAddress}</Text>
          <Button
            size="md"
            color="primary"
            onClick={() => setIsOpen(!isOpen)}
            startIcon={<Icon size="md" type="add" />}
          >
            Create a new role
          </Button>
          {isOpen && (
            <CreateRoleModal onClose={() => setIsOpen(false)}/>
          )}
        </div>
      </Grid>
    </Grid>
  ) : (
    <AttachSafe />
  )

  return (
    <div className={classes.root}>
      <div className={classes.space}>{content}</div>
    </div>
  )
}

export default App
