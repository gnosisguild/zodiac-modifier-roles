import { OpenAPIParameter, Preset } from "../types"
import Field from "@/ui/Field"
import classes from "./style.module.css"

const Parameter: React.FC<{
  parameter: OpenAPIParameter
  queryParams: Preset["queryParams"]
  pathParams: Preset["pathParams"]
}> = ({ parameter, queryParams, pathParams }) => {
  // we only support path and query parameters
  if (parameter.in !== "path" && parameter.in !== "query") return null
  const value =
    parameter.in === "path"
      ? pathParams[parameter.name]
      : queryParams[parameter.name]

  return (
    <Field
      label={parameter.name}
      title={parameter.description}
      key={parameter.name}
    >
      {parameter.schema?.type === "array" ? (
        <ArrayInput
          readOnly
          value={
            Array.isArray(value) ? value : ([value] as string[] | number[])
          }
        />
      ) : (
        <input type="text" readOnly value={value.toString()} />
      )}
    </Field>
  )
}

export default Parameter

const ArrayInput: React.FC<{
  readOnly: boolean
  value: string[] | number[]
}> = ({ readOnly, value }) => {
  return (
    <div>
      {value.map((item, i) => (
        <input
          key={i}
          type="text"
          readOnly={readOnly}
          value={item.toString()}
          className={classes.arrayItem}
        />
      ))}
    </div>
  )
}
