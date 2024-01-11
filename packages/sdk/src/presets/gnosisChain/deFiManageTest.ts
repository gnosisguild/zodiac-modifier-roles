import { allow } from "./../allow"
import { allowErc20Approve } from "./../helpers/erc20"
import { staticEqual, staticOneOf } from "./../helpers/utils"
import { AVATAR } from "./../placeholders"
import { RolePreset } from "./../types"
import { GNO, WETH, balancer } from "./addresses"

const preset = {
  network: 100,
  allow: [],
  placeholders: { AVATAR },
} satisfies RolePreset

export default preset
