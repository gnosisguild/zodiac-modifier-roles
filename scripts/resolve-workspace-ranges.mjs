/**
 * Replaces `workspace:` ranges in a package manifest with the version the
 * sibling workspace currently has.
 *
 * `yarn npm publish` did this substitution on the way out. `npm publish` does
 * not, and a published `workspace:*` is a range no consumer can resolve, so
 * the release workflow runs this over the package it is about to publish.
 *
 * Usage: node scripts/resolve-workspace-ranges.mjs packages/sdk
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

const packageDir = process.argv[2];

if (!packageDir) {
  throw new Error("Usage: resolve-workspace-ranges.mjs <package-dir>");
}

const versions = workspaceVersions();
const manifestPath = join(packageDir, "package.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

const resolved = [];

for (const field of DEPENDENCY_FIELDS) {
  for (const [name, range] of Object.entries(manifest[field] ?? {})) {
    if (!String(range).startsWith("workspace:")) continue;

    const version = versions.get(name);

    if (version == null) {
      throw new Error(
        `${name} is declared as "${range}" but no workspace package provides it`,
      );
    }

    manifest[field][name] = version;
    resolved.push(`${field}.${name}: ${range} -> ${version}`);
  }
}

if (resolved.length === 0) {
  console.log(`No workspace ranges in ${manifestPath}`);
} else {
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Resolved in ${manifestPath}:\n  ${resolved.join("\n  ")}`);
}

function workspaceVersions() {
  const entries = readdirSync("packages", { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      try {
        const { name, version } = JSON.parse(
          readFileSync(join("packages", entry.name, "package.json"), "utf8"),
        );
        return name && version ? [[name, version]] : [];
      } catch {
        // A directory without a readable manifest is not a workspace.
        return [];
      }
    });

  return new Map(entries);
}
