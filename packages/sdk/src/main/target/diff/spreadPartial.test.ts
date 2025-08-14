import { expect, it, describe } from "vitest"
import { spreadPartial } from "./spreadPartial"

describe("spreadPartial", () => {
  describe("roles field", () => {
    it("array replaces all roles", () => {
      const prev = {
        roles: [
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000001" as `0x${string}`,
            members: [
              "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as `0x${string}`,
            ],
            targets: [],
            annotations: [],
            lastUpdate: 123456,
          },
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000002" as `0x${string}`,
            members: [
              "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" as `0x${string}`,
            ],
            targets: [],
            annotations: [],
            lastUpdate: 789012,
          },
        ],
        allowances: [],
      }

      const partial = {
        roles: [
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000003" as `0x${string}`,
            members: [
              "0xcccccccccccccccccccccccccccccccccccccccc" as `0x${string}`,
            ],
            targets: [],
            annotations: [],
            lastUpdate: 345678,
          },
        ],
      }

      const result = spreadPartial(prev, partial)

      expect(result).toEqual({
        roles: [
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000003",
            members: ["0xcccccccccccccccccccccccccccccccccccccccc"],
            targets: [],
            annotations: [],
            lastUpdate: 345678,
          },
        ],
        allowances: [],
      })
    })

    it("map merges with existing roles", () => {
      const prev = {
        roles: [
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000001" as `0x${string}`,
            members: [
              "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as `0x${string}`,
            ],
            targets: [],
            annotations: [],
            lastUpdate: 123456,
          },
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000002" as `0x${string}`,
            members: [
              "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" as `0x${string}`,
            ],
            targets: [],
            annotations: [],
            lastUpdate: 789012,
          },
        ],
        allowances: [],
      }

      const partial = {
        roles: {
          "0x0000000000000000000000000000000000000000000000000000000000000001":
            {
              key: "0x0000000000000000000000000000000000000000000000000000000000000001" as `0x${string}`,
              members: [
                "0xdddddddddddddddddddddddddddddddddddddddd" as `0x${string}`,
              ],
              targets: [],
              annotations: [],
              lastUpdate: 999999,
            },
        },
      }

      const result = spreadPartial(prev, partial)

      expect(result).toEqual({
        roles: [
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000001",
            members: ["0xdddddddddddddddddddddddddddddddddddddddd"],
            targets: [],
            annotations: [],
            lastUpdate: 999999,
          },
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000002",
            members: ["0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"],
            targets: [],
            annotations: [],
            lastUpdate: 789012,
          },
        ],
        allowances: [],
      })
    })

    it("map adds new roles", () => {
      const prev = {
        roles: [
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000001" as `0x${string}`,
            members: [
              "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as `0x${string}`,
            ],
            targets: [],
            annotations: [],
            lastUpdate: 123456,
          },
        ],
        allowances: [],
      }

      const partial = {
        roles: {
          "0x0000000000000000000000000000000000000000000000000000000000000003":
            {
              key: "0x0000000000000000000000000000000000000000000000000000000000000003" as `0x${string}`,
              members: [
                "0xcccccccccccccccccccccccccccccccccccccccc" as `0x${string}`,
              ],
              targets: [],
              annotations: [],
              lastUpdate: 345678,
            },
        },
      }

      const result = spreadPartial(prev, partial)

      expect(result).toEqual({
        roles: [
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000001",
            members: ["0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
            targets: [],
            annotations: [],
            lastUpdate: 123456,
          },
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000003",
            members: ["0xcccccccccccccccccccccccccccccccccccccccc"],
            targets: [],
            annotations: [],
            lastUpdate: 345678,
          },
        ],
        allowances: [],
      })
    })
  })

  describe("allowances field", () => {
    it("array replaces all allowances", () => {
      const prev = {
        roles: [],
        allowances: [
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000001" as `0x${string}`,
            refill: 100n,
            maxRefill: 1000n,
            period: 3600n,
            balance: 500n,
            timestamp: 1234567890n,
          },
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000002" as `0x${string}`,
            refill: 200n,
            maxRefill: 2000n,
            period: 7200n,
            balance: 750n,
            timestamp: 9876543210n,
          },
        ],
      }

      const partial = {
        allowances: [
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000003" as `0x${string}`,
            refill: 300n,
            maxRefill: 3000n,
            period: 10800n,
            balance: 1000n,
            timestamp: 1357924680n,
          },
        ],
      }

      const result = spreadPartial(prev, partial)

      expect(result).toEqual({
        roles: [],
        allowances: [
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000003",
            refill: 300n,
            maxRefill: 3000n,
            period: 10800n,
            balance: 1000n,
            timestamp: 1357924680n,
          },
        ],
      })
    })

    it("map merges with existing allowances", () => {
      const prev = {
        roles: [],
        allowances: [
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000001" as `0x${string}`,
            refill: 100n,
            maxRefill: 1000n,
            period: 3600n,
            balance: 500n,
            timestamp: 1234567890n,
          },
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000002" as `0x${string}`,
            refill: 200n,
            maxRefill: 2000n,
            period: 7200n,
            balance: 750n,
            timestamp: 9876543210n,
          },
        ],
      }

      const partial = {
        allowances: {
          "0x0000000000000000000000000000000000000000000000000000000000000001":
            {
              key: "0x0000000000000000000000000000000000000000000000000000000000000001" as `0x${string}`,
              refill: 100n,
              maxRefill: 1000n,
              period: 3600n,
              balance: 999n,
              timestamp: 1234567890n,
            },
        },
      }

      const result = spreadPartial(prev, partial)

      expect(result).toEqual({
        roles: [],
        allowances: [
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000001",
            refill: 100n,
            maxRefill: 1000n,
            period: 3600n,
            balance: 999n,
            timestamp: 1234567890n,
          },
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000002",
            refill: 200n,
            maxRefill: 2000n,
            period: 7200n,
            balance: 750n,
            timestamp: 9876543210n,
          },
        ],
      })
    })

    it("map adds new allowances", () => {
      const prev = {
        roles: [],
        allowances: [
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000001" as `0x${string}`,
            refill: 100n,
            maxRefill: 1000n,
            period: 3600n,
            balance: 500n,
            timestamp: 1234567890n,
          },
        ],
      }

      const partial = {
        allowances: {
          "0x0000000000000000000000000000000000000000000000000000000000000003":
            {
              key: "0x0000000000000000000000000000000000000000000000000000000000000003" as `0x${string}`,
              refill: 300n,
              maxRefill: 3000n,
              period: 10800n,
              balance: 1000n,
              timestamp: 1357924680n,
            },
        },
      }

      const result = spreadPartial(prev, partial)

      expect(result).toEqual({
        roles: [],
        allowances: [
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000001",
            refill: 100n,
            maxRefill: 1000n,
            period: 3600n,
            balance: 500n,
            timestamp: 1234567890n,
          },
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000003",
            refill: 300n,
            maxRefill: 3000n,
            period: 10800n,
            balance: 1000n,
            timestamp: 1357924680n,
          },
        ],
      })
    })
  })
})
