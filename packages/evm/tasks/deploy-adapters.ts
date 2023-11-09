import hre from "hardhat";
import { deployMastercopyWithInitData } from "@gnosis.pm/zodiac";
import { calculateDeployAddress } from "./EIP2470";

const SaltZero =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

async function run() {
  const [signer] = await hre.ethers.getSigners();
  const deployer = hre.ethers.provider.getSigner(signer.address);

  const MultiSendUnwrapper = await hre.ethers.getContractFactory(
    "MultiSendUnwrapper"
  );
  const unwrapperAddress = calculateDeployAddress(
    MultiSendUnwrapper.bytecode,
    SaltZero
  );
  await deployMastercopyWithInitData(
    deployer,
    MultiSendUnwrapper.bytecode,
    SaltZero
  );

  const AvatarIsOwnerOfERC721 = await hre.ethers.getContractFactory(
    "AvatarIsOwnerOfERC721"
  );
  const avatarIsOwnerOfAddress = calculateDeployAddress(
    AvatarIsOwnerOfERC721.bytecode,
    SaltZero
  );
  await deployMastercopyWithInitData(
    deployer,
    AvatarIsOwnerOfERC721.bytecode,
    SaltZero
  );

  await hre.run("verify", {
    address: unwrapperAddress,
  });

  await hre.run("verify", {
    address: avatarIsOwnerOfAddress,
  });
}

run();
