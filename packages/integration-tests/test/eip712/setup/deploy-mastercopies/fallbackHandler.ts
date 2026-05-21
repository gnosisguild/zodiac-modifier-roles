import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/types"
import Artifact from "@safe-global/safe-contracts/build/artifacts/contracts/handler/CompatibilityFallbackHandler.sol/CompatibilityFallbackHandler.json" with { type: "json" }
import { Interface } from "ethers"

import { deployViaFactory } from "./singletonFactory.js"

export const iface = Interface.from(Artifact.abi)
export const address = "0xcB4a8d3609A7CCa2D9c063a742f75c899BF2f7b5"

export async function deployFallbackHandler(signer: HardhatEthersSigner) {
  await deployViaFactory({ bytecode: Artifact.bytecode }, signer)
  // console.log("fallback: " + address);
}
