import { compareToEthersHashing } from "./compareToEthersHashing"

describe("EIP712Encoder", () => {
  describe("Static Types", () => {
    const domain = { chainId: 1 }

    it("should handle boolean values", async () => {
      const types = { Person: [{ name: "adult", type: "bool" }] }

      await compareToEthersHashing({
        domain,
        types,
        message: { adult: true },
      })

      await compareToEthersHashing({
        domain,
        types,
        message: { adult: false },
      })
    })

    it("should handle address values", async () => {
      const types = { Person: [{ name: "address", type: "address" }] }

      await compareToEthersHashing({
        domain,
        types,
        message: { address: "0x0000000000000000000000000000000000000000" },
      })

      await compareToEthersHashing({
        domain,
        types,
        message: { address: "0x0000000000000000000000000000000000000123" },
      })
    })

    it("should handle bytes1 - bytes32 values", async () => {
      const typesBytes1 = { Person: [{ name: "meta", type: "bytes1" }] }
      const typesBytes16 = { Person: [{ name: "meta", type: "bytes16" }] }
      const typesBytes32 = { Person: [{ name: "meta", type: "bytes32" }] }

      await compareToEthersHashing({
        domain,
        types: typesBytes1,
        message: { meta: "0x00" },
      })

      await compareToEthersHashing({
        domain,
        types: typesBytes1,
        message: { meta: "0xff" },
      })

      await compareToEthersHashing({
        domain,
        types: typesBytes16,
        message: { meta: "0x00000000000000000000000000000000" },
      })

      await compareToEthersHashing({
        domain,
        types: typesBytes16,
        message: { meta: "0xf000000000000000000000000000000f" },
      })

      await compareToEthersHashing({
        domain,
        types: typesBytes32,
        message: {
          meta: "0x0000000000000000000000000000000000000000000000000000000000000000",
        },
      })

      await compareToEthersHashing({
        domain,
        types: typesBytes32,
        message: {
          meta: "0xf000000000000000000000000000000ff000000000000000000000000000000f",
        },
      })
    })
  })
})
