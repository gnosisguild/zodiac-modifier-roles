import { allowCurvePool } from "../helpers/curve"
import { allowErc20Approve } from "../helpers/erc20"
import { allowLido } from "../helpers/lido"
import { staticEqual } from "../helpers/utils"
import { RolePreset } from "../types"

const preset = {
  network: 1,
  allow: [...allowLido()],
  placeholders: {},
} satisfies RolePreset

export default preset
