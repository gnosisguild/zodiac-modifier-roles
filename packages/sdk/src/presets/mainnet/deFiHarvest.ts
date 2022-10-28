import { RolePreset } from "../../types"
import { forAllTargetAddresses, staticEqual } from "../helpers/utils"
import { AVATAR_ADDRESS_PLACEHOLDER } from "../placeholders"

const AURA_CLAIM_ZAP = "0x623B83755a39B12161A63748f3f595A530917Ab2"
const CONVEX_CLAIM_ZAP = "0xDd49A93FDcae579AE50B4b9923325e9e335ec82B"
const CURVE_STETHETH_GAUGE_DEPOSIT =
  "0xF668E6D326945d499e5B35E7CD2E82aCFbcFE6f0"
const AA_WSTETH_GAUGE_DEPOSIT = "0x675eC042325535F6e176638Dd2d4994F645502B9"
const REFLEXER_REWARDS = "0x69c6C08B91010c88c95775B6FD768E5b04EFc106"

const preset: RolePreset = {
  network: 1,
  allow: [
    {
      targetAddress: AURA_CLAIM_ZAP,
      signature:
        "claimRewards(address[],address[],address[],address[],uint256,uint256,uint256,uint256)",
    },
    {
      targetAddress: CONVEX_CLAIM_ZAP,
      signature:
        "claimRewards(address[],address[],address[],address[],uint256,uint256,uint256,uint256,uint256)",
    },
    ...forAllTargetAddresses(
      [CURVE_STETHETH_GAUGE_DEPOSIT, AA_WSTETH_GAUGE_DEPOSIT],
      {
        signature: "claim_rewards(address)",
        params: {
          [0]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
        },
      }
    ),
    {
      targetAddress: REFLEXER_REWARDS,
      signature: "getRewards()",
    },
  ],
}
export default preset
