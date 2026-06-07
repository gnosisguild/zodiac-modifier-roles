import { task } from "hardhat/config";

import packageJson from "../package.json";
import {
  buildMastercopyArtifact,
  Mastercopies,
  upsertMastercopy,
  writeMastercopies,
  ZeroHash,
} from "./mastercopy-artifacts";

const AddressOne = "0x0000000000000000000000000000000000000001";

task(
  "extract:mastercopy",
  "Extracts and persists current mastercopy build artifacts"
).setAction(async (_, hre) => {
  const contractVersion = packageJson.version;
  let mastercopies: Mastercopies = {};

  const artifactInputs = [
    {
      contractName: "AvatarIsOwnerOfERC721",
      sourceName: "contracts/adapters/AvatarIsOwnerOfERC721.sol",
      constructorArgs: { types: [], values: [] },
    },
    {
      contractName: "Integrity",
      sourceName: "contracts/Integrity.sol",
      constructorArgs: { types: [], values: [] },
    },
    {
      contractName: "Packer",
      sourceName: "contracts/packers/Packer.sol",
      constructorArgs: { types: [], values: [] },
    },
    {
      contractName: "Roles",
      sourceName: "contracts/Roles.sol",
      constructorArgs: {
        types: ["address", "address", "address"],
        values: [AddressOne, AddressOne, AddressOne],
      },
    },
    {
      contractName: "MultiSendUnwrapper",
      sourceName: "contracts/adapters/MultiSendUnwrapper.sol",
      constructorArgs: { types: [], values: [] },
    },
  ];

  for (const input of artifactInputs) {
    const artifact = await buildMastercopyArtifact({
      hre,
      contractVersion,
      salt: ZeroHash,
      mastercopies,
      ...input,
    });
    mastercopies = upsertMastercopy(mastercopies, artifact);

    console.log(`${artifact.contractName}: ${artifact.address}`);
  }

  writeMastercopies(mastercopies);
});
