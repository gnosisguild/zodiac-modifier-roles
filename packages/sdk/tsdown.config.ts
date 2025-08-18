import { defineConfig } from "tsdown"

export default defineConfig([
  {
    entry: ["./src/main/index.ts"],
    format: ["cjs", "esm"],
    outDir: "build",
    exports: true,
    sourcemap: true,
  },
])
