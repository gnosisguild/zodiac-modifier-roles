import { defineConfig } from "tsdown"

export default defineConfig([
  {
    entry: {
      index: "./src/main/index.ts",
      kit: "./src/kit/index.ts",
      swaps: "./src/swaps/index.ts",
      annotations: "./src/annotations/index.ts",
      typechain: "./src/typechain.ts",
    },
    format: ["cjs", "esm"],
    outDir: "build",
    exports: true,
    sourcemap: true,
  },
])
