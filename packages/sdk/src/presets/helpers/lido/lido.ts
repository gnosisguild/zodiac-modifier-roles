import { PresetAllowEntry } from "../../../types"

const STETH = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84"
const WSTETH = "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0"

export const allowLido = (): PresetAllowEntry[] => {
    return [
        { targetAddresses: [WSTETH], signature: "wrap(uint256)" },
        { targetAddresses: [WSTETH], signature: "unwrap(uint256)" },
        { targetAddresses: [STETH], signature: "submit(address)" },
        { tokens: [STETH], spenders: [WSTETH] },
        { tokens: [WSTETH], spenders: [WSTETH] },
    ]
}
