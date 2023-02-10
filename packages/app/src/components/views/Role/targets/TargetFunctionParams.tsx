import React, { useState } from "react"
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
    alignItems: "start",
    marginTop: theme.spacing(1),
  },
  rowHead: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
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
  const [decodingError, setDecodingError] = useState(false)

  const handleConditionChange = (index: number, value?: ParamCondition) => {
    const newConditions = funcConditions.params.filter((param) => param.index !== index)
    if (value != null) {
      newConditions.push(value)
    }
    const type: ConditionType = newConditions.length ? ConditionType.SCOPED : ConditionType.WILDCARDED
    onChange({ ...funcConditions, type, params: newConditions })
  }

  const maxIndex = funcConditions.params.reduce((max, param) => Math.max(max, param.index), -1)
  const indices = Array.from({ length: maxIndex + 1 }, (_, i) => i)

  const parameterMismatch = (func: FunctionFragment, funcConditions: FunctionCondition): boolean =>
    func.inputs.length < funcConditions.params.reduce((acc, param) => (acc < param.index ? param.index : acc), 0)
  return typeof func === "string" || parameterMismatch(func, funcConditions) || decodingError ? (
    <>
      {indices.map((index) => (
        <>
          {funcConditions.params.some((p) => p.index === index) ? (
            <div key={index} className={classes.row}>
              <div className={classes.rowHead}>
                <ArrowRight />
                <Typography variant="body1">[{index}]</Typography>
                <Typography variant="body2" className={classes.type}>
                  ({funcConditions.params.find((_) => _.index === index)?.type})
                </Typography>
              </div>
              <ParamConditionInput
                disabled={disabled}
                param={ParamType.from(funcConditions.params.find((_) => _.index === index)?.value[0] || "")}
                index={index}
                onChange={(changingCondition) => handleConditionChange(index, changingCondition)}
                onDecodingError={() => setDecodingError(true)}
              />
            </div>
          ) : (
            <div key={index} className={classes.row}>
              <div className={classes.rowHead}>
                <ArrowRight />
                <Typography variant="body1">[{index}]</Typography>
                <Typography variant="body2" className={classes.type}>
                  Unknown type
                </Typography>
              </div>
              <ParamConditionInput
                disabled={disabled}
                param={ParamType.from("")}
                index={index}
                onChange={(changingCondition) => handleConditionChange(index, changingCondition)}
                onDecodingError={() => setDecodingError(true)}
              />
            </div>
          )}
        </>
      ))}
    </>
  ) : (
    <>
      {func.inputs.map((param, index) => (
        <div key={index} className={classes.row}>
          <div className={classes.rowHead}>
            <ArrowRight />
            <Typography variant="body1">{param.name}</Typography>
            <Typography variant="body2" className={classes.type}>
              ({param.type})
            </Typography>
          </div>
          <ParamConditionInput
            disabled={disabled}
            param={param}
            index={index}
            condition={funcConditions.params.find((param) => param?.index === index)}
            onChange={(condition) => handleConditionChange(index, condition)}
            onDecodingError={() => setDecodingError(true)}
          />
        </div>
      ))}
    </>
  )
}
