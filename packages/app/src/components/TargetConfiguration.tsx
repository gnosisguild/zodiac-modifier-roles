import React, { useState } from "react"
import { Box, Button, Checkbox, FormControlLabel, InputLabel, makeStyles, Select, MenuItem } from "@material-ui/core"
import { DeleteOutlineSharp } from "@material-ui/icons"
import { TextField } from "./commons/input/TextField"
import { ethers } from "ethers"
import { ExecutionOptionsArray, Target } from "../typings/role"

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
  // const [checked, setChecked] = React.useState([true, false])
  const [targetAddress, setTargetAddress] = useState("")
  const [isValidAddress, setIsValidAddress] = useState(false)

  console.log(targetAddress)
  console.log(isValidAddress)

  // const handleChange1 = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   setChecked([event.target.checked, event.target.checked])
  // }

  // const handleChange2 = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   setChecked([event.target.checked, checked[1]])
  // }

  // const handleChange3 = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   setChecked([checked[0], event.target.checked])
  // }

  const onTargetAddressChange = (address: string) => {
    setIsValidAddress(ethers.utils.isAddress(address))
    setTargetAddress(address)
  }

  const handleChangeTargetExecutionsOptions = (value: any) => {
    console.log(value)
  }

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
    <Box>
      <Box alignItems="flex-end" display="flex" justifyContent="space-between">
        <TextField
          onChange={(e) => onTargetAddressChange(e.target.value)}
          label="Target Address"
          placeholder={target.address}
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
        <Select value={target.executionOptions} onChange={handleChangeTargetExecutionsOptions}>
          {ExecutionOptionsArray.map((options) => (
            <MenuItem value={options}>{options}</MenuItem>
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
      {/* <Box className={classes.container}>
        <Box className={classes.root}>
          <Box className={classes.functionWrapper}>
            <Box onClick={() => setFunctionOpen(!isFunctionOpen)} className={classes.functionTrigger}>
              <FormControlLabel
                label={<Typography variant="body1">denyAddList</Typography>}
                control={
                  <Checkbox
                    checked={checked[0] && checked[1]}
                    indeterminate={checked[0] !== checked[1]}
                    onChange={handleChange1}
                  />
                }
              />
              <KeyboardArrowDownSharp className={classNames(classes.arrow, isFunctionOpen && "isActive")} />
            </Box>
            {isFunctionOpen && children}
          </Box>
        </Box>
      </Box> */}
    </Box>
  )
}

export default TargetConfiguration
