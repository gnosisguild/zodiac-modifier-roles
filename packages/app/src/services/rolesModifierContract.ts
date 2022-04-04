import { BigNumberish, BytesLike, ethers, PopulatedTransaction } from "ethers"
import { Roles, Roles__factory } from "../contracts/type"
import SafeAppsSDK, { BaseTransaction } from "@gnosis.pm/safe-apps-sdk"
import { ConditionType, FuncParams, FunctionCondition, ParamComparison, ParamCondition, Target } from "../typings/role"
import { Level, RoleContextState } from "../components/views/Role/RoleContext"
import { FunctionFragment, Interface } from "@ethersproject/abi"
import { _signer } from "../hooks/useWallet"
import { getExplorer } from "../utils/explorer"
import { Network } from "../utils/networks"
import { formatParamValue, isWriteFunction } from "../utils/conditions"

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

  const paramIndexes = funcCondition.params.map((param) => param.index)
  const paramsLength = Math.max(-1, ...paramIndexes) + 1

  const isParamScoped: boolean[] = []
  const paramType: BigNumberish[] = []
  const paramComp: BigNumberish[] = []
  const compValue: BytesLike[] = []

  for (let i = 0; i < paramsLength; i++) {
    const param = funcCondition.params.find((param) => param.index === i)
    if (param) {
      const type = func.inputs[param.index]
      const value = ethers.utils.defaultAbiCoder.encode([type], [param.value])
      isParamScoped.push(true)
      paramType.push(param.type)
      paramComp.push(getParamComparisonInt(param.condition))
      compValue.push(value)
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
export const updateRole = async (modifierAddress: string, network: Network, role: RoleContextState) => {
  console.log("roleId: ", role.id)
  console.log("members to add: ", role.members.add)
  console.log("members to remove: ", role.members.remove)
  console.log("targets to add: ", role.targets.add)
  console.log("targets to remove: ", role.targets.remove)

  const rolesModifierContract = Roles__factory.connect(modifierAddress, _signer)

  const txs = role.targets.list.map(async (target) => {
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

    // TODO: implement unscope param UpdateEvent

    const paramLevelTxs: Promise<PopulatedTransaction>[] = Object.entries(paramEventsPerFunction)
      .map(([sighash, params]) => {
        return params.map((paramCondition) => {
          const param = functions[sighash].inputs[paramCondition.index]

          if (paramCondition.condition !== ParamComparison.ONE_OF) {
            const value = formatParamValue(param, paramCondition.value)
            const encodedValue = ethers.utils.defaultAbiCoder.encode([param], [value])
            console.log("[updateRole] scope parameter", [
              role.id,
              target.address,
              sighash,
              paramCondition.index,
              paramCondition.type,
              paramCondition.condition,
              encodedValue,
            ])
            return rolesModifierContract.populateTransaction.scopeParameter(
              role.id,
              target.address,
              sighash,
              paramCondition.index,
              paramCondition.type,
              paramCondition.condition,
              encodedValue,
            )
          }

          const encodedValues = paramCondition.values?.map((value) => {
            return ethers.utils.defaultAbiCoder.encode([param], [formatParamValue(param, paramCondition.value)])
          })

          console.log("[updateRole] scope parameter as OneOf", [
            role.id,
            target.address,
            sighash,
            paramCondition.index,
            paramCondition.type,
            encodedValues || [],
          ])
          return rolesModifierContract.populateTransaction.scopeParameterAsOneOf(
            role.id,
            target.address,
            sighash,
            paramCondition.index,
            paramCondition.type,
            encodedValues || [],
          )
        })
      })
      .flat()

    return Promise.all([...targetLevelTxs, ...functionLevelTxs, ...updateFunctionOptionTxs, ...paramLevelTxs])
  })

  return (await Promise.all(txs)).flat()
}

export async function executeTransactions(walletType: WalletType, txs: PopulatedTransaction[]) {
  switch (walletType) {
    case WalletType.GNOSIS_SAFE: {
      const safeSDK = new SafeAppsSDK()
      return await safeSDK.txs.send({ txs: txs.map(convertTxToSafeTx) })
    }
    case WalletType.INJECTED: {
      await Promise.all(
        txs.map(async (tx) => {
          const recept = await _signer.sendTransaction(tx)
          await recept.wait()
        }),
      )
      break
    }
    case WalletType.ZODIAC_PILOT: {
      console.warn("Sending transactions via the zodiac pilot in not yet supported")
      break
    }
  }
}

function convertTxToSafeTx(tx: PopulatedTransaction): BaseTransaction {
  return {
    to: tx.to as string,
    value: "0",
    data: tx.data as string,
  }
}

export async function getChainTx(safeTxHash: string, cycles = 20): Promise<string> {
  try {
    const safeSDK = new SafeAppsSDK()
    const safeTx = await safeSDK.txs.getBySafeTxHash(safeTxHash)
    if (safeTx.txHash) return safeTx.txHash
  } catch (err) {
    console.log("failed safeTx ", `cycle ${cycles}`, err)
  }

  if (cycles < 1) throw new Error("failed to fetch chain transaction")

  await new Promise((resolve) => setTimeout(resolve, 12000))
  return getChainTx(safeTxHash, cycles - 1)
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
