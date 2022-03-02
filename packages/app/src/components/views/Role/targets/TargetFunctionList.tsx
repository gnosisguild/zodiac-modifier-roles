import { FunctionFragment } from "@ethersproject/abi"
import { TargetFunction } from "./TargetFunction"
import { FunctionCondition, TargetConditions } from "../../../../typings/role"
import { getKeyFromFunction } from "../../../../utils/conditions"

interface TargetFunctionListProps {
  items: FunctionFragment[]
  conditions: TargetConditions

  onChange(conditions: TargetConditions): void
}

export const TargetFunctionList = ({ items, conditions, onChange }: TargetFunctionListProps) => {
  if (!items.length) {
    return <>The target has 0 function</>
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
