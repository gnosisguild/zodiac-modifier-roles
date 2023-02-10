import React, { useContext } from "react"
import { Box, FormControlLabel, makeStyles, Typography } from "@material-ui/core"
import { ConditionType, ExecutionOption, Target, TargetConditions } from "../../../../typings/role"
import { useAbi } from "../../../../hooks/useAbi"
import { TargetFunctionList } from "./TargetFunctionList"
import { RoleContext } from "../RoleContext"
import { Checkbox } from "../../../commons/input/Checkbox"
import { getWriteFunctions } from "../../../../utils/conditions"
import classNames from "classnames"
import { ExecutionOptions } from "./ExecutionOptions"

const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: theme.spacing(3),
  },
  allowAllLabel: {
    "& .MuiTypography-body1": {
      fontSize: 16,
    },
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

export const TargetConfiguration = ({ target }: TargetConfigurationProps) => {
  const classes = useStyles()
  const { abi, setAbi, fetchAbi, loading: abiLoading } = useAbi(target.address)
  const { setTargetConditions, setTargetClearance, setTargetExecutionOption, state } = useContext(RoleContext)

  console.log("update events", state.getTargetUpdate(target.id))
  const isWildcarded = target.type === ConditionType.WILDCARDED
  const functions = getWriteFunctions(abi)

  const handleChangeTargetExecutionsOptions = (value: ExecutionOption) => {
    setTargetExecutionOption({ targetId: target.id, option: value })
  }

  const handleFuncParamsChange = (conditions: TargetConditions) => {
    setTargetConditions({ targetId: target.id, conditions })
  }

  const handleAllFuncChange = () => {
    const type = !isWildcarded ? ConditionType.WILDCARDED : ConditionType.SCOPED
    setTargetClearance({ targetId: target.id, option: type })

    const conditions = Object.keys(target.conditions).reduce(
      (map, key) => ({
        ...map,
        [key]: { ...target.conditions[key], params: [], type: ConditionType.BLOCKED },
      }),
      {},
    )

    setTargetConditions({
      targetId: target.id,
      conditions,
    })
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
        {/*// from the users perspective it will be "removed", so I still think we should do it*/}
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
          control={<Checkbox checked={isWildcarded} onClick={handleAllFuncChange} />}
        />
      </Box>
      {isWildcarded ? (
        <Box sx={{ mt: 2 }}>
          <ExecutionOptions value={target.executionOption} onChange={handleChangeTargetExecutionsOptions} />
        </Box>
      ) : null}
      <Box className={classNames(classes.container)}>
        <TargetFunctionList
          items={functions}
          conditions={target.conditions}
          onChange={handleFuncParamsChange}
          abiLoading={abiLoading}
          onSubmit={(customABI) => (customABI.length ? setAbi(customABI) : fetchAbi())}
          wildcarded={isWildcarded}
          key={target.id} // force discarding custom entered ABI state when switching between targets
        />
      </Box>
    </Box>
  )
}
