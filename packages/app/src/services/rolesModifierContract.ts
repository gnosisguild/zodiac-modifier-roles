import { BigNumberish, BytesLike, ethers, PopulatedTransaction } from "ethers"
import { Roles, Roles__factory } from "../contracts/type"
import SafeAppsSDK, { BaseTransaction, GatewayTransactionDetails } from "@gnosis.pm/safe-apps-sdk"
import {
  ConditionType,
  FuncParams,
  FunctionCondition,
  ParamComparison,
  ParamCondition,
  ParameterType,
  Target,
} from "../typings/role"
import { Level, RoleContextState } from "../components/views/Role/RoleContext"
import { FunctionFragment, Interface } from "@ethersproject/abi"
import { _signer } from "../hooks/useWallet"
import { getExplorer } from "../utils/explorer"
import { Network } from "../utils/networks"
import { isWriteFunction } from "../utils/conditions"

export enum WalletType {
  INJECTED = "injected",
  GNOSIS_SAFE = "gnosis-safe",
  ZODIAC_PILOT = "zodiac-pilot",
}

function getTargetTransaction(contract: Roles, role: RoleContextState, target: Target): Promise<PopulatedTransaction> {
  switch (target.type) {
    case ConditionType.SCOPED:
      console.log("[getTargetTransaction] scope target to function", [role.id, target.address])
      return contract.populateTransaction.scopeTarget(role.id, target.address)
    case ConditionType.WILDCARDED:
      console.log("[getTargetTransaction] allow target", [role.id, target.address])
      return contract.populateTransaction.allowTarget(role.id, target.address, target.executionOption)
  }
  console.log("[getTargetTransaction] revoke target", [role.id, target.address])
  return contract.populateTransaction.revokeTarget(role.id, target.address)
}

function getFunctionTransaction(
  contract: Roles,
  role: RoleContextState,
  target: Target,
  funcCondition: FunctionCondition,
  func?: FunctionFragment,
): Promise<ethers.PopulatedTransaction> {
  if (funcCondition.type === ConditionType.BLOCKED) {
    console.log("[getFunctionTransaction] scope revoke function", [role.id, target.address, funcCondition.sighash])
    return contract.populateTransaction.scopeRevokeFunction(role.id, target.address, funcCondition.sighash)
  }

  if (funcCondition.type === ConditionType.WILDCARDED) {
    console.log("[getFunctionTransaction] scope allow function", [
      role.id,
      target.address,
      funcCondition.sighash,
      funcCondition.executionOption,
    ])
    return contract.populateTransaction.scopeAllowFunction(
      role.id,
      target.address,
      funcCondition.sighash,
      funcCondition.executionOption,
    )
  }

  if (!func) throw new Error("ABI is needed to scope targets")

  const paramIndexes = funcCondition.params.map((param) => param?.index)
  const paramsLength = Math.max(-1, ...paramIndexes) + 1

  const isParamScoped: boolean[] = []
  const paramType: BigNumberish[] = []
  const paramComp: BigNumberish[] = []
  const compValue: BytesLike[] = []

  for (let i = 0; i < paramsLength; i++) {
    const param = funcCondition.params.find((param) => param.index === i)
    if (param && param.condition !== ParamComparison.ONE_OF) {
      isParamScoped.push(true)
      paramType.push(getParameterTypeInt(param.type))
      paramComp.push(getParamComparisonInt(param.condition))
      compValue.push(param.value[0])
    } else {
      isParamScoped.push(false)
      paramType.push(0)
      paramComp.push(0)
      compValue.push("0x")
    }
  }

  console.log("[getFunctionTransaction] scope function", [
    role.id,
    target.address,
    funcCondition.sighash,
    isParamScoped,
    paramType,
    paramComp,
    compValue,
    funcCondition.executionOption,
  ])

  return contract.populateTransaction.scopeFunction(
    role.id,
    target.address,
    funcCondition.sighash,
    isParamScoped,
    paramType,
    paramComp,
    compValue,
    funcCondition.executionOption,
  )
}

/**
 * Will not check that the members and target operations are valid against the data on chain.
 * For instance requests for adding a member that is already a member or removing a member
 * that is not a member will be executed.
 * @param modifierAddress
 * @param network
 * @param role
 * @returns
 */
export const updateRole = async (
  modifierAddress: string,
  network: Network,
  role: RoleContextState,
): Promise<ethers.PopulatedTransaction[]> => {
  console.log("roleId: ", role.id)
  console.log("members to add: ", role.members.add)
  console.log("members to remove: ", role.members.remove)
  console.log("targets to add: ", role.targets.add)
  console.log("targets to remove: ", role.targets.remove)

  const rolesModifierContract = Roles__factory.connect(modifierAddress, _signer)

  const addMemberTxs = role.members.add.map((member) =>
    rolesModifierContract.populateTransaction.assignRoles(member, [role.id], [true]),
  )
  const removeMemberTxs = role.members.remove.map((member) =>
    rolesModifierContract.populateTransaction.assignRoles(member, [role.id], [false]),
  )
  const removeTargetTxs = role.targets.remove.map((target) => {
    console.log("[removeTargetTxs] revoke target", [role.id, target])
    return rolesModifierContract.populateTransaction.revokeTarget(role.id, target)
  })

  const txs = [...role.targets.list, ...role.targets.add].map(async (target) => {
    const updateEvents = role.getTargetUpdate(target.id)

    const explorer = getExplorer(network)
    let functions: Record<string, FunctionFragment> = {}
    try {
      const targetABI = await explorer.abi(target.address)
      const contract = new ethers.utils.Interface(targetABI)
      functions = Object.values(contract.functions)
        .filter(isWriteFunction)
        .reduce((obj, func) => {
          return { ...obj, [Interface.getSighash(func)]: func }
        }, functions)
    } catch (e) {
      console.warn("failed to fetch ABI of target", target.address)
    }

    const targetLevelTxs: Promise<PopulatedTransaction>[] = updateEvents
      .filter((event) => event.level === Level.SCOPE_TARGET)
      .map((event) => getTargetTransaction(rolesModifierContract, role, event.value as Target))

    const updateFunctionOptionTxs: Promise<PopulatedTransaction>[] = updateEvents
      .filter(
        (event) => event.level === Level.UPDATE_FUNCTION_EXECUTION_OPTION && event.targetAddress === target.address,
      )
      .map((event) => {
        const value = event.value as FunctionCondition
        console.log("[updateRole] scope function execution option", [
          role.id,
          target.address,
          value.sighash,
          value.executionOption,
          functions[value.sighash].format("full"),
        ])
        return rolesModifierContract.populateTransaction.scopeFunctionExecutionOptions(
          role.id,
          target.address,
          value.sighash,
          value.executionOption,
        )
      })

    const scopedFunctions: string[] = []

    const functionLevelTxs: Promise<PopulatedTransaction>[] = updateEvents
      .filter((event) => event.level === Level.SCOPE_FUNCTION && event.targetAddress === target.address)
      .map((event): Promise<PopulatedTransaction> => {
        const value = event.value as FunctionCondition
        scopedFunctions.push(value.sighash)
        return getFunctionTransaction(rolesModifierContract, role, target, value, functions[value.sighash])
      })

    // Group Param Events by Function
    const paramEventsPerFunction = updateEvents
      .filter((event) => event.level === Level.SCOPE_PARAM && event.targetAddress === target.address)
      .reduce((obj, event): Record<string, ParamCondition[]> => {
        if (event.level !== Level.SCOPE_PARAM) return obj

        /*
         Param conditions are configure while scoping a function or can be updated independently.
         If it was configure in scoping the function, it doesn't need to be update. Unless it's a
         `ONE_OF` param condition.
         */
        if (event.value.condition !== ParamComparison.ONE_OF && scopedFunctions.includes(event.funcSighash)) return obj

        const funcParams = obj[event.funcSighash] || []
        return {
          ...obj,
          [event.funcSighash]: [...funcParams, event.value],
        }
      }, {} as Record<string, ParamCondition[]>)

    const paramLevelTxs: Promise<PopulatedTransaction>[] = Object.entries(paramEventsPerFunction)
      .map(([sighash, params]) => {
        return params.map((paramCondition) => {
          if (paramCondition.type === ParameterType.NO_RESTRICTION) {
            // unscopeParameter
            console.log("[updateRole] unscope parameter", [role.id, target.address, sighash, paramCondition.index])
            return rolesModifierContract.populateTransaction.unscopeParameter(
              role.id,
              target.address,
              sighash,
              paramCondition.index,
            )
          } else if (paramCondition.condition !== ParamComparison.ONE_OF) {
            console.log("[updateRole] scope parameter", [
              role.id,
              target.address,
              sighash,
              paramCondition.index,
              getParameterTypeInt(paramCondition.type),
              getParamComparisonInt(paramCondition.condition),
              paramCondition.value[0],
            ])
            return rolesModifierContract.populateTransaction.scopeParameter(
              role.id,
              target.address,
              sighash,
              paramCondition.index,
              getParameterTypeInt(paramCondition.type),
              getParamComparisonInt(paramCondition.condition),
              paramCondition.value[0],
            )
          } else {
            console.log("[updateRole] scope parameter as OneOf", [
              role.id,
              target.address,
              sighash,
              paramCondition.index,
              getParameterTypeInt(paramCondition.type),
              paramCondition.value,
            ])
            return rolesModifierContract.populateTransaction.scopeParameterAsOneOf(
              role.id,
              target.address,
              sighash,
              paramCondition.index,
              getParameterTypeInt(paramCondition.type),
              paramCondition.value,
            )
          }
        })
      })
      .flat()

    return Promise.all([...targetLevelTxs, ...functionLevelTxs, ...updateFunctionOptionTxs, ...paramLevelTxs])
  })

  const targetTxs = (await Promise.all([...txs])).flat()
  const targetActionsTxs = await Promise.all([...removeTargetTxs])
  const memberTxs = await Promise.all([...addMemberTxs, ...removeMemberTxs, ...targetActionsTxs])

  console.log("txs", [...memberTxs, ...targetTxs])

  return [...memberTxs, ...targetTxs]
}

export const executeTxsGnosisSafe = async (txs: PopulatedTransaction[]) => {
  const safeSDK = new SafeAppsSDK()
  const { safeTxHash } = await safeSDK.txs.send({ txs: txs.map(convertTxToSafeTx) })
  return safeTxHash
}

export const executeTxsInjectedProvider = async (txs: PopulatedTransaction[]) =>
  await Promise.all(
    txs.map(async (tx) => {
      const recept = await _signer.sendTransaction(tx)
      await recept.wait()
      return recept.hash
    }),
  )

function convertTxToSafeTx(tx: PopulatedTransaction): BaseTransaction {
  return {
    to: tx.to as string,
    value: "0",
    data: tx.data as string,
  }
}

export const getSafeTx = async (safeTxHash: string): Promise<GatewayTransactionDetails> => {
  const safeSDK = new SafeAppsSDK()
  const safeTx = await safeSDK.txs.getBySafeTxHash(safeTxHash)
  console.log(safeTx)
  return safeTx
}

export function areAllFunctionsAllowed(funcParams: FuncParams): boolean {
  return !Object.values(funcParams)
    .flat(2)
    .some((allowed) => !allowed)
}

function getParamComparisonInt(paramComparison: ParamComparison): number {
  switch (paramComparison) {
    case ParamComparison.EQUAL_TO:
      return 0
    case ParamComparison.GREATER_THAN:
      return 1
    case ParamComparison.LESS_THAN:
      return 2
    case ParamComparison.ONE_OF:
      return 3
  }
}

function getParameterTypeInt(parameterType: ParameterType): number {
  switch (parameterType) {
    case ParameterType.STATIC:
      return 0
    case ParameterType.DYNAMIC:
      return 1
    case ParameterType.DYNAMIC32:
      return 2
    case ParameterType.NO_RESTRICTION:
      throw new Error("No restriction should not go on chain. This should be unscoped via unscopeParameter")
  }
}
