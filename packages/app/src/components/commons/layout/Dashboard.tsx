import { Box, makeStyles } from "@material-ui/core"
import React, { PropsWithChildren } from "react"
import classNames from "classnames"

const useStyles = makeStyles((theme) => ({
  container: {
    display: "grid",
    padding: theme.spacing(0.5),
    gridTemplateColumns: "minmax(360px, 500px) 4px 1fr",

    height: "100%",
    position: "relative",
    flexGrow: 1,
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
  sideBar: {
    paddingRight: "0 !important",
    "& $item": {
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    },
  },
  item: {
    border: "1px solid rgba(217, 212, 173, 0.3)",
    height: "100%",
    padding: theme.spacing(2),
  },
  menu: {
    gridColumnStart: 1,
  },
  content: {
    gridColumnStart: 3,
  },
}))

type DashboardProps = PropsWithChildren<{ left: React.ReactElement }>

export const Dashboard = ({ left, children }: DashboardProps) => {
  const classes = useStyles()

  return (
    <div className={classes.container}>
      <Box className={classNames(classes.item, classes.menu)}>{left}</Box>
      <Box className={classNames(classes.item, classes.content)}>{children}</Box>
    </div>
  )
}
