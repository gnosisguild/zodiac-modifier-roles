import { ethers } from "hardhat";

export async function deploySignTypedMessageLib() {
  const SignTypedMessageLib = await ethers.getContractFactory(
    "SignTypedMessageLib",
  );
  return SignTypedMessageLib.deploy();
}
