import { Preset, PresetsDiff } from "../types"
import IndividualPermissions from "./IndividualPermissions"
import PresetInfo from "./PresetInfo"
import Parameter from "./Parameter"
import { ChainId } from "@/app/chains"
import Flex from "@/ui/Flex"
import DiffBox from "../DiffBox"
import classes from "./style.module.css"

interface Props {
  preset: Preset
  chainId: ChainId
  diff?: PresetsDiff
}

const PresetItem: React.FC<Props> = ({ preset, chainId, diff }) => {
  // TODO what's the plan here!?
  const presetDiff = diff?.get(preset)
  return <PresetItemMain {...{ preset, chainId, diff }} />
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
      <Flex direction="column" gap={3} className={classes.presetContainer}>
        <PresetInfo apiInfo={preset.apiInfo} operation={preset.operation} />

        <Flex direction="column" gap={3}>
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
