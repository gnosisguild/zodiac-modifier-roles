import { hashMessage } from "ethers/lib/utils"
import { stat } from "fs"
import { ExecutionOptions, RolePreset } from "../../types"
import { allowCurvePool } from "../helpers/curve"
import { allowErc20Approve } from "../helpers/erc20"
import { allowLido } from "../helpers/lido"
import {
  dynamic32Equal,
  dynamicEqual,
  staticEqual,
  subsetOf,
} from "../helpers/utils"
import {
  AVATAR_ADDRESS_PLACEHOLDER,
  OMNI_BRIDGE_RECEIVER_PLACEHOLDER,
} from "../placeholders"

const preset: RolePreset = {
  network: 1,
  allow: [],
}
export default preset
