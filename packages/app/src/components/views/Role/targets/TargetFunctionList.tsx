import { FunctionFragment } from "@ethersproject/abi"
import { TargetFunction } from "./TargetFunction"

interface TargetFunctionListProps {
  items: FunctionFragment[]
}

export const TargetFunctionList = ({ items }: TargetFunctionListProps) => {
  if (!items.length) {
    return <>The target has 0 function</>
  }

  return (
    <>
      {items.map((func) => (
        <TargetFunction func={func} />
      ))}
    </>
  )
}
