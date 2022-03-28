import { AVATAR_ADDRESS_PLACEHOLDER } from "../placeholders";
import { Comparison, ParameterType, RolePreset } from "../types";

import { functionSighash } from "./utils";

const DEFI_PROTOCOLS = {
  "Sushiswap MiniChefV2": "0xdDCbf776dF3dE60163066A5ddDF2277cB445E0F3",
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
        {
          type: ParameterType.Static,
          comparison: Comparison.EqualTo,
          value: AVATAR_ADDRESS_PLACEHOLDER,
        },
      ],
    },
  ],
};
export default preset;
