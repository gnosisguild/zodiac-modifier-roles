import React from 'react'
import { makeStyles } from '@material-ui/core'

const useStyles = makeStyles(() => ({
  root: {
    flexGrow: 1,
    minWidth: 8,
  },
}))

export const Grow = (): React.ReactElement => {
  const classes = useStyles()
  return <div className={classes.root} />
}
