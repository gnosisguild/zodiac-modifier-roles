import { Preset, PresetsDiff } from "../types"
import IndividualPermissions from "./IndividualPermissions"
import PresetInfo from "./PresetInfo"
import Parameter from "./Parameter"
import { ChainId } from "@/app/chains"
import Flex from "@/ui/Flex"
import DiffBox from "../DiffBox"

const PresetItem: React.FC<{
  preset: Preset
  chainId: ChainId
  diff?: PresetsDiff
}> = ({ preset, chainId, diff }) => {
  const presetDiff = diff?.get(preset)
  return (
    <DiffBox bg diff={presetDiff?.flag}>
      <Flex direction="column" gap={3}>
        <PresetInfo apiInfo={preset.apiInfo} operation={preset.operation} />

        <Flex direction="column" gap={2}>
          {preset.operation.parameters.map((parameter) => (
            <Parameter
              key={parameter.name}
              parameter={parameter}
              pathParams={preset.pathParams}
              queryParams={preset.queryParams}
            />
          ))}
        </Flex>

        <IndividualPermissions
          chainId={chainId}
          permissions={preset.permissions}
          diff={presetDiff?.permissions}
        />
      </Flex>
    </DiffBox>
  )
}

export default PresetItem
