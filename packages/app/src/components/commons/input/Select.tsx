import { makeStyles, Select as MUISelect, SelectProps } from "@material-ui/core"
import classNames from "classnames"

const useStyles = makeStyles((theme) => ({
  root: {
    borderColor: theme.palette.common.white,
    padding: theme.spacing(1, 0.5, 1, 1),
    "&::after": {
      content: "none",
    },
  },
  select: {
    "&:focus": {
      background: "none",
    },
  },
}))

export const Select = (props: SelectProps) => {
  const classes = useStyles()

  return (
    <MUISelect
      disableUnderline
      {...props}
      classes={{ ...props.classes, select: classNames(classes.select, props.classes?.select) }}
      className={classNames(classes.root, props.className)}
    />
  )
}
