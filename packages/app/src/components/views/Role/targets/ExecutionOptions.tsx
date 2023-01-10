import React from "react"
import { FormControlLabel } from "@material-ui/core"
import { ExecutionOption } from "../../../../typings/role"
import { Checkbox } from "../../../commons/input/Checkbox"

interface Props {
  value: ExecutionOption
  onChange(value: ExecutionOption): void
  disabled?: boolean
}

export const ExecutionOptions = ({ onChange, value, disabled }: Props) => {
  const { allowSend, allowDelegateCall } = enumToFlags(value)
  return (
    <>
      <FormControlLabel
        label="Allow sending ether"
        control={
          <Checkbox
            checked={allowSend}
            onClick={(ev) => onChange(flagsToEnum({ allowDelegateCall, allowSend: !allowSend }))}
          />
        }
      />

      <FormControlLabel
        label="Allow delegate call"
        control={
          <Checkbox
            checked={allowDelegateCall}
            onClick={(ev) => onChange(flagsToEnum({ allowSend, allowDelegateCall: !allowDelegateCall }))}
          />
        }
      />
    </>
  )
}

const enumToFlags = (value: ExecutionOption) => {
  let allowSend = false
  let allowDelegateCall = false
  if (value === ExecutionOption.BOTH) {
    allowSend = true
    allowDelegateCall = true
  } else if (value === ExecutionOption.SEND) {
    allowSend = true
  } else if (value === ExecutionOption.DELEGATE_CALL) {
    allowDelegateCall = true
  }
  return { allowSend, allowDelegateCall }
}

const flagsToEnum = (flags: { allowSend: boolean; allowDelegateCall: boolean }) => {
  if (flags.allowSend && flags.allowDelegateCall) return ExecutionOption.BOTH
  if (flags.allowSend) return ExecutionOption.SEND
  if (flags.allowDelegateCall) return ExecutionOption.DELEGATE_CALL
  return ExecutionOption.NONE
}
