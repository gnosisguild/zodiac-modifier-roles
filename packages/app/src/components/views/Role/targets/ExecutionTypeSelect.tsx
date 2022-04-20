import React from "react"
import { InputLabel, makeStyles, MenuItem, Select, SelectProps } from "@material-ui/core"
import { ExecutionOption } from "../../../../typings/role"

const useStyles = makeStyles((theme) => ({
  label: {
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(1),
  },
}))

interface ExecutionTypeSelectProps {
  value: ExecutionOption
  SelectProps?: Omit<SelectProps, "value" | "onChange">

  onChange(value: ExecutionOption): void
}

export const ExecutionTypeSelect = ({ onChange, value, SelectProps: selectProps }: ExecutionTypeSelectProps) => {
  const classes = useStyles()
  return (
    <>
      <InputLabel className={classes.label}>Execution Type</InputLabel>
      <Select
        {...selectProps}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value as string) as ExecutionOption)}
      >
        <MenuItem value={ExecutionOption.SEND}>Send</MenuItem>
        <MenuItem value={ExecutionOption.DELEGATE_CALL}>DelegateCall</MenuItem>
        <MenuItem value={ExecutionOption.BOTH}>Both</MenuItem>
      </Select>
    </>
  )
}
