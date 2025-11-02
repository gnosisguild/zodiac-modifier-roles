import { expect, it, suite } from "vitest"
import { ZeroAddress, ZeroHash } from "ethers"
import {
  ExecutionOptions,
  Function,
  Operator,
  AbiType,
} from "zodiac-roles-deployments"

import { diffFunction, diffFunctions } from "./function"
import { abiEncode } from "../../abiEncode"
import { conditionId, normalizeCondition } from "../../condition"

const roleKey = ZeroHash as `0x${string}`
const targetAddress = ZeroAddress as `0x${string}`
const selector: `0x${string}` = "0xaabbccdd"

const staticComp = (id: number) => ({
  paramType: AbiType.Static,
  operator: Operator.Custom,
  compValue: abiEncode(["uint256"], [id]),
})

suite("diffFunction", () => {
  it("fn did not previously exist, now is scoped", () => {
    const next = {
      selector,
      executionOptions: ExecutionOptions.Send,
      wildcarded: false,
      condition: staticComp(1),
    }

    const { minus, plus } = diffFunction({ roleKey, targetAddress, next })

    expect(minus).toHaveLength(0)
    expect(plus).toHaveLength(1)
    expect(plus).toEqual([
      {
        call: "scopeFunction",
        roleKey,
        targetAddress,
        selector,
        executionOptions: ExecutionOptions.Send,
        condition: normalizeCondition(staticComp(1)),
      },
    ])
  })
  it("fn did not previously exist, now is wildcarded", () => {
    const next = {
      selector,
      executionOptions: ExecutionOptions.None,
      wildcarded: true,
    }

    const { minus, plus } = diffFunction({ roleKey, targetAddress, next })

    expect(minus).toHaveLength(0)
    expect(plus).toHaveLength(1)
    expect(plus).toEqual([
      {
        call: "allowFunction",
        roleKey,
        targetAddress,
        selector,
        executionOptions: ExecutionOptions.None,
      },
    ])
  })
  it("fn was scoped, now does not exist", () => {
    const prev = {
      selector,
      executionOptions: ExecutionOptions.Send,
      wildcarded: false,
      condition: staticComp(1),
    }

    const { minus, plus } = diffFunction({ roleKey, targetAddress, prev })

    expect(minus).toHaveLength(1)
    expect(minus).toEqual([
      {
        call: "revokeFunction",
        roleKey,
        targetAddress,
        selector,
      },
    ])
    expect(plus).toHaveLength(0)
  })
  it("fn was wildcarded, now does not exist", () => {
    const prev = {
      selector,
      executionOptions: ExecutionOptions.Send,
      wildcarded: true,
    }

    const { minus, plus } = diffFunction({ roleKey, targetAddress, prev })

    expect(minus).toHaveLength(1)
    expect(minus).toEqual([
      {
        call: "revokeFunction",
        roleKey,
        targetAddress,
        selector,
      },
    ])
    expect(plus).toHaveLength(0)
  })

  it("was scoped, now is wildcarded", () => {
    const scoped = {
      selector,
      executionOptions: ExecutionOptions.Send,
      wildcarded: false,
      condition: staticComp(1),
    }

    const wildcarded = {
      selector,
      executionOptions: ExecutionOptions.None,
      wildcarded: true,
    }

    const { minus, plus } = diffFunction({
      roleKey,
      targetAddress,
      prev: scoped,
      next: wildcarded,
    })

    expect(minus).toHaveLength(0)
    expect(plus).toHaveLength(1)
    expect(plus).toEqual([
      {
        call: "allowFunction",
        roleKey,
        targetAddress,
        selector,
        executionOptions: ExecutionOptions.None,
      },
    ])
  })
  it("was wildcarded, now is scoped", () => {
    const scoped = {
      selector,
      executionOptions: ExecutionOptions.Send,
      wildcarded: false,
      condition: staticComp(1),
    }
    const wildcarded = {
      selector,
      executionOptions: ExecutionOptions.None,
      wildcarded: true,
    }

    const { minus, plus } = diffFunction({
      roleKey,
      targetAddress,
      prev: wildcarded,
      next: scoped,
    })

    expect(minus).toHaveLength(1)
    expect(plus).toHaveLength(0)
    expect(minus).toEqual([
      {
        call: "scopeFunction",
        roleKey,
        targetAddress,
        selector,
        executionOptions: ExecutionOptions.Send,
        condition: normalizeCondition(staticComp(1)),
      },
    ])
  })

  it("was scoped, now is scoped, different conditions", () => {
    const scoped1 = {
      selector,
      executionOptions: ExecutionOptions.Send,
      wildcarded: false,
      condition: staticComp(1),
    }
    const scope2 = {
      selector,
      executionOptions: ExecutionOptions.DelegateCall,
      wildcarded: false,
      condition: staticComp(2),
    }

    const { minus, plus } = diffFunction({
      roleKey,
      targetAddress,
      prev: scoped1,
      next: scope2,
    })

    expect(minus).toHaveLength(0)
    expect(plus).toHaveLength(1)
    expect(plus).toEqual([
      {
        call: "scopeFunction",
        roleKey,
        targetAddress,
        selector,
        executionOptions: ExecutionOptions.DelegateCall,
        condition: normalizeCondition(staticComp(2)),
      },
    ])
  })
  it("was scoped, now is scoped, equal conditions", () => {
    const scoped1 = {
      selector,
      executionOptions: ExecutionOptions.Send,
      wildcarded: false,
      condition: staticComp(3),
    }
    const scope2 = {
      selector,
      executionOptions: ExecutionOptions.Send,
      wildcarded: false,
      condition: staticComp(3),
    }

    const { minus, plus } = diffFunction({
      roleKey,
      targetAddress,
      prev: scoped1,
      next: scope2,
    })

    expect(minus).toHaveLength(0)
    expect(plus).toHaveLength(0)
  })
  it("was scoped, now is scoped, equivalent conditions (normalize to same)", () => {
    const condition1 = {
      paramType: AbiType.None,
      operator: Operator.And,
      children: [staticComp(0), staticComp(0), staticComp(1)],
    }
    const condition2 = {
      paramType: AbiType.None,
      operator: Operator.And,
      children: [staticComp(0), staticComp(1)],
    }
    expect(conditionId(normalizeCondition(condition1))).toEqual(
      conditionId(normalizeCondition(condition2))
    )

    const scoped1 = {
      selector,
      executionOptions: ExecutionOptions.Send,
      wildcarded: false,
      condition: condition1,
    }
    const scope2 = {
      selector,
      executionOptions: ExecutionOptions.Send,
      wildcarded: false,
      condition: condition2,
    }

    const { minus, plus } = diffFunction({
      roleKey,
      targetAddress,
      prev: scoped1,
      next: scope2,
    })

    expect(minus).toHaveLength(0)
    expect(plus).toHaveLength(0)
  })

  it("both equal scoped, was EO.None is EO.Both", () => {
    const was = ExecutionOptions.None
    const is = ExecutionOptions.Both
    const prev = {
      selector,
      executionOptions: was,
      wildcarded: false,
      condition: staticComp(1),
    }
    const next = {
      selector,
      executionOptions: is,
      wildcarded: false,
      condition: staticComp(1),
    }

    const { minus, plus } = diffFunction({
      roleKey,
      targetAddress,
      prev,
      next,
    })

    expect(minus).toHaveLength(0)
    expect(plus).toHaveLength(1)
    expect(plus).toEqual([
      {
        call: "scopeFunction",
        roleKey,
        targetAddress,
        selector,
        executionOptions: is,
        condition: normalizeCondition(next.condition),
      },
    ])
  })
  it("both equal scoped, was EO.Both is EO.Send", () => {
    const was = ExecutionOptions.Both
    const is = ExecutionOptions.Send
    const prev = {
      selector,
      executionOptions: was,
      wildcarded: false,
      condition: staticComp(1),
    }
    const next = {
      selector,
      executionOptions: is,
      wildcarded: false,
      condition: staticComp(1),
    }

    const { minus, plus } = diffFunction({
      roleKey,
      targetAddress,
      prev,
      next,
    })

    expect(minus).toHaveLength(1)
    expect(plus).toHaveLength(0)
    expect(minus).toEqual([
      {
        call: "scopeFunction",
        roleKey,
        targetAddress,
        selector,
        executionOptions: is,
        condition: normalizeCondition(next.condition),
      },
    ])
  })
  it("both equal wildcarded, was EO.None is EO.Send", () => {
    const was = ExecutionOptions.None
    const is = ExecutionOptions.Send
    const prev = {
      selector,
      executionOptions: was,
      wildcarded: true,
    }
    const next = {
      selector,
      executionOptions: is,
      wildcarded: true,
    }

    const { minus, plus } = diffFunction({
      roleKey,
      targetAddress,
      prev,
      next,
    })

    expect(minus).toHaveLength(0)
    expect(plus).toHaveLength(1)
    expect(plus).toEqual([
      {
        call: "allowFunction",
        roleKey,
        targetAddress,
        selector,
        executionOptions: is,
      },
    ])
  })
  it("both equal wildcarded, was EO.delegateCall is EO.none", () => {
    const was = ExecutionOptions.DelegateCall
    const is = ExecutionOptions.None
    const prev = {
      selector,
      executionOptions: was,
      wildcarded: true,
    }
    const next = {
      selector,
      executionOptions: is,
      wildcarded: true,
    }

    const { minus, plus } = diffFunction({
      roleKey,
      targetAddress,
      prev,
      next,
    })

    expect(minus).toHaveLength(1)
    expect(plus).toHaveLength(0)
    expect(minus).toEqual([
      {
        call: "allowFunction",
        roleKey,
        targetAddress,
        selector,
        executionOptions: is,
      },
    ])
  })
})

suite("diffFunctions", () => {
  it("it diffs and merges from collections", () => {
    const prev: Function[] = [
      {
        selector: "0x01",
        executionOptions: ExecutionOptions.Both,
        wildcarded: true,
      },
      {
        selector: "0x02",
        executionOptions: ExecutionOptions.Send,
        wildcarded: true,
      },
    ]

    const next: Function[] = [
      {
        selector: "0x02",
        executionOptions: ExecutionOptions.Send,
        wildcarded: true,
      },
      {
        selector: "0x03",
        executionOptions: ExecutionOptions.Send,
        wildcarded: true,
      },
    ]

    const { minus, plus } = diffFunctions({
      roleKey,
      targetAddress,
      prev,
      next,
    })

    expect(minus).toHaveLength(1)
    expect(plus).toHaveLength(1)
  })
})
