import { PresetAllowEntry } from "../../types"
import { allowErc20Approve } from "../erc20"

const STETH = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84"
const WSTETH = "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0"

export const allowLido = (): PresetAllowEntry[] => {
  return [
    { targetAddress: WSTETH, signature: "wrap(uint256)" },
    { targetAddress: WSTETH, signature: "unwrap(uint256)" },
    {
      targetAddress: STETH,
      signature: "submit(address)",
      send: true,
    },
    ...allowErc20Approve([STETH, WSTETH], [WSTETH]),
  ]
}
