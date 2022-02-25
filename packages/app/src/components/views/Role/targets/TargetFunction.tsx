import { FunctionFragment } from "@ethersproject/abi"
import { Box, InputLabel, makeStyles, MenuItem, Typography } from "@material-ui/core"
import { KeyboardArrowDownSharp } from "@material-ui/icons"
import classNames from "classnames"
import React, { useMemo, useState } from "react"
import { TargetFunctionParams } from "./TargetFunctionParams"
import { ConditionType, EXECUTION_OPTIONS, ExecutionOption, FunctionConditions } from "../../../../typings/role"
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
  functionConditions?: FunctionConditions

  onChange(value: FunctionConditions): void
}

function getParamsTypesTitle(func: FunctionFragment): string {
  if (!func.inputs.length) return "()"
  return "(" + func.inputs.map((input) => input.format("full")).join(", ") + ")"
}

const defaultFunctionCondition: FunctionConditions = {
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
  const isSimple = func.inputs.length === 0

  const [open, setOpen] = useState(false)

  const paramsText = useMemo(() => getParamsTypesTitle(func), [func])

  const handleExecutionOption = (option: ExecutionOption) => {
    onChange({ ...functionConditions, executionOption: option })
  }

  const handleFunctionCheck = (checked: boolean) => {
    const type = checked ? ConditionType.WILDCARDED : getFunctionConditionType(functionConditions.params)
    onChange({ ...functionConditions, type })
  }

  const handleOpen = () => {
    if (isSimple) {
      handleFunctionCheck(functionConditions.type !== ConditionType.WILDCARDED)
      return
    }
    setOpen(!open)
  }

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
        {!isSimple ? (
          <>
            <Box sx={{ flexGrow: 1 }} />
            <KeyboardArrowDownSharp className={classNames(classes.arrow, { [classes.rotate]: open })} />
          </>
        ) : null}
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

        {!isSimple ? (
          <TargetFunctionParams func={func} funcConditions={functionConditions} onChange={onChange} />
        ) : null}
      </div>
    </div>
  )
}
