import hre from "hardhat";
import { deployMastercopyWithInitData } from "@gnosis.pm/zodiac";
import { defaultAbiCoder } from "ethers/lib/utils";

const SaltZero =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const AddressZero = "0x0000000000000000000000000000000000000001";

async function run() {
  const [signer] = await hre.ethers.getSigners();
  const deployer = hre.ethers.provider.getSigner(signer.address);

  const Packer = await hre.ethers.getContractFactory("Packer");
  const packerLibraryAddress = await deployMastercopyWithInitData(
    deployer,
    Packer.bytecode,
    SaltZero
  );

  const Integrity = await hre.ethers.getContractFactory("Integrity");
  const integrityLibraryAddress = await deployMastercopyWithInitData(
    deployer,
    Integrity.bytecode,
    SaltZero
  );

  const Roles = await hre.ethers.getContractFactory("Roles", {
    libraries: {
      Integrity: integrityLibraryAddress,
      Packer: packerLibraryAddress,
    },
  });

  const args = defaultAbiCoder.encode(
    ["address", "address", "address"],
    [AddressZero, AddressZero, AddressZero]
  );

  const rolesMastercopyAddress = await deployMastercopyWithInitData(
    deployer,
    `${Roles.bytecode}${args.substring(2)}`,
    SaltZero
  );

  await hre.run("verify", {
    address: packerLibraryAddress,
  });

  await hre.run("verify", {
    address: integrityLibraryAddress,
  });

  await hre.run("verify", {
    address: rolesMastercopyAddress,
    constructorArgsParams: [AddressZero, AddressZero, AddressZero],
  });
}

run();
