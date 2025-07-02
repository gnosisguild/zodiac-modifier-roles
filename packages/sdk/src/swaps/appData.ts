import { ChainId } from "zodiac-roles-deployments"
import { fetchLicense, License } from "zodiac-roles-sdk"
import { AdvancedOptions } from "./types"

interface AppData {
  version: "1.3.0"
  appCode?: string
  environment?: string
  metadata: {
    quote?: {
      slippageBips: number
      smartSlippage?: boolean
    }
    orderClass?: {
      orderClass: "market" | "limit" | "liquidity" | "twap"
    }
    partnerFee?: {
      bps: number
      recipient: `0x${string}`
    }
  }
}

const zodiacOsSafe = "0x3ec84da3A9bCed9767490c198E69Aa216A35Df12"

const defaultAppData = {
  version: "1.3.0",
  appCode: "Zodiac Roles SDK",
  environment: "production",
  metadata: {},
} satisfies AppData

interface Props {
  chainId: ChainId
  owner: `0x${string}`
}

export const defaultAdvancedOptions: AdvancedOptions = {}

export const makeAppData = async (
  { chainId, owner }: Props,
  advancedOptions: AdvancedOptions = {}
) => {
  const license = owner && (await fetchLicense({ chainId, owner }))

  if (license === License.Enterprise) {
    return JSON.stringify({
      ...defaultAppData,
      appCode: advancedOptions.appCode ?? defaultAppData.appCode,
      environment: advancedOptions.environment ?? defaultAppData.environment,
    })
  }

  return JSON.stringify({
    ...defaultAppData,
    appCode: advancedOptions.appCode ?? defaultAppData.appCode,
    environment: advancedOptions.environment ?? defaultAppData.environment,
    metadata: {
      partnerFee: {
        bps: 25,
        recipient: zodiacOsSafe,
      },
    },
  })
}

export const validateAppData = async (
  { chainId, owner }: Props,
  appData: string
) => {
  const license = owner && (await fetchLicense({ chainId, owner }))

  if (license === License.Enterprise) {
    return
  }

  const parsed = JSON.parse(appData) as AppData

  if (parsed.version !== "1.3.0") {
    throw new Error("Invalid appData version")
  }

  if (!parsed.metadata) {
    throw new Error("Missing appData metadata")
  }

  if (
    parsed.metadata.partnerFee?.bps !== 25 ||
    parsed.metadata.partnerFee?.recipient !== zodiacOsSafe
  ) {
    throw new Error("Invalid appData partnerFee")
  }
}
