import { defaultAbiCoder } from "ethers/lib/utils";
import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

import { deployViaFactory } from "./EIP2470";
import { getArtifacts, MastercopyArtifact } from "./mastercopy-artifacts";

task(
  "deploy:mastercopy",
  "Deploys mastercopies from the artifacts file into the current network"
)
  .addOptionalParam(
    "contractVersion",
    "The specific version of the contracts to deploy",
    "latest",
    types.string
  )
  .setAction(async ({ contractVersion }, hre) => {
    await deployMastercopyArtifacts(getArtifacts({ contractVersion }), hre);
  });

export async function deployMastercopyArtifacts(
  artifacts: MastercopyArtifact[],
  hre: HardhatRuntimeEnvironment
) {
  const [deployer] = await hre.ethers.getSigners();

  for (const artifact of artifacts) {
    const initCode = `${artifact.bytecode}${defaultAbiCoder
      .encode(artifact.constructorArgs.types, artifact.constructorArgs.values)
      .slice(2)}`;
    const address = await deployViaFactory(
      initCode,
      artifact.salt,
      deployer,
      `${artifact.contractName}@${artifact.contractVersion}`
    );

    if (address !== artifact.address) {
      throw new Error(
        `${artifact.contractName}@${artifact.contractVersion} deployed to ${address}, expected ${artifact.address}`
      );
    }
  }
}
