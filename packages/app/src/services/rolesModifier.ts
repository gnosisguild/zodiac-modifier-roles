import { ethers } from "ethers"
import { Roles__factory } from "../contracts/type"
// get the safe and provider here.

export const addMember = async (
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

  return RolesModifier.assignRoles(memberToAdd, [roleId], [true])
}

export const removeMember = async (
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

  return RolesModifier.assignRoles(memberToRemove, [roleId], [false])
}
