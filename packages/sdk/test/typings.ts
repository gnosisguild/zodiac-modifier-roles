import { BigNumber, BigNumberish, BytesLike } from "ethers"

import { or } from "../src/presets/authoring/conditions/branching"
import {
  ConditionFunction,
  Scoping,
  StructScoping,
  ArrayScoping,
} from "../src/presets/authoring/conditions/types"

// These are tests of the typing system, not the runtime behavior.
// There's nothing to run here, but the code should not have any TypeScript errors.

// @ts-expect-error - It should not be allowed to pass an empty object as a scoping for string
const _t01: Scoping<string> = {}

// @ts-expect-error - It should not be allowed to pass an empty object as a scoping for BigNumberish
const _t02: Scoping<BigNumberish> = {}

// @ts-expect-error - It should not be allowed to pass an empty object as a scoping for arrays
const _t03: Scoping<any[]> = {}

// @ts-expect-error - It should not be allowed to promises as a scopings
const _t04: Scoping<{ a: Promise<string> }> = { a: Promise.resolve("a") }

type S = Scoping<{ a: string; b: number }[]>
type T = ArrayScoping<{ a: string; b: number }[]>

type R = ArrayScoping<{ a: string; b: number }[]> extends Scoping<any>
  ? "yes"
  : "no"

type T = [1, 2] extends { [key: string]: any } ? "yes" : "no"
