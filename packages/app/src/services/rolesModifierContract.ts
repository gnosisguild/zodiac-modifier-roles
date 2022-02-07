import { ethers, PopulatedTransaction } from "ethers"
import { Roles, Roles__factory } from "../contracts/type"
import SafeAppsSDK, { BaseTransaction } from "@gnosis.pm/safe-apps-sdk"
// get the safe and provider here.

export enum ExecutionOptions {
  // hardcoded initialized number representation to make sure it corresponds to the contracts
  None = 0,
  Send = 1,
  DelegateCall = 2,
  Both = 3,
}

export type WalletType = "injected" | "gnosis-safe" | "zodiac-pilot"

export type TargetWithOptions = {
  address: string
  options: ExecutionOptions
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

const createUpdateTargetTransactions = async (
  contract: Roles,
  roleId: string,
  targetsToAdd: TargetWithOptions[],
  targetsToRemove: string[],
) => {
  const targetIntersection = targetsToAdd.filter(({ address }) => targetsToRemove.includes(address))
  if (targetIntersection.length > 0) {
    throw new Error("The same address is found in both targets to add and targets to remove")
  }
  const addTxs = targetsToAdd.map(({ address, options }) =>
    contract.populateTransaction.allowTarget(roleId, address, options),
  )

  const removeTxs = targetsToRemove.map((targetAddress) =>
    contract.populateTransaction.revokeTarget(roleId, targetAddress),
  )

  return Promise.all([...addTxs, ...removeTxs])
}

/**
 * Will not check that the members and target operations are valid against the data on chain.
 * For instance requests for adding a member that is already a member or removing a member
 * that is not a member will be executed.
 * @param provider
 * @param modifierAddress
 * @param roleId
 * @param memberAddressesToAdd
 * @param memberAddressesToRemove
 * @param targetsToAdd
 * @param targetAddressesToRemove
 * @returns
 */
export const updateRole = async (
  provider: ethers.providers.JsonRpcProvider,
  walletType: WalletType,
  modifierAddress: string,
  roleId: string,
  memberAddressesToAdd: string[],
  memberAddressesToRemove: string[],
  targetsToAdd: TargetWithOptions[],
  targetAddressesToRemove: string[],
) => {
  console.log("members to add: ", memberAddressesToAdd)
  console.log("members to remove: ", memberAddressesToRemove)
  console.log("targets to add: ", targetsToAdd)
  console.log("targets to remove: ", targetAddressesToRemove)

  const signer = await provider.getSigner()
  const rolesModifierContract = Roles__factory.connect(modifierAddress, signer)

  const membershipTransactions = await createUpdateMembershipTransactions(
    rolesModifierContract,
    roleId,
    memberAddressesToAdd,
    memberAddressesToRemove,
  )

  const targetTransactions = await createUpdateTargetTransactions(
    rolesModifierContract,
    roleId,
    targetsToAdd,
    targetAddressesToRemove,
  )

  const txs = [...membershipTransactions, ...targetTransactions]

  switch (walletType) {
    case "gnosis-safe": {
      const safeSDK = new SafeAppsSDK()
      console.log(txs)
      const hash = await safeSDK.txs.send({ txs: txs.map(convertTxToSafeTx) })
      console.log("Initiated Gnosis Safe transaction. Hash:")
      console.log(hash)
      break
    }
    case "injected": {
      await Promise.all(
        txs.map(async (tx) => {
          const recept = await signer.sendTransaction(tx)
          await recept.wait()
        }),
      )
      break
    }
    case "zodiac-pilot": {
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
