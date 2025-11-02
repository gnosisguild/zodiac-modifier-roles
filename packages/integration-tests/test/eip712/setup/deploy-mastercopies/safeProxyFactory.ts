import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import Artifact from "@safe-global/safe-contracts/build/artifacts/contracts/proxies/SafeProxyFactory.sol/SafeProxyFactory.json";
import { Interface } from "ethers";

import { deployViaFactory } from "./singletonFactory";

export const iface = Interface.from(Artifact.abi);
export const address = "0xd9d2Ba03a7754250FDD71333F444636471CACBC4";

export async function deploySafeProxyFactory(signer: HardhatEthersSigner) {
  await deployViaFactory({ bytecode: Artifact.bytecode }, signer);
}
