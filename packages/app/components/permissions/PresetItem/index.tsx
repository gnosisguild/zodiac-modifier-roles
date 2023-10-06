import { Preset, PresetsDiff } from "../types"
import IndividualPermissions from "./IndividualPermissions"
import PresetInfo from "./PresetInfo"
import Parameter from "./Parameter"
import { ChainId } from "@/app/chains"
import Flex from "@/ui/Flex"
import DiffBox from "../DiffBox"

interface Props {
  preset: Preset
  chainId: ChainId
  diff?: PresetsDiff
}

const PresetItem: React.FC<Props> = ({ preset, chainId, diff }) => {
  const presetDiff = diff?.get(preset)
  return (
    <div>
      <PresetItemMain {...{ preset, chainId, diff }} />
      <IndividualPermissions
        chainId={chainId}
        permissions={preset.permissions}
        diff={presetDiff?.permissions}
      />
    </div>
  )
}

export default PresetItem

const PresetItemMain: React.FC<Props> = ({ preset, chainId, diff }) => {
  const presetDiff = diff?.get(preset)
  return (
    <DiffBox
      bg
      stretch
      diff={presetDiff?.flag}
      modified={
        presetDiff?.modified && (
          <PresetItemMain preset={presetDiff.modified} chainId={chainId} />
        )
      }
    >
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
      </Flex>
    </DiffBox>
  )
}
