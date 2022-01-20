import React from 'react'
import { Row } from './layout/Row'
import { makeStyles, Typography } from '@material-ui/core'
import { Grow } from './Grow'
import Skeleton from '@material-ui/lab/Skeleton'

interface ValueLineProps {
  label: string
  loading?: boolean
  icon?: React.ReactNode
  value?: React.ReactNode
}

const useStyles = makeStyles((theme) => ({
  root: {
    alignItems: 'center',
    '& + &': {
      marginTop: theme.spacing(2),
    },
  },
  skeleton: {
    transform: 'none',
  },
  space: {
    marginLeft: theme.spacing(1),
  },
}))

export const ValueLine = ({ value, label, loading, icon }: ValueLineProps): React.ReactElement => {
  const classes = useStyles()
  return (
    <Row className={classes.root}>
      <Typography variant="body1">{label}</Typography>
      {icon ? (
        <>
          <div className={classes.space} />
          {icon}
        </>
      ) : null}

      <Grow />
      {loading ? <Skeleton className={classes.skeleton} variant="text" width={120} height={21} /> : value}
    </Row>
  )
}
