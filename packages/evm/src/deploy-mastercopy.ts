import hre from "hardhat";
import { deployMastercopyWithInitData } from "@gnosis.pm/zodiac";
import { concat, defaultAbiCoder, solidityPack } from "ethers/lib/utils";

const SaltZero =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const AddressZero = "0x0000000000000000000000000000000000000001";

async function run() {
  const [signer] = await hre.ethers.getSigners();
  const deployer = hre.ethers.provider.getSigner(signer.address);

  const Topology = await hre.ethers.getContractFactory("Topology");
  const topologyLibraryAddress = await deployMastercopyWithInitData(
    deployer,
    Topology.bytecode,
    SaltZero
  );

  const Integrity = await hre.ethers.getContractFactory("Integrity", {
    libraries: { Topology: topologyLibraryAddress },
  });
  const integrityLibraryAddress = await deployMastercopyWithInitData(
    deployer,
    Integrity.bytecode,
    SaltZero
  );

  const Roles = await hre.ethers.getContractFactory("Roles", {
    libraries: {
      Topology: topologyLibraryAddress,
      Integrity: integrityLibraryAddress,
    },
  });

  const args = defaultAbiCoder.encode(
    ["address", "address", "address"],
    [AddressZero, AddressZero, AddressZero]
  );

  await deployMastercopyWithInitData(
    deployer,
    `${Roles.bytecode}${args.substring(2)}`,
    SaltZero
  );
}

run();
