import { ExecutionOptions, PresetAllowEntry } from "../../../types"

const RETH = "0xae78736Cd615f374D3085123A210448E74Fc6393"
const ROCKET_DEPOSIT_POOL = "0x2cac916b2A963Bf162f076C0a8a4a8200BCFBfb4"

export const allowRocketPool = (): PresetAllowEntry[] => {
  return [
    {
      targetAddress: ROCKET_DEPOSIT_POOL,
      signature: "deposit()",
      options: ExecutionOptions.Send,
    },
    { targetAddress: RETH, signature: "burn(uint256)" },
  ]
}
