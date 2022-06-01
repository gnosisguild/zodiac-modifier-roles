import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const FirstAddress = "0x0000000000000000000000000000000000000001";

const DAO_SAFE = "0x87eb5F76C3785936406fa93654F39b2087FD8068";
const METAMASK = "0x325b8aB1BD08FbA28332796e6e4e979Fc3776BA9";

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;
  const args = [METAMASK, DAO_SAFE, DAO_SAFE];

  const txCheck = await deploy("Permissions", {
    from: deployer,
    log: true,
  });

  await deploy("Roles", {
    from: deployer,
    args,
    log: true,
    // deterministicDeployment: true,
    libraries: {
      Permissions: txCheck.address,
    },
  });
};

deploy.tags = ["roles-modifier"];
export default deploy;
