import { getMainnetSdk } from "@dethcrypto/eth-sdk-client"
import { BaseContract, ethers } from "ethers"

import {
  ExecutionOptions,
  PresetFullyClearedTarget,
  PresetFunction,
} from "../types"

import { scopeParam } from "./scopeParam"
import { TupleScopings } from "./types"

const mainnetProvider = ethers.getDefaultProvider("mainnet")
const defaultSigner = ethers.Wallet.createRandom().connect(mainnetProvider)

const sdk = getMainnetSdk(defaultSigner)

interface CallOptions {
  send?: boolean
  delegatecall?: boolean
}

// const makeAllowKit = <T extends EthersFunctions, U extends { [key in keyof T]: any }>(conditions: T, input: any):

type MapParams<T extends any[]> = ((...b: T) => void) extends (
  ...args: [...infer I, any]
) => void
  ? [...TupleScopings<I>, CallOptions]
  : []

const makeAllowFunction = <
  C extends BaseContract,
  N extends keyof C["functions"]
>(
  contract: C,
  name: N
) => {
  const functionInputs = contract.interface.functions[name as string].inputs
  const etherFunction = (contract.functions as C["functions"])[name]
  return (
    ...args: MapParams<Parameters<typeof etherFunction>>
  ): PresetFunction => {
    // last param is call options, everything before are param scopings
    const paramScopings = args.slice(0, functionInputs.length - 1) as any[]
    const options = args[functionInputs.length] as CallOptions | undefined

    return {
      targetAddress: contract.address,
      signature: contract.interface.functions[name as string].format("sighash"),
      options: execOptions(options),
      params: paramScopings.some(Boolean)
        ? paramScopings.flatMap((ps, index) =>
            scopeParam(ps, functionInputs[index])
          )
        : undefined,
    }
  }
}

type AllowFunctions<C extends BaseContract, F extends C["functions"]> = {
  [key in keyof F]: (...args: MapParams<Parameters<F[key]>>) => PresetFunction
}
type AllowEntireContract = (options?: CallOptions) => PresetFullyClearedTarget
type AllowContract<C extends BaseContract> = AllowEntireContract &
  AllowFunctions<C, C["functions"]>

const makeAllowContract = <C extends BaseContract>(
  contract: C
): AllowContract<C> => {
  const allowEntireContract = (
    options?: CallOptions
  ): PresetFullyClearedTarget => {
    return {
      targetAddress: contract.address,
      options: execOptions(options),
    }
  }

  const allowFunctions = Object.keys(contract.functions).reduce((acc, key) => {
    acc[key as keyof C["functions"]] = makeAllowFunction(contract, key)
    return acc
  }, {} as AllowFunctions<C, C["functions"]>)

  return Object.assign(allowEntireContract, allowFunctions)
}

const allowUniswap = makeAllowContract(sdk.uniswap.nftPositions)

allowUniswap.mint(
  { token0: "0x6B175474E89094C44Da98b954EedeAC495" },
  { send: true, delegatecall: false }
) // YAY!

type EthSdk = {
  [key: string]: EthSdk | BaseContract
}

type AllowSdk<S extends EthSdk> = {
  [Key in keyof S]: S[Key] extends BaseContract
    ? AllowContract<S[Key]>
    : S[Key] extends EthSdk // somehow it cannot infer that it cannot be a BaseContract here, so we use an extra conditional
    ? AllowSdk<S[Key]>
    : never
}

const mapSdkRecursive = <S extends EthSdk>(sdk: S): AllowSdk<S> => {
  return Object.keys(sdk).reduce((acc, key) => {
    if (sdk[key] instanceof BaseContract) {
      acc[key] = makeAllowContract(sdk[key] as BaseContract)
    } else {
      acc[key] = mapSdkRecursive(sdk[key] as EthSdk)
    }
    return acc
  }, {} as any)
}

export const allow = {
  mainnet: mapSdkRecursive(getMainnetSdk(defaultSigner)),
}

const execOptions = (options: CallOptions = {}): ExecutionOptions => {
  if (options.send && options.delegatecall) return ExecutionOptions.Both
  if (options.delegatecall) return ExecutionOptions.DelegateCall
  if (options.send) return ExecutionOptions.Send
  return ExecutionOptions.None
}

// sdk.uniswap.nftPositions.functions.burn(1, { send: true, delegatecall: false })

// // allow.uniswap.nftPositions.wholeTarget({ send: true, delegatecall: false })
// sdk.uniswap.nftPositions.mint(eq(1), oneOf([1, 2, 3], undefined,  { send: true, delegatecall: false })

// type Scoping<T> = { eq: T } | { oneOf: T[] }
// const eq = <T>(value: T): Scoping<T> => ({ eq: value })

// const allowFunction = <T>(
//   ...scopings: (Scoping<T> | undefined)[],
//   options: CallOptions = {}
// ): PresetFunction => ({})
