import { allowCurvePool } from "../helpers/curve"
import { allowErc20Approve } from "../helpers/erc20"
import { allowLido } from "../helpers/lido"
import { staticEqual } from "../helpers/utils"
import { RolePreset } from "../types"

const preset: RolePreset = {
  network: 1,
  allow: [...allowLido()],
  placeholders: {},
}
export default preset
