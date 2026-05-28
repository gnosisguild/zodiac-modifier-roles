import {
  ChainId,
  chains,
  Condition,
  decodeKey,
  License,
  LicenseError,
  Operator,
  Role,
} from "zodiac-roles-sdk"

type ChainPrefix = (typeof chains)[ChainId]["prefix"]
type PrefixedAddress = `${ChainPrefix}:0x${Lowercase<string>}`

const prefixAddress = (chainId: ChainId, address: `0x${string}`) =>
  `${chains[chainId]["prefix"]}:${address.toLowerCase()}` as PrefixedAddress

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
  if (license === License.Blocked) {
    throw new LicenseError(
      "Permissions updates are blocked. To proceed, renew your Zodiac subscription.",
      prefixAddress(chainId, owner),
      "BLOCKED"
    )
  }

  if (license === License.None) {
    assertPublicFeatureScope(role, prefixAddress(chainId, owner))
  }
}

/**
 * Asserts that the role is only using features that are available without a
 * Zodiac OS account.
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
      owner,
      "UNLICENSED_FEATURE"
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
