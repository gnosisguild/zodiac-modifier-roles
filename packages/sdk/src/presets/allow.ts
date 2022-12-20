import { getMainnetSdk } from "@dethcrypto/eth-sdk-client"
import { BaseContract, ethers } from "ethers"

import { PresetFullyClearedTarget, PresetFunction } from "../types"

import { execOptions } from "./execOptions"
import { scopeParam } from "./scopeParam"
import { ExecutionOptions, TupleScopings } from "./types"

const mainnetProvider = ethers.getDefaultProvider("mainnet")
const defaultSigner = ethers.Wallet.createRandom().connect(mainnetProvider)

type MapParams<T extends any[]> = ((...b: T) => void) extends (
  ...args: [...infer I, any]
) => void
  ? [...params: TupleScopings<I>, options?: ExecutionOptions]
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
    const options = args[functionInputs.length] as ExecutionOptions | undefined

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
type AllowEntireContract = (
  options?: ExecutionOptions
) => PresetFullyClearedTarget
type AllowContract<C extends BaseContract> = AllowEntireContract &
  AllowFunctions<C, C["functions"]>

const makeAllowContract = <C extends BaseContract>(
  contract: C
): AllowContract<C> => {
  const allowEntireContract = (
    options?: ExecutionOptions
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

const mapSdkRecursive = <S extends EthSdk>(sdk: S): AllowKit<S> => {
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

allow.mainnet.uniswap.nftPositions.mint({ amount0Desired: { oneOf: [1, 2] } })
