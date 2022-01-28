import { ethers, PopulatedTransaction } from "ethers"
import { Roles__factory } from "../contracts/type"
import { Transaction as SafeTransaction } from "@gnosis.pm/safe-apps-sdk"

export const addMember = async (
  provider: ethers.providers.JsonRpcProvider | undefined,
  sdk: any,
  modifierAddress: string,
  roleId: string,
  memberToAdd: string,
) => {
  if (!provider) {
    console.error("No provider")
    return
  }

  const signer = await provider.getSigner()
  const RolesModifier = Roles__factory.connect(modifierAddress, signer)

  const tx = await RolesModifier.populateTransaction.assignRoles(memberToAdd, [roleId], [true])
  await sendTransaction(provider, sdk, tx)
}

export const removeMember = async (
  provider: ethers.providers.JsonRpcProvider | undefined,
  sdk: any,
  modifierAddress: string,
  roleId: string,
  memberToRemove: string,
) => {
  if (!provider) {
    console.error("No provider")
    return
  }

  const signer = await provider.getSigner()
  const RolesModifier = Roles__factory.connect(modifierAddress, signer)

  const tx = await RolesModifier.populateTransaction.assignRoles(memberToRemove, [roleId], [false])
  sendTransaction(provider, sdk, tx)
}

const sendTransaction = async (provider: ethers.providers.JsonRpcProvider | undefined, sdk: any, tx: any) => {
  if (!provider) {
    console.error("No provider")
    return
  }

  const txs: PopulatedTransaction[] = []
  txs.push(tx)
  await sdk.txs.send({ txs: txs.map(convertTxToSafeTx) })
}

const convertTxToSafeTx = (tx: PopulatedTransaction): SafeTransaction => ({
  to: tx.to as string,
  value: "0",
  data: tx.data as string,
})
