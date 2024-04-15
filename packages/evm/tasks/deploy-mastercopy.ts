import { defaultAbiCoder } from "ethers/lib/utils";
import { task } from "hardhat/config";
import { deployViaFactory } from "./EIP2470";
import ethProvider from "eth-provider";
import { Web3Provider } from "@ethersproject/providers";

const ZeroHash =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const AddressOne = "0x0000000000000000000000000000000000000001";

const frame = ethProvider("frame");

task("deploy:mastercopy", "Deploys and verifies Roles mastercopy").setAction(
  async (_, hre) => {
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
      "Packer",
      2_000_000
    );

    const Integrity = await hre.ethers.getContractFactory("Integrity");
    const integrityLibraryAddress = await deployViaFactory(
      Integrity.bytecode,
      salt,
      signer,
      "Integrity",
      2_000_000
    );

    const Roles = await hre.ethers.getContractFactory("Roles", {
      libraries: {
        Integrity: integrityLibraryAddress,
        Packer: packerLibraryAddress,
      },
    });

    const args = defaultAbiCoder.encode(
      ["address", "address", "address"],
      [AddressOne, AddressOne, AddressOne]
    );

    const rolesAddress = await deployViaFactory(
      `${Roles.bytecode}${args.substring(2)}`,
      salt,
      signer,
      "Roles Mastercopy",
      6_000_000
    );

    if (hre.network.name == "hardhat") {
      return;
    }

    console.log("Waiting 1 minute before etherscan verification start...");
    // Etherscan needs some time to process before trying to verify.
    await new Promise((resolve) => setTimeout(resolve, 60000));

    await hre.run("verify:verify", {
      address: packerLibraryAddress,
      constructorArguments: [],
    });

    await hre.run("verify:verify", {
      address: integrityLibraryAddress,
      constructorArguments: [],
    });

    await hre.run("verify:verify", {
      address: rolesAddress,
      constructorArguments: [AddressOne, AddressOne, AddressOne],
    });
  }
);
