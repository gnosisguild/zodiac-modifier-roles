import { task, types } from "hardhat/config";
import { loadZodiacCore } from "./loadZodiacCore";

task(
  "verify:mastercopy",
  "Verifies all mastercopies from the artifacts file in the block explorer corresponding to the current network",
)
  .addOptionalParam(
    "contractVersion",
    "Specify a specific version",
    "latest", // Default value
    types.string,
  )
  .setAction(async ({ contractVersion }, hre) => {
    const { readMastercopies, verifyMastercopy } = await loadZodiacCore();
    const apiKey = hre.config.etherscan.apiKey as string;
    if (!apiKey) {
      throw new Error(
        "Missing etherscan api key for network " + hre.network.name,
      );
    }

    const chainId = Number((await hre.ethers.provider.getNetwork()).chainId);

    for (const artifact of readMastercopies({ contractVersion })) {
      const { noop } = await verifyMastercopy({
        chainId: chainId,
        apiKey,
        artifact,
      }).catch((e) => {
        console.error(
          `Error verifying ${artifact.contractName}@${artifact.contractVersion}: ${e}`,
        );
        throw e;
      });

      const { contractName, contractVersion, address } = artifact;

      if (noop) {
        console.log(
          `🔄 ${contractName}@${contractVersion}: Already verified at ${address}`,
        );
      } else {
        console.log(
          `🚀 ${contractName}@${contractVersion}: Successfully verified at ${address}`,
        );
      }
    }
  });
