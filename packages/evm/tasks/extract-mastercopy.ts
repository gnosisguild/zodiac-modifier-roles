import { task } from "hardhat/config";
import { ZeroHash } from "ethers";
import { writeMastercopyFromBuild } from "@gnosis-guild/zodiac-core";

import packageJson from "../package.json" with { type: "json" };

const AddressOne = "0x0000000000000000000000000000000000000001";

// Note: Hardhat 3 removed the `verify:etherscan-get-minimal-input` subtask.
// We now omit the optional `compilerInput`, which makes verification include
// the full source set reachable through graph traversal instead of the minimal
// set. If a tighter minimal input is required, compute it from the build-info
// JSON in `build/artifacts/build-info/`.
export default task(
  "extract:mastercopy",
  "Extracts and persists current mastercopy build artifacts",
)
  .setInlineAction(async () => {
    writeMastercopyFromBuild({
      contractVersion: packageJson.version,
      contractName: "AvatarIsOwnerOfERC721",
      constructorArgs: { types: [], values: [] },
      salt: ZeroHash,
    });
    writeMastercopyFromBuild({
      contractVersion: packageJson.version,
      contractName: "MultiSendUnwrapper",
      constructorArgs: { types: [], values: [] },
      salt: ZeroHash,
    });
    writeMastercopyFromBuild({
      contractVersion: packageJson.version,
      contractName: "ConditionStorer",
      constructorArgs: { types: [], values: [] },
      salt: ZeroHash,
    });
    writeMastercopyFromBuild({
      contractVersion: packageJson.version,
      contractName: "WithinRatioChecker",
      constructorArgs: { types: [], values: [] },
      salt: ZeroHash,
    });
    writeMastercopyFromBuild({
      contractVersion: packageJson.version,
      contractName: "Roles",
      constructorArgs: {
        types: ["address", "address", "address"],
        values: [AddressOne, AddressOne, AddressOne],
      },
      salt: ZeroHash,
    });
  })
  .build();
