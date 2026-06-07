import { task } from "hardhat/config";

import { deployMastercopyArtifacts } from "./deploy-mastercopy";
import { getArtifacts } from "./mastercopy-artifacts";

task(
  "deploy:mastercopies",
  "Deploys all mastercopies from the artifacts file into the current network"
).setAction(async (_, hre) => {
  await deployMastercopyArtifacts(getArtifacts(), hre);
});
