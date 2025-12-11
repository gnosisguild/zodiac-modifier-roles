import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import Artifact from "@safe-global/safe-contracts/build/artifacts/contracts/Safe.sol/Safe.json"
import { Interface } from "ethers"

import { deployViaFactory } from "./singletonFactory"

export const address = "0x639245e8476E03e789a244f279b5843b9633b2E7"

export const iface = Interface.from(Artifact.abi)

export async function deploySafeMastercopy(signer: HardhatEthersSigner) {
  await deployViaFactory({ bytecode: Artifact.bytecode }, signer)
}
