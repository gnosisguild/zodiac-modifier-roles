import { allow } from "../../allow"
import { allowErc20Approve } from "../../helpers/erc20"
import { staticEqual, staticOneOf } from "../../helpers/utils"
import { AVATAR } from "../../placeholders"
import { RolePreset } from "../../types"
import { cowswap } from "../addresses"

const preset = {
  network: 100,
  allow: [
    allow.gnosis.cowswap.order_signer["signOrder"](
      undefined,
      undefined,
      undefined,
      {
        delegatecall: true,
      }
    ),
  ],
  placeholders: { AVATAR },
} satisfies RolePreset

export default preset
