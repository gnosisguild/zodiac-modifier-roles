import React from "react"
import { GridProps, StandardTextFieldProps, TextField as MUITextField, withStyles } from "@material-ui/core"

const StyledTextField = withStyles((theme) => ({
  root: {
    "& label.Mui-focused": {
      position: "relative",
      transform: "none",
      color: theme.palette.text.primary,
      marginBottom: theme.spacing(1),
    },
    "& .MuiInputBase-root": {
      marginTop: 0,
      minHeight: "37px",
    },
    "& .MuiInputBase-root input": {
      fontFamily: "Roboto Mono",
      fontSize: "14px",
    },
    "& .MuiSelect-select:focus": {
      backgroundColor: "transparent",
    },
  },
}))(MUITextField)

export interface TextFieldProps extends Omit<StandardTextFieldProps, "variant" | "label"> {
  label?: string
  append?: React.ReactElement | string
  AppendProps?: GridProps
}

export const TextField = ({ InputProps, InputLabelProps, label, append, AppendProps, ...props }: TextFieldProps) => {
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
