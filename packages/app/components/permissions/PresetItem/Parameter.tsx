import { Preset } from "zodiac-roles-sdk/annotations"
import Flex from "@/ui/Flex"
import classes from "./style.module.css"
import LabeledData from "@/ui/LabeledData"

const Parameter: React.FC<{
  parameter: Preset["operation"]["parameters"][number]
  params: Preset["params"]
  query: Preset["query"]
}> = ({ parameter, params, query }) => {
  // we only support path and query parameters
  if (parameter.in !== "path" && parameter.in !== "query") return null
  const value = (
    parameter.in === "path" ? params[parameter.name] : query[parameter.name]
  ) as string | number | string[] | number[] | undefined

  return (
    <LabeledData label={parameter.name} title={parameter.description}>
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
