import { RolePreset } from "../../types"
import { forAllTargetAddresses, staticEqual } from "../helpers/utils"
import { AVATAR_ADDRESS } from "../placeholders"

import {
  CURVE_3POOL_GAUGE_FACTORY,
  CURVE_MAI_3POOL3CRV_GAUGE,
  CURVE_x3CRV_GAUGE,
  CURVE_x3CRV_REWARD_GAUGE,
  ELK_FARMING_REWARDS,
  SUSHISWAP_MINI_CHEF,
  SYMMETRIC_MINI_CHEF,
} from "./addresses"

const preset: RolePreset = {
  network: 100,
  allow: [
    ...forAllTargetAddresses([SUSHISWAP_MINI_CHEF, SYMMETRIC_MINI_CHEF], {
      signature: "harvest(uint256,address)",
      params: {
        [1]: staticEqual(AVATAR_ADDRESS), // ensure rewards are sent to Avatar
      },
    }),

    ...forAllTargetAddresses(
      [CURVE_x3CRV_REWARD_GAUGE, CURVE_x3CRV_GAUGE, CURVE_MAI_3POOL3CRV_GAUGE],
      {
        signature: "claim_rewards(address)",
        params: {
          [0]: staticEqual(AVATAR_ADDRESS), // ensure rewards are sent to Avatar
        },
      }
    ),
    {
      targetAddress: CURVE_3POOL_GAUGE_FACTORY,
      signature: "mint(address)",
      params: {
        [0]: staticEqual(CURVE_x3CRV_GAUGE, "address"),
      },
    },
    ...forAllTargetAddresses(ELK_FARMING_REWARDS, {
      signature: "getReward()",
    }),
    ...forAllTargetAddresses(ELK_FARMING_REWARDS, {
      signature: "getBoosterReward()",
    }),
  ],
}
export default preset
