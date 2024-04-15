import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import ethProvider from "eth-provider";
import { deployViaFactory } from "./EIP2470";
import { Web3Provider } from "@ethersproject/providers";

const frame = ethProvider("frame");

interface RolesTaskArgs {
  owner: string;
  avatar: string;
  target: string;
}

const ZeroHash =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

task("deploy:standalone", "Deploys a Roles modifier")
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
      const chainId = hre.network.config.chainId;
      if (!chainId) throw new Error("chainId not set");
      frame.setChain(chainId);
      const provider = new Web3Provider(frame as any, chainId);
      const signer = await provider.getSigner();

      const salt = ZeroHash;

      const Packer = await hre.ethers.getContractFactory("Packer");
      const packerLibraryAddress = await deployViaFactory(
        Packer.bytecode,
        salt,
        signer,
        "Packer"
      );

      const Integrity = await hre.ethers.getContractFactory("Integrity");
      const integrityLibraryAddress = await deployViaFactory(
        Integrity.bytecode,
        salt,
        signer,
        "Integrity"
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
      await roles.connect(signer).deployed();
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

task("verify:standalone", "Verifies the contract on etherscan")
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
