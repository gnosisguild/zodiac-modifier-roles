import { allow } from "../../allow"
import { allowErc20Approve } from "../../helpers/erc20"
import { AVATAR } from "../../placeholders"
import { RolePreset } from "../../types"
import { DAI, spark } from "../addresses"

const preset = {
  network: 1,
  allow: [
    //---------------------------------------------------------------------------------------------------------------------------------
    // Spark - DAI
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([DAI], [spark.LENDING_POOL_V3]),

    // Repay
    allow.mainnet.spark.sparkLendingPoolV3["repay"](
      DAI,
      undefined,
      undefined,
      AVATAR
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Spark - sDAI
    //---------------------------------------------------------------------------------------------------------------------------------

    // Withdraw
    allow.mainnet.spark.sDAI["redeem"](undefined, AVATAR, AVATAR),
  ],
  placeholders: { AVATAR },
} satisfies RolePreset

export default preset
