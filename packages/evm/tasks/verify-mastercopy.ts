import { task } from "hardhat/config";
import { ArgumentType } from "hardhat/types/arguments";
import { readMastercopies, verifyMastercopy } from "@gnosis-guild/zodiac-core";

export default task(
  "verify:mastercopy",
  "Verifies all mastercopies from the artifacts file in the block explorer corresponding to the current network",
)
  .addOption({
    name: "contractVersion",
    description: "Specify a specific version",
    type: ArgumentType.STRING,
    defaultValue: "latest",
  })
  .setInlineAction(async ({ contractVersion }, hre) => {
    const apiKey = await hre.config.verify.etherscan.apiKey.get();
    if (!apiKey) {
      throw new Error("Missing etherscan api key");
    }

    const connection = await hre.network.create();
    const network = await connection.ethers.provider.getNetwork();
    const chainId = Number(network.chainId);

    for (const artifact of readMastercopies({ contractVersion })) {
      const { noop } = await verifyMastercopy({
        chainId,
        apiKey,
        artifact,
      }).catch((e) => {
        console.error(
          `Error verifying ${artifact.contractName}@${artifact.contractVersion}: ${e}`,
        );
        throw e;
      });

      const { contractName, contractVersion: version, address } = artifact;

      if (noop) {
        console.log(
          `🔄 ${contractName}@${version}: Already verified at ${address}`,
        );
      } else {
        console.log(
          `🚀 ${contractName}@${version}: Successfully verified at ${address}`,
        );
      }
    }
  })
  .build();
