import {
    DAI,
    spark
} from "../addresses"
import { AVATAR } from "../../placeholders"
import { RolePreset } from "../../types"
import { allow } from "../../allow"
import { allowErc20Approve } from "../../helpers/erc20"

const preset = {
    network: 1,
    allow: [
        //---------------------------------------------------------------------------------------------------------------------------------
        // Spark - DAI
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([DAI], [spark.LENDING_POOL]),

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
        allow.mainnet.spark.sDAI["redeem"](
            undefined,
            AVATAR,
            AVATAR
        ),
    ],
    placeholders: { AVATAR },
} satisfies RolePreset

export default preset