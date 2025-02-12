import Flex from "@/ui/Flex"
import { arrayElementType } from "@/utils/abi"
import { AbiParameter } from "viem"
import classes from "./style.module.css"

export const TupleParams: React.FC<{
  value: readonly unknown[]
  type: readonly AbiParameter[]
}> = ({ value, type }) => {
  return (
    <Flex direction="column" gap={1}>
      {type.map((field, i) => (
        <Flex direction="row" gap={3} key={i}>
          <label className={classes.paramLabel}>{field.name || `[${i}]`}</label>
          <Param type={field} value={value[i]} />
        </Flex>
      ))}
    </Flex>
  )
}

const ArrayParam: React.FC<{ value: unknown[]; type: AbiParameter }> = ({
  value,
  type,
}) => {
  const elementType = arrayElementType(type)
  if (!elementType) {
    throw new Error("Not an array type")
  }

  return (
    <div>
      {value.map((v, i) => (
        <div key={i}>
          <Param type={elementType} value={v} />
        </div>
      ))}
    </div>
  )
}

const PrimitiveParam: React.FC<{
  value: unknown
  type: AbiParameter
}> = ({ value, type }) => {
  if (
    typeof value !== "bigint" &&
    typeof value !== "string" &&
    typeof value !== "boolean" &&
    typeof value !== "number"
  ) {
    throw new Error("Unexpected non-primitive value")
  }

  return (
    <div>
      <input type="text" value={value.toString()} readOnly />
      <code>{type.type}</code>
    </div>
  )
}

const Param: React.FC<{ value: unknown; type: AbiParameter }> = ({
  value,
  type,
}) => {
  const isArray = type.type.endsWith("]")
  const isTuple = !isArray && type.type === "tuple" && "components" in type

  if (isTuple) {
    if (typeof value !== "object" || value == null) {
      throw new Error("Tuple value must be an array or object")
    }
    return (
      <TupleParams
        value={Array.isArray(value) ? value : Object.values(value)}
        type={type.components}
      />
    )
  }

  if (isArray) {
    if (!Array.isArray(value)) {
      throw new Error("Array value must be an array")
    }
    return <ArrayParam value={value} type={type} />
  }

  return <PrimitiveParam value={value} type={type} />
}
