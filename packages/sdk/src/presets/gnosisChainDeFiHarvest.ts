import { RolePreset } from "../types"

import {
  CURVE_3POOL_GAUGE_FACTORY,
  CURVE_MAI_3POOL3CRV_GAUGE,
  CURVE_x3CRV_GAUGE,
  CURVE_x3CRV_REWARD_GAUGE,
  SUSHISWAP_MINI_CHEF,
} from "./addresses"
import { AVATAR_ADDRESS_PLACEHOLDER } from "./placeholders"
import { staticEqual } from "./utils"

const CURVE_CRV_REWARDS = "0xabc000d88f23bb45525e447528dbf656a9d55bf5"

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
      targetAddresses: [
        CURVE_x3CRV_REWARD_GAUGE,
        CURVE_x3CRV_GAUGE,
        CURVE_MAI_3POOL3CRV_GAUGE,
      ],
      signature: "claim_rewards(address)",
      params: {
        [0]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // ensure rewards are sent to Avatar
      },
    },
    {
      targetAddresses: [CURVE_3POOL_GAUGE_FACTORY],
      signature: "mint(address)",
      params: {
        [0]: staticEqual(CURVE_x3CRV_GAUGE, "address"),
      },
    },
  ],
}
export default preset
