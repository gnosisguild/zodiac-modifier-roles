import { task } from "hardhat/config";
import { readMastercopies, verifyMastercopy } from "@gnosis-guild/zodiac-core";

const { ETHERSCAN_API_KEY } = process.env;

task(
  "verify:mastercopies",
  "Verifies all mastercopies from the artifacts file, in the block explorer corresponding to the current network"
).setAction(async (_, hre) => {
  if (!ETHERSCAN_API_KEY) {
    throw new Error("Missing ENV ETHERSCAN_API_KEY");
  }

  const chainId = String((await hre.ethers.provider.getNetwork()).chainId);

  for (const artifact of readMastercopies()) {
    const { noop } = await verifyMastercopy({
      artifact,
      apiUrlOrChainId: chainId,
      apiKey: ETHERSCAN_API_KEY,
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
