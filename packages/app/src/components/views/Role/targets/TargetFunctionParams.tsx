import React from "react"
import { makeStyles, Typography } from "@material-ui/core"
import { ParamConditionInput } from "./ParamConditionInput"
import { FunctionCondition, ParamCondition } from "../../../../typings/role"
import { FunctionFragment } from "@ethersproject/abi"
import { ArrowRight } from "@material-ui/icons"

interface TargetFunctionParamsProps {
  func: FunctionFragment
  funcConditions: FunctionCondition

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

export const TargetFunctionParams = ({ func, funcConditions, onChange }: TargetFunctionParamsProps) => {
  const classes = useStyles()

  const handleConditionChange = (index: number, value?: ParamCondition) => {
    const newConditions = [...funcConditions.params]
    newConditions[index] = value
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
            index={index}
            condition={funcConditions.params[index]}
            onChange={(condition) => handleConditionChange(index, condition)}
          />
        </div>
      ))}
    </>
  )
}
