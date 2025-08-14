import { expect, it, describe } from "vitest"
import {
  Target,
  Role,
  Allowance,
  RolesModifier,
  Function,
  Clearance,
  ExecutionOptions,
} from "zodiac-roles-deployments"
import {
  TargetPartial,
  RolePartial,
  AllowancePartial,
  RolesModifierPartial,
} from "./types"
import {
  applyTargetPartial,
  applyRolePartial,
  applyAllowancePartial,
  applyRolesModifierPartial,
  getDefaultTarget,
  getDefaultRole,
  getDefaultAllowance,
  getDefaultRolesModifier,
} from "./partials"

describe("applyTargetPartial", () => {
  describe("functions field", () => {
    it("array replaces all functions", () => {
      const existingTarget: Target = {
        address: "0x1234567890123456789012345678901234567890",
        clearance: Clearance.Target,
        executionOptions: ExecutionOptions.Send,
        functions: [
          {
            selector: "0x12345678",
            executionOptions: ExecutionOptions.Send,
            wildcarded: false,
          },
          {
            selector: "0x87654321",
            executionOptions: ExecutionOptions.DelegateCall,
            wildcarded: true,
          },
        ],
      }

      const partial: TargetPartial = {
        address: "0x1234567890123456789012345678901234567890",
        functions: [
          {
            selector: "0xabcdef00",
            executionOptions: ExecutionOptions.None,
            wildcarded: false,
          },
        ],
      }

      const result = applyTargetPartial(existingTarget, partial)

      expect(result.functions).toHaveLength(1)
      expect(result.functions[0].selector).toBe("0xabcdef00")
      expect(result.functions).not.toContainEqual(
        expect.objectContaining({ selector: "0x12345678" })
      )
    })

    it("map updates with existing functions", () => {
      const existingTarget: Target = {
        address: "0x1234567890123456789012345678901234567890",
        clearance: Clearance.Target,
        executionOptions: ExecutionOptions.Send,
        functions: [
          {
            selector: "0x12345678",
            executionOptions: ExecutionOptions.Send,
            wildcarded: false,
          },
          {
            selector: "0x87654321",
            executionOptions: ExecutionOptions.DelegateCall,
            wildcarded: true,
          },
        ],
      }

      const partial: TargetPartial = {
        address: "0x1234567890123456789012345678901234567890",
        functions: {
          "0x12345678": {
            selector: "0x12345678",
            executionOptions: ExecutionOptions.Both,
            wildcarded: true,
          },
        },
      }

      const result = applyTargetPartial(existingTarget, partial)

      expect(result.functions).toEqual([
        {
          selector: "0x12345678",
          executionOptions: ExecutionOptions.Both,
          wildcarded: true,
        },
        {
          selector: "0x87654321",
          executionOptions: ExecutionOptions.DelegateCall,
          wildcarded: true,
        },
      ])
    })

    it("map adds new functions", () => {
      const existingTarget: Target = {
        address: "0x1234567890123456789012345678901234567890",
        clearance: Clearance.Target,
        executionOptions: ExecutionOptions.Send,
        functions: [
          {
            selector: "0x12345678",
            executionOptions: ExecutionOptions.Send,
            wildcarded: false,
          },
        ],
      }

      const partial: TargetPartial = {
        address: "0x1234567890123456789012345678901234567890",
        functions: {
          "0xabcdef00": {
            selector: "0xabcdef00",
            executionOptions: ExecutionOptions.None,
            wildcarded: false,
          },
        },
      }

      const result = applyTargetPartial(existingTarget, partial)

      expect(result).toEqual({
        address: "0x1234567890123456789012345678901234567890",
        clearance: Clearance.Target,
        executionOptions: ExecutionOptions.Send,
        functions: [
          {
            selector: "0x12345678",
            executionOptions: ExecutionOptions.Send,
            wildcarded: false,
          },
          {
            selector: "0xabcdef00",
            executionOptions: ExecutionOptions.None,
            wildcarded: false,
          },
        ],
      })
    })

    it("preserves non-mentioned functions when using map", () => {
      const existingTarget: Target = {
        address: "0x1234567890123456789012345678901234567890",
        clearance: Clearance.Target,
        executionOptions: ExecutionOptions.Send,
        functions: [
          {
            selector: "0x11111111",
            executionOptions: ExecutionOptions.Send,
            wildcarded: false,
          },
          {
            selector: "0x22222222",
            executionOptions: ExecutionOptions.DelegateCall,
            wildcarded: true,
          },
          {
            selector: "0x33333333",
            executionOptions: ExecutionOptions.Both,
            wildcarded: false,
          },
        ],
      }

      const partial: TargetPartial = {
        address: "0x1234567890123456789012345678901234567890",
        functions: {
          "0x22222222": {
            selector: "0x22222222",
            executionOptions: ExecutionOptions.None,
            wildcarded: false,
          },
        },
      }

      const result = applyTargetPartial(existingTarget, partial)

      expect(result).toEqual({
        address: "0x1234567890123456789012345678901234567890",
        clearance: Clearance.Target,
        executionOptions: ExecutionOptions.Send,
        functions: [
          {
            selector: "0x11111111",
            executionOptions: ExecutionOptions.Send,
            wildcarded: false,
          },
          {
            selector: "0x22222222",
            executionOptions: ExecutionOptions.None,
            wildcarded: false,
          },
          {
            selector: "0x33333333",
            executionOptions: ExecutionOptions.Both,
            wildcarded: false,
          },
        ],
      })
    })
  })

  describe("other fields", () => {
    it("updates clearance field", () => {
      const existingTarget: Target = {
        address: "0x1234567890123456789012345678901234567890",
        clearance: Clearance.Target,
        executionOptions: ExecutionOptions.Send,
        functions: [
          {
            selector: "0x12345678",
            executionOptions: ExecutionOptions.Send,
            wildcarded: false,
          },
        ],
      }

      const partial: TargetPartial = {
        address: "0x1234567890123456789012345678901234567890",
        clearance: Clearance.Function,
      }

      const result = applyTargetPartial(existingTarget, partial)

      expect(result).toEqual({
        address: "0x1234567890123456789012345678901234567890",
        clearance: Clearance.Function,
        executionOptions: ExecutionOptions.Send,
        functions: [
          {
            selector: "0x12345678",
            executionOptions: ExecutionOptions.Send,
            wildcarded: false,
          },
        ],
      })
    })

    it("updates executionOptions field", () => {
      const existingTarget: Target = {
        address: "0x1234567890123456789012345678901234567890",
        clearance: Clearance.Target,
        executionOptions: ExecutionOptions.Send,
        functions: [],
      }

      const partial: TargetPartial = {
        address: "0x1234567890123456789012345678901234567890",
        executionOptions: ExecutionOptions.Both,
      }

      const result = applyTargetPartial(existingTarget, partial)

      expect(result).toEqual({
        address: "0x1234567890123456789012345678901234567890",
        clearance: Clearance.Target,
        executionOptions: ExecutionOptions.Both,
        functions: [],
      })
    })

    it("updates conditions field", () => {
      const existingTarget: Target = {
        address: "0x1234567890123456789012345678901234567890",
        clearance: Clearance.Target,
        executionOptions: ExecutionOptions.Send,
        functions: [],
      }

      const partial: TargetPartial = {
        address: "0x1234567890123456789012345678901234567890",
        executionOptions: ExecutionOptions.Both,
      }

      const result = applyTargetPartial(existingTarget, partial)

      expect(result).toEqual({
        address: "0x1234567890123456789012345678901234567890",
        clearance: Clearance.Target,
        executionOptions: ExecutionOptions.Both,
        functions: [],
      })
    })

    it("updates address field", () => {
      const existingTarget: Target = {
        address: "0x1234567890123456789012345678901234567890",
        clearance: Clearance.Target,
        executionOptions: ExecutionOptions.Send,
        functions: [],
      }

      const partial: TargetPartial = {
        address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      }

      expect(() => applyTargetPartial(existingTarget, partial)).toThrow(
        "Invariant"
      )
    })
  })
})

describe("applyRolePartial", () => {
  describe("targets field", () => {
    it("array replaces all targets", () => {
      const existingRole: Role = {
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        members: ["0x1111111111111111111111111111111111111111"],
        targets: [
          {
            address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            clearance: Clearance.Target,
            executionOptions: ExecutionOptions.Send,
            functions: [],
          },
          {
            address: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            clearance: Clearance.Function,
            executionOptions: ExecutionOptions.DelegateCall,
            functions: [],
          },
        ],
        annotations: [],
        lastUpdate: 123456,
      }

      const partial: RolePartial = {
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        targets: [
          {
            address: "0xcccccccccccccccccccccccccccccccccccccccc",
            clearance: Clearance.None,
            executionOptions: ExecutionOptions.None,
            functions: [],
          },
        ],
      }

      const result = applyRolePartial(existingRole, partial)

      expect(result).toEqual({
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        members: ["0x1111111111111111111111111111111111111111"],
        targets: [
          {
            address: "0xcccccccccccccccccccccccccccccccccccccccc",
            clearance: Clearance.None,
            executionOptions: ExecutionOptions.None,
            functions: [],
          },
        ],
        annotations: [],
        lastUpdate: 123456,
      })
    })

    it("map merges with existing targets", () => {
      const existingRole: Role = {
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        members: ["0x1111111111111111111111111111111111111111"],
        targets: [
          {
            address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            clearance: Clearance.Target,
            executionOptions: ExecutionOptions.Send,
            functions: [],
          },
          {
            address: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            clearance: Clearance.Function,
            executionOptions: ExecutionOptions.DelegateCall,
            functions: [],
          },
        ],
        annotations: [],
        lastUpdate: 123456,
      }

      const partial: RolePartial = {
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        targets: {
          "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa": {
            address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            clearance: Clearance.Function,
            executionOptions: ExecutionOptions.Both,
          },
        },
      }

      const result = applyRolePartial(existingRole, partial)

      expect(result).toEqual({
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        members: ["0x1111111111111111111111111111111111111111"],
        targets: [
          {
            address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            clearance: Clearance.Function,
            executionOptions: ExecutionOptions.Both,
            functions: [],
          },
          {
            address: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            clearance: Clearance.Function,
            executionOptions: ExecutionOptions.DelegateCall,
            functions: [],
          },
        ],
        annotations: [],
        lastUpdate: 123456,
      })
    })

    it("map adds new targets", () => {
      const existingRole: Role = {
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        members: ["0x1111111111111111111111111111111111111111"],
        targets: [
          {
            address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            clearance: Clearance.Target,
            executionOptions: ExecutionOptions.Send,
            functions: [],
          },
        ],
        annotations: [],
        lastUpdate: 123456,
      }

      const partial: RolePartial = {
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        targets: {
          "0xcccccccccccccccccccccccccccccccccccccccc": {
            address: "0xcccccccccccccccccccccccccccccccccccccccc",
            clearance: Clearance.None,
            executionOptions: ExecutionOptions.None,
            functions: [],
          },
        },
      }

      const result = applyRolePartial(existingRole, partial)

      expect(result).toEqual({
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        members: ["0x1111111111111111111111111111111111111111"],
        targets: [
          {
            address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            clearance: Clearance.Target,
            executionOptions: ExecutionOptions.Send,
            functions: [],
          },
          {
            address: "0xcccccccccccccccccccccccccccccccccccccccc",
            clearance: Clearance.None,
            executionOptions: ExecutionOptions.None,
            functions: [],
          },
        ],
        annotations: [],
        lastUpdate: 123456,
      })
    })

    it("map updates existing targets", () => {
      const existingRole: Role = {
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        members: ["0x1111111111111111111111111111111111111111"],
        targets: [
          {
            address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            clearance: Clearance.Target,
            executionOptions: ExecutionOptions.Send,
            functions: [
              {
                selector: "0x12345678",
                executionOptions: ExecutionOptions.Send,
                wildcarded: false,
              },
            ],
          },
        ],
        annotations: [],
        lastUpdate: 123456,
      }

      const partial: RolePartial = {
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        targets: {
          "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa": {
            address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            clearance: Clearance.Function,
          },
        },
      }

      const result = applyRolePartial(existingRole, partial)

      expect(result).toEqual({
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        members: ["0x1111111111111111111111111111111111111111"],
        targets: [
          {
            address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            clearance: Clearance.Function,
            executionOptions: ExecutionOptions.Send,
            functions: [
              {
                selector: "0x12345678",
                executionOptions: ExecutionOptions.Send,
                wildcarded: false,
              },
            ],
          },
        ],
        annotations: [],
        lastUpdate: 123456,
      })
    })

    it("preserves non-mentioned targets when using map", () => {
      const existingRole: Role = {
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        members: ["0x1111111111111111111111111111111111111111"],
        targets: [
          {
            address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            clearance: Clearance.Target,
            executionOptions: ExecutionOptions.Send,
            functions: [],
          },
          {
            address: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            clearance: Clearance.Function,
            executionOptions: ExecutionOptions.DelegateCall,
            functions: [],
          },
          {
            address: "0xcccccccccccccccccccccccccccccccccccccccc",
            clearance: Clearance.None,
            executionOptions: ExecutionOptions.Both,
            functions: [],
          },
        ],
        annotations: [],
        lastUpdate: 123456,
      }

      const partial: RolePartial = {
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        targets: {
          "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb": {
            address: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            executionOptions: ExecutionOptions.None,
          },
        },
      }

      const result = applyRolePartial(existingRole, partial)

      expect(result).toEqual({
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        members: ["0x1111111111111111111111111111111111111111"],
        targets: [
          {
            address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            clearance: Clearance.Target,
            executionOptions: ExecutionOptions.Send,
            functions: [],
          },
          {
            address: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            clearance: Clearance.Function,
            executionOptions: ExecutionOptions.None,
            functions: [],
          },
          {
            address: "0xcccccccccccccccccccccccccccccccccccccccc",
            clearance: Clearance.None,
            executionOptions: ExecutionOptions.Both,
            functions: [],
          },
        ],
        annotations: [],
        lastUpdate: 123456,
      })
    })

    it("handles nested function updates in targets when using map", () => {
      const existingRole: Role = {
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        members: ["0x1111111111111111111111111111111111111111"],
        targets: [
          {
            address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            clearance: Clearance.Function,
            executionOptions: ExecutionOptions.Send,
            functions: [
              {
                selector: "0x11111111",
                executionOptions: ExecutionOptions.Send,
                wildcarded: false,
              },
              {
                selector: "0x22222222",
                executionOptions: ExecutionOptions.DelegateCall,
                wildcarded: true,
              },
            ],
          },
        ],
        annotations: [],
        lastUpdate: 123456,
      }

      const partial: RolePartial = {
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        targets: {
          "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa": {
            address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            functions: {
              "0x22222222": {
                selector: "0x22222222",
                executionOptions: ExecutionOptions.Both,
                wildcarded: false,
              },
              "0x33333333": {
                selector: "0x33333333",
                executionOptions: ExecutionOptions.None,
                wildcarded: false,
              },
            },
          },
        },
      }

      const result = applyRolePartial(existingRole, partial)

      expect(result).toEqual({
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        members: ["0x1111111111111111111111111111111111111111"],
        targets: [
          {
            address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            clearance: Clearance.Function,
            executionOptions: ExecutionOptions.Send,
            functions: [
              {
                selector: "0x11111111",
                executionOptions: ExecutionOptions.Send,
                wildcarded: false,
              },
              {
                selector: "0x22222222",
                executionOptions: ExecutionOptions.Both,
                wildcarded: false,
              },
              {
                selector: "0x33333333",
                executionOptions: ExecutionOptions.None,
                wildcarded: false,
              },
            ],
          },
        ],
        annotations: [],
        lastUpdate: 123456,
      })
    })
  })

  describe("other fields", () => {
    it("updates members field", () => {
      const existingRole: Role = {
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        members: ["0x1111111111111111111111111111111111111111"],
        targets: [],
        annotations: [],
        lastUpdate: 123456,
      }

      const partial: RolePartial = {
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        members: [
          "0x2222222222222222222222222222222222222222",
          "0x3333333333333333333333333333333333333333",
        ],
      }

      const result = applyRolePartial(existingRole, partial)

      expect(result).toEqual({
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        members: [
          "0x2222222222222222222222222222222222222222",
          "0x3333333333333333333333333333333333333333",
        ],
        targets: [],
        annotations: [],
        lastUpdate: 123456,
      })
    })

    it("updates annotations field", () => {
      const existingRole: Role = {
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        members: ["0x1111111111111111111111111111111111111111"],
        targets: [],
        annotations: [
          {
            uri: "https://example.com/old",
            schema: "old-schema",
          },
        ],
        lastUpdate: 123456,
      }

      const partial: RolePartial = {
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        annotations: [
          {
            uri: "https://example.com/new",
            schema: "new-schema",
          },
          {
            uri: "https://example.com/another",
            schema: "another-schema",
          },
        ],
      }

      const result = applyRolePartial(existingRole, partial)

      expect(result).toEqual({
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        members: ["0x1111111111111111111111111111111111111111"],
        targets: [],
        annotations: [
          {
            uri: "https://example.com/new",
            schema: "new-schema",
          },
          {
            uri: "https://example.com/another",
            schema: "another-schema",
          },
        ],
        lastUpdate: 123456,
      })
    })

    it("updates lastUpdate field", () => {
      const existingRole: Role = {
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        members: ["0x1111111111111111111111111111111111111111"],
        targets: [],
        annotations: [],
        lastUpdate: 123456,
      }

      const partial: RolePartial = {
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        lastUpdate: 999999,
      }

      const result = applyRolePartial(existingRole, partial)

      expect(result).toEqual({
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        members: ["0x1111111111111111111111111111111111111111"],
        targets: [],
        annotations: [],
        lastUpdate: 999999,
      })
    })

    it("preserves fields not specified in partial", () => {
      const existingRole: Role = {
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        members: [
          "0x1111111111111111111111111111111111111111",
          "0x2222222222222222222222222222222222222222",
        ],
        targets: [
          {
            address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            clearance: Clearance.Target,
            executionOptions: ExecutionOptions.Send,
            functions: [],
          },
        ],
        annotations: [
          {
            uri: "https://example.com/test",
            schema: "test-schema",
          },
        ],
        lastUpdate: 123456,
      }

      const partial: RolePartial = {
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
      }

      const result = applyRolePartial(existingRole, partial)

      expect(result).toEqual({
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        members: [
          "0x1111111111111111111111111111111111111111",
          "0x2222222222222222222222222222222222222222",
        ],
        targets: [
          {
            address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            clearance: Clearance.Target,
            executionOptions: ExecutionOptions.Send,
            functions: [],
          },
        ],
        annotations: [
          {
            uri: "https://example.com/test",
            schema: "test-schema",
          },
        ],
        lastUpdate: 123456,
      })
    })

    it("throws on key mismatch", () => {
      const existingRole: Role = {
        key: "0x0000000000000000000000000000000000000000000000000000000000000001",
        members: ["0x1111111111111111111111111111111111111111"],
        targets: [],
        annotations: [],
        lastUpdate: 123456,
      }

      const partial: RolePartial = {
        key: "0x0000000000000000000000000000000000000000000000000000000000000002",
      }

      expect(() => applyRolePartial(existingRole, partial)).toThrow("Invariant")
    })
  })
})

describe("applyAllowancePartial", () => {
  it("updates refill field", () => {
    const existingAllowance: Allowance = {
      key: "0x0000000000000000000000000000000000000000000000000000000000000001",
      refill: 100n,
      maxRefill: 1000n,
      period: 3600n,
      balance: 500n,
      timestamp: 1234567890n,
    }

    const partial: AllowancePartial = {
      key: "0x0000000000000000000000000000000000000000000000000000000000000001",
      refill: 200n,
    }

    const result = applyAllowancePartial(existingAllowance, partial)

    expect(result).toEqual({
      key: "0x0000000000000000000000000000000000000000000000000000000000000001",
      refill: 200n,
      maxRefill: 1000n,
      period: 3600n,
      balance: 500n,
      timestamp: 1234567890n,
    })
  })

  it("updates maxRefill field", () => {
    const existingAllowance: Allowance = {
      key: "0x0000000000000000000000000000000000000000000000000000000000000001",
      refill: 100n,
      maxRefill: 1000n,
      period: 3600n,
      balance: 500n,
      timestamp: 1234567890n,
    }

    const partial: AllowancePartial = {
      key: "0x0000000000000000000000000000000000000000000000000000000000000001",
      maxRefill: 2000n,
    }

    const result = applyAllowancePartial(existingAllowance, partial)

    expect(result).toEqual({
      key: "0x0000000000000000000000000000000000000000000000000000000000000001",
      refill: 100n,
      maxRefill: 2000n,
      period: 3600n,
      balance: 500n,
      timestamp: 1234567890n,
    })
  })

  it("updates period field", () => {
    const existingAllowance: Allowance = {
      key: "0x0000000000000000000000000000000000000000000000000000000000000001",
      refill: 100n,
      maxRefill: 1000n,
      period: 3600n,
      balance: 500n,
      timestamp: 1234567890n,
    }

    const partial: AllowancePartial = {
      key: "0x0000000000000000000000000000000000000000000000000000000000000001",
      period: 7200n,
    }

    const result = applyAllowancePartial(existingAllowance, partial)

    expect(result).toEqual({
      key: "0x0000000000000000000000000000000000000000000000000000000000000001",
      refill: 100n,
      maxRefill: 1000n,
      period: 7200n,
      balance: 500n,
      timestamp: 1234567890n,
    })
  })

  it("updates balance field", () => {
    const existingAllowance: Allowance = {
      key: "0x0000000000000000000000000000000000000000000000000000000000000001",
      refill: 100n,
      maxRefill: 1000n,
      period: 3600n,
      balance: 500n,
      timestamp: 1234567890n,
    }

    const partial: AllowancePartial = {
      key: "0x0000000000000000000000000000000000000000000000000000000000000001",
      balance: 750n,
    }

    const result = applyAllowancePartial(existingAllowance, partial)

    expect(result).toEqual({
      key: "0x0000000000000000000000000000000000000000000000000000000000000001",
      refill: 100n,
      maxRefill: 1000n,
      period: 3600n,
      balance: 750n,
      timestamp: 1234567890n,
    })
  })

  it("updates timestamp field", () => {
    const existingAllowance: Allowance = {
      key: "0x0000000000000000000000000000000000000000000000000000000000000001",
      refill: 100n,
      maxRefill: 1000n,
      period: 3600n,
      balance: 500n,
      timestamp: 1234567890n,
    }

    const partial: AllowancePartial = {
      key: "0x0000000000000000000000000000000000000000000000000000000000000001",
      timestamp: 9876543210n,
    }

    const result = applyAllowancePartial(existingAllowance, partial)

    expect(result).toEqual({
      key: "0x0000000000000000000000000000000000000000000000000000000000000001",
      refill: 100n,
      maxRefill: 1000n,
      period: 3600n,
      balance: 500n,
      timestamp: 9876543210n,
    })
  })

  it("throws on key mismatch", () => {
    const existingAllowance: Allowance = {
      key: "0x0000000000000000000000000000000000000000000000000000000000000001",
      refill: 100n,
      maxRefill: 1000n,
      period: 3600n,
      balance: 500n,
      timestamp: 1234567890n,
    }

    const partial: AllowancePartial = {
      key: "0x0000000000000000000000000000000000000000000000000000000000000002",
    }

    expect(() => applyAllowancePartial(existingAllowance, partial)).toThrow(
      "Invariant"
    )
  })
})

describe("applyRolesModifierPartial", () => {
  describe("roles field", () => {
    it("array replaces all roles", () => {
      const existingModifier: RolesModifier = {
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
        roles: [
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000001",
            members: ["0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
            targets: [],
            annotations: [],
            lastUpdate: 123456,
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
        multiSendAddresses: [],
      }

      const partial: RolesModifierPartial = {
        address: "0x1234567890123456789012345678901234567890",
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
      }

      const result = applyRolesModifierPartial(existingModifier, partial)

      expect(result).toEqual({
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
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
        multiSendAddresses: [],
      })
    })

    it("map merges with existing roles", () => {
      const existingModifier: RolesModifier = {
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
        roles: [
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000001",
            members: ["0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
            targets: [],
            annotations: [],
            lastUpdate: 123456,
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
        multiSendAddresses: [],
      }

      const partial: RolesModifierPartial = {
        address: "0x1234567890123456789012345678901234567890",
        roles: {
          "0x0000000000000000000000000000000000000000000000000000000000000001":
            {
              key: "0x0000000000000000000000000000000000000000000000000000000000000001",
              members: ["0xdddddddddddddddddddddddddddddddddddddddd"],
              lastUpdate: 999999,
            },
        },
        allowances: [],
      }

      const result = applyRolesModifierPartial(existingModifier, partial)

      expect(result).toEqual({
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
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
        multiSendAddresses: [],
      })
    })

    it("map adds new roles", () => {
      const existingModifier: RolesModifier = {
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
        roles: [
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000001",
            members: ["0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
            targets: [],
            annotations: [],
            lastUpdate: 123456,
          },
        ],
        allowances: [],
        multiSendAddresses: [],
      }

      const partial: RolesModifierPartial = {
        address: "0x1234567890123456789012345678901234567890",
        roles: {
          "0x0000000000000000000000000000000000000000000000000000000000000003":
            {
              key: "0x0000000000000000000000000000000000000000000000000000000000000003",
              members: ["0xcccccccccccccccccccccccccccccccccccccccc"],
              targets: [],
              annotations: [],
              lastUpdate: 345678,
            },
        },
        allowances: [],
      }

      const result = applyRolesModifierPartial(existingModifier, partial)

      expect(result).toEqual({
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
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
        multiSendAddresses: [],
      })
    })

    it("map updates existing roles", () => {
      const existingModifier: RolesModifier = {
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
        roles: [
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000001",
            members: ["0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
            targets: [
              {
                address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                clearance: Clearance.Target,
                executionOptions: ExecutionOptions.Send,
                functions: [],
              },
            ],
            annotations: [],
            lastUpdate: 123456,
          },
        ],
        allowances: [],
        multiSendAddresses: [],
      }

      const partial: RolesModifierPartial = {
        address: "0x1234567890123456789012345678901234567890",
        roles: {
          "0x0000000000000000000000000000000000000000000000000000000000000001":
            {
              key: "0x0000000000000000000000000000000000000000000000000000000000000001",
              members: ["0xdddddddddddddddddddddddddddddddddddddddd"],
            },
        },
        allowances: [],
      }

      const result = applyRolesModifierPartial(existingModifier, partial)

      expect(result).toEqual({
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
        roles: [
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000001",
            members: ["0xdddddddddddddddddddddddddddddddddddddddd"],
            targets: [
              {
                address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                clearance: Clearance.Target,
                executionOptions: ExecutionOptions.Send,
                functions: [],
              },
            ],
            annotations: [],
            lastUpdate: 123456,
          },
        ],
        allowances: [],
        multiSendAddresses: [],
      })
    })

    it("preserves non-mentioned roles when using map", () => {
      const existingModifier: RolesModifier = {
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
        roles: [
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000001",
            members: ["0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
            targets: [],
            annotations: [],
            lastUpdate: 123456,
          },
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000002",
            members: ["0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"],
            targets: [],
            annotations: [],
            lastUpdate: 789012,
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
        multiSendAddresses: [],
      }

      const partial: RolesModifierPartial = {
        address: "0x1234567890123456789012345678901234567890",
        roles: {
          "0x0000000000000000000000000000000000000000000000000000000000000002":
            {
              key: "0x0000000000000000000000000000000000000000000000000000000000000002",
              lastUpdate: 999999,
            },
        },
        allowances: [],
      }

      const result = applyRolesModifierPartial(existingModifier, partial)

      expect(result).toEqual({
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
        roles: [
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000001",
            members: ["0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
            targets: [],
            annotations: [],
            lastUpdate: 123456,
          },
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000002",
            members: ["0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"],
            targets: [],
            annotations: [],
            lastUpdate: 999999,
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
        multiSendAddresses: [],
      })
    })

    it("handles nested target updates in roles when using map", () => {
      const existingModifier: RolesModifier = {
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
        roles: [
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000001",
            members: ["0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
            targets: [
              {
                address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                clearance: Clearance.Target,
                executionOptions: ExecutionOptions.Send,
                functions: [
                  {
                    selector: "0x11111111",
                    executionOptions: ExecutionOptions.Send,
                    wildcarded: false,
                  },
                ],
              },
            ],
            annotations: [],
            lastUpdate: 123456,
          },
        ],
        allowances: [],
        multiSendAddresses: [],
      }

      const partial: RolesModifierPartial = {
        address: "0x1234567890123456789012345678901234567890",
        roles: {
          "0x0000000000000000000000000000000000000000000000000000000000000001":
            {
              key: "0x0000000000000000000000000000000000000000000000000000000000000001",
              targets: {
                "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": {
                  address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                  functions: {
                    "0x22222222": {
                      selector: "0x22222222",
                      executionOptions: ExecutionOptions.Both,
                      wildcarded: true,
                    },
                  },
                },
              },
            },
        },
        allowances: [],
      }

      const result = applyRolesModifierPartial(existingModifier, partial)

      expect(result).toEqual({
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
        roles: [
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000001",
            members: ["0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
            targets: [
              {
                address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                clearance: Clearance.Target,
                executionOptions: ExecutionOptions.Send,
                functions: [
                  {
                    selector: "0x11111111",
                    executionOptions: ExecutionOptions.Send,
                    wildcarded: false,
                  },
                  {
                    selector: "0x22222222",
                    executionOptions: ExecutionOptions.Both,
                    wildcarded: true,
                  },
                ],
              },
            ],
            annotations: [],
            lastUpdate: 123456,
          },
        ],
        allowances: [],
        multiSendAddresses: [],
      })
    })

    it("handles undefined roles (preserves existing)")
  })

  describe("allowances field", () => {
    it("array replaces all allowances", () => {
      const existingModifier: RolesModifier = {
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
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
            key: "0x0000000000000000000000000000000000000000000000000000000000000002",
            refill: 200n,
            maxRefill: 2000n,
            period: 7200n,
            balance: 750n,
            timestamp: 9876543210n,
          },
        ],
        multiSendAddresses: [],
      }

      const partial: RolesModifierPartial = {
        address: "0x1234567890123456789012345678901234567890",
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
      }

      const result = applyRolesModifierPartial(existingModifier, partial)

      expect(result).toEqual({
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
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
        multiSendAddresses: [],
      })
    })

    it("map merges with existing allowances", () => {
      const existingModifier: RolesModifier = {
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
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
            key: "0x0000000000000000000000000000000000000000000000000000000000000002",
            refill: 200n,
            maxRefill: 2000n,
            period: 7200n,
            balance: 750n,
            timestamp: 9876543210n,
          },
        ],
        multiSendAddresses: [],
      }

      const partial: RolesModifierPartial = {
        address: "0x1234567890123456789012345678901234567890",
        roles: [],
        allowances: {
          "0x0000000000000000000000000000000000000000000000000000000000000001":
            {
              key: "0x0000000000000000000000000000000000000000000000000000000000000001",
              balance: 999n,
            },
        },
      }

      const result = applyRolesModifierPartial(existingModifier, partial)

      expect(result).toEqual({
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
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
        multiSendAddresses: [],
      })
    })

    it("map adds new allowances", () => {
      const existingModifier: RolesModifier = {
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
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
        ],
        multiSendAddresses: [],
      }

      const partial: RolesModifierPartial = {
        address: "0x1234567890123456789012345678901234567890",
        roles: [],
        allowances: {
          "0x0000000000000000000000000000000000000000000000000000000000000003":
            {
              key: "0x0000000000000000000000000000000000000000000000000000000000000003",
              refill: 300n,
              maxRefill: 3000n,
              period: 10800n,
              balance: 1000n,
              timestamp: 1357924680n,
            },
        },
      }

      const result = applyRolesModifierPartial(existingModifier, partial)

      expect(result).toEqual({
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
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
        multiSendAddresses: [],
      })
    })

    it("map updates existing allowances", () => {
      const existingModifier: RolesModifier = {
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
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
        ],
        multiSendAddresses: [],
      }

      const partial: RolesModifierPartial = {
        address: "0x1234567890123456789012345678901234567890",
        roles: [],
        allowances: {
          "0x0000000000000000000000000000000000000000000000000000000000000001":
            {
              key: "0x0000000000000000000000000000000000000000000000000000000000000001",
              refill: 400n,
              balance: 800n,
            },
        },
      }

      const result = applyRolesModifierPartial(existingModifier, partial)

      expect(result).toEqual({
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
        roles: [],
        allowances: [
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000001",
            refill: 400n,
            maxRefill: 1000n,
            period: 3600n,
            balance: 800n,
            timestamp: 1234567890n,
          },
        ],
        multiSendAddresses: [],
      })
    })

    it("preserves non-mentioned allowances when using map", () => {
      const existingModifier: RolesModifier = {
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
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
            key: "0x0000000000000000000000000000000000000000000000000000000000000002",
            refill: 200n,
            maxRefill: 2000n,
            period: 7200n,
            balance: 750n,
            timestamp: 9876543210n,
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
        multiSendAddresses: [],
      }

      const partial: RolesModifierPartial = {
        address: "0x1234567890123456789012345678901234567890",
        roles: [],
        allowances: {
          "0x0000000000000000000000000000000000000000000000000000000000000002":
            {
              key: "0x0000000000000000000000000000000000000000000000000000000000000002",
              balance: 999n,
            },
        },
      }

      const result = applyRolesModifierPartial(existingModifier, partial)

      expect(result).toEqual({
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
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
            key: "0x0000000000000000000000000000000000000000000000000000000000000002",
            refill: 200n,
            maxRefill: 2000n,
            period: 7200n,
            balance: 999n,
            timestamp: 9876543210n,
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
        multiSendAddresses: [],
      })
    })
  })

  describe("other fields", () => {
    it("updates owner field", () => {
      const existingModifier: RolesModifier = {
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
        roles: [],
        allowances: [],
        multiSendAddresses: [],
      }

      const partial: RolesModifierPartial = {
        address: "0x1234567890123456789012345678901234567890",
        owner: "0xdddddddddddddddddddddddddddddddddddddddd",
        roles: [],
        allowances: [],
      }

      const result = applyRolesModifierPartial(existingModifier, partial)

      expect(result).toEqual({
        address: "0x1234567890123456789012345678901234567890",
        owner: "0xdddddddddddddddddddddddddddddddddddddddd",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
        roles: [],
        allowances: [],
        multiSendAddresses: [],
      })
    })

    it("updates avatar field", () => {
      const existingModifier: RolesModifier = {
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
        roles: [],
        allowances: [],
        multiSendAddresses: [],
      }

      const partial: RolesModifierPartial = {
        address: "0x1234567890123456789012345678901234567890",
        avatar: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        roles: [],
        allowances: [],
      }

      const result = applyRolesModifierPartial(existingModifier, partial)

      expect(result).toEqual({
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        target: "0x3333333333333333333333333333333333333333",
        roles: [],
        allowances: [],
        multiSendAddresses: [],
      })
    })

    it("updates target field", () => {
      const existingModifier: RolesModifier = {
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
        roles: [],
        allowances: [],
        multiSendAddresses: [],
      }

      const partial: RolesModifierPartial = {
        address: "0x1234567890123456789012345678901234567890",
        target: "0xffffffffffffffffffffffffffffffffffffffff",
        roles: [],
        allowances: [],
      }

      const result = applyRolesModifierPartial(existingModifier, partial)

      expect(result).toEqual({
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0xffffffffffffffffffffffffffffffffffffffff",
        roles: [],
        allowances: [],
        multiSendAddresses: [],
      })
    })

    it("updates multiSendAddresses field", () => {
      const existingModifier: RolesModifier = {
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
        roles: [],
        allowances: [],
        multiSendAddresses: ["0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
      }

      const partial: RolesModifierPartial = {
        address: "0x1234567890123456789012345678901234567890",
        multiSendAddresses: [
          "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          "0xcccccccccccccccccccccccccccccccccccccccc",
        ],
        roles: [],
        allowances: [],
      }

      const result = applyRolesModifierPartial(existingModifier, partial)

      expect(result).toEqual({
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
        roles: [],
        allowances: [],
        multiSendAddresses: [
          "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          "0xcccccccccccccccccccccccccccccccccccccccc",
        ],
      })
    })

    it("updates address field", () => {
      const existingModifier: RolesModifier = {
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
        roles: [],
        allowances: [],
        multiSendAddresses: [],
      }

      const partial: RolesModifierPartial = {
        address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        roles: [],
        allowances: [],
      }

      const result = applyRolesModifierPartial(existingModifier, partial)

      expect(result).toEqual({
        address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
        roles: [],
        allowances: [],
        multiSendAddresses: [],
      })
    })

    it("preserves fields not specified in partial", () => {
      const existingModifier: RolesModifier = {
        address: "0x1234567890123456789012345678901234567890",
        owner: "0x1111111111111111111111111111111111111111",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
        roles: [
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000001",
            members: ["0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
            targets: [],
            annotations: [],
            lastUpdate: 123456,
          },
        ],
        allowances: [
          {
            key: "0x0000000000000000000000000000000000000000000000000000000000000001",
            refill: 100n,
            maxRefill: 1000n,
            period: 3600n,
            balance: 500n,
            timestamp: 1234567890n,
          },
        ],
        multiSendAddresses: ["0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
      }

      const partial: RolesModifierPartial = {
        address: "0x1234567890123456789012345678901234567890",
        owner: "0xdddddddddddddddddddddddddddddddddddddddd",
        roles: [],
        allowances: [],
      }

      const result = applyRolesModifierPartial(existingModifier, partial)

      expect(result).toEqual({
        address: "0x1234567890123456789012345678901234567890",
        owner: "0xdddddddddddddddddddddddddddddddddddddddd",
        avatar: "0x2222222222222222222222222222222222222222",
        target: "0x3333333333333333333333333333333333333333",
        roles: [],
        allowances: [],
        multiSendAddresses: ["0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
      })
    })
  })
})
