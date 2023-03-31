import {
    AAVE, AURA, auraBAL, BAL, COMP, COW, CRV, CVX, DAI, FIS,
    FXS, GNO, GRT, LDO, LUSD, MKR, NODE, RAI, RPL, SAFE,
    SUSHI, USDC, USDP, USDT, WETH, x3CRV
} from "../addresses"
import { allowErc20Revoke } from "../../helpers/erc20"
import { AVATAR } from "../../placeholders"
import { RolePreset } from "../../types"


const preset = {
    network: 1,
    allow: [
        ...allowErc20Revoke([
            AAVE, AURA, auraBAL, BAL, COMP, COW, CRV, CVX, DAI, FIS,
            FXS, GNO, GRT, LDO, LUSD, MKR, NODE, RAI, RPL, SAFE,
            SUSHI, USDC, USDP, USDT, WETH, x3CRV
        ])
    ],
    placeholders: { AVATAR },
} satisfies RolePreset

export default preset