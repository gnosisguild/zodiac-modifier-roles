import React from 'react'
import { Checkbox as MUICheckbox, CheckboxProps, makeStyles } from '@material-ui/core'
import CheckMarkCheckedIcon from '../../../assets/icons/checkbox-checked.svg'
import CheckMarkUncheckedIcon from '../../../assets/icons/checkbox-unchecked.svg'

const useStyles = makeStyles(() => ({
  root: {
    padding: 0,
    backgroundColor: 'transparent !important',
    borderRadius: 0,
  },
}))

export const Checkbox = ({ ...props }: CheckboxProps) => {
  const classes = useStyles()

  return (
    <MUICheckbox
      disableFocusRipple
      disableRipple
      disableTouchRipple
      icon={<img src={CheckMarkUncheckedIcon} alt="unchecked" />}
      checkedIcon={<img src={CheckMarkCheckedIcon} alt="checked" />}
      classes={{ root: classes.root }}
      {...props}
    />
  )
}
