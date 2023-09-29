import { DiffFlag } from "../types"
import { diffPermissions } from "./diff"

describe("diff", () => {
  describe("diffPermissions", () => {
    it("marks identical permissions as Identical / Identical", () => {
      const [left, right] = diffPermissions([PERMISSION], [copy(PERMISSION)])
      expect([...left.entries()]).toEqual([[PERMISSION, DiffFlag.Identical]])
      expect([...right.entries()]).toEqual([[PERMISSION, DiffFlag.Identical]])
    })

    it("marks new permissions as Hidden / Added", () => {
      const [left, right] = diffPermissions([], [PERMISSION])
      expect([...left.entries()]).toEqual([[PERMISSION, DiffFlag.Hidden]])
      expect([...right.entries()]).toEqual([[PERMISSION, DiffFlag.Added]])
    })

    it("marks missing permissions as Removed / Hidden", () => {
      const [left, right] = diffPermissions([PERMISSION], [])
      expect([...left.entries()]).toEqual([[PERMISSION, DiffFlag.Removed]])
      expect([...right.entries()]).toEqual([[PERMISSION, DiffFlag.Hidden]])
    })

    it("marks different permissions to same target+function as Modified / Modified", () => {
      const withoutCondition = copy(PERMISSION)
      withoutCondition.condition = undefined
      const [left, right] = diffPermissions([PERMISSION], [withoutCondition])
      expect([...left.entries()]).toEqual([[PERMISSION, DiffFlag.Modified]])
      expect([...right.entries()]).toEqual([
        [withoutCondition, DiffFlag.Modified],
      ])
    })
  })

  describe("diffPresets", () => {
    it("returns the combined set of all presets and a map of diff flags", () => {
      throw new Error("TODO")
    })
    it("marks new endpoints as Added", () => {})
    it("marks missing endpoints as Removed", () => {})
    it("marks same endpoints with different params as Modified", () => {})
    it("calculates diff of permissions", () => {})
  })
})

const copy = (value: any) => JSON.parse(JSON.stringify(value))

const PERMISSION = {
  targetAddress: "0x6b175474e89094c44da98b954eedeac495271d0f",
  selector: "0x095ea7b3",
  send: false,
  delegateCall: false,
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
