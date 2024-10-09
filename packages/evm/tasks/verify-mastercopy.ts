import { task, types } from "hardhat/config";
import { readMastercopies, verifyMastercopy } from "@gnosis-guild/zodiac-core";

const { ETHERSCAN_API_KEY } = process.env;

task(
  "verify:mastercopy",
  "Verifies all mastercopies from the artifacts file in the block explorer corresponding to the current network"
)
  .addOptionalParam(
    "contractVersion",
    "Specify a specific version",
    "latest", // Default value
    types.string
  )
  .setAction(async ({ contractVersion }, hre) => {
    const apiKey = (hre.config.etherscan.apiKey as any)[hre.network.name] as
      | string
      | undefined;
    if (!apiKey) {
      throw new Error(
        "Missing etherscan api key for network " + hre.network.name
      );
    }

    const chainId = String((await hre.ethers.provider.getNetwork()).chainId);

    for (const artifact of readMastercopies({ contractVersion })) {
      const { noop } = await verifyMastercopy({
        artifact,
        apiUrlOrChainId: chainId,
        apiKey: apiKey,
      });

      const { contractName, contractVersion, address } = artifact;

      if (noop) {
        console.log(
          `🔄 ${contractName}@${contractVersion}: Already verified at ${address}`
        );
      } else {
        console.log(
          `🚀 ${contractName}@${contractVersion}: Successfully verified at ${address}`
        );
      }
    }
  });
