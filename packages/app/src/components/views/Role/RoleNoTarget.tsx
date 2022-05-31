import { Box, makeStyles, Typography } from "@material-ui/core"

const useStyles = makeStyles(() => ({
  mainPanelZeroState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
}))

export const RoleNoTarget = () => {
  const classes = useStyles()
  return (
    <Box className={classes.mainPanelZeroState}>
      <Box sx={{ display: "flex", alignItems: "center", flexDirection: "column" }}>
        <Typography variant="body1" align="center">
          Here you can configure the role's targets.
          <br />
          Add or select a target to get started.
        </Typography>
      </Box>
    </Box>
  )
}
