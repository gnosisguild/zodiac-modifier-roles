import { Contract, Signer } from "ethers";

import ROLES_ABI from "../../build//artifacts/contracts/Roles.sol/Roles.json";
import { Roles } from "../../typechain-types";

import { AVATAR_ADDRESS_PLACEHOLDER } from "./placeholders";
import { RolePreset, ScopeParam } from "./types";

/**
 * Updates a role, setting all permissions of the given preset
 *
 * @param address The address of the roles modifier
 * @param roleId ID of the role to update
 * @param preset: Permissions preset to apply
 */
const applyPreset = async (
  /// address of the roles modifier
  address: string,
  roleId: number,
  preset: RolePreset,
  signer: Signer
): Promise<void> => {
  const rolesMod = new Contract(address, ROLES_ABI.abi, signer) as Roles;
  const avatarAddress = await rolesMod.avatar();
  const filledPreset = fillPlaceholders(preset, avatarAddress);
  console.log(`Using ${avatarAddress} for avatar address placeholders`);

  await Promise.all(
    filledPreset.allowTargets.map(async (allowTarget) => {
      rolesMod.allowTarget(
        roleId,
        allowTarget.targetAddress,
        allowTarget.executionOption?.toString() || 0
      );
    })
  );
};

export default applyPreset;

const fillPlaceholders = (preset: RolePreset, avatarAddress: string) => ({
  ...preset,
  allowFunctions: preset.allowFunctions.map((allowFunction) => ({
    ...allowFunction,
    params: (allowFunction.params || []).map(
      (param) =>
        param && {
          ...param,
          value:
            param.value && fillPlaceholdersValue(param.value, avatarAddress),
        }
    ),
  })),
});

const fillPlaceholdersValue = (
  value: ScopeParam["value"],
  avatarAddress: string
) => {
  if (value === AVATAR_ADDRESS_PLACEHOLDER) return avatarAddress;
  if (Array.isArray(value))
    return value.map((element) =>
      element === AVATAR_ADDRESS_PLACEHOLDER ? avatarAddress : element
    );
  return value;
};
