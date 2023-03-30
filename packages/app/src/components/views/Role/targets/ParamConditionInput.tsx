import { Select } from "../../../commons/input/Select"
import { Button, IconButton, makeStyles, MenuItem } from "@material-ui/core"
import { Add } from "@material-ui/icons"
import { ethers } from "ethers"
import { ParamComparison, ParamCondition, ParamNativeType } from "../../../../typings/role"
import { BooleanValue, getConditionsPerType, getConditionType, getNativeType } from "../../../../utils/conditions"
import { OneOfParamConditionInputValue, ParamConditionInputValue } from "./ParamConditionInputValue"
import DeleteIcon from "@material-ui/icons/DeleteOutline"

const useStyles = makeStyles((theme) => ({
  select: {
    borderColor: "rgba(217,212,173, 0.3)",
    width: "auto !important",
    display: "inline-block",
    fontSize: 12,
    padding: theme.spacing(0.5),
    color: "rgb(217,212,173)",
  },
  selectIcon: {
    color: "rgba(217,212,173,0.5)",
  },
  button: {
    color: "#D9D4AD",
    borderColor: "#D9D4AD",
    opacity: 0.3,
    padding: theme.spacing(0.25, 0.5),
    fontSize: 12,
    "&:before": {
      content: "none",
    },
  },
  icon: {
    fontSize: 12,
    marginRight: theme.spacing(0.5),
  },
  btnRemove: {
    color: "#D9D4AD",
    padding: theme.spacing(0.25),
    marginLeft: theme.spacing(1),
    border: "1px solid rgba(217, 212, 173, 0.3)",
    borderRadius: 0,
  },
}))

export const ConditionLabel: Record<ParamComparison, string> = {
  [ParamComparison.EQUAL_TO]: "is equal to",
  [ParamComparison.ONE_OF]: "is one of",
  [ParamComparison.GREATER_THAN]: "is greater than",
  [ParamComparison.LESS_THAN]: "is less than",
}

interface ParamConditionInputProps {
  index: number
  /** If null is specified, no decoding will be applied */
  param: ethers.utils.ParamType | null
  condition?: ParamCondition
  disabled?: boolean
  onDecodingError(err: Error): void

  onChange(value?: ParamCondition): void
}

export const ParamConditionInput = ({
  index,
  param,
  condition,
  disabled,
  onChange,
  onDecodingError,
}: ParamConditionInputProps) => {
  const classes = useStyles()
  const nativeType = getNativeType(param)
  const type = getConditionType(nativeType)
  const options = getConditionsPerType(nativeType)

  const handleChange = (condition: ParamComparison) => onChange({ index, type, condition, value: [""] })
  const handleRemove = () => onChange(undefined)

  if (!condition) {
    const handleClick = () => {
      if (nativeType === ParamNativeType.BOOLEAN) {
        onChange({ index, type, condition: ParamComparison.EQUAL_TO, value: [BooleanValue.FALSE] })
        return
      }
      handleChange(options[0])
    }
    return (
      <Button variant="outlined" className={classes.button} onClick={handleClick}>
        <Add className={classes.icon} />
        add a condition
      </Button>
    )
  }

  const removeButton = (
    <IconButton disableRipple className={classes.btnRemove} size="small" disabled={disabled} onClick={handleRemove}>
      <DeleteIcon fontSize="inherit" />
    </IconButton>
  )

  if (nativeType === ParamNativeType.BOOLEAN) {
    const handleBooleanChange = (value: string) =>
      onChange({ index, type, condition: ParamComparison.EQUAL_TO, value: [value] })
    return (
      <>
        <Select
          classes={{ icon: classes.selectIcon }}
          className={classes.select}
          disabled={disabled}
          value={condition.value[0]}
          onChange={(evt) => handleBooleanChange(evt.target.value as string)}
        >
          <MenuItem value={BooleanValue.FALSE}>is false</MenuItem>
          <MenuItem value={BooleanValue.TRUE}>is true</MenuItem>
        </Select>
        {removeButton}
      </>
    )
  }

  const handleValueChange = (value: string[]) => onChange({ ...condition, value })

  return (
    <>
      <Select
        classes={{ icon: classes.selectIcon }}
        className={classes.select}
        disabled={disabled}
        value={condition.condition}
        onChange={(evt) => handleChange(evt.target.value as ParamComparison)}
      >
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            {ConditionLabel[option]}
          </MenuItem>
        ))}
      </Select>
      {condition && condition.condition !== ParamComparison.ONE_OF && (
        <ParamConditionInputValue
          onDecodingError={onDecodingError}
          param={param}
          value={condition.value}
          disabled={disabled}
          onChange={handleValueChange}
        />
      )}
      {condition && condition.condition === ParamComparison.ONE_OF && (
        <OneOfParamConditionInputValue
          onDecodingError={onDecodingError}
          param={param}
          value={condition.value}
          disabled={disabled}
          onChange={handleValueChange}
        />
      )}
      {removeButton}
    </>
  )
}
