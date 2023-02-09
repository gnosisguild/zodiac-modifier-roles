import React from "react"
import { makeStyles, Typography } from "@material-ui/core"
import { ParamConditionInput } from "./ParamConditionInput"
import { ConditionType, FunctionCondition, ParamCondition } from "../../../../typings/role"
import { FunctionFragment } from "@ethersproject/abi"
import { ArrowRight } from "@material-ui/icons"
import { ParamType } from "ethers/lib/utils"

interface TargetFunctionParamsProps {
  func: FunctionFragment | string
  funcConditions: FunctionCondition
  disabled: boolean

  onChange(value: FunctionCondition): void
}

const useStyles = makeStyles((theme) => ({
  checkbox: {
    padding: theme.spacing(1),
  },
  row: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing(1),
  },
  type: {
    color: "rgb(255,255,255, 0.6)",
    marginLeft: theme.spacing(1),
    paddingRight: theme.spacing(2),
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    maxWidth: 600,
  },
}))

export const TargetFunctionParams = ({ func, funcConditions, disabled, onChange }: TargetFunctionParamsProps) => {
  const classes = useStyles()

  const handleConditionChange = (index: number, value?: ParamCondition) => {
    const newConditions = funcConditions.params.filter((param) => param.index !== index)
    if (value != null) {
      newConditions.push(value)
    }
    const type: ConditionType = newConditions.length ? ConditionType.SCOPED : ConditionType.WILDCARDED
    onChange({ ...funcConditions, type, params: newConditions })
  }

  return typeof func === "string" ? (
    <>
      {funcConditions.params.map((condition, index) => (
        <div key={index} className={classes.row}>
          <ArrowRight />
          <Typography variant="body1">[{index}]</Typography>
          <Typography variant="body2" className={classes.type}>
            ({condition.type})
          </Typography>
          <ParamConditionInput
            disabled={disabled}
            param={ParamType.from("bytes")}
            index={index}
            condition={funcConditions.params.find((param) => param?.index === index)}
            onChange={(condition) => handleConditionChange(index, condition)}
          />
        </div>
      ))}
    </>
  ) : (
    <>
      {func.inputs.map((param, index) => (
        <div key={index} className={classes.row}>
          <ArrowRight />
          <Typography variant="body1">{param.name}</Typography>
          <Typography variant="body2" className={classes.type}>
            ({param.type})
          </Typography>
          <ParamConditionInput
            disabled={disabled}
            param={param}
            index={index}
            condition={funcConditions.params.find((param) => param?.index === index)}
            onChange={(condition) => handleConditionChange(index, condition)}
          />
        </div>
      ))}
    </>
  )
}
