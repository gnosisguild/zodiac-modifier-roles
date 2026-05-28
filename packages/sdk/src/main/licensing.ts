import { chains } from "./chains"
import { ChainId } from "./types"

type LicenseErrorStatus = "BLOCKED" | "UNLICENSED_FEATURE"

export class LicenseError extends Error {
  owner: PrefixedAddress
  status: LicenseErrorStatus

  constructor(
    message: string,
    owner: PrefixedAddress,
    status: LicenseErrorStatus
  ) {
    super(message)
    this.name = "LicenseError"
    this.owner = owner
    this.status = status
  }
}

type ChainPrefix = (typeof chains)[ChainId]["prefix"]
type PrefixedAddress = `${ChainPrefix}:0x${Lowercase<string>}`

const prefixAddress = (chainId: ChainId, address: `0x${string}`) => {
  return `${chains[chainId]["prefix"]}:${address.toLowerCase()}` as PrefixedAddress
}

export enum License {
  None = "none",
  Free = "free",
  Enterprise = "enterprise",
  Blocked = "blocked",
}

export const fetchLicense = async ({
  chainId,
  owner,
}: {
  chainId: ChainId
  owner: `0x${string}`
}) => {
  const prefixedAddress = prefixAddress(chainId, owner)
  const response = await fetch(
    `https://app.zodiac.eco/system/get-plan/${prefixedAddress}`
  )
  const data = await response.json()

  if (!Object.values(License).includes(data.currentPlan)) {
    throw new Error(`Invalid license: ${data.currentPlan}`)
  }

  return data.currentPlan as License
}
