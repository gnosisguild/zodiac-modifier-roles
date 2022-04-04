import { ethers } from "ethers"
import { ParamCondition, ParamNativeType } from "../../../../typings/role"
import { makeStyles, TextField } from "@material-ui/core"
import { useState } from "react"
import { formatParamValue, getNativeType } from "../../../../utils/conditions"
import classNames from "classnames"

interface ParamConditionInputValueProps {
  param: ethers.utils.ParamType
  condition: ParamCondition

  onChange(condition: ParamCondition): void
}

const useStyles = makeStyles((theme) => ({
  root: {
    width: "auto !important",
    marginLeft: theme.spacing(1),
  },
  error: {
    borderColor: "rgba(255, 0, 0, 0.7)",
  },
  input: {
    padding: theme.spacing(0.5),
    fontSize: 12,
  },
}))

const PlaceholderPerType: Record<ParamNativeType, string> = {
  [ParamNativeType.ARRAY]: "[value 1, value 2, ...]",
  [ParamNativeType.TUPLE]: "(1,2,3)",
  [ParamNativeType.BOOLEAN]: "true",
  [ParamNativeType.INT]: "235000000",
  [ParamNativeType.ADDRESS]: "0xABF...123",
  [ParamNativeType.STRING]: "Enter a string",
  [ParamNativeType.BYTES]: "0x...",
  [ParamNativeType.UNSUPPORTED]: "unsupported type",
}

function getPlaceholderForType(param: ethers.utils.ParamType) {
  const nativeType = getNativeType(param)
  return PlaceholderPerType[nativeType]
}

export const ParamConditionInputValue = ({ param, condition, onChange }: ParamConditionInputValueProps) => {
  const classes = useStyles()
  const [valid, setValid] = useState<boolean>(false)
  const [dirty, setDirty] = useState(false)

  const handleChange = (value: string) => {
    setDirty(true)
    try {
      ethers.utils.defaultAbiCoder.encode([param], [formatParamValue(param, value)])
      setValid(true)
    } catch (err) {
      setValid(false)
    }
    onChange({ ...condition, value })
  }

  return (
    <TextField
      error={!valid && dirty}
      className={classes.root}
      InputProps={{
        disableUnderline: true,
        className: classNames(classes.input, { [classes.error]: !valid && dirty }),
      }}
      value={condition.value}
      placeholder={getPlaceholderForType(param)}
      onChange={(evt) => handleChange(evt.target.value)}
    />
  )
}
