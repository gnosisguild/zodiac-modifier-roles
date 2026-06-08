const { readFileSync, writeFileSync } = require("fs");
const { join } = require("path");

const file = join(
  __dirname,
  "..",
  "node_modules",
  "@gnosis.pm",
  "zodiac",
  "contracts",
  "signature",
  "SignatureChecker.sol"
);

const before = `    (, bytes memory returnData) = signer.staticcall(
      abi.encodeWithSelector(
        IERC1271.isValidSignature.selector,
        hash,
        signature
      )
    );

    return bytes4(returnData) == EIP1271_MAGIC_VALUE;`;

const after = `    (bool success, bytes memory returnData) = signer.staticcall(
      abi.encodeWithSelector(
        IERC1271.isValidSignature.selector,
        hash,
        signature
      )
    );

    return success && bytes4(returnData) == EIP1271_MAGIC_VALUE;`;

const source = readFileSync(file, "utf8");

if (source.includes(after)) {
  console.log("Zodiac SignatureChecker patch already applied.");
} else if (source.includes(before)) {
  writeFileSync(file, source.replace(before, after));
  console.log("Applied Zodiac SignatureChecker patch.");
} else {
  throw new Error(
    "Could not patch Zodiac SignatureChecker: expected source snippet was not found."
  );
}
