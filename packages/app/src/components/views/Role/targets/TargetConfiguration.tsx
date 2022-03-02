import React, { useContext, useEffect, useMemo } from "react"
import { Box, Button, FormControlLabel, InputLabel, makeStyles, MenuItem, Typography } from "@material-ui/core"
import { DeleteOutlineSharp } from "@material-ui/icons"
import {
  ConditionType,
  EXECUTION_OPTIONS,
  ExecutionOption,
  FunctionCondition,
  Target,
  TargetConditions,
} from "../../../../typings/role"
import { useAbi } from "../../../../hooks/useAbi"
import { TargetFunctionList } from "./TargetFunctionList"
import { FunctionFragment, Interface } from "@ethersproject/abi"
import { RoleContext } from "../RoleContext"
import { Checkbox } from "../../../commons/input/Checkbox"
import { Select } from "../../../commons/input/Select"
import { getKeyFromFunction, getTargetConditionType } from "../../../../utils/conditions"

const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: theme.spacing(3),
    position: "relative",
    "&::before": {
      backgroundColor: "rgba(217, 212, 173, 0.1)",
      content: '" "',
      position: "absolute",
      zIndex: 1,
      inset: -3,
      border: "1px solid rgba(217, 212, 173, 0.3)",
      pointerEvents: "none",
    },
  },
  label: {
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(1),
  },
  allowAllLabel: {
    "& .MuiTypography-body1": {
      fontSize: 16,
    },
  },
  root: {
    padding: theme.spacing(2),
    paddingRight: `calc(${theme.spacing(2)}px - var(--scrollbarWidth))`,
    maxHeight: "calc(100vh - 400px)",
    overflowY: "auto",
    scrollbarGutter: "stable",
  },
  functionWrapper: {
    backgroundColor: "rgba(217, 212, 173, 0.1)",
    border: "1px solid rgba(217, 212, 173, 0.3)",
    marginTop: theme.spacing(1),
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    position: "relative",
    "&::before": {
      border: "1px solid rgba(217, 212, 173, 0.3)",
      content: '" "',
      position: "absolute",
      zIndex: 1,
      inset: 2,
      pointerEvents: "none",
    },
  },
  functionTrigger: {
    alignItems: "center",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
  },
  removeButton: {
    whiteSpace: "nowrap",
    marginLeft: theme.spacing(4),
    paddingLeft: theme.spacing(4),
    paddingRight: theme.spacing(4),
  },
  arrow: {
    height: 32,
    fill: "#B2B5B2",
    transition: "transform 0.25s ease-in-out",
    width: 32,
    "&.isActive": {
      transform: "rotate(180deg)",
    },
  },
  title: {
    fontSize: 16,
  },
  subtitle: {
    color: "rgb(178,178,178)",
    fontFamily: "Roboto Mono",
    fontSize: 12,
  },
}))

type TargetConfigurationProps = {
  target: Target
}

function isWriteFunction(method: FunctionFragment) {
  if (!method.stateMutability) return true
  return !["view", "pure"].includes(method.stateMutability)
}

function getInitialTargetConditions(functions: FunctionFragment[]): TargetConditions {
  return functions.reduce((obj, func): TargetConditions => {
    const funcCondition: FunctionCondition = {
      sighash: Interface.getSighash(func),
      type: ConditionType.WILDCARDED,
      executionOption: ExecutionOption.BOTH,
      params: func.inputs.map(() => undefined),
    }
    return {
      ...obj,
      [getKeyFromFunction(func)]: funcCondition,
    }
  }, {})
}

export const TargetConfiguration = ({ target }: TargetConfigurationProps) => {
  const classes = useStyles()
  const { setTargetConditions, setTargetClearance, setTargetExecutionOption, removeTarget } = useContext(RoleContext)

  const { abi } = useAbi(target.address)
  const functions = useMemo(() => {
    if (!abi) return []
    return new Interface(abi).fragments.filter(FunctionFragment.isFunctionFragment).filter(isWriteFunction)
  }, [abi])

  useEffect(() => {
    const initial = getInitialTargetConditions(functions)
    const conditions: TargetConditions = {
      ...initial,
      functions: { ...initial.functions, ...target.conditions.functions },
    }
    setTargetConditions({ targetId: target.id, conditions })
  }, [functions, setTargetConditions, target.id])

  const handleChangeTargetExecutionsOptions = (value: ExecutionOption) => {
    setTargetExecutionOption({ targetId: target.id, option: value })
  }

  const handleFuncParamsChange = (conditions: TargetConditions) => {
    setTargetConditions({ targetId: target.id, conditions })
  }

  const allowAllFunctions = target.type === ConditionType.WILDCARDED

  const handleAllFuncChange = () => {
    const type = !allowAllFunctions ? ConditionType.WILDCARDED : getTargetConditionType(target.conditions.functions)
    setTargetClearance({ targetId: target.id, option: type })
  }

  return (
    <Box>
      <Box alignItems="flex-end" display="flex" justifyContent="space-between">
        <div>
          <Typography variant="h5" className={classes.title}>
            Target Address
          </Typography>
          <Typography variant="h5" className={classes.subtitle}>
            {target.address}
          </Typography>
        </div>
        <Button
          color="secondary"
          variant="outlined"
          className={classes.removeButton}
          onClick={() => removeTarget({ target })}
          startIcon={<DeleteOutlineSharp />}
        >
          Remove Target
        </Button>
      </Box>
      <Box sx={{ mt: 3 }}>
        <InputLabel className={classes.label}>Execution Type</InputLabel>
        <Select
          disableUnderline
          value={target.executionOption}
          onChange={(event) => handleChangeTargetExecutionsOptions(event.target.value as ExecutionOption)}
        >
          {EXECUTION_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </Box>
      <Box sx={{ mt: 2 }}>
        <FormControlLabel
          className={classes.allowAllLabel}
          label="Allow all calls to target"
          control={<Checkbox checked={allowAllFunctions} onClick={handleAllFuncChange} />}
        />
      </Box>
      <Box className={classes.container}>
        <Box className={classes.root}>
          <TargetFunctionList items={functions} conditions={target.conditions} onChange={handleFuncParamsChange} />
        </Box>
      </Box>
    </Box>
  )
}
