import path from "path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    alias: {
      "zodiac-roles-sdk": path.resolve(path.join(__dirname, "src", "main")),
    },
  },
})
