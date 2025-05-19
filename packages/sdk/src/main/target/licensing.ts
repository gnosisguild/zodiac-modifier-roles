import {
  ChainId,
  chains,
  Condition,
  Operator,
  ParameterType,
  Role,
  Target,
} from "zodiac-roles-deployments"
import { decodeKey } from "../keys"
import { AbiCoder } from "ethers"

type RoleFragment = {
  key: `0x${string}`
  targets?: Target[]
}

type ChainPrefix = (typeof chains)[ChainId]["prefix"]
type PrefixedAddress = `${ChainPrefix}:0x${Lowercase<string>}`

export const prefixAddress = (chainId: ChainId, address: `0x${string}`) => {
  return `${chains[chainId]["prefix"]}:${address.toLowerCase()}` as PrefixedAddress
}

export enum License {
  None,
  Free,
  Enterprise,
}

export const fetchLicense = async (account: PrefixedAddress) => {
  return License.None // TODO fetch from Zodiac OS endpoint
}

export const enforceLicenseTerms = (
  role: RoleFragment,
  license: License,
  owner: PrefixedAddress
) => {
  if (license === License.Free) {
    assertFeeCollection(role)
  }

  if (license === License.None) {
    assertFeeCollection(role)
    assertPublicFeatureScope(role, owner)
  }
}

const defaultAbiCoder = AbiCoder.defaultAbiCoder()

/**
 * Asserts that the role permissions correctly enforces fee collection as per the zodiac os fee structure.
 */
const assertFeeCollection = (role: RoleFragment) => {
  if (!role.targets) return

  // CowSwap swap fee: 0.25%
  // TODO: Check for target CowOrderSigner 0x23dA9AdE38E4477b23770DeD512fD37b12381FAB (feeAmountBP must be set to 25)
  const cowOrderSigner = role.targets.find(
    (target) =>
      target.address.toLowerCase() ===
      "0x23da9ade38e4477b23770ded512fd37b12381fab"
  )
  if (cowOrderSigner) {
    const signOrder = cowOrderSigner.functions.find(
      (func) => func.selector === "0x569d3489"
    )
    if (signOrder && signOrder.condition) {
      // check that any condition node scoping feeAmountBP is set to 25
      const feeAmountBPConditions = collectFeeAmountBPConditionNodes(
        signOrder.condition
      )
      if (
        feeAmountBPConditions.length === 0 ||
        !feeAmountBPConditions.every(
          (condition) =>
            condition.operator !== Operator.EqualTo ||
            condition.compValue !== defaultAbiCoder.encode(["uint256"], [25])
        )
      ) {
        throw new Error(
          `Role ${decodeKey(role.key)} is scoping Cow Swap orders in disregard of the 0.25% swap fee applying to users without a Zodiac OS Enterprise subscription.\n\n` +
            "Learn more at TODO docs links."
        )
      }
    }
  }

  // Uniswap fee: 0.25% (0% for some pairs)
  // TODO Check for target Uniswap UniversalRouter (https://github.com/Uniswap/universal-router/tree/main/deploy-addresses)
  //
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

const collectFeeAmountBPConditionNodes = (
  condition: Condition
): Condition[] => {
  const nodes = skipOverLogicalNodes(condition)
  const result: Condition[] = []
  for (const node of nodes) {
    if (
      node.paramType === ParameterType.Calldata &&
      node.operator === Operator.Matches
    ) {
      // feeAmountBP is the 3rd parameter of the calldata
      const feeAmountBPCondition = node.children?.[2]
      if (feeAmountBPCondition) {
        result.push(...skipOverLogicalNodes(feeAmountBPCondition))
      }
    }
  }

  return result
}

const skipOverLogicalNodes = (condition: Condition): Condition[] => {
  if (
    condition.operator === Operator.And ||
    condition.operator === Operator.Or
  ) {
    return (
      condition.children?.flatMap((child) => skipOverLogicalNodes(child)) ?? []
    )
  }

  return [condition]
}
