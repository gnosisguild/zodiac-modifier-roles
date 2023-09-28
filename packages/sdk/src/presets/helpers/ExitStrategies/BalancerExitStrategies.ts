import { PresetAllowEntry } from "../../types"
import { allow } from "../../allow"
import { AVATAR } from "../../placeholders"
import { staticEqual } from "../utils"
import { balancer } from "../../mainnet/addresses"

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
