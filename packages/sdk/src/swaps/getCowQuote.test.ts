import { it, describe, expect, vi, beforeEach } from "vitest"
import { getCowQuote } from "./getCowQuote"
import { SupportedChainId } from "./types"

// Mock the fetchLicense function from the swaps appData module
vi.mock("../main/licensing", () => ({
  fetchLicense: vi.fn(),
  License: {
    None: 0,
    Free: 1,
    Enterprise: 2,
  },
}))

// Import the License enum from the actual module for type safety
import { License } from "../main/licensing"
import { fetchLicense } from "../main/licensing"
import { encodeKey } from "../main/keys"
const mockFetchLicense = vi.mocked(fetchLicense)

// Token addresses on mainnet
const WETH_ADDRESS =
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" as `0x${string}`
const COW_ADDRESS =
  "0xDEf1CA1fb7FBcDC777520aa7f396b4E015F497aB" as `0x${string}`

// RolesMod address from the user request
const ROLES_MOD_ADDRESS =
  "0x27d8bb2e33Bc38A9CE93fdD90C80677b8436aFfb" as `0x${string}`

// 1 ETH in wei
const ONE_ETH_WEI = 1000000000000000000n

describe("getCowQuote", () => {
  beforeEach(() => {
    // Reset the mock before each test
    mockFetchLicense.mockReset()
  })

  it(
    "should use 25 basis points partner fee for License.None",
    { timeout: 10000 },
    async () => {
      // Set up mock to return License.None
      mockFetchLicense.mockResolvedValue(License.None)

      // Calculate a valid timestamp (30 minutes from now)
      const validTo = Math.floor(Date.now() / 1000) + 30 * 60

      // Call getCowQuote
      const quote = await getCowQuote({
        kind: "sell",
        sellToken: WETH_ADDRESS,
        buyToken: COW_ADDRESS,
        sellAmountBeforeFee: ONE_ETH_WEI,
        validTo,
        chainId: SupportedChainId.MAINNET,
        rolesModifier: ROLES_MOD_ADDRESS,
        roleKey: encodeKey("test-role"),
      })

      // Verify the quote was successful
      expect(quote).toBeDefined()
      expect(quote.sellToken.toLowerCase()).toBe(WETH_ADDRESS.toLowerCase())
      expect(quote.buyToken.toLowerCase()).toBe(COW_ADDRESS.toLowerCase())

      // Parse appData to verify partner fee
      const appData = JSON.parse(quote.appData)
      expect(appData.metadata.partnerFee.bps).toBe(25)
    }
  )

  it(
    "should use 0 basis points partner fee for License.Enterprise",
    { timeout: 10000 },
    async () => {
      // Set up mock to return License.Enterprise
      mockFetchLicense.mockResolvedValue(License.Enterprise)

      // Calculate a valid timestamp (30 minutes from now)
      const validTo = Math.floor(Date.now() / 1000) + 30 * 60

      // Call getCowQuote
      const quote = await getCowQuote({
        kind: "sell",
        sellToken: WETH_ADDRESS,
        buyToken: COW_ADDRESS,
        sellAmountBeforeFee: ONE_ETH_WEI,
        validTo,
        chainId: SupportedChainId.MAINNET,
        rolesModifier: ROLES_MOD_ADDRESS,
        roleKey: encodeKey("test-role"),
      })

      // Verify the quote was successful
      expect(quote).toBeDefined()
      expect(quote.sellToken.toLowerCase()).toBe(WETH_ADDRESS.toLowerCase())
      expect(quote.buyToken.toLowerCase()).toBe(COW_ADDRESS.toLowerCase())

      // Parse appData to verify no partner fee specified
      const appData = JSON.parse(quote.appData)
      expect(appData.metadata.partnerFee).toBe(undefined)
    }
  )
})
