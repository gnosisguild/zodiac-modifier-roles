import { calculateDeployAddress, deployViaFactory } from "./EIP2470";
import { task } from "hardhat/config";

const SaltZero =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

task(
  "deploy:adapters",
  "Deploys the MultiSendUnwrapper and AvatarIsOwnerOfERC721"
).setAction(async (_, hre) => {
  const [signer] = await hre.ethers.getSigners();
  const deployer = hre.ethers.provider.getSigner(signer.address);

  const MultiSendUnwrapper = await hre.ethers.getContractFactory(
    "MultiSendUnwrapper"
  );
  const unwrapperAddress = calculateDeployAddress(
    MultiSendUnwrapper.bytecode,
    SaltZero
  );
  await deployViaFactory(
    MultiSendUnwrapper.bytecode,
    SaltZero,
    deployer,
    "MultiSendUnwrapper",
    2000000
  );

  const AvatarIsOwnerOfERC721 = await hre.ethers.getContractFactory(
    "AvatarIsOwnerOfERC721"
  );
  const avatarIsOwnerOfAddress = calculateDeployAddress(
    AvatarIsOwnerOfERC721.bytecode,
    SaltZero
  );
  await deployViaFactory(
    AvatarIsOwnerOfERC721.bytecode,
    SaltZero,
    deployer,
    "AvatarIsOwnerOfERC721",
    1000000
  );

  console.log("Waiting 1 minute before etherscan verification start...");
  // Etherscan needs some time to process before trying to verify.
  await new Promise((resolve) => setTimeout(resolve, 60000));

  await hre.run("verify", {
    address: unwrapperAddress,
  });

  await hre.run("verify", {
    address: avatarIsOwnerOfAddress,
  });
});
