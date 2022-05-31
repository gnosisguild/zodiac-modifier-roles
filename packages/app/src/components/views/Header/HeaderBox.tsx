import { makeStyles } from "@material-ui/core"
import classNames from "classnames"
import React, { PropsWithChildren } from "react"

const useStyles = makeStyles((theme) => ({
  banner: {
    display: "flex",
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(217, 212, 173, 0.3)",
    background: "rgba(217, 212, 173, 0.1)",
    padding: theme.spacing(0.5),
    position: "relative",
    transition: "background 0.25s ease-in-out",
    "&:not(:first-child)": {
      marginLeft: theme.spacing(2),
    },
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
  icon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 60,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(217, 212, 173, 0.3)",
    padding: theme.spacing(0.5),
    width: 46,
    height: 46,
  },
  leftIcon: {
    paddingRight: 16,
    borderRadius: "60px 0 0 60px",
    "&:before": {
      borderRadius: "60px 0 0 60px",
    },
  },
  clickable: {
    cursor: "pointer",
    "&:hover::before": {
      background: "rgba(217, 212, 173, 0.3)",
    },
  },
}))

interface HeaderBoxProps {
  className?: string
  icon?: React.ReactElement | null
  onClick?(): void
}

export const HeaderBox = ({ className, icon, children, onClick }: PropsWithChildren<HeaderBoxProps>) => {
  const classes = useStyles()

  if (icon !== undefined) {
    return (
      <div
        onClick={onClick}
        className={classNames(classes.banner, classes.leftIcon, className, { [classes.clickable]: onClick != null })}
      >
        <div className={classes.icon}>{icon}</div>
        {children}
      </div>
    )
  }

  return (
    <div onClick={onClick} className={classNames(classes.banner, className, { [classes.clickable]: onClick != null })}>
      {children}
    </div>
  )
}
