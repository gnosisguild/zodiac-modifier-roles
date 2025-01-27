import { Allowance, ChainId, fetchRolesMod } from "zodiac-roles-deployments"

import { Roles__factory } from "../../evm/typechain-types"

const rolesInterface = Roles__factory.createInterface()

type Options = (
  | {
      /** ID of the Chain where the Roles mod is deployed */
      chainId: ChainId
      /** Address of the roles mod */
      address: `0x${string}`
    }
  | {
      /** The addresses of all current Allowances of this rolesMod. If not specified, they will be fetched from the subgraph. */
      currentAllowances: Allowance[]
    }
) & {
  /**  The mode to use for updating the set of allowances of the rolesMod:
   *  - "replace": The rolesMod will have only the passed allowances, meaning that all other current allowances will be removed from the rolesMod
   *  - "extend": The rolesMod will keep its current allowances and will additionally get the passed allowances
   *  - "remove": All passed allowances will be removed from the rolesMod
   */
  mode: "replace" | "extend" | "remove"
  log?: boolean | ((message: string) => void)
}

/**
 * Returns a set of encoded call data to be sent to the Roles mod for updating allowances.
 *
 * @param allowances Array of allowances
 */
export const applyAllowances = async (
  allowances: Allowance[],
  options: Options
) => {
  let currentAllowances: Allowance[]

  if ("currentAllowances" in options && options.currentAllowances) {
    currentAllowances = options.currentAllowances
  } else {
    if (!("chainId" in options)) {
      throw new Error(
        "Either `currentAllowances` or `chainId` and `address` must be specified"
      )
    }

    const rolesMod = await fetchRolesMod({
      chainId: options.chainId,
      address: options.address,
    })
    if (!rolesMod) {
      throw new Error(
        `RolesMod ${options.address} not found on chain ${options.chainId}`
      )
    }
    currentAllowances = rolesMod.allowances
  }

  let result: { unset: Allowance[]; set: Allowance[] }
  switch (options.mode) {
    case "replace":
      result = replaceAllowances(currentAllowances, allowances)
      break
    case "extend":
      result = extendAllowances(currentAllowances, allowances)
      break
    case "remove":
      result = removeAllowances(currentAllowances, allowances)
      break
    default:
      throw new Error(`Invalid mode: ${options.mode}`)
  }

  if (options.log) {
    const log = options.log === true ? console.log : options.log
    result.unset.forEach(({ key }) => log(`💰 Unset allowance ${key}`))
    result.set.forEach(({ key }) => log(`👤 Set allowance ${key}`))
  }

  return [
    ...result.unset.map(encodeUnsetAllowance),
    ...result.set.map(encodeSetAllowance),
  ]
}

const replaceAllowances = (prev: Allowance[], next: Allowance[]) => ({
  unset: prev.filter((allowance) => next.every((a) => a.key !== allowance.key)),
  set: next,
})

const extendAllowances = (_: Allowance[], next: Allowance[]) => ({
  unset: [],
  set: next,
})

const removeAllowances = (_: Allowance[], next: Allowance[]) => ({
  unset: next,
  set: [],
})

const encodeSetAllowance = (allowance: Allowance) => {
  return rolesInterface.encodeFunctionData("setAllowance", [
    allowance.key,
    allowance.balance,
    allowance.maxRefill,
    allowance.refill,
    allowance.period,
    allowance.timestamp,
  ]) as `0x${string}`
}

const encodeUnsetAllowance = (allowance: Allowance) => {
  return rolesInterface.encodeFunctionData("setAllowance", [
    allowance.key,
    0,
    0,
    0,
    0,
    0,
  ]) as `0x${string}`
}
