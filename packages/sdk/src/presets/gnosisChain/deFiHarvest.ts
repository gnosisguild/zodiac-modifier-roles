import { forAllTargetAddresses, staticEqual } from "../helpers/utils"
import { AVATAR } from "../placeholders"
import { RolePreset } from "../types"

import {
  CRV_MINTER,
  CURVE_MAI_3POOL3CRV_GAUGE,
  CURVE_x3CRV_GAUGE,
  CURVE_x3CRV_REWARD_GAUGE,
  ELK_FARMING_REWARDS,
  SUSHISWAP_MINI_CHEF,
  SYMMETRIC_MINI_CHEF,
} from "./addresses"

const preset = {
  network: 100,
  allow: [
    ...forAllTargetAddresses([SUSHISWAP_MINI_CHEF, SYMMETRIC_MINI_CHEF], {
      signature: "harvest(uint256,address)",
      params: {
        [1]: staticEqual(AVATAR), // ensure rewards are sent to Avatar
      },
    }),

    ...forAllTargetAddresses(
      [CURVE_x3CRV_REWARD_GAUGE, CURVE_x3CRV_GAUGE, CURVE_MAI_3POOL3CRV_GAUGE],
      {
        signature: "claim_rewards(address)",
        params: {
          [0]: staticEqual(AVATAR), // ensure rewards are sent to Avatar
        },
      }
    ),
    {
      targetAddress: CRV_MINTER,
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
  placeholders: { AVATAR },
} satisfies RolePreset

export default preset
