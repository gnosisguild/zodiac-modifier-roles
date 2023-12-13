import { PresetAllowEntry } from "../../types"
import { allow } from "../../allow"
import { AVATAR } from "../../placeholders"
import { staticEqual } from "../../helpers/utils"
import { balancer } from "../../mainnet/addresses"

export const auraExitStrategy1 = (rewarder: string): PresetAllowEntry[] => {
  return [
    // It doesn't matter the blockchain we use, since we are overwriting
    // the address of the rewarder (abis are the same indistinctively of the blockchain)
    {
      ...allow.mainnet.aura.auraB_stETH_stable_rewarder["withdrawAndUnwrap"](),
      targetAddress: rewarder,
    },
  ]
}

export const auraExitStrategy2 = (
  rewarder: string,
  balancerPoolId: string
): PresetAllowEntry[] => {
  return [
    // It doesn't matter the blockchain we use, since we are overwriting
    // the address of the rewarder (abis are the same indistinctively of the blockchain)
    {
      ...allow.mainnet.aura.auraB_stETH_stable_rewarder["withdrawAndUnwrap"](),
      targetAddress: rewarder,
    },
    {
      targetAddress: balancer.VAULT,
      signature:
        "exitPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(balancerPoolId, "bytes32"), // Balancer PoolId
        [1]: staticEqual(AVATAR),
        [2]: staticEqual(AVATAR),
      },
    },
  ]
}
