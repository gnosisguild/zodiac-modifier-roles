import { deployAndSetUpCustomModule } from "@gnosis.pm/zodiac";
import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

interface TaskArgs {
  owner: string;
  avatar: string;
  target: string;
  nonce: number;
}

// TODO update this if we make any changes to the Roles contract
const MASTERCOPY_ADDRESS = "0x26DA7F5a385BA7c96456Ea6273d715ebF90feba8";
// TODO in the future we should deploy through the @gnosis.pm/zodiac module

task("deploy:proxy", "Deploys a Roles modifier proxy instance")
  .addParam("owner", "Address of the owner", undefined, types.string)
  .addParam(
    "avatar",
    "Address of the avatar (e.g. Safe)",
    undefined,
    types.string
  )
  .addParam("target", "Address of the target", undefined, types.string)
  .addParam(
    "nonce",
    "Use for deploying multiple proxies with the same setup params (does not need to be in sequence)",
    0,
    types.int,
    true
  )
  .setAction(
    async (
      { owner, avatar, target, nonce }: TaskArgs,
      hre: HardhatRuntimeEnvironment
    ) => {
      const [signer] = await hre.ethers.getSigners();
      const deployer = hre.ethers.provider.getSigner(signer.address);

      const { abi: rolesAbi } = await hre.artifacts.readArtifact("Roles");

      const { chainId } = await hre.ethers.provider.getNetwork();
      if (!chainId) throw new Error("No chainId found");
      console.log(`Deploying Roles proxy instance on chain #${chainId}...`);

      const { expectedModuleAddress, transaction } =
        await deployAndSetUpCustomModule(
          MASTERCOPY_ADDRESS,
          rolesAbi,
          {
            types: ["address", "address", "address"],
            values: [owner, avatar, target],
          },
          deployer.provider,
          chainId,
          nonce.toString()
        );

      if ((await deployer.provider.getCode(expectedModuleAddress)) !== "0x") {
        console.log(
          `A Roles instance with this configuration is already deployed at ${expectedModuleAddress}. If you want to deploy a new instance, use a different nonce.`
        );
      } else {
        const response = await signer.sendTransaction(transaction);
        console.log(
          `Roles proxy instance deployed to: ${expectedModuleAddress}, transaction hash: ${response.hash}`
        );
      }

      //   await hre.run("verify", {
      //     address: taskArgs.roles,
      //     constructorArgsParams: [
      //       taskArgs.owner,
      //       taskArgs.avatar,
      //       taskArgs.target,
      //     ],
      //   });
    }
  );

export {};
