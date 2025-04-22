import {
  AbiFunction,
  toFunctionSelector,
  decodeFunctionData,
  AbiParameter,
} from "viem"
import {
  c,
  Condition,
  FunctionPermission,
  FunctionPermissionCoerced,
} from "zodiac-roles-sdk"
import { ParamType } from "ethers"
import { invariant } from "@epic-web/invariant"
import { fetchContractInfo } from "@/app/abi"
import { ChainId } from "@/app/chains"
import { Call, Operation, Record } from "@/app/api/records/types"

type ConditionFunction = (abiType: ParamType, _?: any) => Condition

export async function derivePermissionsFromRecord(
  record: Record,
  chainId: ChainId
): Promise<FunctionPermission[]> {
  const calls = Object.values(record.calls)

  // fetch all ABIs (they should already be in cache at this point)
  const targets = new Set(calls.map((call) => call.to))
  const abiEntries = Object.fromEntries(
    await Promise.all(
      [...targets].map(
        async (target) =>
          [target, await fetchContractInfo(target, chainId)] as const
      )
    )
  )

  return calls.map((call) => {
    const selector = call.data.slice(0, 10) as `0x${string}`
    const functionAbi = abiEntries[call.to]?.abi?.find(
      (fragment: any) =>
        fragment.type === "function" &&
        toFunctionSelector(fragment) === selector
    ) as AbiFunction | undefined

    if (!functionAbi) {
      throw new Error(`Unable to decode function data for call ${call.id}`)
    }

    const wildcardsObj = record.wildcards[call.to + ":" + selector] || {}
    const wildcards = Object.entries(wildcardsObj)
      .filter(([, active]) => !!active)
      .map(([paramPath]) => paramPath)
    return derivePermissionFromCall({ call, abi: functionAbi, wildcards })
  })
}

export const derivePermissionFromCall = ({
  call,
  abi,
  wildcards,
}: {
  call: Call
  abi: AbiFunction
  wildcards: string[]
}): FunctionPermissionCoerced => {
  const selector = call.data.slice(0, 10) as `0x${string}`
  const { args } = decodeFunctionData({ abi: [abi], data: call.data })

  // This will generally be a calldataMatches condition (the type only doesn't say so because the recursive calls will yield other conditions)
  const condition = deriveConditionFromWildcards(args, abi.inputs, wildcards)

  return {
    targetAddress: call.to,
    selector,
    delegatecall: call.operation === Operation.DelegateCall,
    send: BigInt(call.value || "0") > 0,
    condition: condition && condition(ParamType.from("bytes")),
  }
}

/**
 * Derives a condition from the wildcards:
 *
 * Initially invoked with the set of function inputs, then recurses for struct parameters.
 */
const deriveConditionFromWildcards = (
  values: readonly unknown[],
  abi: readonly AbiParameter[],
  wildcards: string[],
  pathPrefix = ""
): ConditionFunction | undefined => {
  const isTopLevelCalldata = pathPrefix === ""

  const filteredWildcards = wildcards.filter((wildcard) =>
    abi.some((input, index) =>
      wildcard.startsWith(pathPrefix + (input.name ?? `[${index}]`))
    )
  )

  // some weird incompatibility between ParamType from different ethers instances forces use of any :/
  const paramTypes = abi.map((abiParam) => ParamType.from(abiParam)) as any[]

  const noWildcards = filteredWildcards.length === 0

  if (noWildcards && isTopLevelCalldata) {
    // use calldata matches on top-level

    return c.calldataMatches(
      values.map((value) => c.eq(value)),
      paramTypes
    )
  }

  if (noWildcards && !isTopLevelCalldata) {
    // full equals match on tuple

    return c.eq(values)
  }

  // use matches structure on the tuple and recurse into tuple components
  const components = abi.map((component, index) => {
    const componentPath = pathPrefix + (component.name ?? `[${index}]`)
    const isWildcarded = filteredWildcards.includes(componentPath)

    if (isWildcarded) {
      return undefined
    }

    if (component.type === "tuple") {
      invariant("components" in component, "tuple components not found")
      invariant(Array.isArray(values[index]), "invalid tuple value")
      return deriveConditionFromWildcards(
        values[index],
        component.components,
        filteredWildcards,
        componentPath + "."
      )
    }

    // some weird incompatibility between ParamType from different ethers instances :/
    return c.eq(values[index])
  })

  const allWildcarded = components.every((component) => component === undefined)

  if (allWildcarded) {
    return undefined
  }

  return isTopLevelCalldata
    ? c.calldataMatches(components, paramTypes)
    : c.matches(components)
}
