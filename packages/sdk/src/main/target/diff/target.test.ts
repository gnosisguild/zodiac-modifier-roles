import { expect, it, suite } from "vitest"
import { ZeroAddress, ZeroHash } from "ethers"
import {
  Clearance,
  ExecutionOptions,
  Operator,
  ParameterType,
  Target,
} from "zodiac-roles-deployments"

import { normalizeCondition } from "../condition/normalizeCondition"
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

suite("diffTarget - Misc", () => {
  it("should revoke function-scoped targets", () => {
    const before: Target[] = [
      {
        address: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
        clearance: 2,
        executionOptions: 0,
        functions: [
          {
            selector: "0x095ea7b3",
            executionOptions: 0,
            wildcarded: false,
            condition: {
              paramType: ParameterType.None,
              operator: Operator.Pass,
            },
          },
        ],
      },
    ]
    const after: Target[] = []

    const { minus, plus } = diffTargets({ roleKey, prev: before, next: after })

    expect(minus).to.deep.equal([
      {
        call: "revokeTarget",
        roleKey,
        targetAddress: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
      },
      {
        call: "revokeFunction",
        roleKey,
        targetAddress: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
        selector: "0x095ea7b3",
      },
    ])

    expect(plus).to.deep.equal([])
  })

  it("should patch conditions", () => {
    const before: Target[] = [
      {
        address: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
        clearance: 2,
        executionOptions: 0,
        functions: [
          {
            selector: "0x095ea7b3",
            executionOptions: 0,
            wildcarded: false,
            condition: {
              paramType: ParameterType.None,
              operator: Operator.Pass,
            },
          },
        ],
      },
    ]

    const after: Target[] = [
      {
        address: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
        clearance: 2,
        executionOptions: 0,
        functions: [
          {
            selector: "0x095ea7b3",
            executionOptions: 0,
            wildcarded: false,
            condition: {
              paramType: ParameterType.None,
              operator: Operator.Or,
              children: [],
            },
          },
        ],
      },
    ]

    const { minus, plus } = diffTargets({ roleKey, prev: before, next: after })

    expect(minus).to.deep.equal([])

    expect(plus).to.deep.equal([
      {
        call: "scopeFunction",
        roleKey,
        targetAddress: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
        selector: "0x095ea7b3",
        executionOptions: 0,
        condition: normalizeCondition({
          paramType: ParameterType.None,
          operator: Operator.Or,
          children: [],
        }),
      },
    ])
  })

  it("should correctly diff target-cleared targets", () => {
    const a: Target[] = [
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
    ]

    const b: Target[] = [
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
    ]

    expect(diffTargets({ roleKey, prev: a, next: b })).to.deep.equal({
      minus: [],
      plus: [
        {
          call: "allowTarget",
          roleKey,
          targetAddress: "0x2",
          executionOptions: ExecutionOptions.Both,
        },
      ],
    })

    expect(diffTargets({ roleKey, prev: b, next: a })).to.deep.equal({
      minus: [
        {
          call: "allowTarget",
          roleKey,
          targetAddress: "0x2",
          executionOptions: ExecutionOptions.None,
        },
      ],
      plus: [],
    })
  })

  it("should diff functions based on all their properties including conditions", () => {
    const a: Target[] = [
      {
        address: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
        clearance: 2,
        executionOptions: 0,
        functions: [
          {
            selector: "0x095ea7b3",
            executionOptions: 0,
            wildcarded: false,
            condition: {
              paramType: ParameterType.None,
              operator: Operator.Pass,
            },
          },
        ],
      },
    ]

    const b: Target[] = [
      {
        address: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
        clearance: 2,
        executionOptions: 0,
        functions: [
          {
            selector: "0x095ea7b3",
            executionOptions: 0,
            wildcarded: false,
            condition: {
              paramType: ParameterType.Dynamic,
              operator: Operator.EqualTo,
              compValue: "0x00",
            },
          },
        ],
      },
    ]

    //expect(diffTargets(a, a)).to.deep.equal([])
    expect(diffTargets({ roleKey, prev: a, next: a })).to.deep.equal({
      minus: [],
      plus: [],
    })

    //expect(diffTargets(a, b)).to.deep.equal(a)
    expect(diffTargets({ roleKey, prev: b, next: a })).to.deep.equal({
      minus: [],
      plus: [
        {
          call: "scopeFunction",
          roleKey,
          targetAddress: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
          selector: "0x095ea7b3",
          executionOptions: 0,
          condition: normalizeCondition({
            paramType: ParameterType.None,
            operator: Operator.Pass,
          }),
        },
      ],
    })
  })
})
