import { task, types } from "hardhat/config";

import {
  deployFactories,
  deployMastercopy,
  readMastercopies,
} from "@gnosis-guild/zodiac-core";
import { createEIP1193 } from "./createEIP1193";

task(
  "deploy:mastercopy",
  "Deploys mastercopies from the artifacts file into the current network"
)
  .addOptionalParam(
    "contractVersion",
    "The specific version of the contracts to deploy",
    "latest",
    types.string
  )
  .setAction(async ({ contractVersion }, hre) => {
    const [signer] = await hre.ethers.getSigners();
    const provider = createEIP1193(hre.network.provider, signer);

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
            `${contractName}@${contractVersion}: Deployment starting...`
          );
        },
      });

      if (noop) {
        console.log(
          `${contractName}@${contractVersion}: Already deployed at ${address}`
        );
      } else {
        console.log(
          `${contractName}@${contractVersion}: Successfully deployed at ${address}`
        );
      }
    }
  });
