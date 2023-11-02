import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { deployViaFactory } from "./EIP2470";

interface RolesTaskArgs {
  owner: string;
  avatar: string;
  target: string;
}

const ZeroHash =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

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

      const salt = ZeroHash;

      const Packer = await hre.ethers.getContractFactory("Packer");
      const packerLibraryAddress = await deployViaFactory(
        Packer.bytecode,
        salt,
        deployer,
        "Packer          "
      );

      const Integrity = await hre.ethers.getContractFactory("Integrity");
      const integrityLibraryAddress = await deployViaFactory(
        Integrity.bytecode,
        salt,
        deployer,
        "Integrity       "
      );

      const Roles = await hre.ethers.getContractFactory("Roles", {
        libraries: {
          Integrity: integrityLibraryAddress,
          Packer: packerLibraryAddress,
        },
      });

      const roles = await Roles.deploy(
        taskArgs.owner,
        taskArgs.avatar,
        taskArgs.target
      );
      await roles.connect(deployer).deployed();
      console.log(`\x1B[32m✔ Roles deployed to: ${roles.address} 🎉\x1B[0m `);

      console.log("Waiting 1 minute before etherscan verification start...");
      // Etherscan needs some time to process before trying to verify.
      await new Promise((resolve) => setTimeout(resolve, 60000));

      await hre.run("verify", {
        address: roles.address,
        constructorArguments: [
          taskArgs.owner,
          taskArgs.avatar,
          taskArgs.target,
        ],
      });
    }
  );

export {};
