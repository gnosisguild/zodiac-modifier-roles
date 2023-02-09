import { FunctionFragment } from "@ethersproject/abi"
import { TargetFunction } from "./TargetFunction"
import { FunctionCondition, TargetConditions } from "../../../../typings/role"
import { getKeyFromFunction } from "../../../../utils/conditions"
import { Box, Button, Grid, makeStyles, Typography } from "@material-ui/core"
import { ZodiacPaper, ZodiacTextField } from "zodiac-ui-components"
import { useState } from "react"
import { JsonFragment } from "@ethersproject/abi"
import classNames from "classnames"
import { KeyboardArrowDownSharp, Check, EditOutlined, WarningOutlined } from "@material-ui/icons"

interface TargetFunctionListProps {
  items: FunctionFragment[]
  conditions: TargetConditions
  onChange(conditions: TargetConditions): void
  onSubmit?: (customABI: JsonFragment[]) => void
  wildcarded: boolean
}

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
    paddingRight: `calc(${theme.spacing(2)}px - 6px)`,
    maxHeight: "calc(100vh - 275px)",
    overflowY: "auto",
    scrollbarGutter: "stable",
    "&::-webkit-scrollbar": {
      width: "6px",
    },
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

  title: {
    display: "flex",
    alignItems: "center",
    minHeight: 32,
  },
  triggerTitle: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    minHeight: 32,
  },
  icon: {
    height: 32,
    fill: "#B2B5B2",
    transition: "transform 0.25s ease-in-out",
    width: 32,
  },
  rotate: {
    transform: "rotate(180deg)",
  },
}))

export const TargetFunctionList = ({ items, conditions, onChange, onSubmit, wildcarded }: TargetFunctionListProps) => {
  const classes = useStyles()

  const [customABI, setCustomABI] = useState<string>("")
  const [usingCustomABI, setUsingCustomABI] = useState(false)
  const [customABIExpanded, setCustomABIExpanded] = useState(false)

  const handleCustomABI = () => {
    if (onSubmit && (customABI || customABI !== "")) {
      try {
        let json = JSON.parse(customABI) as JsonFragment[]
        if (json.length > 0) {
          onSubmit(json)
          setUsingCustomABI(true)
        }
      } catch (err) {
        console.error("invalid custom ABI", err)
      }
    }
  }

  const handleFunctionChange = (format: string) => (funcConditions: FunctionCondition) => {
    onChange({
      ...conditions,
      [format]: funcConditions,
    })
  }

  const sighashesNotInAbi = Object.keys(conditions).filter(
    (key) => !items.some((item) => getKeyFromFunction(item) === key),
  )

  const expanded = customABIExpanded || items.length === 0

  return (
    <>
      <ZodiacPaper borderStyle="single" className={classNames(classes.root, { [classes.disabledArea]: wildcarded })}>
        <Grid container direction="column" spacing={2}>
          <Grid item>
            {!items.length ? (
              <div className={classes.title}>
                <WarningOutlined className={classes.icon} style={{ marginRight: 8 }} />
                <Typography>Unable to fetch ABI for this address</Typography>
              </div>
            ) : (
              <div className={classes.triggerTitle} onClick={() => setCustomABIExpanded(!expanded)}>
                {usingCustomABI ? (
                  <EditOutlined className={classes.icon} style={{ marginRight: 8 }} />
                ) : (
                  <Check className={classes.icon} style={{ marginRight: 8 }} />
                )}
                <Typography>{usingCustomABI ? "Using custom ABI" : "Contract ABI detected"}</Typography>
                <Box sx={{ flexGrow: 1 }} />
                {!expanded && (
                  <Typography variant="body2" style={{ marginRight: 8 }}>
                    click to enter custom ABI
                  </Typography>
                )}
                <KeyboardArrowDownSharp className={classNames(classes.icon, { [classes.rotate]: expanded })} />
              </div>
            )}
          </Grid>
          {expanded && (
            <>
              <Grid item>
                <ZodiacTextField
                  InputProps={{ style: { padding: 10 } }}
                  onChange={(evt) => setCustomABI(evt.target.value)}
                  label="Custom ABI"
                  value={customABI}
                  placeholder="Enter custom ABI here."
                  minRows={5}
                  multiline
                />
              </Grid>
              <Grid item>
                <Button color="secondary" variant="contained" onClick={handleCustomABI} disabled={!customABI}>
                  Submit Custom ABI
                </Button>
              </Grid>
            </>
          )}
        </Grid>
      </ZodiacPaper>
      <Box mt={3}>
        <ZodiacPaper borderStyle="single" className={classNames(classes.root, { [classes.disabledArea]: wildcarded })}>
          {/* render functions that are in the ABI */}
          {items.map((func) => {
            const sighash = getKeyFromFunction(func)
            if (!conditions[sighash]) return null
            return (
              <TargetFunction
                key={sighash}
                func={func}
                functionConditions={conditions[sighash]}
                onChange={handleFunctionChange(sighash)}
              />
            )
          })}

          {/* render functions that are not in the ABI */}
          {sighashesNotInAbi.map((sighash) => {
            const funcConditions = conditions[sighash]
            return (
              <TargetFunction
                key={sighash}
                func={sighash}
                functionConditions={funcConditions}
                onChange={handleFunctionChange(sighash)}
              />
            )
          })}
        </ZodiacPaper>
      </Box>
    </>
  )
}
