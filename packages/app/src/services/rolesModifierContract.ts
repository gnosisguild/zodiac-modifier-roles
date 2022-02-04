import { ethers } from "ethers"
import { Roles__factory } from "../contracts/type"
// get the safe and provider here.

const addMember = async (
  provider: ethers.providers.JsonRpcProvider | undefined,
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

  return RolesModifier.populateTransaction.assignRoles(memberToAdd, [roleId], [true])
}

const removeMember = async (
  provider: ethers.providers.JsonRpcProvider | undefined,
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

  return RolesModifier.populateTransaction.assignRoles(memberToRemove, [roleId], [false])
}

export const updateRole = async (
  provider: ethers.providers.JsonRpcProvider | undefined,
  modifierAddress: string | undefined,
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
  console.log("not implemented yest. Will update the role.")
}
