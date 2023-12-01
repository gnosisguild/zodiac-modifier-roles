import { expect } from "chai"

import { removeObsoleteCalls } from "../src/calls"
import { Call } from "../src/calls/types"
import { ExecutionOptions } from "../src/types"

describe("removeObsoleteCalls", () => {
  it("should remove function permission updates if later on the entire target is cleared", () => {
    const calls: Call[] = [
      {
        call: "allowFunction",
        targetAddress: "0x1",
        selector: "0x12345678",
        executionOptions: ExecutionOptions.None,
      },
      {
        call: "allowTarget",
        targetAddress: "0x1",
        executionOptions: ExecutionOptions.None,
      },
    ]

    const result = removeObsoleteCalls(calls)
    expect(result).to.deep.equal([
      {
        call: "allowTarget",
        targetAddress: "0x1",
        executionOptions: ExecutionOptions.None,
      },
    ])
  })

  it("should not remove function permission updates if the target will be cleared but then later updated to function scoping", () => {
    const calls: Call[] = [
      {
        call: "allowFunction",
        targetAddress: "0x1",
        selector: "0x12345678",
        executionOptions: ExecutionOptions.None,
      },
      {
        call: "allowTarget",
        targetAddress: "0x1",
        executionOptions: ExecutionOptions.None,
      },
      {
        call: "scopeTarget",
        targetAddress: "0x1",
      },
    ]

    const result = removeObsoleteCalls(calls)
    expect(result).to.deep.equal([
      {
        call: "allowFunction",
        targetAddress: "0x1",
        selector: "0x12345678",
        executionOptions: ExecutionOptions.None,
      },
      {
        call: "scopeTarget",
        targetAddress: "0x1",
      },
    ])
  })
})
