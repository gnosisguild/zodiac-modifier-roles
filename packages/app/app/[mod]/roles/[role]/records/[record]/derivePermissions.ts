import {
  AbiFunction,
  toFunctionSelector,
  decodeFunctionData,
  AbiParameter,
  encodeAbiParameters,
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

  return {
    targetAddress: call.to,
    selector,
    delegatecall: call.operation === Operation.DelegateCall,
    send: BigInt(call.value || "0") > 0,
    condition: deriveConditionFromWildcards(args, abi.inputs, wildcards),
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
): Condition | undefined => {
  const isTopLevelCalldata = pathPrefix === ""

  const filteredWildcards = wildcards.filter((wildcard) =>
    abi.some((input, index) =>
      wildcard.startsWith(pathPrefix + (input.name ?? `[${index}]`))
    )
  )

  const noWildcards = filteredWildcards.length === 0

  const allWildcarded = abi.every((component, index) =>
    filteredWildcards.includes(pathPrefix + (component.name ?? `[${index}]`))
  )

  if (allWildcarded) {
    // no condition needed
    return undefined
  }

  // some weird incompatibility between ParamType from different ethers instances forces use of any :/
  const paramTypes = abi.map((abiParam) => ParamType.from(abiParam)) as any[]

  if (noWildcards && isTopLevelCalldata) {
    // use calldata matches on top-level
    return c.calldataMatches(
      values.map((value, index) => c.eq(value)(paramTypes[index])),
      paramTypes
    )()
  }

  const tupleType = ParamType.from({
    type: "tuple",
    components: abi,
  })

  if (noWildcards && !isTopLevelCalldata) {
    // full equals match on tuple

    return c.eq(encodeAbiParameters(abi, values))(tupleType as any)
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
    return c.eq(values[index])(ParamType.from(component) as any)
  })

  return c.matches(components)(tupleType as any)
}
