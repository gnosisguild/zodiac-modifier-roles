import { BigNumber, BigNumberish, BytesLike } from "ethers"

import { Scoping, StructScoping } from "../src/presets/authoring/types"

// These are tests of the typing system, not the runtime behavior.
// There's nothing to run here, but the code should not have any TypeScript errors.

// @ts-expect-error - It should not be allowed to pass an empty object as a scoping for string
const _t01: Scoping<string> = {}

// @ts-expect-error - It should not be allowed to pass an empty object as a scoping for BigNumberish
const _t02: Scoping<BigNumberish> = {}

// @ts-expect-error - It should not be allowed to pass an empty object as a scoping for arrays
const _t03: Scoping<any[]> = {}

const _t04: StructScoping<{ a: Promise<string> }> = { a: "a" }

type T = [1, 2] extends { [key: string]: any } ? "yes" : "no"
