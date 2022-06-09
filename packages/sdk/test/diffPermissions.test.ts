import { expect } from "chai"
import diffPermissions from "../src/diffPermissions"
import { Clearance, ExecutionOptions, RolePermissions } from "../src/types"

describe("diffPermissions", () => {
  it("should correctly diff target-cleared targets", () => {
    const a: RolePermissions = {
      targets: [
        {
          address: "0x1",
          clearance: Clearance.Target,
          executionOptions: ExecutionOptions.None,
          functions: [],
        },
        {
          address: "0x2",
          clearance: Clearance.Target,
          executionOptions: ExecutionOptions.None,
          functions: [],
        },
      ],
    }

    const b: RolePermissions = {
      targets: [
        {
          address: "0x1",
          clearance: Clearance.Target,
          executionOptions: ExecutionOptions.None,
          functions: [],
        },
        {
          address: "0x2",
          clearance: Clearance.Target,
          executionOptions: ExecutionOptions.Both,
          functions: [],
        },
      ],
    }

    expect(diffPermissions(a, b)).to.deep.equal({
      targets: [
        {
          address: "0x2",
          clearance: Clearance.Target,
          executionOptions: ExecutionOptions.None,
          functions: [],
        },
      ],
    })
    expect(diffPermissions(b, a)).to.deep.equal({
      targets: [
        {
          address: "0x2",
          clearance: Clearance.Target,
          executionOptions: ExecutionOptions.Both,
          functions: [],
        },
      ],
    })
  })
})
