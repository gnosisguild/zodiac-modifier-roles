import * as ethSdk from "@dethcrypto/eth-sdk-client"
import { BaseContract, ethers } from "ethers"
// We import via alias to avoid double bundling of sdk functions
// eslint does not know about our Typescript path alias
// eslint-disable-next-line import/no-unresolved
import { c } from "zodiac-roles-sdk"

// For things that are not publicly exported we still use relative paths.
// Since these are mainly types, this won't blow up bundles.
import { Condition, Operator, ParameterType } from "../../types"
import {
  ExecutionFlags,
  TargetPermission,
  FunctionPermission,
  FunctionPermissionCoerced,
} from "../types"
import { coercePermission } from "../utils"

import {
  callWithinAllowance,
  etherWithinAllowance,
} from "./conditions/allowances"
import { TupleScopings } from "./conditions/types"

// In this file, we derive the typed allow kit from the eth-sdk-client that has been generated based on the user-provided config json.

type MapParams<T extends any[]> = ((...b: T) => void) extends (
  ...args: [...infer I, any]
) => void
  ? [...params: TupleScopings<I>, options?: Options]
  : []

const makeAllowFunction = <
  C extends BaseContract,
  N extends keyof C["functions"]
>(
  contract: C,
  name: N
) => {
  const functionFragment = contract.interface.getFunction(name as string)
  const functionInputs = functionFragment.inputs
  const ethersFunction = contract.functions[name as string]

  return (
    ...args: MapParams<Parameters<typeof ethersFunction>>
  ): FunctionPermission => {
    const scopings = args.slice(0, functionInputs.length) as any[]
    const hasScopings = scopings.some((s) => !!s)
    const options = (args[functionInputs.length] || {}) as Options
    const presetFunction: FunctionPermission = {
      targetAddress: contract.address as `0x${string}`,
      signature: functionFragment.format("sighash"),
      condition: hasScopings
        ? c.calldataMatches(scopings, functionInputs)()
        : undefined,
    }
    return applyOptions(coercePermission(presetFunction), options)
  }
}

type Options = {
  send?: boolean
  delegatecall?: boolean
  etherWithinAllowance?: `0x${string}`
  callWithinAllowance?: `0x${string}`
}

const applyOptions = (
  entry: FunctionPermissionCoerced,
  options: Options
): FunctionPermissionCoerced => {
  const conditions: Condition[] = []

  if (entry.condition) {
    conditions.push(entry.condition)
  }

  if (options.etherWithinAllowance) {
    if (!options.send) {
      throw new Error(
        "`etherWithinAllowance` can only be used if `send` is allowed"
      )
    }

    conditions.push(etherWithinAllowance(options.etherWithinAllowance)())
  }

  if (options.callWithinAllowance) {
    conditions.push(callWithinAllowance(options.callWithinAllowance)())
  }

  const condition =
    conditions.length > 1
      ? {
          paramType: ParameterType.None,
          operator: Operator.And,
          children: conditions,
        }
      : conditions[0]

  return {
    ...entry,
    send: options.send,
    delegatecall: options.delegatecall,
    condition,
  }
}

export const EVERYTHING = Symbol("EVERYTHING")

type AllowFunctions<C extends BaseContract> = {
  [key in keyof C["functions"]]: (
    ...args: MapParams<Parameters<C["functions"][key]>>
  ) => FunctionPermission
}
type AllowContract<C extends BaseContract> = {
  [EVERYTHING]: (options?: Options) => TargetPermission
} & AllowFunctions<C>

const makeAllowContract = <C extends BaseContract>(
  contract: C
): AllowContract<C> => {
  const allowEverything = (options?: ExecutionFlags): TargetPermission => {
    return {
      targetAddress: contract.address as `0x${string}`,
      ...options,
    }
  }

  const allowFunctions = Object.keys(contract.functions).reduce((acc, key) => {
    acc[key as keyof C["functions"]] = makeAllowFunction(contract, key)
    return acc
  }, {} as AllowFunctions<C>)

  return Object.assign(allowFunctions, { [EVERYTHING]: allowEverything })
}

type EthSdk = {
  [key: string]: EthSdk | BaseContract
}

type AllowKit<S extends EthSdk> = {
  [Key in keyof S]: S[Key] extends BaseContract
    ? AllowContract<S[Key]>
    : S[Key] extends EthSdk // somehow it cannot infer that it cannot be a BaseContract here, so we use an extra conditional
    ? AllowKit<S[Key]>
    : never
}

const mapSdk = <S extends EthSdk>(sdk: S): AllowKit<S> => {
  return Object.keys(sdk).reduce((acc, key) => {
    // for this check to work reliably, make sure ethers node_modules is not duplicated
    if (sdk[key] instanceof BaseContract) {
      acc[key] = makeAllowContract(sdk[key] as BaseContract)
    } else {
      acc[key] = mapSdk(sdk[key] as EthSdk)
    }
    return acc
  }, {} as any)
}

type SdkGetterName = Exclude<keyof typeof ethSdk, "getContract">
type NetworkName<S extends SdkGetterName> = S extends `get${infer N}Sdk`
  ? Uncapitalize<N>
  : never

type AllowKitMap = {
  [Key in NetworkName<SdkGetterName>]: AllowKit<
    ReturnType<(typeof ethSdk)[`get${Capitalize<Key>}Sdk`]>
  >
}

const uncapitalize = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

export const allow: AllowKitMap = Object.keys(ethSdk).reduce(
  (acc, sdkGetterName) => {
    if (sdkGetterName === "getContract") return acc

    const network = uncapitalize(sdkGetterName.slice(3, -3))
    acc[network] = mapSdk(
      // eslint-disable-next-line import/namespace
      ethSdk[sdkGetterName as SdkGetterName](ethers.getDefaultProvider())
    )
    return acc
  },
  {} as any
)
