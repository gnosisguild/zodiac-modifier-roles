import ethProvider from "eth-provider";
import { task } from "hardhat/config";
import { Web3Provider } from "@ethersproject/providers";
import { calculateDeployAddress, deployViaFactory } from "./EIP2470";

const SaltZero =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const frame = ethProvider("frame");

task(
  "deploy:adapters",
  "Deploys the MultiSendUnwrapper and AvatarIsOwnerOfERC721"
).setAction(async (_, hre) => {
  const chainId = hre.network.config.chainId;
  if (!chainId) throw new Error("chainId not set");
  frame.setChain(chainId);
  const provider = new Web3Provider(frame as any, chainId);
  const signer = await provider.getSigner();

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
    signer,
    "MultiSendUnwrapper",
    2_000_000
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
    signer,
    "AvatarIsOwnerOfERC721",
    1_000_000
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
