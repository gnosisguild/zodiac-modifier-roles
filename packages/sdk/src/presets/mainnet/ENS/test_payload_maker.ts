import { allow } from "../../allow"
import { allowErc20Approve } from "../../helpers/erc20"
import { AVATAR } from "../../placeholders"
import { RolePreset } from "../../types"
import { DAI, WETH, wstETH, maker } from "../addresses"

const preset = {
  network: 1,
  allow: [
    // // Proxy Arquitecture
    // ...allowErc20Approve([DAI, WETH], [maker.DS_PROXY]),
    // allow.mainnet.maker.ds_proxy["execute(address,bytes)"](
    //   maker.PROXY_ACTIONS,
    //   undefined,
    //   { send: true }
    // ),

    // // CDPManager (no proxy)
    // ...allowErc20Approve([wstETH], [maker.GEM_JOIN]),
    // ...allowErc20Approve([DAI], [maker.DAI_JOIN]),

    // allow.mainnet.maker.cdp_manager["open"](undefined, AVATAR),
    // allow.mainnet.maker.gem_join["join"](),
    // allow.mainnet.maker.dai_join["join"](),
    // allow.mainnet.maker.cdp_manager["frob"](),
    // allow.mainnet.maker.jug["drip"](),
    // allow.mainnet.maker.cdp_manager["move"](),
    // allow.mainnet.maker.vat["hope"](maker.DAI_JOIN),
    // allow.mainnet.maker.gem_join["exit"](AVATAR),
    // allow.mainnet.maker.dai_join["exit"](AVATAR),
    // allow.mainnet.maker.cdp_manager["flux(uint256,address,uint256)"](
    //   undefined,
    //   AVATAR
    // ),

    ...allowErc20Approve([DAI], [maker.DSR_MANAGER]),

    allow.mainnet.maker.dsr_manager["join"](AVATAR),
    allow.mainnet.maker.dsr_manager["exit"](AVATAR),
    allow.mainnet.maker.dsr_manager["exitAll"](AVATAR),
  ],
  placeholders: { AVATAR },
} satisfies RolePreset
export default preset
