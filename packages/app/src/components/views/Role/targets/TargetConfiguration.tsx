import React, { useContext, useEffect, useState } from "react"
import { Box, FormControlLabel, makeStyles, Typography } from "@material-ui/core"
import { ConditionType, ExecutionOption, FunctionCondition, Target, TargetConditions } from "../../../../typings/role"
import { useAbi } from "../../../../hooks/useAbi"
import { TargetFunctionList } from "./TargetFunctionList"
import { FunctionFragment, Interface } from "@ethersproject/abi"
import { RoleContext } from "../RoleContext"
import { ZodiacPaper } from "zodiac-ui-components"
import { Checkbox } from "../../../commons/input/Checkbox"
import { getKeyFromFunction, isWriteFunction } from "../../../../utils/conditions"
import classNames from "classnames"
import { ExecutionTypeSelect } from "./ExecutionTypeSelect"

const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: theme.spacing(3),
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
  disabledArea: {
    opacity: 0.5,
    "&::after": {
      content: "''",
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.12)",
    },
  },
}))

type TargetConfigurationProps = {
  target: Target
}

function getInitialTargetConditions(functions: FunctionFragment[]): TargetConditions {
  return functions.reduce((obj, func): TargetConditions => {
    const funcCondition: FunctionCondition = {
      sighash: Interface.getSighash(func),
      type: ConditionType.BLOCKED,
      executionOption: ExecutionOption.SEND,
      params: [],
    }
    return {
      ...obj,
      [getKeyFromFunction(func)]: funcCondition,
    }
  }, {})
}

export const TargetConfiguration = ({ target }: TargetConfigurationProps) => {
  const classes = useStyles()
  const { abi } = useAbi(target.address)
  const { setTargetConditions, setTargetClearance, setTargetExecutionOption, state } = useContext(RoleContext)

  console.log("update events", state.getTargetUpdate(target.id))
  const [refresh, setRefresh] = useState(true)
  const [functions, setFunctions] = useState<FunctionFragment[]>([])

  useEffect(() => {
    const funcs = !abi ? [] : Object.values(new Interface(abi).functions).filter(isWriteFunction)
    setFunctions(funcs)
    setRefresh(true)
  }, [abi])

  useEffect(() => {
    if (!refresh) return
    setRefresh(false)
    const initial = getInitialTargetConditions(functions)
    const conditions: TargetConditions = { ...initial, ...target.conditions }
    setTargetConditions({ targetId: target.id, conditions })
  }, [functions, refresh, setTargetConditions, target.conditions, target.id])

  const handleChangeTargetExecutionsOptions = (value: ExecutionOption) => {
    setTargetExecutionOption({ targetId: target.id, option: value })
  }

  const handleFuncParamsChange = (conditions: TargetConditions) => {
    setTargetConditions({ targetId: target.id, conditions })
  }

  const allowAllFunctions = target.type === ConditionType.WILDCARDED

  const handleAllFuncChange = () => {
    const type = !allowAllFunctions ? ConditionType.WILDCARDED : ConditionType.SCOPED
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
        {/*// TODO: A target can't be remove from a role, it's set to 'None' which is same as disabling all functions */}
        {/*<Button*/}
        {/*  color="secondary"*/}
        {/*  variant="outlined"*/}
        {/*  className={classes.removeButton}*/}
        {/*  onClick={() => removeTarget({ target })}*/}
        {/*  startIcon={<DeleteOutlineSharp />}*/}
        {/*>*/}
        {/*  Remove Target*/}
        {/*</Button>*/}
      </Box>
      <Box sx={{ mt: 3 }}>
        <FormControlLabel
          className={classes.allowAllLabel}
          label="Allow all calls to target"
          control={<Checkbox checked={allowAllFunctions} onClick={handleAllFuncChange} />}
        />
      </Box>
      {target.type === ConditionType.WILDCARDED ? (
        <Box sx={{ mt: 2 }}>
          <ExecutionTypeSelect value={target.executionOption} onChange={handleChangeTargetExecutionsOptions} />
        </Box>
      ) : null}
      <Box
        className={classNames(classes.container, { [classes.disabledArea]: target.type === ConditionType.WILDCARDED })}
      >
        <ZodiacPaper borderStyle="single" className={classes.root}>
          <TargetFunctionList items={functions} conditions={target.conditions} onChange={handleFuncParamsChange} />
        </ZodiacPaper>
      </Box>
    </Box>
  )
}
