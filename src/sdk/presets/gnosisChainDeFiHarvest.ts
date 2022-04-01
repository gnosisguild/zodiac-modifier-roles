import { AVATAR_ADDRESS_PLACEHOLDER } from "../placeholders";
import { RolePreset } from "../types";

import { CURVE_x3CRV_REWARD_GAUGE, SUSHISWAP_MINI_CHEF } from "./addresses";
import { functionSighash, staticEqual } from "./utils";

const preset: RolePreset = {
  network: 100,
  allowTargets: [],
  allowFunctions: [
    {
      targetAddresses: [SUSHISWAP_MINI_CHEF],
      functionSig: functionSighash("harvest(uint256,address)"),
      params: [
        undefined, // unrestricted value
        staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // ensure tokens are sent to Avatar
      ],
    },
    {
      targetAddresses: [CURVE_x3CRV_REWARD_GAUGE],
      functionSig: functionSighash("claim_rewards(address)"),
      params: [
        staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // ensure rewards are sent to Avatar
      ],
    },
  ],
};
export default preset;
