import React from 'react'
import {
  Grid,
  GridProps,
  InputBase,
  InputLabel,
  makeStyles,
  StandardTextFieldProps,
  TextField as MUITextField,
  withStyles,
} from '@material-ui/core'
import classNames from 'classnames'

const StyledTextField = withStyles((theme) => ({
  root: {
    '& label.Mui-focused': {
      position: 'relative',
      transform: 'none',
      color: theme.palette.text.primary,
      marginBottom: theme.spacing(1),
    },
    '& .MuiInputBase-root': {
      marginTop: 0,
      minHeight: '37px',
    },
    '& .MuiInputBase-root input': {
      fontFamily: 'Roboto Mono',
      fontSize: '14px',
    },
    '& .MuiSelect-select:focus': {
      backgroundColor: 'transparent',
    },
  },
}))(MUITextField)

const useStyles = makeStyles((theme) => ({
  root: {
    position: 'relative',
    flexWrap: 'nowrap',
    justifyContent: 'flex-end',
  },
  label: {
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(1),
  },
  inputContainer: {
    flexGrow: 1,
  },
  input: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    padding: '8px 0 8px 8px',
    border: '1px solid rgb(255,255,255)',
    '& input': {
      borderRightWidth: 1,
      borderRightStyle: 'solid',
      borderRightColor: theme.palette.secondary.main,
      paddingRight: theme.spacing(1),
    },
    '&:after': {
      content: '',
      display: 'none',
    },
  },
  append: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1),
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.palette.text.primary,
    borderLeftWidth: 0,
  },
}))

export interface TextFieldProps extends Omit<StandardTextFieldProps, 'variant' | 'label'> {
  label?: string
  append?: React.ReactElement | string
  AppendProps?: GridProps
}

export const TextField = ({ InputProps, InputLabelProps, label, append, AppendProps, ...props }: TextFieldProps) => {
  const classes = useStyles()

  if (props.select || !append) {
    return (
      <StyledTextField
        focused={!props.disabled}
        label={label}
        placeholder={label}
        InputProps={{
          disableUnderline: true,
          ...InputProps,
        }}
        InputLabelProps={{
          shrink: true,
          ...InputLabelProps,
        }}
        {...props}
      />
    )
  }

  return (
    <div className={props.className}>
      <InputLabel {...InputLabelProps} className={classes.label}>
        {label}
      </InputLabel>
      <Grid container className={classes.root}>
        <Grid item className={classes.inputContainer}>
          <InputBase
            disabled={props.disabled}
            placeholder={props.placeholder}
            onClick={props.onClick}
            inputMode={props.inputMode}
            value={props.value}
            onChange={props.onChange}
            {...InputProps}
            className={classNames(classes.input, InputProps?.className)}
          />
        </Grid>
        <Grid item xs={4} {...AppendProps} className={classNames(classes.append, AppendProps?.className)}>
          {append}
        </Grid>
      </Grid>
    </div>
  )
}
