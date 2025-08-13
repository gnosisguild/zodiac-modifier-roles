import { it, describe, expect } from "vitest"
import { allowCowOrderSigning } from "./allowCowOrderSigning"
import {
  processPermissions,
  targetIntegrity,
} from "../../build/esm/sdk/src/main"

const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" as const
const COW = "0xDEf1CA1fb7FBcDC777520aa7f396b4E015F497aB" as const

describe("allowCowOrderSigning", () => {
  it("should return valid permissions", () => {
    const permissions = allowCowOrderSigning({
      sell: [WETH],
      buy: [COW],
    })

    const { targets } = processPermissions(permissions)
    expect(() => targetIntegrity(targets)).not.toThrow()
  })
})
