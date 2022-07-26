import { RolePreset } from "../types"

import {
  CURVE_3POOL_GAUGE_FACTORY,
  CURVE_MAI_3POOL3CRV_GAUGE,
  CURVE_x3CRV_GAUGE,
  CURVE_x3CRV_REWARD_GAUGE,
  ELK_FARMING_REWARDS,
  SUSHISWAP_MINI_CHEF,
  SYMMETRIC_MINI_CHEF,
} from "./addresses"
import { AVATAR_ADDRESS_PLACEHOLDER } from "./placeholders"
import { staticEqual } from "./utils"

const preset: RolePreset = {
  network: 100,
  allowTargets: [],
  allowFunctions: [
    {
      targetAddresses: [SUSHISWAP_MINI_CHEF, SYMMETRIC_MINI_CHEF],
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
    {
      targetAddresses: ELK_FARMING_REWARDS,
      signature: "getReward()",
    },
    {
      targetAddresses: ELK_FARMING_REWARDS,
      signature: "getBoosterReward()",
    },
  ],
}
export default preset
