import * as ethSdk from "@gnosis-guild/eth-sdk-client"
import {
  BaseContract,
  ContractTransaction,
  ContractTransactionResponse,
  ethers,
  FunctionFragment,
  isError,
  TransactionRequest,
} from "ethers"
import { Condition, Operator, AbiType } from "zodiac-roles-deployments"
// We import via alias to avoid double bundling of sdk functions
// eslint does not know about our Typescript path alias
// eslint-disable-next-line import/no-unresolved
import {
  c,
  ExecutionFlags,
  TargetPermission,
  FunctionPermission,
  FunctionPermissionCoerced,
} from "zodiac-roles-sdk"

// For things that are not publicly exported we still use relative paths.
// Since these are mainly types, this won't blow up bundles.
import { TupleScopings } from "../main/target/authoring"
import { coercePermission } from "../main/permission"

// In this file, we derive the typed allow kit from the eth-sdk-client that has been generated based on the user-provided config json.

type PickByValue<T, Value> = {
  [P in keyof T as T[P] extends Value
    ? P extends string
      ? P
      : never
    : never]: T[P]
}

type Options = {
  /** Allow sending an Ether value */
  send?: boolean
  /** Allow making delegate calls */
  delegatecall?: boolean
  /** Restrict the total Ether value sent using the specified allowance */
  etherWithinAllowance?: `0x${string}`
  /** Restrict the call rate using the specified allowance */
  callWithinAllowance?: `0x${string}`
}

/** We need to skip over functions with "view" state mutability. We do this by matching the ethers ContractMethod type  */
interface StateMutatingContractMethod {
  (): Promise<ContractTransactionResponse>

  name: string
  fragment: FunctionFragment
  getFragment(): FunctionFragment
  populateTransaction(): Promise<ContractTransaction>
  staticCall(): Promise<any>
  send(): Promise<ContractTransactionResponse>
  estimateGas(): Promise<bigint>
  staticCallResult(): Promise<any>
}

type StateMutatingContractMethods<C extends BaseContract> = PickByValue<
  C,
  StateMutatingContractMethod
>

// These are copied over from what TypeChain generates
type BaseOverrides = Omit<TransactionRequest, "to" | "data">
type NonPayableOverrides = Omit<
  BaseOverrides,
  "value" | "blockTag" | "enableCcipRead"
>
type PayableOverrides = Omit<BaseOverrides, "blockTag" | "enableCcipRead">

// Maps the types of ethers method arguments to the ones we want to use in the allow function
type AllowFunctionParameters<MethodArgs extends [...any]> = MethodArgs extends [
  ...any,
  NonPayableOverrides | PayableOverrides,
]
  ? never
  : [...TupleScopings<MethodArgs>, options?: Options]

type AllowFunctions<C extends BaseContract> = {
  [key in keyof StateMutatingContractMethods<C>]: (
    ...args: AllowFunctionParameters<
      Parameters<C[key] extends (...args: any) => any ? C[key] : never>
    >
  ) => FunctionPermission
}

type AllowContract<C extends BaseContract> = {
  [EVERYTHING]: (options?: Options) => TargetPermission
} & AllowFunctions<C>

const makeAllowFunction = <
  C extends BaseContract,
  N extends keyof StateMutatingContractMethods<C>,
>(
  contract: C,
  name: N
) => {
  const functionFragment = contract.interface.getFunction(name as string)!
  const functionInputs = functionFragment.inputs

  if (
    typeof contract.target !== "string" ||
    !contract.target.startsWith("0x")
  ) {
    throw new Error("Only addresses as contract targets are supported")
  }

  return (...args: any[]): FunctionPermission => {
    const scopings = args.slice(0, functionInputs.length) as any[]
    const hasScopings = scopings.some((s) => !!s)
    const options = (args[functionInputs.length] || {}) as Options
    const presetFunction: FunctionPermission = {
      targetAddress: contract.target as `0x${string}`,
      signature: functionFragment.format("sighash"),
      condition: hasScopings
        ? c.calldataMatches(scopings, functionInputs)()
        : undefined,
    }
    return applyOptions(coercePermission(presetFunction), options)
  }
}

const emptyCalldataMatches = {
  paramType: AbiType.Calldata,
  operator: Operator.Matches,
  children: [],
}

/**
 * EthersWithinAllowance and CallWithinAllowance are global conditions that restrict the total Ether value sent or the call rate.
 * They must be appended as children of the root calldata matches node.
 */
const applyGlobalAllowance = (
  condition: Condition = emptyCalldataMatches,
  allowanceCondition: Condition
) => {
  if (
    condition.paramType !== AbiType.Calldata ||
    condition.operator !== Operator.Matches
  ) {
    throw new Error(
      "Global allowance can only be applied to calldata matches nodes"
    )
  }

  return {
    ...condition,
    children: [...(condition.children || []), allowanceCondition],
  }
}

const applyOptions = (
  entry: FunctionPermissionCoerced,
  options: Options
): FunctionPermissionCoerced => {
  let condition = entry.condition

  if (options.etherWithinAllowance) {
    if (!options.send) {
      throw new Error(
        "`etherWithinAllowance` can only be used if `send` is allowed"
      )
    }

    condition = applyGlobalAllowance(condition, {
      paramType: AbiType.None,
      operator: Operator.EtherWithinAllowance,
      compValue: options.etherWithinAllowance,
    })
  }

  if (options.callWithinAllowance) {
    condition = applyGlobalAllowance(condition, {
      paramType: AbiType.None,
      operator: Operator.CallWithinAllowance,
      compValue: options.etherWithinAllowance,
    })
  }

  return {
    ...entry,
    send: options.send,
    delegatecall: options.delegatecall,
    condition,
  }
}

export const EVERYTHING = Symbol("EVERYTHING")

const makeAllowContract = <C extends BaseContract>(
  contract: C
): AllowContract<C> => {
  const allowEverything = (options?: ExecutionFlags): TargetPermission => {
    return {
      targetAddress: contract.target as `0x${string}`,
      ...options,
    }
  }

  // TODO use Proxy just like ethers v6
  // https://github.com/ethers-io/ethers.js/blob/main/src.ts/contract/contract.ts#L777

  const contractHasFunction = (prop: string) => {
    try {
      contract.getFunction(prop)
    } catch (error) {
      if (!isError(error, "INVALID_ARGUMENT") || error.argument !== "key") {
        throw error
      }
      return false
    }
    return true
  }

  return new Proxy(
    {},
    {
      get: (target, prop) => {
        if (prop === EVERYTHING) {
          return allowEverything
        }
        if (typeof prop !== "string") {
          return undefined
        }

        if (contractHasFunction(prop)) {
          return makeAllowFunction(contract, prop as any)
        }

        return undefined
      },
      has: (target, prop) => {
        if (typeof prop === "symbol") {
          return prop === EVERYTHING
        }

        return contractHasFunction(prop)
      },
    }
  ) as any
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
    if (sdk[key].constructor.name === "Contract") {
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
    if (
      sdkGetterName === "getContract" ||
      !sdkGetterName.startsWith("get") ||
      !sdkGetterName.endsWith("Sdk")
    ) {
      return acc
    }

    const network = uncapitalize(sdkGetterName.slice(3, -3))
    acc[network] = mapSdk(
      ethSdk[sdkGetterName as SdkGetterName](ethers.getDefaultProvider())
    )
    return acc
  },
  {} as any
)
