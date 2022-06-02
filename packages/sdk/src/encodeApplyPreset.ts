import { Contract, PopulatedTransaction } from "ethers"
import { encodeMulti, MetaTransaction, OperationType } from "ethers-multisend"
import { defaultAbiCoder } from "ethers/lib/utils"

import ROLES_ABI from "../../evm/build/artifacts/contracts/Roles.sol/Roles.json"
import { Roles } from "../../evm/typechain-types"

import { AVATAR_ADDRESS_PLACEHOLDER } from "./placeholders"
import {
  AllowFunction,
  Comparison,
  ExecutionOptions,
  ParameterType,
  RolePreset,
  ScopeParam,
} from "./types"

/**
 * Updates a role, setting all permissions of the given preset
 *
 * @param address The address of the roles modifier
 * @param roleId ID of the role to update
 * @param preset: Permissions preset to apply
 */
const encodeApplyPreset = async (
  /// address of the roles modifier
  address: string,
  roleId: number,
  preset: RolePreset,
  avatar?: string
): Promise<PopulatedTransaction[]> => {
  const contract = new Contract(address, ROLES_ABI.abi) as Roles

  const avatarAddress = avatar || (await contract.avatar())
  const filledPreset = fillPlaceholders(preset, avatarAddress)
  console.log(`Using ${avatarAddress} for avatar address placeholders.`)

  return await Promise.all([
    ...populateAllowTargetCalls(roleId, filledPreset, contract),
    ...populateScopeTargetCalls(roleId, filledPreset, contract),
    ...populateScopeAllowFunctionCalls(roleId, filledPreset, contract),
    ...populateScopeSignatureCalls(roleId, filledPreset, contract),
    ...populateScopeParameterAsOneOfCalls(roleId, filledPreset, contract),
  ])
}

export default encodeApplyPreset

export const encodeApplyPresetMultisend = async (
  /// address of the roles modifier
  address: string,
  roleId: number,
  preset: RolePreset,
  avatar?: string,
  multiSendAddress?: string,
  chunkSize = 75
): Promise<MetaTransaction[][]> => {
  const txs = await encodeApplyPreset(address, roleId, preset, avatar)
  return chunkArray(txs, chunkSize).map((chunk) => chunk.map(asMetaTransaction))
}

const chunkArray = (array: any[], chunkSize: number) => {
  const result = []
  while (array.length) {
    result.push(array.splice(0, chunkSize))
  }
  return result
}

const asMetaTransaction = (
  populatedTransaction: PopulatedTransaction
): MetaTransaction => {
  return {
    to: populatedTransaction.to || "",
    data: populatedTransaction.data || "",
    value: populatedTransaction.value?.toHexString() || "0",
    operation: OperationType.Call,
  }
}

const ExecutionOptionLabel = {
  [ExecutionOptions.None]: "call",
  [ExecutionOptions.DelegateCall]: "call, delegatecall",
  [ExecutionOptions.Send]: "call, send",
  [ExecutionOptions.Both]: "call, delegatecall, send",
}

const ComparisonLabel = {
  [Comparison.EqualTo]: "",
  [Comparison.GreaterThan]: ">",
  [Comparison.LessThan]: "<",
}

function populateAllowTargetCalls(
  roleId: number,
  preset: RolesPresetFilled,
  contract: Roles
) {
  return preset.allowTargets.map(
    ({ targetAddress, options = ExecutionOptions.None }) => {
      console.log(
        `✔️ Allow ${ExecutionOptionLabel[options]} to any function of ${targetAddress}`
      )
      return contract.populateTransaction.allowTarget(
        roleId,
        targetAddress,
        options
      )
    }
  )
}

function populateScopeTargetCalls(
  roleId: number,
  preset: RolesPresetFilled,
  contract: Roles
) {
  // Every single function scoping, either: functionAllow, functionScope, parameterScope and parameterScopeAsOneOf
  // requires a preceding scopeTarget
  return preset.allowFunctions
    .flatMap((af) => af.targetAddresses)
    .map((targetAddress) => {
      return contract.populateTransaction.scopeTarget(roleId, targetAddress)
    })
}

function populateScopeAllowFunctionCalls(
  roleId: number,
  preset: RolesPresetFilled,
  contract: Roles
) {
  return preset.allowFunctions
    .filter(needsScopeAllowFunctionCall)
    .flatMap((allowFunction) => {
      const {
        targetAddresses,
        functionSig,
        options = ExecutionOptions.None,
      } = allowFunction

      console.log(
        `✔️ Allow ${
          ExecutionOptionLabel[options]
        } to ${functionSig} function of:\n${logList(targetAddresses)}`
      )

      return targetAddresses.map((targetAddress) =>
        contract.populateTransaction.scopeAllowFunction(
          roleId,
          targetAddress,
          functionSig,
          options
        )
      )
    })
}

function populateScopeSignatureCalls(
  roleId: number,
  preset: RolesPresetFilled,
  contract: Roles
) {
  return preset.allowFunctions
    .filter(needsScopeSignatureCall)
    .flatMap((allowFunction) => {
      const {
        targetAddresses,
        functionSig,
        options = ExecutionOptions.None,
        params = [],
      } = allowFunction

      // Note we exclude oneOf parameters. These will be set independently later
      const paramsWithoutOneOf = params.map((param) =>
        param?.comparison !== Comparison.OneOf ? param : undefined
      )

      // extract arguments
      const isParamScoped = paramsWithoutOneOf.map(Boolean)
      const paramType = paramsWithoutOneOf.map(
        (entry) => entry?.type || ParameterType.Static
      )
      const paramComp = paramsWithoutOneOf.map(
        (entry) => entry?.comparison || Comparison.EqualTo
      )
      const compValue = paramsWithoutOneOf.map(
        (entry) => (entry?.value as string) || "0x"
      )

      console.log(
        `✔️ Allow ${
          ExecutionOptionLabel[options]
        } to ${functionSig} function with params (${logParams(
          paramsWithoutOneOf
        )}) of:\n${logList(targetAddresses)}`
      )

      return targetAddresses.map((targetAddress) =>
        contract.populateTransaction.scopeFunction(
          roleId,
          targetAddress,
          functionSig,
          isParamScoped,
          paramType,
          paramComp,
          compValue,
          options
        )
      )
    })
}

function populateScopeParameterAsOneOfCalls(
  roleId: number,
  preset: RolesPresetFilled,
  contract: Roles
) {
  return preset.allowFunctions.flatMap((allowFunction) => {
    const {
      targetAddresses,
      functionSig,
      options = ExecutionOptions.None,
      params,
    } = allowFunction

    // If there are other scoped params, we've already set the ExecutionOptions in makeScopeSignatureCalls
    const hasPerformedScopeSignatureCalls =
      countParams(allowFunction).scopedCount > 0
    const needsScopeFunctionExecutionOptions =
      options != ExecutionOptions.None && !hasPerformedScopeSignatureCalls

    return params
      .filter((param) => param?.comparison === Comparison.OneOf) // skip any params that are not scoped as oneOf
      .flatMap((param, paramIndex) => {
        return targetAddresses.flatMap((targetAddress) => {
          if (!param) throw new Error("invariant violation: param is undefined")
          const result = []

          if (needsScopeFunctionExecutionOptions) {
            result.push(
              contract.populateTransaction.scopeFunctionExecutionOptions(
                roleId,
                targetAddress,
                functionSig,
                options
              )
            )
          }

          result.push(
            contract.populateTransaction.scopeParameterAsOneOf(
              roleId,
              targetAddress,
              functionSig,
              paramIndex,
              param.type,
              param.value as string[]
            )
          )

          if (hasPerformedScopeSignatureCalls) {
            console.log(
              `✔️ Narrow earlier allowance of ${
                ExecutionOptionLabel[options]
              } to ${functionSig} function: must now use params (${logParams(
                params
              )}) of:\n${logList(targetAddresses)}`
            )
          } else {
            console.log(
              `✔️ Allow ${
                ExecutionOptionLabel[options]
              } to ${functionSig} function with params (${logParams(
                params
              )}) of:\n${logList(targetAddresses)}`
            )
          }

          return result
        })
      })
  })
}

function needsScopeAllowFunctionCall(allowFunction: AllowFunction): boolean {
  const { scopedCount, scopedOneOfCount } = countParams(allowFunction)
  return scopedCount + scopedOneOfCount === 0
}

function needsScopeSignatureCall(allowFunction: AllowFunction): boolean {
  const { scopedCount } = countParams(allowFunction)
  return scopedCount > 0
}

function countParams({ params = [] }: AllowFunction) {
  const scopedParams = params.filter(Boolean) as ScopeParam[]
  return {
    scopedCount: scopedParams.filter(
      (entry) => entry.comparison !== Comparison.OneOf
    ).length,
    scopedOneOfCount: scopedParams.filter(
      (entry) => entry.comparison === Comparison.OneOf
    ).length,
  }
}

const logList = (addresses: string[]) =>
  addresses.map((address) => `  - ${address}`).join("\n")

const logParams = (params: (ScopeParam | undefined)[]) =>
  params
    .map((param) => {
      if (!param) return "any"
      if (param.comparison === Comparison.OneOf)
        return `${(param.value as string[]).join(" | ")}`
      return `${ComparisonLabel[param.comparison]}${param.value as string}`
    })
    .join(", ")
