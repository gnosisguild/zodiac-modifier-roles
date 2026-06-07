import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

import { getArtifacts, MastercopyArtifact } from "./mastercopy-artifacts";

task(
  "verify:mastercopy",
  "Verifies mastercopies from the artifacts file in the block explorer corresponding to the current network"
)
  .addOptionalParam(
    "contractVersion",
    "The specific version of the contracts to verify",
    "latest",
    types.string
  )
  .setAction(async ({ contractVersion }, hre) => {
    await verifyMastercopyArtifacts(getArtifacts({ contractVersion }), hre);
  });

export async function verifyMastercopyArtifacts(
  artifacts: MastercopyArtifact[],
  hre: HardhatRuntimeEnvironment
) {
  for (const artifact of artifacts) {
    await hre.run("verify:verify", {
      address: artifact.address,
      constructorArguments: artifact.constructorArgs.values,
      contract: `${artifact.sourceName}:${artifact.contractName}`,
      libraries: getLibraries(artifact),
    });
  }
}

function getLibraries(artifact: MastercopyArtifact) {
  if (artifact.contractName !== "Roles") {
    return {};
  }

  return {
    Integrity: getArtifacts({
      contractName: "Integrity",
      contractVersion: artifact.contractVersion,
    })[0].address,
    Packer: getArtifacts({
      contractName: "Packer",
      contractVersion: artifact.contractVersion,
    })[0].address,
  };
}
