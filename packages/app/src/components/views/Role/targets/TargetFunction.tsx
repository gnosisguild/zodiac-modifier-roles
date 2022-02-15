import { FunctionFragment } from "@ethersproject/abi"
import { Box, Checkbox, FormControlLabel, makeStyles, Typography } from "@material-ui/core"
import { KeyboardArrowDownSharp } from "@material-ui/icons"
import classNames from "classnames"
import React, { useMemo, useState } from "react"

const useStyles = makeStyles((theme) => ({
  wrapper: {
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
  trigger: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
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
  content: {
    display: "flex",
    flexDirection: "column",
    marginLeft: theme.spacing(3),
  },
  hidden: {
    display: "none",
  },
  checkbox: {
    padding: theme.spacing(1),
  },
  row: {
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
  name: {},
}))

interface TargetFunctionProps {
  func: FunctionFragment
  params: boolean[]

  onChange(params: boolean[]): void
}

function getParamsTypesTitle(func: FunctionFragment): string {
  if (!func.inputs.length) return "( )"
  return "(" + func.inputs.map((input) => input.format("full")).join(", ") + ")"
}

export const TargetFunction = ({ func, params, onChange }: TargetFunctionProps) => {
  const classes = useStyles()

  const isSimple = func.inputs.length < 2

  const [open, setOpen] = useState(false)

  const paramsText = useMemo(() => getParamsTypesTitle(func), [func])
  const paramsChecked = params.filter((param) => param)

  const handleParamChange = (index: number, checked: boolean) => {
    onChange(
      params.map((current, _index) => {
        if (_index === index) return checked
        return current
      }),
    )
  }

  const handleFunctionCheck = (checked: boolean) => {
    if (isSimple) {
      onChange([checked])
      return
    }
    onChange(params.map((_) => checked))
  }

  const handleOpen = () => {
    if (isSimple) {
      handleFunctionCheck(paramsChecked.length !== params.length)
      return
    }
    setOpen(!open)
  }

  return (
    <div className={classes.wrapper}>
      <div className={classes.trigger} onClick={handleOpen}>
        <Checkbox
          indeterminate={!!paramsChecked.length && paramsChecked.length !== params.length}
          checked={paramsChecked.length === params.length}
          onChange={(_, checked) => handleFunctionCheck(checked)}
          onClick={(evt) => evt.stopPropagation()}
        />
        <Typography variant="body1">{func.name}</Typography>
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
      {!isSimple ? (
        <div className={classNames(classes.content, { [classes.hidden]: !open })}>
          {func.inputs.map((param, index) => (
            <FormControlLabel
              key={index}
              label={
                <div className={classes.row}>
                  <Typography variant="body1" className={classes.name}>
                    {param.name}
                  </Typography>
                  <Typography variant="body2" className={classes.type}>
                    {param.type}
                  </Typography>
                </div>
              }
              control={
                <Checkbox
                  checked={params[index]}
                  onChange={(_, checked) => handleParamChange(index, checked)}
                  size="small"
                />
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
