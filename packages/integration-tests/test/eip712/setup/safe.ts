import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { AbiCoder, Signer, ZeroAddress, ZeroHash, concat } from "ethers";

import { iface } from "./deploy-mastercopies/safeMastercopy";
import {
  calculateSafeAddress,
  populateSafeCreation,
} from "./encodeSafeCreation";

export async function deploySafe(
  {
    owners,
    threshold,
    creationNonce,
  }: {
    owners: string[];
    threshold: number;
    creationNonce: bigint | number;
  },
  relayer: Signer,
) {
  await relayer.sendTransaction(
    populateSafeCreation({
      owners,
      threshold,
      creationNonce: BigInt(creationNonce),
    }),
  );

  return calculateSafeAddress({
    owners,
    threshold,
    creationNonce: BigInt(creationNonce),
  });
}

export async function enableModuleInSafe(
  {
    safe,
    module,
  }: {
    safe: string;
    module: string;
  },
  signer: SignerWithAddress,
) {
  return signer.sendTransaction({
    to: safe,
    data: iface.encodeFunctionData("execTransaction", [
      safe,
      0n,
      iface.encodeFunctionData("enableModule", [module]),
      0,
      0n,
      0n,
      0n,
      ZeroAddress,
      ZeroAddress,
      createPreApprovedSignature(await signer.getAddress()),
    ]),
  });
}

const createPreApprovedSignature = (approver: string) => {
  return concat([
    AbiCoder.defaultAbiCoder().encode(["address"], [approver]),
    ZeroHash,
    "0x01",
  ]);
};
