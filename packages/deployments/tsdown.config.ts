import { defineConfig } from "tsdown"

export default defineConfig([
  {
    entry: ["./src/index.ts"],
    format: ["cjs", "esm"],
    outDir: "build",
    exports: true,
    sourcemap: true,
  },
])
