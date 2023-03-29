import * as ethSdk from "@dethcrypto/eth-sdk-client"
import { BaseContract, ethers } from "ethers"

import { Condition } from "../../types"
import {
  PresetFullyClearedTarget,
  PresetFunction,
  ExecutionFlags,
} from "../types"

import { every } from "./array"
import { or } from "./branching"
import { eq } from "./comparisons"
import { matches, matchesAbi } from "./matches"
import { ConditionFunction, TupleScoping } from "./types"

type MapParams<T extends any[]> = ((...b: T) => void) extends (
  ...args: [...infer I, any]
) => void
  ? [...params: TupleScoping<I>, options?: ExecutionFlags]
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
  ): PresetFunction => {
    const conditionStructures = args.slice(0, functionInputs.length) as any[]
    const options = (args[functionInputs.length] || {}) as ExecutionFlags
    return {
      targetAddress: contract.address,
      signature: functionFragment.format("sighash"),
      condition: matchesAbi(conditionStructures, functionInputs)(),
      ...options,
    }
  }
}

export const EVERYTHING = Symbol("EVERYTHING")
type AllowFunctions<C extends BaseContract> = {
  [key in keyof C["functions"]]: (
    ...args: MapParams<Parameters<C["functions"][key]>>
  ) => PresetFunction
}
type AllowContract<C extends BaseContract> = {
  [EVERYTHING]: (options?: ExecutionFlags) => PresetFullyClearedTarget
} & AllowFunctions<C>

const makeAllowContract = <C extends BaseContract>(
  contract: C
): AllowContract<C> => {
  const allowEverything = (
    options?: ExecutionFlags
  ): PresetFullyClearedTarget => {
    return {
      targetAddress: contract.address,
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

const { getContract, ...sdkGetters } = ethSdk
export { sdkGetters as ethSdk }
type SdkGetterName = keyof typeof sdkGetters
type NetworkName<S extends SdkGetterName> = S extends `get${infer N}Sdk`
  ? Uncapitalize<N>
  : never

type AllowKitMap = {
  [Key in NetworkName<SdkGetterName>]: AllowKit<
    ReturnType<(typeof ethSdk)[`get${Capitalize<Key>}Sdk`]>
  >
}

const uncapitalize = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

export const allow: AllowKitMap = Object.keys(sdkGetters).reduce(
  (acc, sdkGetterName) => {
    const network = uncapitalize(sdkGetterName.slice(3, -3))
    acc[network] = mapSdk(
      ethSdk[sdkGetterName as SdkGetterName](ethers.getDefaultProvider(network))
    )
    return acc
  },
  {} as any
)

type ContractMap = {
  [Key in NetworkName<SdkGetterName>]: ReturnType<
    (typeof ethSdk)[`get${Capitalize<Key>}Sdk`]
  >
}

export const contracts: ContractMap = Object.keys(sdkGetters).reduce(
  (acc, sdkGetterName) => {
    const network = uncapitalize(sdkGetterName.slice(3, -3))
    acc[network] = ethSdk[sdkGetterName as SdkGetterName](
      ethers.getDefaultProvider(network)
    )
    return acc
  },
  {} as any
)
// const test = every<number[]>(0)
allow.mainnet.balancer.vault.batchSwap(
  undefined,
  or([]),
  or(1),
  or({ fromInternalBalance: true }),
  or(),
  or()
)
