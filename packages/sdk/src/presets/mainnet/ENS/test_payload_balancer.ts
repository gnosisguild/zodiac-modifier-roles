import { balancerExitStrategy1 } from "../../../../src/presets/helpers/ExitStrategies/BalancerExitStrategies"
import { AVATAR } from "../../placeholders"
import { RolePreset } from "../../types"

const preset = {
  network: 1,
  allow: [
    ...balancerExitStrategy1(
      "0x8353157092ed8be69a9df8f95af097bbf33cb2af0000000000000000000005d9"
    ),
  ],
  placeholders: { AVATAR },
} satisfies RolePreset
export default preset
