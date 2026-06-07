import { task } from "hardhat/config";

import { verifyMastercopyArtifacts } from "./verify-mastercopy";
import { getArtifacts } from "./mastercopy-artifacts";

task(
  "verify:mastercopies",
  "Verifies all mastercopies from the artifacts file in the block explorer corresponding to the current network"
).setAction(async (_, hre) => {
  await verifyMastercopyArtifacts(getArtifacts(), hre);
});
