import { expect, test } from "vitest"
import { BigNumberish } from "ethers"
import { c } from "zodiac-roles-sdk"
import { Condition, Operator, ParameterType } from "zodiac-roles-deployments"

import { Scoping } from "../main/target/authoring/types"
import { allow } from "./typings"
import { checkRootConditionIntegrity } from "../main/condition/conditionIntegrity"

test("typings", async () => {
  // These are tests of the typing system, not the runtime behavior.
  // There's nothing to run here, but the code should not have any TypeScript errors.

  // @ts-expect-error - It should not be allowed to pass an empty object as a scoping for string
  const _t01: Scoping<string> = {}

  // @ts-expect-error - It should not be allowed to pass an empty object as a scoping for BigNumberish
  const _t02: Scoping<BigNumberish> = {}

  // @ts-expect-error - It should not be allowed to pass an empty object as a scoping for arrays
  const _t03: Scoping<any[]> = {}

  // @ts-expect-error - It should not be allowed to use promises as a scopings
  const _t04: Scoping<{ a: Promise<string> }> = { a: Promise.resolve("a") }

  // @ts-expect-error - It should only be allowed to use gt on BigNumberish scopings
  const _t05: Scoping<string[]> = c.gt(0)

  const _t07: Scoping<[Struct, Struct]> = c.matches([
    undefined,
    { wrong: "foo" },
  ] as const)

  const oneOf = (values: string[]) =>
    values.length === 0
      ? undefined
      : values.length === 1
        ? values[0]
        : c.or(...(values as [string, string, ...string[]]))

  // It should be allowed to only define scoping for some struct fields
  const _t06: Scoping<{ a: string; b: number }> = { a: oneOf(["foo", "bar"]) }

  // calldataMatches should have an overload scopings and ABI types
  c.calldataMatches([], [])
  // calldataMatches should have an overload allowing to pass a PresetFunction
  c.calldataMatches({
    targetAddress: "0x1234567890123456789012345678901234567890",
    selector: "0x12345678",
  })

  type Struct = {
    name: string
    version: string
  }
})

test("callWithinAllowance sets correct compValue", () => {
  const allowanceKey =
    "0x0000000000000000000000000000000000000000000000000000000000000001" as `0x${string}`

  // Use any allow kit function — they all go through applyOptions
  const permission = allow.mainnet.lido.stETH.submit(c.pass, {
    callWithinAllowance: allowanceKey,
  })

  // The condition tree should contain a CallWithinAllowance node
  // with compValue equal to the provided allowance key
  expect(permission.condition).toBeDefined()

  const condition = permission.condition!
  const callWithinAllowanceNode = condition.children?.find(
    (child) => child.operator === Operator.CallWithinAllowance
  )

  expect(callWithinAllowanceNode).toBeDefined()
  expect(callWithinAllowanceNode!.paramType).toBe(ParameterType.None)
  expect(callWithinAllowanceNode!.compValue).toBe(allowanceKey)

  // The condition should pass the SDK's own integrity check
  expect(() =>
    checkRootConditionIntegrity(condition as Condition)
  ).not.toThrow()
})

test("callWithinAllowance without etherWithinAllowance does not throw", () => {
  const allowanceKey =
    "0x00000000000000000000000000000000000000000000000000000000deadbeef" as `0x${string}`

  // This was the exact scenario that triggered the bug:
  // passing callWithinAllowance WITHOUT etherWithinAllowance caused
  // compValue to be undefined (it read options.etherWithinAllowance by mistake)
  expect(() => {
    const permission = allow.mainnet.lido.stETH.submit(c.pass, {
      callWithinAllowance: allowanceKey,
    })
    checkRootConditionIntegrity(permission.condition as Condition)
  }).not.toThrow()
})
