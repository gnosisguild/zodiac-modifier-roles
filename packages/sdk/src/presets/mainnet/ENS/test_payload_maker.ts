import { AVATAR } from "../../placeholders"
import { RolePreset } from "../../types"
import { allow } from "../../allow"
import { allowErc20Approve } from "../../helpers/erc20"
import { DAI, WETH, maker } from "../addresses"

const preset = {
  network: 1,
  allow: [
    ...allowErc20Approve([DAI, WETH], [maker.DS_PROXY]),
    allow.mainnet.maker.ds_proxy["execute(address,bytes)"](
      maker.PROXY_ACTIONS,
      undefined,
      { send: true }
    ),
  ],
  placeholders: { AVATAR },
} satisfies RolePreset
export default preset
