import { FunctionFragment } from "@ethersproject/abi"
import { TargetFunction } from "./TargetFunction"
import { FunctionConditions, TargetConditions } from "../../../../typings/role"
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

  const handleFunctionChange = (format: string) => (funcConditions: FunctionConditions) => {
    onChange({
      ...conditions,
      functions: {
        ...conditions.functions,
        [format]: funcConditions,
      },
    })
  }
  return (
    <>
      {items.map((func) => {
        const format = getKeyFromFunction(func)
        if (!conditions.functions[format]) return null
        return (
          <TargetFunction
            key={format}
            func={func}
            functionConditions={conditions.functions[format]}
            onChange={handleFunctionChange(format)}
          />
        )
      })}
    </>
  )
}
