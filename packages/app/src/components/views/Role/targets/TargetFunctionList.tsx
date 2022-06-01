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
          <Typography>The target has 0 function</Typography>{" "}
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
  return (
    <>
      {items.map((func) => {
        const format = getKeyFromFunction(func)
        if (!conditions[format]) return null
        return (
          <TargetFunction
            key={format}
            func={func}
            functionConditions={conditions[format]}
            onChange={handleFunctionChange(format)}
          />
        )
      })}
    </>
  )
}
