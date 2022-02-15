import React, { useContext, useEffect, useMemo } from "react"
import { Box, Button, Checkbox, FormControlLabel, InputLabel, makeStyles, MenuItem, Select } from "@material-ui/core"
import { DeleteOutlineSharp } from "@material-ui/icons"
import { TextField } from "../../../commons/input/TextField"
import { EXECUTION_OPTIONS, FuncParams, Target } from "../../../../typings/role"
import { useAbi } from "../../../../hooks/useAbi"
import { TargetFunctionList } from "./TargetFunctionList"
import { FunctionFragment, Interface } from "@ethersproject/abi"
import { RoleContext } from "../RoleContext"
import { areAllFunctionsAllowed } from "../../../../services/rolesModifierContract"

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
    maxHeight: "calc(100vh - 400px)",
    overflowY: "auto",
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
}))

type Props = {
  target: Target
  onChangeTargetExecutionsOptions: (target: Target) => void
}

function isWriteFunction(method: FunctionFragment) {
  if (!method.stateMutability) return true
  return !["view", "pure"].includes(method.stateMutability)
}

function getInitialFuncParams(functions: FunctionFragment[], defaultValue = true): FuncParams {
  return functions.reduce((obj, func) => {
    const params = func.inputs.length < 2 ? [defaultValue] : func.inputs.map((_) => defaultValue)
    return {
      ...obj,
      [func.format()]: params,
    }
  }, {})
}

const TargetConfiguration = ({ target, onChangeTargetExecutionsOptions }: Props) => {
  const classes = useStyles()
  const { setFuncParams, removeTarget } = useContext(RoleContext)

  const { abi } = useAbi(target.address)
  const functions = useMemo(() => {
    if (!abi) return []
    return new Interface(abi).fragments.filter(FunctionFragment.isFunctionFragment).filter(isWriteFunction)
  }, [abi])

  useEffect(() => {
    setFuncParams({ targetId: target.id, funcParams: getInitialFuncParams(functions) })
  }, [functions, setFuncParams, target.id])

  const handleChangeTargetExecutionsOptions = (value: any) => {
    onChangeTargetExecutionsOptions(value)
  }

  const handleFuncParamsChange = (funcParams: FuncParams) => {
    setFuncParams({ targetId: target.id, funcParams })
  }

  const allowAllFunc = areAllFunctionsAllowed(target.funcParams || {})

  const handleAllFuncChange = () => {
    const newFuncParams = Object.fromEntries(
      Object.entries(target.funcParams || {}).map(([func, params]) => {
        return [func, params.map((_) => !allowAllFunc)]
      }),
    )
    setFuncParams({ targetId: target.id, funcParams: newFuncParams })
  }

  return (
    <Box>
      <Box alignItems="flex-end" display="flex" justifyContent="space-between">
        <TextField
          label="Target Address"
          value={target.address}
          InputProps={{
            readOnly: true,
          }}
        />
        <Button
          color="secondary"
          variant="outlined"
          className={classes.removeButton}
          size="large"
          onClick={() => removeTarget({ target })}
          startIcon={<DeleteOutlineSharp />}
        >
          Remove Target
        </Button>
      </Box>
      <Box sx={{ mt: 3 }}>
        <InputLabel className={classes.label}>Execution Type</InputLabel>
        <Select value={target.executionOptions} onChange={handleChangeTargetExecutionsOptions}>
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
          label="Allow all functions"
          control={<Checkbox checked={allowAllFunc} onClick={handleAllFuncChange} />}
        />
      </Box>
      <Box className={classes.container}>
        <Box className={classes.root}>
          <TargetFunctionList items={functions} funcParams={target.funcParams} onChange={handleFuncParamsChange} />
        </Box>
      </Box>
    </Box>
  )
}

export default TargetConfiguration
