import { BigNumberish } from "ethers"

import * as c from "../src/permissions/authoring/conditions"
import { Scoping } from "../src/permissions/authoring/conditions/types"

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

// calldataMatches should have an overload scopings and ABI types
c.calldataMatches([], [])
// calldataMatches should have an overload allowing to pass a PresetFunction
c.calldataMatches({
  targetAddress: "0x1234567890123456789012345678901234567890",
  selector: "0x12345678",
})
