import {
  ChainId,
  chains,
  Condition,
  Operator,
  Target,
} from "zodiac-roles-deployments"
import { decodeKey } from "./keys"

type RoleFragment = {
  key: `0x${string}`
  targets?: Target[]
}

type ChainPrefix = (typeof chains)[ChainId]["prefix"]
type PrefixedAddress = `${ChainPrefix}:0x${Lowercase<string>}`

const prefixAddress = (chainId: ChainId, address: `0x${string}`) => {
  return `${chains[chainId]["prefix"]}:${address.toLowerCase()}` as PrefixedAddress
}

export enum License {
  None,
  Free,
  Enterprise,
}

export const fetchLicense = async ({
  chainId,
  owner,
}: {
  chainId: ChainId
  owner: `0x${string}`
}) => {
  const prefixedAddress = prefixAddress(chainId, owner)
  return License.None // TODO fetch from Zodiac OS endpoint
}

export const enforceLicenseTerms = ({
  chainId,
  owner,
  role,
  license,
}: {
  chainId: ChainId
  owner: `0x${string}`
  role: RoleFragment
  license: License
}) => {
  if (license === License.None) {
    assertPublicFeatureScope(role, prefixAddress(chainId, owner))
  }
}

/**
 * Asserts that the role is only using features that are available without a zodiac os account.
 */
const assertPublicFeatureScope = (
  role: RoleFragment,
  owner: PrefixedAddress
) => {
  if (!role.targets) return

  if (
    role.targets.some((target) =>
      target.functions.some(
        (func) => func.condition && usesAllowances(func.condition)
      )
    )
  ) {
    throw new Error(
      `Role ${decodeKey(role.key)} is using allowances. Add the owner of the Roles Modifier to your Zodiac OS organization to proceed: https://app.pilot.gnosisguild.org/add-account/${owner}\n\n` +
        "Learn more at TODO docs links."
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
