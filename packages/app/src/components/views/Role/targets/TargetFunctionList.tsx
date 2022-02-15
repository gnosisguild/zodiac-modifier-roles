import { FunctionFragment } from "@ethersproject/abi"
import { TargetFunction } from "./TargetFunction"
import { FuncParams } from "../../../../typings/role"

interface TargetFunctionListProps {
  items: FunctionFragment[]
  funcParams?: Record<string, boolean[]>
  onChange(funcParams: FuncParams): void
}

export const TargetFunctionList = ({ items, funcParams, onChange }: TargetFunctionListProps) => {
  if (!items.length) {
    return <>The target has 0 function</>
  }

  const handleFunctionChange = (format: string) => (params: boolean[]) => {
    onChange({
      ...funcParams,
      [format]: params,
    })
  }

  return (
    <>
      {items.map((func) => {
        const format = func.format()
        if (!funcParams || !funcParams[format]) return null
        return (
          <TargetFunction
            key={format}
            func={func}
            params={funcParams[format]}
            onChange={handleFunctionChange(format)}
          />
        )
      })}
    </>
  )
}
