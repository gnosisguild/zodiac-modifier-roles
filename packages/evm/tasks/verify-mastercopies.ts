import { task } from "hardhat/config";
import { readMastercopies, verifyMastercopy } from "@gnosis-guild/zodiac-core";

const { ETHERSCAN_API_KEY } = process.env;

task(
  "verify:mastercopies",
  "Verifies all mastercopies from the artifacts file, in the block explorer corresponding to the current network",
).setAction(async (_, hre) => {
  const apiKey = (hre.config.etherscan.apiKey as any)[hre.network.name] as
    | string
    | undefined;
  if (!apiKey) {
    throw new Error(
      "Missing etherscan api key for network " + hre.network.name,
    );
  }

  const chainId = Number((await hre.ethers.provider.getNetwork()).chainId);

  for (const artifact of readMastercopies()) {
    const { noop } = await verifyMastercopy({
      chainId: chainId,
      apiKey,
      artifact,
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
