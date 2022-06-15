import { AVATAR_ADDRESS_PLACEHOLDER } from "./placeholders"
import { RolePreset } from "../types"

import { CURVE_x3CRV_REWARD_GAUGE, SUSHISWAP_MINI_CHEF } from "./addresses"
import { staticEqual } from "./utils"

const preset: RolePreset = {
  network: 100,
  allowTargets: [],
  allowFunctions: [
    {
      targetAddresses: [SUSHISWAP_MINI_CHEF],
      signature: "harvest(uint256,address)",
      params: {
        [1]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // ensure rewards are sent to Avatar
      },
    },
    {
      targetAddresses: [CURVE_x3CRV_REWARD_GAUGE],
      signature: "claim_rewards(address)",
      params: {
        [0]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // ensure rewards are sent to Avatar
      },
    },
  ],
}
export default preset
