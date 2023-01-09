import { ExecutionOptions, RolePreset } from "../../types"
import { allowCurvePool } from "../helpers/curve"
import { allowErc20Approve } from "../helpers/erc20"
import { allowLido } from "../helpers/lido"
import { dynamic32Equal, staticEqual } from "../helpers/utils"
import {
  AVATAR_ADDRESS_PLACEHOLDER,
  OMNI_BRIDGE_RECEIVER_PLACEHOLDER,
} from "../placeholders"

const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
const cUSDC = "0x39AA39c021dfbaE8faC545936693aC917d5E7563"

const preset: RolePreset = {
  network: 1,
  allow: [...allowErc20Approve([USDC], [cUSDC])],
}
export default preset
