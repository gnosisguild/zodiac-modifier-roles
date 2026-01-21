import { it, describe, expect } from "vitest"
import { allowCowOrderSigning } from "./allowCowOrderSigning"
import { processPermissions, targetIntegrity } from "zodiac-roles-sdk"
import { SupportedChainId } from "./types"

const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" as const
const COW = "0xDEf1CA1fb7FBcDC777520aa7f396b4E015F497aB" as const

describe("allowCowOrderSigning", () => {
  it("should return valid permissions", () => {
    const permissions = allowCowOrderSigning({
      chainId: SupportedChainId.MAINNET,
      sell: [WETH],
      buy: [COW],
    })

    const { targets } = processPermissions(permissions)
    expect(() => targetIntegrity(targets)).not.toThrow()
  })

  it("should add WETH deposit permission when selling native token", () => {
    const permissions = allowCowOrderSigning({
      chainId: SupportedChainId.MAINNET,
      sell: ["native"],
      buy: [COW],
    })

    const depositPermission = permissions.find(
      (p) =>
        p.targetAddress === WETH &&
        p.signature === "deposit()" &&
        p.send === true
    )
    expect(depositPermission).toBeDefined()

    const { targets } = processPermissions(permissions)
    expect(() => targetIntegrity(targets)).not.toThrow()
  })

  it("should add WETH withdraw permission when buying native token", () => {
    const permissions = allowCowOrderSigning({
      chainId: SupportedChainId.MAINNET,
      sell: [COW],
      buy: ["native"],
    })

    const withdrawPermission = permissions.find(
      (p) =>
        p.targetAddress === WETH && p.signature === "withdraw(uint256)"
    )
    expect(withdrawPermission).toBeDefined()

    const { targets } = processPermissions(permissions)
    expect(() => targetIntegrity(targets)).not.toThrow()
  })

  it("should add both deposit and withdraw permissions when native is in both sell and buy", () => {
    const permissions = allowCowOrderSigning({
      chainId: SupportedChainId.MAINNET,
      sell: ["native"],
      buy: ["native"],
    })

    const depositPermission = permissions.find(
      (p) =>
        p.targetAddress === WETH &&
        p.signature === "deposit()" &&
        p.send === true
    )
    const withdrawPermission = permissions.find(
      (p) =>
        p.targetAddress === WETH && p.signature === "withdraw(uint256)"
    )
    expect(depositPermission).toBeDefined()
    expect(withdrawPermission).toBeDefined()

    const { targets } = processPermissions(permissions)
    expect(() => targetIntegrity(targets)).not.toThrow()
  })

  it("should work with different chains", () => {
    const permissions = allowCowOrderSigning({
      chainId: SupportedChainId.GNOSIS_CHAIN,
      sell: ["native"],
      buy: [COW],
    })

    const WXDAI = "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d" as const
    const depositPermission = permissions.find(
      (p) =>
        p.targetAddress.toLowerCase() === WXDAI.toLowerCase() &&
        p.signature === "deposit()" &&
        p.send === true
    )
    expect(depositPermission).toBeDefined()

    const { targets } = processPermissions(permissions)
    expect(() => targetIntegrity(targets)).not.toThrow()
  })
})
