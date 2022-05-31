import { makeStyles } from "@material-ui/core"
import classNames from "classnames"
import React, { PropsWithChildren } from "react"
import { colors, doubleBorder, ZodiacPaper } from "zodiac-ui-components"

const useStyles = makeStyles((theme) => ({
  banner: {
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(0.5),
    position: "relative",
    transition: "background 0.25s ease-in-out",
    "&:not(:first-child)": {
      marginLeft: theme.spacing(2),
    },
    "&::before": {
      ...doubleBorder(-5),
      borderColor: colors.tan[300],
    },
  },
  clickable: {
    cursor: "pointer",
    transition: "background 0.25s ease-in-out",
    "&:hover::before": {
      background: colors.tan[300],
    },
  },
  icon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 60,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.tan[300],
    padding: theme.spacing(0.5),
    width: 46,
    height: 46,
  },
  leftIcon: {
    paddingRight: 16,
  },
}))

interface HeaderBoxProps {
  className?: string
  icon?: React.ReactElement
  onClick?(): void
}

export const HeaderBox = ({ className, icon, children, onClick }: PropsWithChildren<HeaderBoxProps>) => {
  const classes = useStyles()

  if (icon !== undefined) {
    return (
      <ZodiacPaper
        rounded="left"
        elevation={0}
        onClick={onClick}
        className={classNames(classes.banner, classes.leftIcon, className, { [classes.clickable]: onClick != null })}
      >
        {icon != null && <div className={classes.icon}>{icon}</div>}
        {children}
      </ZodiacPaper>
    )
  }

  return (
    <ZodiacPaper
      elevation={0}
      onClick={onClick}
      className={classNames(classes.banner, className, { [classes.clickable]: onClick != null })}
    >
      {children}
    </ZodiacPaper>
  )
}
