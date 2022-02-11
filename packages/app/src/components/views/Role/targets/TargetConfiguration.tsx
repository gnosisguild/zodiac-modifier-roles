import React, { useMemo } from "react"
import { Box, Button, Checkbox, FormControlLabel, InputLabel, makeStyles, MenuItem, Select } from "@material-ui/core"
import { DeleteOutlineSharp } from "@material-ui/icons"
import { TextField } from "../../../commons/input/TextField"
import { EXECUTION_OPTIONS, Target } from "../../../../typings/role"
import { useAbi } from "../../../../hooks/useAbi"
import { TargetFunctionList } from "./TargetFunctionList"
import { FunctionFragment, Interface } from "@ethersproject/abi"

const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: theme.spacing(3),
    padding: theme.spacing(2),
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
    maxHeight: "calc(100vh - 400px)",
    overflow: "auto",
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
    marginLeft: theme.spacing(4),
    whiteSpace: "nowrap",
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

const TargetConfiguration = ({ target, onChangeTargetExecutionsOptions }: Props) => {
  const classes = useStyles()

  const handleChangeTargetExecutionsOptions = (value: any) => {
    console.log(value)
  }

  const { abi } = useAbi(target.address)
  const functions = useMemo(() => {
    if (!abi) return []
    return new Interface(abi).fragments.filter(FunctionFragment.isFunctionFragment)
  }, [abi])

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
          // onClick={removeTarget}
          startIcon={<DeleteOutlineSharp />}
        >
          Remove Target
        </Button>
      </Box>
      <Box sx={{ mt: 3 }}>
        <InputLabel className={classes.label}>Execution Type</InputLabel>
        <Select value={target.executionOptions} onChange={handleChangeTargetExecutionsOptions} disabled={true}>
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
          label={"Allow all functions"}
          control={<Checkbox checked={true} disabled={true} />}
        />
      </Box>
      <Box className={classes.container}>
        <Box className={classes.root}>
          <TargetFunctionList items={functions} />
        </Box>
      </Box>
    </Box>
  )
}

export default TargetConfiguration
