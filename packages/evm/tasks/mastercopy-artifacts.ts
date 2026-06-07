import { existsSync, readFileSync, writeFileSync } from "fs";

import {
  defaultAbiCoder,
  getCreate2Address,
  keccak256,
} from "ethers/lib/utils";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

export const FactoryAddress = "0xce0042b868300000d44a59004da54a005ffdcf9f";
export const ZeroHash =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

export type ConstructorArgs = {
  types: string[];
  values: unknown[];
};

export type MastercopyArtifact = {
  contractName: string;
  sourceName: string;
  contractVersion: string;
  compilerVersion: string;
  factory: string;
  address: string;
  bytecode: string;
  constructorArgs: ConstructorArgs;
  salt: string;
  abi: unknown[];
  compilerInput: unknown;
};

export type Mastercopies = Record<string, Record<string, MastercopyArtifact>>;

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

export async function buildMastercopyArtifact({
  hre,
  contractVersion,
  contractName,
  sourceName,
  constructorArgs,
  libraries = {},
  mastercopies = {},
  salt = ZeroHash,
  factory = FactoryAddress,
}: {
  hre: HardhatRuntimeEnvironment;
  contractVersion: string;
  contractName: string;
  sourceName: string;
  constructorArgs: ConstructorArgs;
  libraries?: Record<string, string>;
  mastercopies?: Mastercopies;
  salt?: string;
  factory?: string;
}) {
  const fqn = `${sourceName}:${contractName}`;
  const artifact = await hre.artifacts.readArtifact(fqn);
  const buildInfo = await hre.artifacts.getBuildInfo(fqn);

  if (!buildInfo) {
    throw new Error(`Build info not found for ${fqn}`);
  }

  const bytecode = linkBytecode(artifact.bytecode, artifact.linkReferences, {
    ...linkedLibraryAddresses(contractVersion, mastercopies),
    ...libraries,
  });
  const initCode = `${bytecode}${defaultAbiCoder
    .encode(constructorArgs.types, constructorArgs.values)
    .slice(2)}`;

  return {
    contractName,
    sourceName,
    contractVersion,
    compilerVersion: `v${buildInfo.solcLongVersion}`,
    factory,
    address: getCreate2Address(factory, salt, keccak256(initCode)),
    bytecode,
    constructorArgs,
    salt,
    abi: artifact.abi,
    compilerInput: minimalCompilerInput(buildInfo, sourceName),
  };
}

export function readMastercopies(file = "mastercopies.json") {
  if (!existsSync(file)) {
    return {};
  }

  return JSON.parse(readFileSync(file, "utf8")) as Mastercopies;
}

export function writeMastercopies(
  mastercopies: Mastercopies,
  file = "mastercopies.json"
) {
  writeFileSync(file, `${JSON.stringify(mastercopies, null, 2)}\n`, "utf8");
}

export function upsertMastercopy(
  mastercopies: Mastercopies,
  artifact: MastercopyArtifact
) {
  return {
    ...mastercopies,
    [artifact.contractName]: {
      ...(mastercopies[artifact.contractName] || {}),
      [artifact.contractVersion]: artifact,
    },
  };
}

export function getArtifacts({
  contractName,
  contractVersion,
}: {
  contractName?: string;
  contractVersion?: string;
} = {}) {
  const mastercopies = readMastercopies();
  const artifacts: MastercopyArtifact[] = [];

  for (const [name, versions] of Object.entries(mastercopies)) {
    if (contractName && name !== contractName) {
      continue;
    }

    const version =
      contractVersion === "latest" || contractVersion === undefined
        ? latestVersion(versions)
        : contractVersion;

    if (version && versions[version]) {
      artifacts.push(versions[version]);
    }
  }

  return artifacts;
}

function latestVersion(versions: Record<string, MastercopyArtifact>) {
  const sortedVersions = Object.keys(versions).sort(compareVersions);
  return sortedVersions[sortedVersions.length - 1];
}

function minimalCompilerInput(buildInfo: any, rootSourceName: string) {
  const sourceNames = new Set<string>();

  function visit(sourceName: string) {
    if (sourceNames.has(sourceName)) {
      return;
    }

    sourceNames.add(sourceName);

    for (const node of buildInfo.output.sources[sourceName]?.ast?.nodes ?? []) {
      if (node.nodeType === "ImportDirective") {
        visit(node.absolutePath);
      }
    }
  }

  visit(rootSourceName);

  return {
    language: buildInfo.input.language,
    sources: Object.fromEntries(
      [...sourceNames]
        .sort()
        .map((name) => [name, buildInfo.input.sources[name]])
    ),
    settings: {
      evmVersion: buildInfo.input.settings.evmVersion,
      optimizer: buildInfo.input.settings.optimizer,
      outputSelection: VerificationOutputSelection,
      libraries: {},
    },
  };
}

function linkBytecode(
  bytecode: string,
  linkReferences: Record<
    string,
    Record<string, { start: number; length: number }[]>
  >,
  libraries: Record<string, string>
) {
  let linked = bytecode;

  for (const sourceReferences of Object.values(linkReferences)) {
    for (const [libraryName, references] of Object.entries(sourceReferences)) {
      const libraryAddress = libraries[libraryName];
      if (!libraryAddress) {
        throw new Error(`Missing address for library ${libraryName}`);
      }

      for (const { start, length } of references) {
        const left = 2 + start * 2;
        const right = left + length * 2;
        linked = `${linked.slice(0, left)}${libraryAddress
          .slice(2)
          .toLowerCase()}${linked.slice(right)}`;
      }
    }
  }

  return linked;
}

function linkedLibraryAddresses(
  contractVersion: string,
  mastercopies: Mastercopies
) {
  return Object.fromEntries(
    Object.entries(mastercopies)
      .map(([name, versions]) => [name, versions[contractVersion]?.address])
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
  );
}

function compareVersions(a: string, b: string) {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);

  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const diff = (left[i] || 0) - (right[i] || 0);
    if (diff !== 0) {
      return diff;
    }
  }

  return 0;
}
