import Box from "@/ui/Box"
import { Preset } from "../types"
import IndividualPermissions from "./IndividualPermissions"
import PresetInfo from "./PresetInfo"
import Parameter from "./Parameter"
import { ChainId } from "@/app/chains"
import Flex from "@/ui/Flex"

const PresetItem: React.FC<Preset & { chainId: ChainId }> = ({
  chainId,
  permissions,
  apiInfo,
  operation,
  queryParams,
  pathParams,
}) => {
  return (
    <Box bg p={3}>
      <Flex direction="column" gap={3}>
        <PresetInfo apiInfo={apiInfo} operation={operation} />

        <Flex direction="column" gap={2}>
          {operation.parameters.map((parameter) => (
            <Parameter
              key={parameter.name}
              parameter={parameter}
              pathParams={pathParams}
              queryParams={queryParams}
            />
          ))}
        </Flex>

        <IndividualPermissions chainId={chainId} permissions={permissions} />
      </Flex>
    </Box>
  )
}

export default PresetItem
