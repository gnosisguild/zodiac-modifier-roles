import { task, types } from "hardhat/config";

import { createEIP1193 } from "./createEIP1193";
import { loadZodiacCore } from "./loadZodiacCore";

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
    const { deployFactories, deployMastercopy, readMastercopies } =
      await loadZodiacCore();
    const [signer] = await hre.ethers.getSigners();
    const provider = createEIP1193(
      hre.network.config.chainId,
      hre.network.provider,
      signer
    );

    await deployFactories({ provider });

    for (const mastercopy of readMastercopies({ contractVersion })) {
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
