import React from "react"
import { makeStyles, Typography } from "@material-ui/core"
import { ParamConditionInput } from "./ParamConditionInput"
import { FunctionConditions, ParamCondition } from "../../../../typings/role"
import { FunctionFragment } from "@ethersproject/abi"
import { ArrowRight } from "@material-ui/icons"

interface TargetFunctionParamsProps {
  func: FunctionFragment
  funcConditions: FunctionConditions

  onChange(value: FunctionConditions): void
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

export const TargetFunctionParams = ({ func, funcConditions, onChange }: TargetFunctionParamsProps) => {
  const classes = useStyles()

  const handleConditionChange = (index: number, value?: ParamCondition) => {
    const newConditions = funcConditions.params.map((condition, _index) => {
      if (index !== _index) return condition
      return value
    })
    onChange({ ...funcConditions, params: newConditions })
  }

  return (
    <>
      {func.inputs.map((param, index) => (
        <div key={index} className={classes.row}>
          <ArrowRight />
          <Typography variant="body1">{param.name}</Typography>
          <Typography variant="body2" className={classes.type}>
            ({param.type})
          </Typography>
          <ParamConditionInput
            param={param}
            condition={funcConditions.params[index]}
            onChange={(condition) => handleConditionChange(index, condition)}
          />
        </div>
      ))}
    </>
  )
}
