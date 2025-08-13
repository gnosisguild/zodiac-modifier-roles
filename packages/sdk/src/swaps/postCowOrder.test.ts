import { it, describe, expect, vi, beforeEach } from "vitest"
import { postCowOrder } from "./postCowOrder"
import { SupportedChainId, Quote } from "./types"

// Mock the fetchLicense function from the main licensing module
vi.mock("../main/licensing", () => ({
  fetchLicense: vi.fn(),
  License: {
    None: 0,
    Free: 1,
    Enterprise: 2,
  },
}))

// Import the License enum and mocked functions
import { License } from "../main/licensing"
import { fetchLicense } from "../main/licensing"
import { postCowOrder as postCowOrderApi } from "./cowOrderbookApi"
import { encodeKey } from "../main/keys"

const mockFetchLicense = vi.mocked(fetchLicense)

// Test data
const WETH_ADDRESS =
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" as `0x${string}`
const COW_ADDRESS =
  "0xDEf1CA1fb7FBcDC777520aa7f396b4E015F497aB" as `0x${string}`
const ROLES_MOD_ADDRESS =
  "0x27d8bb2e33Bc38A9CE93fdD90C80677b8436aFfb" as `0x${string}`

const quoteWithoutFee: Quote = {
  sellToken: WETH_ADDRESS,
  buyToken: COW_ADDRESS,
  receiver: ROLES_MOD_ADDRESS,
  sellAmount: "1000000000000000000",
  buyAmount: "4000000000000000000",
  validTo: Math.floor(Date.now() / 1000) + 30 * 60,
  appData: JSON.stringify({
    version: "1.3.0",
    appCode: "Zodiac Roles SDK",
    environment: "production",
    metadata: {},
  }),
  appDataHash:
    "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  networkCostsAmount: "1000000000000000",
  kind: "sell",
  partiallyFillable: false,
  sellTokenBalance: "erc20",
  buyTokenBalance: "erc20",
  from: ROLES_MOD_ADDRESS,
  chainId: SupportedChainId.MAINNET,
  rolesModifier: ROLES_MOD_ADDRESS,
  roleKey: encodeKey("test-role"),
}

describe("postCowOrder", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockFetchLicense.mockReset()
  })

  it("should successfully post an order", async () => {
    // Set up mocks
    mockFetchLicense.mockResolvedValue(License.Enterprise)

    // Call the function
    const orderId = await postCowOrder(quoteWithoutFee)
    expect(orderId).toBeDefined()
  })

  it("should throw error for missing partner fee in non-Enterprise license", async () => {
    // Set up mocks
    mockFetchLicense.mockResolvedValue(License.None)

    // Expect the function to throw
    await expect(postCowOrder(quoteWithoutFee)).rejects.toThrow(
      "Invalid appData partnerFee"
    )
  })
})
