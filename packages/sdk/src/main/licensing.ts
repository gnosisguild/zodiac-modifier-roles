import {
  ChainId,
  chains,
  Condition,
  Operator,
  Role,
} from "zodiac-roles-deployments"

import { decodeKey } from "./keys"

/**
 * Error class for license-related errors
 */
export class LicenseError extends Error {
  owner: PrefixedAddress

  constructor(message: string, owner: PrefixedAddress) {
    super(message)
    this.name = "LicenseError"
    this.owner = owner
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

export const enforceLicenseTerms = ({
  chainId,
  owner,
  role,
  license,
}: {
  chainId: ChainId
  owner: `0x${string}`
  role: Role
  license: License
}) => {
  if (license === License.None) {
    assertPublicFeatureScope(role, prefixAddress(chainId, owner))
  }
}

/**
 * Asserts that the role is only using features that are available without a zodiac os account.
 */
const assertPublicFeatureScope = (role: Role, owner: PrefixedAddress) => {
  if (!role.targets) return

  if (
    role.targets.some((target) =>
      target.functions.some(
        (func) => func.condition && usesAllowances(func.condition)
      )
    )
  ) {
    throw new LicenseError(
      `Role ${decodeKey(role.key)} is using allowances. Add the owner of the Roles Modifier to your Zodiac OS organization to proceed: https://app.zodiac.eco/create/${owner}`,
      owner
    )
  }
}

const usesAllowances = (condition: Condition): boolean => {
  if (
    condition.operator === Operator.WithinAllowance ||
    condition.operator === Operator.CallWithinAllowance ||
    condition.operator === Operator.EtherWithinAllowance
  ) {
    return true
  }
  return condition.children?.some((child) => usesAllowances(child)) ?? false
}
