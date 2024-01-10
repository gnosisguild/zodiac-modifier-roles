import { DiffFlag, Preset } from "../types"
import { diffPermissions, diffPresets } from "./diff"

describe("diff", () => {
  describe("diffPermissions", () => {
    it("marks identical permissions as Identical / Identical", () => {
      const [left, right] = diffPermissions([PERMISSION], [copy(PERMISSION)])
      expect([...left.entries()]).toEqual([
        [PERMISSION, { flag: DiffFlag.Identical }],
      ])
      expect([...right.entries()]).toEqual([
        [PERMISSION, { flag: DiffFlag.Identical }],
      ])
    })

    it("marks new permissions as Hidden / Added", () => {
      const [left, right] = diffPermissions([], [PERMISSION])
      expect([...left.entries()]).toEqual([
        [PERMISSION, { flag: DiffFlag.Hidden }],
      ])
      expect([...right.entries()]).toEqual([
        [PERMISSION, { flag: DiffFlag.Added }],
      ])
    })

    it("marks missing permissions as Removed / Hidden", () => {
      const [left, right] = diffPermissions([PERMISSION], [])
      expect([...left.entries()]).toEqual([
        [PERMISSION, { flag: DiffFlag.Removed }],
      ])
      expect([...right.entries()]).toEqual([
        [PERMISSION, { flag: DiffFlag.Hidden }],
      ])
    })

    it("marks different permissions to same target+function as Modified / Modified and includes the modified counterpart", () => {
      const withoutCondition = copy(PERMISSION)
      withoutCondition.condition = undefined
      const [left, right] = diffPermissions([PERMISSION], [withoutCondition])
      expect([...left.entries()]).toEqual([
        [PERMISSION, { flag: DiffFlag.Modified, modified: withoutCondition }],
      ])
      expect([...right.entries()]).toEqual([
        [withoutCondition, { flag: DiffFlag.Modified, modified: PERMISSION }],
      ])
    })
  })

  describe("diffPresets", () => {
    it("marks identical presets as Identical / Identical", () => {
      const [left, right] = diffPresets([PRESET], [copy(PRESET)])
      expect([...left.entries()]).toEqual([
        [PRESET, { flag: DiffFlag.Identical }],
      ])
      expect([...right.entries()]).toEqual([
        [PRESET, { flag: DiffFlag.Identical }],
      ])
    })

    it("marks new presets as Hidden / Added", () => {
      const [left, right] = diffPresets([], [PRESET])
      expect([...left.entries()]).toEqual([[PRESET, { flag: DiffFlag.Hidden }]])
      expect([...right.entries()]).toEqual([[PRESET, { flag: DiffFlag.Added }]])
    })

    it("marks missing presets as Removed / Hidden", () => {
      const [left, right] = diffPresets([PRESET], [])
      expect([...left.entries()]).toEqual([
        [PRESET, { flag: DiffFlag.Removed }],
      ])
      expect([...right.entries()]).toEqual([
        [PRESET, { flag: DiffFlag.Hidden }],
      ])
    })

    it("marks different presets with same path key as Modified / Modified and includes the modified counterpart", () => {
      const edited = copy(PRESET)
      // remove USDC from sell
      edited.uri =
        "https://kit.karpatkey.com/api/v1/permissions/gor/cowswap/swap?buy=0x6B175474E89094C44Da98b954EedeAC495271d0F%2C0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&sell=0x6B175474E89094C44Da98b954EedeAC495271d0F"
      edited.queryParams.sell.pop()
      const [left, right] = diffPresets([PRESET], [edited])
      expect(left.get(PRESET)).toHaveProperty("flag", DiffFlag.Modified)
      expect(right.get(edited)).toHaveProperty("flag", DiffFlag.Modified)
      expect(left.get(PRESET)).toHaveProperty("modified", edited)
      expect(right.get(edited)).toHaveProperty("modified", PRESET)
    })

    it.only("marks presets with same uri but updated permissions as Modified / Modified", () => {
      const edited = copy(PRESET)
      delete edited.permissions[0].condition
      const [left, right] = diffPresets([PRESET], [edited])
      expect(left.get(PRESET)).toHaveProperty("flag", DiffFlag.Modified)
      expect(right.get(edited)).toHaveProperty("flag", DiffFlag.Modified)
    })

    it("calculates a permissions diff for Modified / Modified preset pairs", () => {
      const edited = copy(PRESET)
      delete edited.permissions[0].condition
      const [left, right] = diffPresets([PRESET], [edited])
      expect([...left.get(PRESET)!.permissions!.values()]).toEqual("TODO")
      expect([...right.get(edited)!.permissions!.values()]).toEqual("TODO")
    })
  })
})

const copy = (value: any) => JSON.parse(JSON.stringify(value))

const PERMISSION = {
  targetAddress: "0x6b175474e89094c44da98b954eedeac495271d0f",
  selector: "0x095ea7b3",
  send: false,
  delegatecall: false,
  condition: {
    paramType: 5,
    operator: 5,
    children: [
      {
        paramType: 1,
        operator: 16,
        compValue:
          "0x000000000000000000000000ba12222222228d8ba445958a75a0704d566bf2c8",
      },
    ],
  },
} as const

const PRESET: Preset = {
  permissions: [
    {
      targetAddress: "0xdeb83d81d4a9758a7baec5749da863c409ea6c6b",
      selector: "0x83afcefd",
      condition: {
        paramType: 5,
        operator: 5,
        children: [
          {
            paramType: 0,
            operator: 2,
            children: [
              {
                paramType: 1,
                operator: 16,
                compValue:
                  "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
              },
              {
                paramType: 1,
                operator: 16,
                compValue:
                  "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              },
            ],
          },
          {
            paramType: 0,
            operator: 2,
            children: [
              {
                paramType: 1,
                operator: 16,
                compValue:
                  "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
              },
              {
                paramType: 1,
                operator: 16,
                compValue:
                  "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              },
            ],
          },
          { paramType: 1, operator: 0 },
          { paramType: 1, operator: 0 },
          { paramType: 1, operator: 0 },
          { paramType: 1, operator: 0 },
          { paramType: 1, operator: 0 },
          { paramType: 1, operator: 0 },
          { paramType: 1, operator: 0 },
          { paramType: 1, operator: 0 },
          { paramType: 1, operator: 0 },
          { paramType: 1, operator: 0 },
        ],
      },
    },
  ],
  uri: "https://kit.karpatkey.com/api/v1/permissions/gor/cowswap/swap?buy=0x6B175474E89094C44Da98b954EedeAC495271d0F%2C0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&sell=0x6B175474E89094C44Da98b954EedeAC495271d0F%2C0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  serverUrl: "https://kit.karpatkey.com/api/v1",
  apiInfo: {
    contact: { name: "Karpatkey", url: "https://kit.karpatkey.com" },
    description:
      "Permissions for Zodiac Roles covering interactions with DeFi protocols",
    title: "DeFi Kit",
    version: "1.0.0",
  },
  pathKey: "/permissions/gor/cowswap/swap",
  pathParams: {},
  queryParams: {
    sell: [
      "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    ],
    buy: [
      "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    ],
  },
  operation: {
    summary: "Make swaps on cowswap",
    tags: ["cowswap permissions"],
    parameters: [
      {
        in: "query",
        style: "form",
        allowEmptyValue: false,
        allowReserved: false,
        explode: false,
        name: "sell",
        required: false,
        schema: {
          type: "array",
          deprecated: false,
          items: { type: "string", deprecated: false, nullable: false },
          nullable: false,
        },
      },
      {
        in: "query",
        style: "form",
        allowEmptyValue: false,
        allowReserved: false,
        explode: false,
        name: "buy",
        required: false,
        schema: {
          type: "array",
          deprecated: false,
          items: { type: "string", deprecated: false, nullable: false },
          nullable: false,
        },
      },
    ],
  },
}
