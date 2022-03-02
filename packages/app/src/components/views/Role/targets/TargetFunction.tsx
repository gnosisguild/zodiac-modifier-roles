import { FunctionFragment, Interface } from "@ethersproject/abi"
import { Box, InputLabel, makeStyles, MenuItem, Typography } from "@material-ui/core"
import { KeyboardArrowDownSharp } from "@material-ui/icons"
import classNames from "classnames"
import React, { useMemo, useState } from "react"
import { TargetFunctionParams } from "./TargetFunctionParams"
import { ConditionType, EXECUTION_OPTIONS, ExecutionOption, FunctionCondition } from "../../../../typings/role"
import { Select } from "../../../commons/input/Select"
import { getFunctionConditionType } from "../../../../utils/conditions"
import { Checkbox } from "../../../commons/input/Checkbox"

const useStyles = makeStyles((theme) => ({
  content: {
    display: "flex",
    flexDirection: "column",
    margin: theme.spacing(1, 0, 1, 3),
  },
  wrapper: {
    backgroundColor: "rgba(217, 212, 173, 0.1)",
    border: "1px solid rgba(217, 212, 173, 0.3)",
    marginTop: theme.spacing(1),
    padding: theme.spacing(0, 1),
  },
  trigger: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    minHeight: 32,
  },
  arrow: {
    height: 32,
    fill: "#B2B5B2",
    transition: "transform 0.25s ease-in-out",
    width: 32,
  },
  rotate: {
    transform: "rotate(180deg)",
  },
  name: {
    fontFamily: "Roboto Mono, Spectral",
    fontSize: 14,
    color: "rgb(178,178,178)",
    marginLeft: theme.spacing(0.5),
  },
  type: {
    fontSize: 10,
    fontFamily: "Roboto Mono, Spectral",
    color: "rgb(178,178,178, 0.6)",
    marginLeft: theme.spacing(1),
    paddingRight: theme.spacing(2),
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    maxWidth: 600,
  },
  hidden: {
    display: "none",
  },
  label: {
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(0.5),
  },
  select: {
    margin: theme.spacing(0, 0, 1, 0),
  },
}))

interface TargetFunctionProps {
  func: FunctionFragment
  functionConditions?: FunctionCondition

  onChange(value: FunctionCondition): void
}

function getParamsTypesTitle(func: FunctionFragment): string {
  if (!func.inputs.length) return "()"
  return "(" + func.inputs.map((input) => input.format("full")).join(", ") + ")"
}

const defaultFunctionCondition: FunctionCondition = {
  sighash: "",
  type: ConditionType.WILDCARDED,
  executionOption: ExecutionOption.BOTH,
  params: [],
}

export const TargetFunction = ({
  func,
  functionConditions = defaultFunctionCondition,
  onChange,
}: TargetFunctionProps) => {
  const classes = useStyles()

  const [open, setOpen] = useState(false)

  const paramsText = useMemo(() => getParamsTypesTitle(func), [func])

  const handleExecutionOption = (option: ExecutionOption) => {
    onChange({ ...functionConditions, sighash: Interface.getSighash(func), executionOption: option })
  }

  const handleFunctionCheck = (checked: boolean) => {
    const type = checked ? ConditionType.WILDCARDED : getFunctionConditionType(functionConditions.params)
    onChange({ ...functionConditions, sighash: Interface.getSighash(func), type })
  }

  const handleOpen = () => setOpen(!open)

  return (
    <div className={classes.wrapper}>
      <div className={classes.trigger} onClick={handleOpen}>
        <Checkbox
          checked={functionConditions?.type === ConditionType.WILDCARDED}
          indeterminateIcon={functionConditions?.type === ConditionType.SCOPED}
          onChange={(evt) => handleFunctionCheck(evt.target.checked)}
          onClick={(evt) => evt.stopPropagation()}
        />
        <Typography variant="body1" className={classes.name}>
          {func.name}
        </Typography>
        <Typography variant="body2" className={classes.type}>
          {paramsText}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <KeyboardArrowDownSharp className={classNames(classes.arrow, { [classes.rotate]: open })} />
      </div>

      <div className={classNames(classes.content, { [classes.hidden]: !open })}>
        <div className={classes.select}>
          <InputLabel className={classes.label}>Execution Type</InputLabel>
          <Select
            value={functionConditions.executionOption}
            onChange={(evt) => handleExecutionOption(evt.target.value as ExecutionOption)}
          >
            {EXECUTION_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </div>

        <TargetFunctionParams func={func} funcConditions={functionConditions} onChange={onChange} />
      </div>
    </div>
  )
}
