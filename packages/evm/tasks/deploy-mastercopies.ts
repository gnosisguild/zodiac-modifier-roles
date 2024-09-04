import { task } from "hardhat/config";

import { readMastercopies, deployMastercopy } from "@gnosis-guild/zodiac-core";
import { createEIP1193 } from "./createEIP1193";

task(
  "deploy:mastercopies",
  "For every version entry on the artifacts file, deploys a mastercopy into the current network"
).setAction(async (_, hre) => {
  const [signer] = await hre.ethers.getSigners();
  const provider = createEIP1193(hre.network.provider, signer);
  for (const mastercopy of readMastercopies()) {
    const {
      contractName,
      contractVersion,
      factory,
      bytecode,
      constructorArgs,
      salt,
    } = mastercopy;

    const { address, noop } = await deployMastercopy({
      factory,
      bytecode,
      constructorArgs,
      salt,
      provider,
      onStart: () => {
        console.log(
          `⏳ ${contractName}@${contractVersion}: Deployment starting...`
        );
      },
    });
    if (noop) {
      console.log(
        `🔄 ${contractName}@${contractVersion}: Already deployed at ${address}`
      );
    } else {
      console.log(
        `🚀 ${contractName}@${contractVersion}: Successfully deployed at ${address}`
      );
    }
  }
});
