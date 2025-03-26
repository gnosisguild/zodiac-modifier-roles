import { AbiFunction, toFunctionSelector, decodeFunctionData } from "viem"
import { FunctionPermission } from "zodiac-roles-sdk"
import { fetchContractInfo } from "@/app/abi"
import { ChainId } from "@/app/chains"
import { Call, Operation, Record } from "@/app/api/records/types"
import { mapAbiInputs, StructAbiInput } from "./abi"

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

    const wildcards = record.wildcards[call.to + ":" + selector] || {}
    return derivePermissionFromCall({ call, abi: functionAbi, wildcards })
  })

  return []
}

const derivePermissionFromCall = ({
  call,
  abi,
  wildcards,
}: {
  call: Call
  abi: AbiFunction
  wildcards: { [paramPath: string]: boolean | undefined }
}): FunctionPermission => {
  const selector = call.data.slice(0, 10) as `0x${string}`
  const { args } = decodeFunctionData({ abi: [abi], data: call.data })
  const abiInputs = mapAbiInputs(abi.inputs, args)

  return {
    targetAddress: call.to,
    selector,
    delegatecall: call.operation === Operation.DelegateCall,
    send: BigInt(call.value || "0") > 0,
    condition: deriveConditionFromWildcards(abiInputs, wildcards),
  }
}

const deriveConditionFromWildcards = (
  abiInputs: StructAbiInput,
  wildcards: { [paramPath: string]: boolean | undefined },
  isTopLevelCalldata = true
) => {
  const noWildcards = Object.values(wildcards).every((v) => !v)
  const allWildcarded = Object.keys(abiInputs).every(
    (paramName) => wildcards[paramName]
  )

  if (allWildcarded) {
    // no condition needed
    return undefined
  }

  if (noWildcards) {
    // full equals match
  }
}
