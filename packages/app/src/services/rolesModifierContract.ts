import { ethers, PopulatedTransaction } from "ethers"
import { Roles, Roles__factory } from "../contracts/type"
import SafeAppsSDK, { BaseTransaction } from "@gnosis.pm/safe-apps-sdk"
import { ExecutionOption, FuncParams, Target } from "../typings/role"
import { RoleContextState } from "../components/views/Role/RoleContext"
import { FunctionFragment } from "@ethersproject/abi"
import { _signer } from "../hooks/useWallet"
// get the safe and provider here.

const executionOptionsToInt = (executionOptions: ExecutionOption) => {
  switch (executionOptions) {
    case ExecutionOption.NONE:
      return 0
    case ExecutionOption.SEND:
      return 1
    case ExecutionOption.DELEGATE_CALL:
      return 2
    case ExecutionOption.BOTH:
      return 3
  }
}

export enum WalletType {
  INJECTED = "injected",
  GNOSIS_SAFE = "gnosis-safe",
  ZODIAC_PILOT = "zodiac-pilot",
}

const createUpdateMembershipTransactions = async (
  contract: Roles,
  roleId: string,
  membersToAdd: string[],
  membersToRemove: string[],
) => {
  const memberIntersection = membersToAdd.filter((memberAddress) => membersToRemove.includes(memberAddress))
  if (memberIntersection.length > 0) {
    throw new Error("The same address is found in both members to add and members to remove")
  }
  const addTxs = membersToAdd.map((memberAddress) =>
    contract.populateTransaction.assignRoles(memberAddress, [roleId], [true]),
  )

  const removeTxs = membersToRemove.map((memberAddress) =>
    contract.populateTransaction.assignRoles(memberAddress, [roleId], [false]),
  )

  return Promise.all([...addTxs, ...removeTxs])
}

const createUpdateTargetTransactions = async (contract: Roles, roleId: string, state: RoleContextState) => {
  const targetIntersection = state.targets.add.filter(({ address }) => state.targets.remove.includes(address))
  if (targetIntersection.length > 0) {
    throw new Error("The same address is found in both targets to add and targets to remove")
  }
  const addTxs = await createUpdateRoleTransactions(contract, roleId, state)

  const removeTxs = state.targets.remove.map((targetAddress) =>
    contract.populateTransaction.revokeTarget(roleId, targetAddress),
  )

  return Promise.all([...addTxs, ...removeTxs])
}

async function createUpdateRoleTransactions(
  contract: Roles,
  roleId: string,
  state: RoleContextState,
): Promise<ethers.PopulatedTransaction[]> {
  // TODO: Get Role diff
  return (await Promise.all(state.targets.add.map((target) => getTargetScopeTx(contract, roleId, target)))).flat()
}

async function getTargetScopeTx(
  contract: Roles,
  roleId: string,
  target: Target,
): Promise<ethers.PopulatedTransaction[]> {
  if (!target.funcParams) return []
  if (areAllFunctionsAllowed(target.funcParams)) {
    console.log("areAllFunctionsAllowed", roleId, target.address)
    return Promise.all([
      contract.populateTransaction.allowTarget(roleId, target.address, executionOptionsToInt(target.executionOptions)),
    ])
  }

  return Promise.all([
    contract.populateTransaction.scopeTarget(roleId, target.address),
    ...Object.entries(target.funcParams)
      .filter(([_, params]) => params.some((p) => p))
      .map(([hash]) => {
        const func = FunctionFragment.fromString(hash)
        return contract.populateTransaction.scopeAllowFunction(
          roleId,
          target.address,
          ethers.utils.Interface.getSighash(func),
          executionOptionsToInt(target.executionOptions),
        )
      }),
  ])
}

/**
 * Will not check that the members and target operations are valid against the data on chain.
 * For instance requests for adding a member that is already a member or removing a member
 * that is not a member will be executed.
 * @param signer
 * @param walletType
 * @param modifierAddress
 * @param roleId
 * @param state
 * @returns
 */
export const updateRole = async (
  walletType: WalletType,
  modifierAddress: string,
  roleId: string,
  state: RoleContextState,
) => {
  console.log("roleId: ", roleId)
  console.log("members to add: ", state.members.add)
  console.log("members to remove: ", state.members.remove)
  console.log("targets to add: ", state.targets.add)
  console.log("targets to remove: ", state.targets.remove)

  const rolesModifierContract = Roles__factory.connect(modifierAddress, _signer)

  const membershipTransactions = await createUpdateMembershipTransactions(
    rolesModifierContract,
    roleId,
    state.members.add,
    state.members.remove,
  )

  const targetTransactions = await createUpdateTargetTransactions(rolesModifierContract, roleId, state)

  const txs = [...membershipTransactions, ...targetTransactions]

  switch (walletType) {
    case WalletType.GNOSIS_SAFE: {
      const safeSDK = new SafeAppsSDK()
      console.log(txs)
      const hash = await safeSDK.txs.send({ txs: txs.map(convertTxToSafeTx) })
      console.log("Initiated Gnosis Safe transaction. Hash:")
      console.log(hash)
      break
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

export function areAllFunctionsAllowed(funcParams: FuncParams): boolean {
  return !Object.values(funcParams)
    .flat(2)
    .some((allowed) => !allowed)
}
