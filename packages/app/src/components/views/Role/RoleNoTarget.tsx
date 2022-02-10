import { Box, makeStyles, Typography } from "@material-ui/core"
import { Link as RouterLink } from "react-router-dom"
import ButtonLink from "../../commons/input/ButtonLink"
import { ArrowBackSharp } from "@material-ui/icons"

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
          You currently have no targets associated with this role.
          <br />
          Once you’ve added a target, you can configure the permissions here.
        </Typography>
        <Box sx={{ mt: 2 }}>
          <RouterLink to="/">
            <ButtonLink icon={<ArrowBackSharp fontSize="small" />} text="Go back to Roles" />
          </RouterLink>
        </Box>
      </Box>
    </Box>
  )
}
