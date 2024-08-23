import { task, types } from "hardhat/config";

import {
  EIP1193Provider,
  deployMastercopy,
  readMastercopy,
} from "@gnosis-guild/zodiac-core";
import { createEIP1193 } from "./createEIP1193";

task(
  "deploy:mastercopy",
  "For every version entry on the artifacts file, deploys a mastercopy into the current network"
)
  .addOptionalParam(
    "contractVersion",
    "The specific version of the contract to deploy",
    "latest", // Default value
    types.string
  )
  .setAction(async ({ contractVersion }, hre) => {
    const [signer] = await hre.ethers.getSigners();
    const provider = createEIP1193(hre.network.provider, signer);

    // Deploy the contracts based on the provided version
    await deployLatestMastercopyFromDisk(provider, contractVersion);
  });

async function deployLatestMastercopyFromDisk(
  provider: EIP1193Provider,
  version?: string
) {
  const CONTRACTS = ["Packer", "Integrity", "Roles"];

  for (const contract of CONTRACTS) {
    try {
      // Read the artifact for the specific contract and version
      const artifact = readMastercopy({
        contractName: contract,
        contractVersion: version === "latest" ? undefined : version,
      });

      const { address, noop } = await deployMastercopy({
        ...artifact,
        provider,
      });

      if (noop) {
        console.log(
          `🔄 ${artifact.contractName}@${artifact.contractVersion}: Already deployed at ${address}`
        );
      } else {
        console.log(
          `🚀 ${artifact.contractName}@${artifact.contractVersion}: Successfully deployed at ${address}`
        );
      }
    } catch (error) {
      console.error(
        `⏭️ Skipping deployment of ${contract}@${version}: Version not found.`
      );
      // Skip the current contract if there's an error and continue with the next one
      continue;
    }
  }
}
