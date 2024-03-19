import Flex from "@/ui/Flex"
import { OpenAPIParameter, Preset } from "../types"
import classes from "./style.module.css"
import LabeledData from "@/ui/LabeledData"

const Parameter: React.FC<{
  parameter: OpenAPIParameter
  queryParams: Preset["queryParams"]
  pathParams: Preset["pathParams"]
}> = ({ parameter, queryParams, pathParams }) => {
  // we only support path and query parameters
  if (parameter.in !== "path" && parameter.in !== "query") return null
  const value = (
    parameter.in === "path"
      ? pathParams[parameter.name]
      : queryParams[parameter.name]
  ) as string | number | string[] | number[] | undefined

  return (
    <LabeledData
      label={parameter.name}
      title={parameter.description}
      key={parameter.name}
    >
      {parameter.schema?.type === "array" ? (
        <ArrayInput
          readOnly
          value={
            value
              ? Array.isArray(value)
                ? value
                : ([value] as string[] | number[])
              : undefined
          }
        />
      ) : (
        <input
          type="text"
          readOnly
          value={value ? value.toString() : ""}
          className={classes.parameterInput}
        />
      )}
    </LabeledData>
  )
}

export default Parameter

const ArrayInput: React.FC<{
  readOnly: boolean
  value: string[] | number[] | undefined
}> = ({ readOnly, value }) => {
  return (
    <Flex gap={2} direction="column">
      {value?.map((item, i) => (
        <input
          key={i}
          type="text"
          readOnly={readOnly}
          value={item.toString()}
          className={classes.parameterInput}
        />
      ))}
    </Flex>
  )
}
