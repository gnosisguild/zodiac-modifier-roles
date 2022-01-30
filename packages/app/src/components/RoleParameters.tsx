import * as React from "react"
import { Box, Checkbox, FormControlLabel, IconButton, Typography, makeStyles } from "@material-ui/core"
import KeyboardArrowDownSharp from "@material-ui/icons/KeyboardArrowDownSharp"

const useStyles = makeStyles((theme) => ({
  root: {
    maxHeight: "calc(100vh - 400px)",
    overflow: "auto",
  },
  function: {
    color: "#B2B5B2",
    fontFamily: "Roboto Mono, monospace",
  },
}))

export default function IndeterminateCheckbox() {
  const classes = useStyles()
  const [checked, setChecked] = React.useState([true, false])

  const handleChange1 = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked([event.target.checked, event.target.checked])
  }

  const handleChange2 = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked([event.target.checked, checked[1]])
  }

  const handleChange3 = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked([checked[0], event.target.checked])
  }

  const children = (
    <Box sx={{ display: "flex", flexDirection: "column", ml: 3 }}>
      <FormControlLabel
        label={
          <Typography variant="body2" className={classes.function}>
            parameter1
          </Typography>
        }
        control={<Checkbox size="small" checked={checked[0]} onChange={handleChange2} />}
      />
      <FormControlLabel
        label={
          <Typography variant="body2" className={classes.function}>
            parameter2
          </Typography>
        }
        control={<Checkbox size="small" checked={checked[1]} onChange={handleChange3} />}
      />
    </Box>
  )

  return (
    <Box>
      <Box sx={{ pl: 1 }}>
        <FormControlLabel
          label={"Allow all functions"}
          control={
            <Checkbox
              checked={checked[0] && checked[1]}
              indeterminate={checked[0] !== checked[1]}
              onChange={handleChange1}
            />
          }
        />
      </Box>
      <Box className={classes.root}>
        <Box
          sx={{
            pl: 1,
            pr: 1,
            border: "1px solid rgba(217, 212, 173, 0.1)",
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <FormControlLabel
              label={
                <Typography variant="body1" className={classes.function}>
                  denyAddList
                </Typography>
              }
              control={
                <Checkbox
                  checked={checked[0] && checked[1]}
                  indeterminate={checked[0] !== checked[1]}
                  onChange={handleChange1}
                />
              }
            />
            <IconButton size="small" aria-label="Expand function parameters">
              <KeyboardArrowDownSharp />
            </IconButton>
          </Box>
          {children}
        </Box>
      </Box>
    </Box>
  )
}
