import { allow } from "../../allow"
import { balancer } from "../../mainnet/addresses"
import { AVATAR } from "../../placeholders"
import { PresetAllowEntry } from "../../types"
import { staticEqual } from "../utils"

export const balancerExitStrategy1 = (
  balancerPoolId: string
): PresetAllowEntry[] => {
  return [
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
