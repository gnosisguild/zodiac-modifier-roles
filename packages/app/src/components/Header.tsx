import { Box, makeStyles, Typography } from "@material-ui/core"
import classNames from "classnames"
import RolesModuleLogo from "../assets/images/roles-module-logo.png"

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "row",
    marginBottom: theme.spacing(2),
  },
  container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing(1, 2, 1, 1),
    borderRadius: 60,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(217, 212, 173, 0.3)",
    background: "rgba(217, 212, 173, 0.1)",
    "&:not(:first-child)": {
      marginLeft: theme.spacing(2),
    },
  },
  leftHeader: {
    borderRadius: "60px 0 0 60px",
  },
  header: {
    padding: theme.spacing(0.5, 2, 0.5, 0.5),
    position: "relative",
    "&::before": {
      content: '" "',
      position: "absolute",
      zIndex: 1,
      top: "-5px",
      left: "-5px",
      right: "-5px",
      bottom: "-5px",
      borderRadius: "60px 0 0 60px",
      border: "1px solid rgba(217, 212, 173, 0.3)",
      pointerEvents: "none",
    },
  },
  img: {
    display: "block",
    width: 36,
    height: 36,
  },
  title: {
    marginLeft: theme.spacing(1),
  },
  circleIconContainer: {
    borderRadius: 60,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(217, 212, 173, 0.3)",
    padding: theme.spacing(0.5),
    width: 46,
    height: 46,
  },
  banner: {
    flexGrow: 1,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(217, 212, 173, 0.3)",
    background: "rgba(217, 212, 173, 0.1)",
    marginLeft: theme.spacing(2),
    position: "relative",
    "&::before": {
      content: '" "',
      position: "absolute",
      zIndex: 1,
      top: "-5px",
      left: "-5px",
      right: "-5px",
      bottom: "-5px",
      border: "1px solid rgba(217, 212, 173, 0.3)",
      pointerEvents: "none",
    },
  },
}))

export const Header = () => {
  const classes = useStyles()

  return (
    <Box className={classes.root}>
      <div className={classNames(classes.container, classes.header, classes.leftHeader)}>
        <div className={classes.circleIconContainer}>
          <img src={RolesModuleLogo} alt="Roles App Logo" className={classes.img} />
        </div>
        <Typography variant="h5" className={classes.title}>
          Roles
        </Typography>
      </div>
      <div className={classes.banner} />
    </Box>
  )
}
