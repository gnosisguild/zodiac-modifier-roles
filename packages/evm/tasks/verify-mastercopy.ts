import { task, types } from "hardhat/config";

import { readMastercopies, verifyMastercopy } from "@gnosis-guild/zodiac-core";

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
    const apiKey = hre.config.etherscan.apiKey as string;
    if (!apiKey) {
      throw new Error(
        `Missing etherscan api key for network ${hre.network.name}`
      );
    }

    const chainId = Number((await hre.ethers.provider.getNetwork()).chainId);

    for (const artifact of readMastercopies({ contractVersion })) {
      const { noop } = await verifyMastercopy({
        chainId,
        artifact,
        apiKey,
      });

      const { contractName, contractVersion, address } = artifact;

      if (noop) {
        console.log(
          `${contractName}@${contractVersion}: Already verified at ${address}`
        );
      } else {
        console.log(
          `${contractName}@${contractVersion}: Successfully verified at ${address}`
        );
      }
    }
  });
