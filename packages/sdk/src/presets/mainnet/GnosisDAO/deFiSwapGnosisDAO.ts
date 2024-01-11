import { allowErc20Approve } from "../../helpers/erc20"
import { AVATAR } from "../../placeholders"
import { GNO, cowswap } from "../addresses"

const preset = {
  network: 1,
  allow: [
    //---------------------------------------------------------------------------------------------------------------------------------
    // Cowswap
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([GNO], [cowswap.GPv2_VAULT_RELAYER]),
  ],
  placeholders: { AVATAR },
} satisfies RolePreset

export default preset
