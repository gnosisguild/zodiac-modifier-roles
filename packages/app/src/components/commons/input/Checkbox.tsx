import React from "react"
import { Checkbox as MUICheckbox, CheckboxProps, makeStyles } from "@material-ui/core"
import { ReactComponent as CheckMarkCheckedIcon } from "../../../assets/icons/checkbox-checked.svg"
import { ReactComponent as CheckMarkUncheckedIcon } from "../../../assets/icons/checkbox-unchecked.svg"
import { ReactComponent as CheckMarkIndeterminateIcon } from "../../../assets/icons/checkbox-indeterminate.svg"

const useStyles = makeStyles((theme) => ({
  root: {
    padding: 0,
    backgroundColor: "transparent !important",
    borderRadius: 0,
    margin: theme.spacing(1, 1, 1, 0),
  },
}))

export const Checkbox = ({ ...props }: CheckboxProps) => {
  const classes = useStyles()

  return (
    <MUICheckbox
      disableFocusRipple
      disableRipple
      disableTouchRipple
      icon={<CheckMarkUncheckedIcon />}
      checkedIcon={<CheckMarkCheckedIcon />}
      indeterminateIcon={<CheckMarkIndeterminateIcon />}
      classes={{ root: classes.root }}
      {...props}
    />
  )
}
