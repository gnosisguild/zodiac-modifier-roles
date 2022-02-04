import { ethers, PopulatedTransaction } from "ethers"
import { Roles, Roles__factory } from "../contracts/type"
import SafeAppsSDK, { BaseTransaction } from "@gnosis.pm/safe-apps-sdk"
// get the safe and provider here.

export type WalletType = "injected" | "gnosis-safe" | "zodiac-pilot"

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
  targetsToAdd: string[],
  targetsToRemove: string[],
) => {
  const targetIntersection = targetsToAdd.filter((memberAddress) => targetsToRemove.includes(memberAddress))
  if (targetIntersection.length > 0) {
    throw new Error("The same address is found in both targets to add and targets to remove")
  }
  const addTxs = targetsToAdd.map((targetAddress) => contract.populateTransaction.allowTarget(roleId, targetAddress, 3)) // TODO: let user specify `options`

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
 * @param membersToAdd
 * @param membersToRemove
 * @param targetsToAdd
 * @param targetsToRemove
 * @returns
 */
export const updateRole = async (
  provider: ethers.providers.JsonRpcProvider,
  walletType: WalletType,
  modifierAddress: string,
  roleId: string,
  membersToAdd: string[],
  membersToRemove: string[],
  targetsToAdd: string[],
  targetsToRemove: string[],
) => {
  console.log("members to add: ", membersToAdd)
  console.log("members to remove: ", membersToRemove)
  console.log("targets to add: ", targetsToAdd)
  console.log("targets to remove: ", targetsToRemove)

  const signer = await provider.getSigner()
  const rolesModifierContract = Roles__factory.connect(modifierAddress, signer)

  const membershipTransactions = await createUpdateMembershipTransactions(
    rolesModifierContract,
    roleId,
    membersToAdd,
    membersToRemove,
  )

  const targetTransactions = await createUpdateTargetTransactions(
    rolesModifierContract,
    roleId,
    targetsToAdd,
    targetsToRemove,
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
