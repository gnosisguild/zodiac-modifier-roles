import { useState } from "react"
import { Box, Button, CircularProgress, Grid, Link, makeStyles, Typography } from "@material-ui/core"
import AddIcon from "@material-ui/icons/Add"
import ArrowBackSharp from "@material-ui/icons/ArrowBackSharp"

const useStyles = makeStyles((theme) => ({
  container: {
    height: "100%",
    position: "relative",
    flexGrow: 1,
    padding: 1,
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
  errorSpacing: {
    marginTop: theme.spacing(2),
  },
  img: {
    borderRadius: "50%",
    border: "1px solid rgba(250, 132, 132, 0.2)",
    padding: 4,
    width: 68,
  },
  item: {
    border: "1px solid rgba(217, 212, 173, 0.3)",
    height: "100%",
    padding: theme.spacing(2),
  },
  label: {
    color: theme.palette.text.primary,
    lineHeight: 1,
  },
  labelLink: {
    color: "rgba(217,212,173, 0.6)",
    cursor: "pointer",
    lineHeight: 1,
    "&:hover": {
      color: "rgba(217,212,173, 0.3)",
    },
  },
  labelWrapper: {
    alignItems: "flex-end",
    display: "flex",
    justifyContent: "space-between",
  },
  sideBar: {
    paddingRight: "0 !important",
    "& $item": {
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    },
  },
  mainPanelZeroState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  viewRolesLink: {
    color: "rgb(217,212,173)",
    cursor: "pointer",
    fontSize: 16,
    textDecoration: "none !important",
    textUnderlineOffset: "2px",
    "&:hover": {
      textDecoration: "underline !important",
    },
  },
}))

const RoleView = () => {
  const classes = useStyles()
  const [isWaiting, setIsWaiting] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 3,
          mt: 1,
        }}
      >
        <Typography variant="h4">Create a new role</Typography>
        <Link className={classes.viewRolesLink}>
          <Box display="flex" alignItems="center">
            <ArrowBackSharp fontSize="small" />
            <Box sx={{ ml: 1 }}>View All Roles</Box>
          </Box>
        </Link>
      </Box>

      <Grid container spacing={1} className={classes.container}>
        <Grid item xs={4} lg={3} className={classes.sideBar}>
          <Box className={classes.item}>
            <Box>
              <Typography variant="h5">Role #1</Typography>
              <Box
                sx={{
                  bgcolor: "rgba(217, 212, 173, 0.1)",
                  height: 1,
                  my: 2,
                  width: "100%",
                }}
              />
              <Box className={classes.labelWrapper}>
                <Typography variant="body1" className={classes.label}>
                  Members
                </Typography>
                <Link href="#">
                  <Typography variant="body2" className={classes.labelLink}>
                    What's a member?
                  </Typography>
                </Link>
              </Box>
              <Box sx={{ mt: 1 }}>
                <Button
                  fullWidth
                  color="secondary"
                  size="large"
                  variant="contained"
                  // onClick={onSubmit}
                  startIcon={<AddIcon />}
                >
                  Add a Member
                </Button>
              </Box>
              <Box className={classes.labelWrapper} sx={{ mt: 4 }}>
                <Typography variant="body1" className={classes.label}>
                  Targets
                </Typography>
                <Link href="#">
                  <Typography variant="body2" className={classes.labelLink}>
                    What's a target?
                  </Typography>
                </Link>
              </Box>
              <Box sx={{ mt: 1 }}>
                <Button
                  fullWidth
                  color="secondary"
                  size="large"
                  variant="contained"
                  // onClick={onSubmit}
                  startIcon={<AddIcon />}
                >
                  Add a Target
                </Button>
              </Box>
            </Box>
            <Button
              fullWidth
              color="secondary"
              size="large"
              variant="contained"
              // onClick={onSubmit}
              disabled={isWaiting}
              startIcon={isWaiting ? <CircularProgress size={18} color="primary" /> : <AddIcon />}
            >
              {isWaiting ? "Creating role..." : "Create role"}
            </Button>
          </Box>

          {error != null && (
            <Typography color="error" className={classes.errorSpacing}>
              {error}
            </Typography>
          )}
        </Grid>
        <Grid item xs={8} lg={9}>
          <Box className={classes.item}>
            {/* If the role has no targets set */}
            <Box className={classes.mainPanelZeroState}>
              <Box sx={{ display: "flex", alignItems: "center", flexDirection: "column" }}>
                <Typography variant="body1" align="center">
                  You currently have no targets associated with this role.
                  <br />
                  Once you’ve added a target, you can configure the permissions here.
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Link className={classes.viewRolesLink}>
                    <Box display="flex" alignItems="center">
                      <ArrowBackSharp fontSize="small" />
                      <Box sx={{ ml: 1 }}>Go back to Roles</Box>
                    </Box>
                  </Link>
                </Box>
              </Box>
            </Box>

            {/* If the role has at least one target set, set the first target in the list as active */}
            {/* <RoleParameters /> */}
          </Box>
        </Grid>
      </Grid>
    </>
  )
}

export default RoleView
