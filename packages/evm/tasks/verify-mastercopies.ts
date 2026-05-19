import { task } from "hardhat/config";
import { loadZodiacCore } from "./loadZodiacCore";

const { ETHERSCAN_API_KEY } = process.env;

task(
  "verify:mastercopies",
  "Verifies all mastercopies from the artifacts file, in the block explorer corresponding to the current network",
).setAction(async (_, hre) => {
  const { readMastercopies, verifyMastercopy } = await loadZodiacCore();
  const chainId = Number((await hre.ethers.provider.getNetwork()).chainId);

  for (const artifact of readMastercopies()) {
    const { noop } = await verifyMastercopy({
      chainId,
      artifact,
      apiKey: ETHERSCAN_API_KEY as string,
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
