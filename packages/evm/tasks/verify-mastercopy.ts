import { task } from "hardhat/config";
import { verifyContract } from "@nomicfoundation/hardhat-verify/verify";

import {
  buildMastercopyDeployments,
  type MastercopyDeployment,
} from "./buildMastercopyDeployments.js";

export default task(
  "verify:mastercopy",
  "Verifies the current Roles release (primary mastercopy plus prerequisite singleton libraries and periphery contracts) without local metadata",
)
  .setInlineAction(async (_, hre) => {
    const connection = await hre.network.create();
    for (const deployment of await buildMastercopyDeployments(
      hre,
      connection,
    )) {
      await verifyOne(deployment, hre);
    }
  })
  .build();

async function verifyOne(
  deployment: MastercopyDeployment,
  hre: Parameters<typeof verifyContract>[1],
) {
  await verifyContract(
    {
      address: deployment.address,
      constructorArgs: deployment.constructorArgs.values,
      contract: deployment.contract,
      libraries: deployment.libraries,
      provider: "etherscan",
    },
    hre,
  );
}
