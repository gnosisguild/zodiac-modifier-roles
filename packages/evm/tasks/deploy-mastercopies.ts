import { task } from "hardhat/config";

import { deployAllMastercopies } from "@gnosis-guild/zodiac-core";
import { createEIP1193 } from "./createEIP1193";

task(
  "deploy:mastercopies",
  "For every version entry on the artifacts file, deploys a mastercopy into the current network"
).setAction(async (_, hre) => {
  const [signer] = await hre.ethers.getSigners();
  const provider = createEIP1193(hre.network.provider, signer);

  await deployAllMastercopies({
    provider,
  });
});
