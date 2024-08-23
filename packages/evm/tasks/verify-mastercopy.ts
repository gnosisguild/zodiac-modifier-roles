import { task, types } from "hardhat/config";
import {
  readMastercopy,
  verifyAllMastercopies,
} from "@gnosis-guild/zodiac-core";
import path from "path";
import fs from "fs";
import { cwd } from "process";

const { ETHERSCAN_API_KEY } = process.env;

/**
 * Simulates the SDK's `defaultMastercopyArtifactsFile`, pointing to the mastercopies.json file.
 *
 * @returns {string} The absolute path to the mastercopy artifacts file.
 */
function getMastercopyArtifactsFile(): string {
  return path.join(cwd(), "temp-mastercopies.json");
}

task(
  "verify:mastercopy",
  "Verifies all mastercopies from the artifacts file in the block explorer corresponding to the current network"
)
  .addOptionalParam(
    "contractVersion",
    "The specific version of the contract to deploy",
    "latest", // Default value
    types.string
  )
  .setAction(async ({ contractVersion }, hre) => {
    if (!ETHERSCAN_API_KEY) {
      throw new Error("Missing ENV ETHERSCAN_API_KEY");
    }

    const chainId = String((await hre.ethers.provider.getNetwork()).chainId);
    await verifyLatestMastercopyFromDisk(chainId, contractVersion);
  });

/**
 * Verifies the latest mastercopy from disk, handling multiple contracts and versions.
 *
 * @param {string} chainId - The chain ID of the network.
 * @param {string} [version] - The specific version of the contract to verify.
 */
async function verifyLatestMastercopyFromDisk(
  chainId: string,
  version?: string
) {
  const CONTRACTS = ["Packer", "Integrity", "Roles"];

  const verifyDir = path.dirname(getMastercopyArtifactsFile());

  // Ensure the directory exists
  if (!fs.existsSync(verifyDir)) {
    fs.mkdirSync(verifyDir, { recursive: true });
  }

  // Define the mastercopyObject with the appropriate type
  const mastercopyObject: { [key: string]: { [version: string]: any } } = {};

  for (const contract of CONTRACTS) {
    try {
      // Read the artifact for the specific contract and version
      const latestArtifact = readMastercopy({
        contractName: contract,
        contractVersion: version === "latest" ? undefined : version,
      });

      if (!latestArtifact) {
        console.error(
          `⏭️ Skipping verify of ${contract}@${version}: Artifact not found.`
        );
        continue;
      }

      // Add the contract to the expected structure
      mastercopyObject[contract] = {
        [latestArtifact.contractVersion]: latestArtifact,
      };
    } catch (error) {
      console.error(
        `⏭️ Skipping deployment of ${contract}@${version}: Version not found.`
      );
      continue;
    }
  }

  const tempFilePath = getMastercopyArtifactsFile();
  fs.writeFileSync(tempFilePath, JSON.stringify(mastercopyObject, null, 2));

  await verifyAllMastercopies({
    apiUrlOrChainId: chainId,
    apiKey: ETHERSCAN_API_KEY as string,
    mastercopyArtifactsFile: tempFilePath,
  });

  fs.unlinkSync(tempFilePath);
}
