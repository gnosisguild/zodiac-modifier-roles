import { Contract, PopulatedTransaction, Signer } from "ethers";
import { encodeMulti, MetaTransaction, OperationType } from "ethers-multisend";
import { defaultAbiCoder, solidityPack } from "ethers/lib/utils";

import ROLES_ABI from "../../build/artifacts/contracts/Roles.sol/Roles.json";
import { Roles } from "../../typechain-types";

import encodeApplyPreset from "./encodeApplyPreset";
import { AVATAR_ADDRESS_PLACEHOLDER } from "./placeholders";
import {
  AllowFunction,
  Comparison,
  ExecutionOptions,
  ParameterType,
  RolePreset,
  ScopeParam,
} from "./types";

let nonce: number;

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
  signer: Signer,
  avatar?: string,
  multiSend?: string
): Promise<void> => {
  const txs = await encodeApplyPreset(address, roleId, preset, avatar);
  nonce = await signer.getTransactionCount();

  if (multiSend) {
    const multiTx = encodeMulti(txs.map(asMetaTransaction));
    await signer.sendTransaction({ ...multiTx, nonce: nonce++ });
  } else {
    for (let i = 0; i < txs.length; i++) {
      const tx = await signer.sendTransaction({
        ...txs[i],
        nonce: nonce++,
      });
      console.log(`tx #${i}`, tx.hash);
    }
  }
};

const asMetaTransaction = (
  populatedTransaction: PopulatedTransaction
): MetaTransaction => {
  return {
    to: populatedTransaction.to || "",
    data: populatedTransaction.data || "",
    value: populatedTransaction.value?.toHexString() || "0",
    operation: OperationType.Call,
  };
};

export default applyPreset;
