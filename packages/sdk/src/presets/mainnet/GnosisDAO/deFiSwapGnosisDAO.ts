import { GNO, cowswap } from "../addresses"
import { allowErc20Approve } from "../../helpers/erc20"
import { AVATAR } from "../../placeholders"
import { RolePreset } from "../../types"
import { allow } from "../../allow"

const preset = {
  network: 1,
  allow: [
    //---------------------------------------------------------------------------------------------------------------------------------
    // Cowswap
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([GNO], [cowswap.GPv2_VAULT_RELAYER]),

    allow.mainnet.cowswap.order_signer["signOrder"](
      {
        oneOf: [GNO],
      },
      {
        oneOf: [],
      },
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
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
