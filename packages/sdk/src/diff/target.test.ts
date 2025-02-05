import { expect, it, suite } from "vitest"
import { Clearance, ExecutionOptions, Target } from "zodiac-roles-deployments"

import { ZeroAddress, ZeroHash } from "ethers"

import { diffTarget, diffTargets } from "./target"

const roleKey = ZeroHash
const address = ZeroAddress as `0x${string}`
const targetAddress = address

suite("diffTarget", () => {
  it("was undefined, is Clearance.Function", () => {
    const is = Clearance.Function

    const next: Target = {
      address,
      clearance: is,
      executionOptions: ExecutionOptions.None,
      functions: [],
    }

    const { minus, plus } = diffTarget({
      roleKey,
      next,
    })

    expect(minus).toHaveLength(0)
    expect(plus).toHaveLength(1)
    expect(plus).toEqual([
      {
        call: "scopeTarget",
        roleKey,
        targetAddress,
      },
    ])
  })

  it("was Clearance.None, is Clearance.Function", () => {
    const was = Clearance.None
    const is = Clearance.Function

    const prev: Target = {
      address,
      clearance: was,
      executionOptions: ExecutionOptions.None,
      functions: [],
    }
    const next: Target = {
      address,
      clearance: is,
      executionOptions: ExecutionOptions.None,
      functions: [],
    }

    const { minus, plus } = diffTarget({
      roleKey,
      prev,
      next,
    })

    expect(minus).toHaveLength(0)
    expect(plus).toHaveLength(1)
    expect(plus).toEqual([
      {
        call: "scopeTarget",
        roleKey,
        targetAddress,
      },
    ])
  })

  it("was Clearance.None, is Clearance.Target", () => {
    const was = Clearance.None
    const is = Clearance.Target

    const prev: Target = {
      address,
      clearance: was,
      executionOptions: ExecutionOptions.None,
      functions: [],
    }
    const next: Target = {
      address,
      clearance: is,
      executionOptions: ExecutionOptions.Send,
      functions: [],
    }

    const { minus, plus } = diffTarget({
      roleKey,
      prev,
      next,
    })

    expect(minus).toHaveLength(0)
    expect(plus).toHaveLength(1)
    expect(plus).toEqual([
      {
        call: "allowTarget",
        roleKey,
        targetAddress,
        executionOptions: ExecutionOptions.Send,
      },
    ])
  })

  it("was Clearance.Function, is Clearance.None", () => {
    const was = Clearance.Function
    const is = Clearance.None

    const prev: Target = {
      address,
      clearance: was,
      executionOptions: ExecutionOptions.None,
      functions: [],
    }
    const next: Target = {
      address,
      clearance: is,
      executionOptions: ExecutionOptions.None,
      functions: [],
    }

    const { minus, plus } = diffTarget({
      roleKey,
      prev,
      next,
    })

    expect(minus).toHaveLength(1)
    expect(plus).toHaveLength(0)
    expect(minus).toEqual([
      {
        call: "revokeTarget",
        roleKey,
        targetAddress,
      },
    ])
  })

  it("was Clearance.Function, is Clearance.Function", () => {
    const was = Clearance.Function
    const is = Clearance.Function

    const prev: Target = {
      address,
      clearance: was,
      executionOptions: ExecutionOptions.None,
      functions: [],
    }
    const next: Target = {
      address,
      clearance: is,
      executionOptions: ExecutionOptions.None,
      functions: [],
    }

    const { minus, plus } = diffTarget({
      roleKey,
      prev,
      next,
    })

    expect(minus).toHaveLength(0)
    expect(plus).toHaveLength(0)
  })

  it("was Clearance.Function, is Clearance.Target", () => {
    const was = Clearance.Function
    const is = Clearance.Target

    const prev: Target = {
      address,
      clearance: was,
      executionOptions: ExecutionOptions.None,
      functions: [],
    }
    const next: Target = {
      address,
      clearance: is,
      executionOptions: ExecutionOptions.Both,
      functions: [],
    }

    const { minus, plus } = diffTarget({
      roleKey,
      prev,
      next,
    })

    expect(minus).toHaveLength(0)
    expect(plus).toHaveLength(1)
    expect(plus).toEqual([
      {
        call: "allowTarget",
        roleKey,
        targetAddress,
        executionOptions: ExecutionOptions.Both,
      },
    ])
  })

  it("was Clearance.Target, undefined", () => {
    const was = Clearance.Target
    const is = Clearance.None

    const prev: Target = {
      address,
      clearance: was,
      executionOptions: ExecutionOptions.None,
      functions: [],
    }

    const { minus, plus } = diffTarget({
      roleKey,
      prev,
    })

    expect(minus).toHaveLength(1)
    expect(plus).toHaveLength(0)
    expect(minus).toEqual([
      {
        call: "revokeTarget",
        roleKey,
        targetAddress,
      },
    ])
  })

  it("was Clearance.Target, is Clearance.None", () => {
    const was = Clearance.Target
    const is = Clearance.None

    const prev: Target = {
      address,
      clearance: was,
      executionOptions: ExecutionOptions.None,
      functions: [],
    }
    const next: Target = {
      address,
      clearance: is,
      executionOptions: ExecutionOptions.None,
      functions: [],
    }

    const { minus, plus } = diffTarget({
      roleKey,
      prev,
      next,
    })

    expect(minus).toHaveLength(1)
    expect(plus).toHaveLength(0)
    expect(minus).toEqual([
      {
        call: "revokeTarget",
        roleKey,
        targetAddress,
      },
    ])
  })

  it("was Clearance.Target, is Clearance.Function", () => {
    const was = Clearance.Target
    const is = Clearance.Function

    const prev: Target = {
      address,
      clearance: was,
      executionOptions: ExecutionOptions.None,
      functions: [],
    }
    const next: Target = {
      address,
      clearance: is,
      executionOptions: ExecutionOptions.None,
      functions: [],
    }

    const { minus, plus } = diffTarget({
      roleKey,
      prev,
      next,
    })

    expect(minus).toHaveLength(1)
    expect(plus).toHaveLength(0)
    expect(minus).toEqual([
      {
        call: "scopeTarget",
        roleKey,
        targetAddress,
      },
    ])
  })

  it("was Clearance.Target, is Clearance.Target", () => {
    const was = Clearance.Target
    const is = Clearance.Target

    const prev: Target = {
      address,
      clearance: was,
      executionOptions: ExecutionOptions.None,
      functions: [],
    }
    const next: Target = {
      address,
      clearance: is,
      executionOptions: ExecutionOptions.None,
      functions: [],
    }

    const { minus, plus } = diffTarget({
      roleKey,
      prev,
      next,
    })

    expect(minus).toHaveLength(0)
    expect(plus).toHaveLength(0)
  })

  it("Both Clearance.Target, ExecutionOptions plus", () => {
    const was = Clearance.Target
    const is = Clearance.Target

    const prev: Target = {
      address,
      clearance: was,
      executionOptions: ExecutionOptions.None,
      functions: [],
    }
    const next: Target = {
      address,
      clearance: is,
      executionOptions: ExecutionOptions.Send,
      functions: [],
    }

    const { minus, plus } = diffTarget({
      roleKey,
      prev,
      next,
    })

    expect(minus).toHaveLength(0)
    expect(plus).toHaveLength(1)
    expect(plus).toEqual([
      {
        call: "allowTarget",
        roleKey,
        targetAddress,
        executionOptions: ExecutionOptions.Send,
      },
    ])
  })

  it("Both Clearance.Target, ExecutionOptions minus", () => {
    const was = Clearance.Target
    const is = Clearance.Target

    const prev: Target = {
      address,
      clearance: was,
      executionOptions: ExecutionOptions.Both,
      functions: [],
    }
    const next: Target = {
      address,
      clearance: is,
      executionOptions: ExecutionOptions.Send,
      functions: [],
    }

    const { minus, plus } = diffTarget({
      roleKey,
      targetAddress,
      prev,
      next,
    })

    expect(minus).toHaveLength(1)
    expect(plus).toHaveLength(0)
    expect(minus).toEqual([
      {
        call: "allowTarget",
        roleKey,
        targetAddress,
        executionOptions: ExecutionOptions.Send,
      },
    ])
  })

  it("Merges diff with inner diffFunctions", () => {
    const was = Clearance.Target
    const is = Clearance.Target

    const prev: Target = {
      address,
      clearance: was,
      executionOptions: ExecutionOptions.Both,
      functions: [
        {
          selector: "0x01",
          executionOptions: ExecutionOptions.Send,
          wildcarded: true,
        },
      ],
    }
    const next: Target = {
      address,
      clearance: is,
      executionOptions: ExecutionOptions.Both,
      functions: [
        {
          selector: "0x02",
          executionOptions: ExecutionOptions.DelegateCall,
          wildcarded: true,
        },
      ],
    }

    const { minus, plus } = diffTarget({
      roleKey,
      prev,
      next,
    })

    expect(minus).toHaveLength(1)
    expect(plus).toHaveLength(1)
    expect(minus).toEqual([
      {
        call: "revokeFunction",
        roleKey,
        targetAddress,
        selector: "0x01",
      },
    ])
    expect(plus).toEqual([
      {
        call: "allowFunction",
        roleKey,
        targetAddress,
        selector: "0x02",
        executionOptions: ExecutionOptions.DelegateCall,
      },
    ])
  })
})

suite("diffTargets", () => {
  it("it diffs and merges from collections", () => {
    const prev: Target[] = [
      {
        address: "0x01",
        clearance: Clearance.Target,
        executionOptions: ExecutionOptions.None,
        functions: [],
      },
      {
        address: "0x02",
        clearance: Clearance.Target,
        executionOptions: ExecutionOptions.None,
        functions: [],
      },
    ]

    const next: Target[] = [
      {
        address: "0x02",
        clearance: Clearance.Target,
        executionOptions: ExecutionOptions.None,
        functions: [],
      },
      {
        address: "0x03",
        clearance: Clearance.Target,
        executionOptions: ExecutionOptions.None,
        functions: [],
      },
    ]

    expect(
      diffTargets({
        roleKey,
        prev,
        next,
      })
    ).toEqual({
      minus: [{ call: "revokeTarget", roleKey, targetAddress: "0x01" }],
      plus: [
        {
          call: "allowTarget",
          roleKey,
          targetAddress: "0x03",
          executionOptions: ExecutionOptions.None,
        },
      ],
    })
  })
})
