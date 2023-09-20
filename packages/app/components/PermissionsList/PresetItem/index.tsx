import Box from "@/ui/Box"
import { Preset } from "../types"
import IndividualPermissions from "./IndividualPermissions"
import PresetInfo from "./PresetInfo"
import Parameter from "./Parameter"

const PresetItem: React.FC<Preset> = ({
  permissions,
  apiInfo,
  operation,
  queryParams,
  pathParams,
}) => {
  return (
    <Box p={2}>
      <PresetInfo apiInfo={apiInfo} operation={operation} />

      {operation.parameters.map((parameter) => (
        <Parameter
          key={parameter.name}
          parameter={parameter}
          pathParams={pathParams}
          queryParams={queryParams}
        />
      ))}

      <IndividualPermissions permissions={permissions} />
    </Box>
  )
}

export default PresetItem
