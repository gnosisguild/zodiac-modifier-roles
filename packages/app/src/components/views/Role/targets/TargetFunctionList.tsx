import { FunctionFragment } from "@ethersproject/abi"
import { TargetFunction } from "./TargetFunction"
import { FunctionCondition, TargetConditions } from "../../../../typings/role"
import { getKeyFromFunction } from "../../../../utils/conditions"
import { Button, Grid, Typography } from "@material-ui/core"
import { ZodiacTextField } from "zodiac-ui-components"
import { useState } from "react"
import { JsonFragment } from "@ethersproject/abi"

interface TargetFunctionListProps {
  items: FunctionFragment[]
  conditions: TargetConditions
  onChange(conditions: TargetConditions): void
  onSubmit?: (customABI: JsonFragment[]) => void
}

export const TargetFunctionList = ({ items, conditions, onChange, onSubmit }: TargetFunctionListProps) => {
  const [customABI, setCustomABI] = useState<JsonFragment[] | undefined>(undefined)
  const handleCustomABI = () => {
    if (onSubmit && (customABI || customABI !== "")) {
      onSubmit(customABI as JsonFragment[])
    }
  }
  if (!items.length) {
    return (
      <Grid container direction="column" spacing={2}>
        <Grid item>
          <Typography>Unable to fetch ABI for this address</Typography>{" "}
        </Grid>
        <Grid item>
          <ZodiacTextField
            InputProps={{ style: { padding: 10 } }}
            onChange={(evt: any) => setCustomABI(evt.target.value)}
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
      </Grid>
    )
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

  return (
    <>
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
    </>
  )
}
