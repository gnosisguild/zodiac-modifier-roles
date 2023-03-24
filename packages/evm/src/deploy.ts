import { deployAndSetUpModule } from "@gnosis.pm/zodiac";
import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

interface RolesTaskArgs {
  owner: string;
  avatar: string;
  target: string;
}

task("deploy", "Deploys a Roles modifier")
  .addParam("owner", "Address of the owner", undefined, types.string)
  .addParam(
    "avatar",
    "Address of the avatar (e.g. Safe)",
    undefined,
    types.string
  )
  .addParam("target", "Address of the target", undefined, types.string)
  .setAction(
    async (taskArgs: RolesTaskArgs, hre: HardhatRuntimeEnvironment) => {
      const [signer] = await hre.ethers.getSigners();
      const deployer = hre.ethers.provider.getSigner(signer.address);

      const Topology = await hre.ethers.getContractFactory("Topology");
      const topology = await Topology.connect(deployer).deploy();
      await topology.deployed();
      console.log("Library Topology:", topology.address);

      const Integrity = await hre.ethers.getContractFactory("Integrity", {
        libraries: { Topology: topology.address },
      });
      const integrity = await Integrity.connect(deployer).deploy();
      await integrity.deployed();
      console.log("Library Integrity:", integrity.address);

      const Roles = await hre.ethers.getContractFactory("Roles", {
        libraries: {
          Topology: topology.address,
          Integrity: integrity.address,
        },
      });

      const roles = await Roles.deploy(
        taskArgs.owner,
        taskArgs.avatar,
        taskArgs.target
      );
      await roles.connect(deployer).deployed();
      console.log("Roles:", roles.address);
    }
  );

task("verifyEtherscan", "Verifies the contract on etherscan")
  .addParam("roles", "Address of the Roles mod", undefined, types.string)
  .addParam("owner", "Address of the owner", undefined, types.string)
  .addParam(
    "avatar",
    "Address of the avatar (e.g. Safe)",
    undefined,
    types.string
  )
  .addParam("target", "Address of the target", undefined, types.string)
  .setAction(async (taskArgs, hardhatRuntime) => {
    await hardhatRuntime.run("verify", {
      address: taskArgs.roles,
      constructorArgsParams: [taskArgs.owner, taskArgs.avatar, taskArgs.target],
    });
  });

export {};
