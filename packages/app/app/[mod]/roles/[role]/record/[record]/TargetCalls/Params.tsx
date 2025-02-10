import { AbiParameter } from "viem"

export const TupleParams: React.FC<{
  value: readonly unknown[]
  type: readonly AbiParameter[]
}> = ({ value, type }) => {
  return (
    <div>
      {type.map((field, i) => (
        <div key={i}>
          {field.name} ({field.type})
        </div>
      ))}
    </div>
  )
}
