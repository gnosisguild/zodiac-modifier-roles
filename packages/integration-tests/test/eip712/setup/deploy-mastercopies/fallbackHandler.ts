import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import Artifact from "@safe-global/safe-contracts/build/artifacts/contracts/handler/CompatibilityFallbackHandler.sol/CompatibilityFallbackHandler.json"
import { Interface } from "ethers"

import { deployViaFactory } from "./singletonFactory"

export const iface = Interface.from(Artifact.abi)
export const address = "0xcB4a8d3609A7CCa2D9c063a742f75c899BF2f7b5"

export async function deployFallbackHandler(signer: HardhatEthersSigner) {
  await deployViaFactory({ bytecode: Artifact.bytecode }, signer)
  // console.log("fallback: " + address);
}
