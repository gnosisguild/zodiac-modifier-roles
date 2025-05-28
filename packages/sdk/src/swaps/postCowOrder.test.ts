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

// Mock the cowOrderbookApi module
vi.mock("./cowOrderbookApi", () => ({
  postCowOrder: vi.fn(),
}))

// Import the License enum and mocked functions
import { License } from "../main/licensing"
import { fetchLicense } from "../main/licensing"
import { postCowOrder as postCowOrderApi } from "./cowOrderbookApi"

const mockFetchLicense = vi.mocked(fetchLicense)
const mockPostCowOrderApi = vi.mocked(postCowOrderApi)

// Test data
const WETH_ADDRESS =
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" as `0x${string}`
const COW_ADDRESS =
  "0xDEf1CA1fb7FBcDC777520aa7f396b4E015F497aB" as `0x${string}`
const ROLES_MOD_ADDRESS =
  "0x27d8bb2e33Bc38A9CE93fdD90C80677b8436aFfb" as `0x${string}`

const mockQuote: Quote = {
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
    metadata: {
      partnerFee: {
        bps: 25,
        recipient: "0x3ec84da3A9bCed9767490c198E69Aa216A35Df12",
      },
    },
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
  roleKey: "test-role",
}

const mockSignature =
  "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b"

describe("postCowOrder", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockFetchLicense.mockReset()
    mockPostCowOrderApi.mockReset()
  })

  it("should successfully post an order with valid appData for License.None", async () => {
    // Set up mocks
    mockFetchLicense.mockResolvedValue(License.None)
    mockPostCowOrderApi.mockResolvedValue({ orderId: "test-order-id-123" })

    // Call the function
    const orderId = await postCowOrder(mockQuote, mockSignature)

    // Verify the result
    expect(orderId).toBe("test-order-id-123")

    // Verify the API was called with correct parameters
    expect(mockPostCowOrderApi).toHaveBeenCalledWith(SupportedChainId.MAINNET, {
      sellToken: WETH_ADDRESS,
      buyToken: COW_ADDRESS,
      sellAmount: "1000000000000000000",
      buyAmount: "4000000000000000000",
      validTo: mockQuote.validTo,
      appData: mockQuote.appData,
      feeAmount: "1000000000000000",
      kind: "sell",
      partiallyFillable: false,
      sellTokenBalance: "erc20",
      buyTokenBalance: "erc20",
      from: ROLES_MOD_ADDRESS,
      signature: mockSignature,
      signingScheme: "eip712",
    })

    // Verify license was checked
    expect(mockFetchLicense).toHaveBeenCalledWith({
      chainId: SupportedChainId.MAINNET,
      owner: ROLES_MOD_ADDRESS,
    })
  })

  it("should successfully post an order for License.Enterprise", async () => {
    // Create a quote with Enterprise license (no partner fee)
    const enterpriseQuote: Quote = {
      ...mockQuote,
      appData: JSON.stringify({
        version: "1.3.0",
        appCode: "Zodiac Roles SDK",
        environment: "production",
        metadata: {},
      }),
    }

    // Set up mocks
    mockFetchLicense.mockResolvedValue(License.Enterprise)
    mockPostCowOrderApi.mockResolvedValue({ orderId: "enterprise-order-id" })

    // Call the function
    const orderId = await postCowOrder(enterpriseQuote, mockSignature)

    // Verify the result
    expect(orderId).toBe("enterprise-order-id")
    expect(mockPostCowOrderApi).toHaveBeenCalled()
  })

  it("should use custom signing scheme when provided", async () => {
    // Set up mocks
    mockFetchLicense.mockResolvedValue(License.None)
    mockPostCowOrderApi.mockResolvedValue({ orderId: "test-order-id" })

    // Call with custom signing scheme
    await postCowOrder(mockQuote, mockSignature, "eip1271")

    // Verify the signing scheme was passed correctly
    expect(mockPostCowOrderApi).toHaveBeenCalledWith(
      SupportedChainId.MAINNET,
      expect.objectContaining({
        signingScheme: "eip1271",
      })
    )
  })

  it("should throw error for invalid appData version", async () => {
    // Create quote with invalid appData version
    const invalidQuote: Quote = {
      ...mockQuote,
      appData: JSON.stringify({
        version: "1.0.0", // Invalid version
        appCode: "Zodiac Roles SDK",
        environment: "production",
        metadata: {
          partnerFee: {
            bps: 25,
            recipient: "0x3ec84da3A9bCed9767490c198E69Aa216A35Df12",
          },
        },
      }),
    }

    // Set up mocks
    mockFetchLicense.mockResolvedValue(License.None)

    // Expect the function to throw
    await expect(postCowOrder(invalidQuote, mockSignature)).rejects.toThrow(
      "Invalid appData version"
    )

    // Verify API was not called
    expect(mockPostCowOrderApi).not.toHaveBeenCalled()
  })

  it("should throw error for missing partner fee in non-Enterprise license", async () => {
    // Create quote without partner fee for non-Enterprise license
    const invalidQuote: Quote = {
      ...mockQuote,
      appData: JSON.stringify({
        version: "1.3.0",
        appCode: "Zodiac Roles SDK",
        environment: "production",
        metadata: {}, // Missing partner fee
      }),
    }

    // Set up mocks
    mockFetchLicense.mockResolvedValue(License.None)

    // Expect the function to throw
    await expect(postCowOrder(invalidQuote, mockSignature)).rejects.toThrow(
      "Invalid appData partnerFee"
    )

    // Verify API was not called
    expect(mockPostCowOrderApi).not.toHaveBeenCalled()
  })

  it("should throw error for invalid partner fee amount", async () => {
    // Create quote with wrong partner fee amount
    const invalidQuote: Quote = {
      ...mockQuote,
      appData: JSON.stringify({
        version: "1.3.0",
        appCode: "Zodiac Roles SDK",
        environment: "production",
        metadata: {
          partnerFee: {
            bps: 50, // Wrong amount (should be 25)
            recipient: "0x3ec84da3A9bCed9767490c198E69Aa216A35Df12",
          },
        },
      }),
    }

    // Set up mocks
    mockFetchLicense.mockResolvedValue(License.None)

    // Expect the function to throw
    await expect(postCowOrder(invalidQuote, mockSignature)).rejects.toThrow(
      "Invalid appData partnerFee"
    )

    // Verify API was not called
    expect(mockPostCowOrderApi).not.toHaveBeenCalled()
  })

  it("should propagate API errors", async () => {
    // Set up mocks
    mockFetchLicense.mockResolvedValue(License.None)
    mockPostCowOrderApi.mockRejectedValue(
      new Error("API Error: Order already exists")
    )

    // Expect the function to throw the API error
    await expect(postCowOrder(mockQuote, mockSignature)).rejects.toThrow(
      "API Error: Order already exists"
    )
  })
})
