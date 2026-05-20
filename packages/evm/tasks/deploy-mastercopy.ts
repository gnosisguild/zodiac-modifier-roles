import { task } from "hardhat/config";
import { ArgumentType } from "hardhat/types/arguments";
import {
  deployFactories,
  deployMastercopy,
  readMastercopies,
} from "@gnosis-guild/zodiac-core";

import { createEIP1193 } from "./createEIP1193.js";

export default task(
  "deploy:mastercopy",
  "For every version entry on the artifacts file, deploys a mastercopy into the current network",
)
  .addOption({
    name: "contractVersion",
    description: "The specific version of the contract to deploy",
    type: ArgumentType.STRING,
    defaultValue: "latest",
  })
  .setInlineAction(async ({ contractVersion }, hre) => {
    const connection = await hre.network.create();
    const [signer] = await connection.ethers.getSigners();
    const provider = createEIP1193(
      connection.networkConfig.chainId,
      connection.provider,
      signer,
    );

    await deployFactories({ provider });

    for (const mastercopy of readMastercopies({ contractVersion })) {
      const {
        contractName,
        contractVersion: version,
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
          console.log(`⏳ ${contractName}@${version}: Deployment starting...`);
        },
      });
      if (noop) {
        console.log(
          `🔄 ${contractName}@${version}: Already deployed at ${address}`,
        );
      } else {
        console.log(
          `🚀 ${contractName}@${version}: Successfully deployed at ${address}`,
        );
      }
    }
  })
  .build();
