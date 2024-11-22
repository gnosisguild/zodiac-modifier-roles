import { task } from "hardhat/config";

import { writeMastercopyFromBuild } from "@gnosis-guild/zodiac-core";

import packageJson from "../package.json";
import { ZeroHash } from "ethers";

const AddressOne = "0x0000000000000000000000000000000000000001";

task(
  "extract:mastercopy",
  "Extracts and persists current mastercopy build artifacts"
).setAction(async (_, hre) => {
  writeMastercopyFromBuild({
    contractVersion: packageJson.version,
    contractName: "AvatarIsOwnerOfERC721",
    compilerInput: await hre.run("verify:etherscan-get-minimal-input", {
      sourceName: "contracts/adapters/AvatarIsOwnerOfERC721.sol",
    }),
    constructorArgs: {
      types: [],
      values: [],
    },
    salt: ZeroHash,
  });
  writeMastercopyFromBuild({
    contractVersion: packageJson.version,
    contractName: "MultiSendUnwrapper",
    compilerInput: await hre.run("verify:etherscan-get-minimal-input", {
      sourceName: "contracts/adapters/MultiSendUnwrapper.sol",
    }),
    constructorArgs: {
      types: [],
      values: [],
    },
    salt: ZeroHash,
  });
  writeMastercopyFromBuild({
    contractVersion: packageJson.version,
    contractName: "Packer",
    compilerInput: await hre.run("verify:etherscan-get-minimal-input", {
      sourceName: "contracts/packers/Packer.sol",
    }),
    constructorArgs: {
      types: [],
      values: [],
    },
    salt: "0x0000000000000000000000000000000000000000000000000000000000000000",
  });

  writeMastercopyFromBuild({
    contractVersion: packageJson.version,
    contractName: "Integrity",
    compilerInput: await hre.run("verify:etherscan-get-minimal-input", {
      sourceName: "contracts/Integrity.sol",
    }),
    constructorArgs: {
      types: [],
      values: [],
    },
    salt: "0x0000000000000000000000000000000000000000000000000000000000000000",
  });
  writeMastercopyFromBuild({
    contractVersion: packageJson.version,
    contractName: "Roles",
    compilerInput: await hre.run("verify:etherscan-get-minimal-input", {
      sourceName: "contracts/Roles.sol",
    }),
    constructorArgs: {
      types: ["address", "address", "address"],
      values: [AddressOne, AddressOne, AddressOne],
    },
    salt: "0x0000000000000000000000000000000000000000000000000000000000000000",
  });
});
