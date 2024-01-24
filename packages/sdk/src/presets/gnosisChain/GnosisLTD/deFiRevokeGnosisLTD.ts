import { allowErc20Revoke } from "../../helpers/erc20"
import { AVATAR } from "../../placeholders"
import { RolePreset } from "../../types"
import {
  AAVE,
  BAL,
  COW,
  CRV,
  EURe,
  GNO,
  MKR,
  nextUSDC,
  NODE,
  SUSHI,
  USDC,
  USDP,
  USDT,
  WETH,
  WXDAI,
  x3CRV,
} from "../addresses"

const preset = {
  network: 100,
  allow: [
    ...allowErc20Revoke([
      AAVE,
      BAL,
      COW,
      CRV,
      EURe,
      GNO,
      MKR,
      nextUSDC,
      NODE,
      SUSHI,
      USDC,
      USDP,
      USDT,
      WETH,
      WXDAI,
      x3CRV,
    ]),
  ],
  placeholders: { AVATAR },
} satisfies RolePreset

export default preset
