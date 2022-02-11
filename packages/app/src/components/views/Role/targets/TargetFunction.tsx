import { FunctionFragment } from "@ethersproject/abi"
import { Box, Checkbox, FormControlLabel, makeStyles, Typography } from "@material-ui/core"
import { KeyboardArrowDownSharp } from "@material-ui/icons"
import classNames from "classnames"
import React from "react"

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
    alignItems: "center",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
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

interface TargetFunctionProps {
  func: FunctionFragment
}

export const TargetFunction = ({ func }: TargetFunctionProps) => {
  const classes = useStyles()

  // const children = (
  //   <Box sx={{ display: "flex", flexDirection: "column", ml: 3 }}>
  //     <FormControlLabel
  //       label={<Typography variant="body2">parameter1</Typography>}
  //       control={<Checkbox size="small" checked={checked[0]} onChange={handleChange2} />}
  //     />
  //     <FormControlLabel
  //       label={<Typography variant="body2">parameter2</Typography>}
  //       control={<Checkbox size="small" checked={checked[1]} onChange={handleChange3} />}
  //     />
  //   </Box>
  // )

  return (
    <Box className={classes.wrapper}>
      <Box className={classes.trigger}>
        <FormControlLabel
          label={<Typography variant="body1">{func.name}</Typography>}
          control={
            <Checkbox
            // checked={checked[0] && checked[1]}
            // indeterminate={checked[0] !== checked[1]}
            // onChange={handleChange1}
            />
          }
        />
        <KeyboardArrowDownSharp className={classNames(classes.arrow /*,  isFunctionOpen && "isActive" */)} />
      </Box>
      {/*{isFunctionOpen && children}*/}
    </Box>
  )
}
