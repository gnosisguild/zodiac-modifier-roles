import { expect, test } from "vitest"
import { c } from "zodiac-roles-sdk"
import { Condition, Operator, ParameterType } from "zodiac-roles-deployments"

import { Scoping } from "../main/target/authoring/types"
import { allow } from "./typings"
import { checkRootConditionIntegrity } from "../main/condition/conditionIntegrity"

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
