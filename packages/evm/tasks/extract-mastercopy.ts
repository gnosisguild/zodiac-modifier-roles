import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

import { writeMastercopyFromBuild } from "@gnosis-guild/zodiac-core";
import packageJson from "../package.json";

const AddressOne = "0x0000000000000000000000000000000000000001";
const ZeroHash =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const VerificationOutputSelection = {
  "*": {
    "*": [
      "evm.bytecode",
      "evm.deployedBytecode",
      "devdoc",
      "userdoc",
      "metadata",
      "abi",
    ],
  },
};

task(
  "extract:mastercopy",
  "Extracts and persists current mastercopy build artifacts"
).setAction(async (_, hre) => {
  const contractVersion = packageJson.version;

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
    const artifact = writeMastercopyFromBuild({
      contractVersion,
      contractName: input.contractName,
      compilerInput: await minimalCompilerInput(
        hre,
        input.sourceName,
        input.contractName
      ),
      constructorArgs: input.constructorArgs,
      salt: ZeroHash,
    });

    console.log(`${artifact.contractName}: ${artifact.address}`);
  }
});

async function minimalCompilerInput(
  hre: HardhatRuntimeEnvironment,
  sourceName: string,
  contractName: string
) {
  const buildInfo = await hre.artifacts.getBuildInfo(
    `${sourceName}:${contractName}`
  );

  if (!buildInfo) {
    throw new Error(`Build info not found for ${sourceName}:${contractName}`);
  }
  const info = buildInfo;

  const sourceNames = new Set<string>();

  function visit(sourceName: string) {
    if (sourceNames.has(sourceName)) {
      return;
    }

    sourceNames.add(sourceName);

    for (const node of info.output.sources[sourceName]?.ast?.nodes ?? []) {
      if (node.nodeType === "ImportDirective") {
        visit(node.absolutePath);
      }
    }
  }

  visit(sourceName);

  return {
    language: info.input.language,
    sources: Object.fromEntries(
      [...sourceNames].sort().map((name) => [name, info.input.sources[name]])
    ),
    settings: {
      evmVersion: info.input.settings.evmVersion,
      optimizer: info.input.settings.optimizer,
      outputSelection: VerificationOutputSelection,
      libraries: {},
    },
  };
}
