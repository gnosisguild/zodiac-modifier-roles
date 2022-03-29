import { AVATAR_ADDRESS_PLACEHOLDER } from "../placeholders";
import { RolePreset } from "../types";

import { functionSighash, staticEqual } from "./utils";

const DEFI_PROTOCOLS = {
  "Sushiswap MiniChefV2": "0xdDCbf776dF3dE60163066A5ddDF2277cB445E0F3",
  "Curve.fi x3CRV RewardGauge Deposit":
    "0x78CF256256C8089d68Cde634Cf7cDEFb39286470",
};

const preset: RolePreset = {
  network: 100,
  allowTargets: [],
  allowFunctions: [
    {
      targetAddresses: [DEFI_PROTOCOLS["Sushiswap MiniChefV2"]],
      functionSig: functionSighash("harvest(uint256,address)"),
      params: [
        undefined, // unrestricted value
        staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // ensure tokens are sent to Avatar
      ],
    },
    {
      targetAddresses: [DEFI_PROTOCOLS["Curve.fi x3CRV RewardGauge Deposit"]],
      functionSig: functionSighash("claim_rewards(address)"),
      params: [
        staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // ensure rewards are sent to Avatar
      ],
    },
  ],
};
export default preset;
