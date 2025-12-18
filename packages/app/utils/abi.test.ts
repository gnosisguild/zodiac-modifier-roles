import { describe, expect, it } from "vitest"
import { tupleValues } from "./abi"
import { AbiParameter } from "viem"

describe("tupleValues", () => {
  it("should return array as-is if already an array", () => {
    const components: AbiParameter[] = [
      { name: "a", type: "uint256" },
      { name: "b", type: "string" },
    ]
    const arrayValue = [123n, "hello"]
    expect(tupleValues(arrayValue, components)).toEqual(arrayValue)
  })

  it("should convert named tuple object to array in component order", () => {
    const components: AbiParameter[] = [
      { name: "a", type: "uint256" },
      { name: "b", type: "string" },
      { name: "c", type: "bool" },
    ]
    const tupleObject = {
      a: 123n,
      b: "hello",
      c: true,
    }
    expect(tupleValues(tupleObject, components)).toEqual([123n, "hello", true])
  })

  it("should convert unnamed tuple object to array in component order", () => {
    const components: AbiParameter[] = [
      { type: "uint256" },
      { type: "string" },
      { type: "bool" },
    ]
    // viem uses numeric string keys for unnamed components
    const tupleObject = {
      "0": 123n,
      "1": "hello",
      "2": true,
    }
    expect(tupleValues(tupleObject, components)).toEqual([123n, "hello", true])
  })

  it("should handle mixed named and unnamed components", () => {
    const components: AbiParameter[] = [
      { name: "a", type: "uint256" },
      { type: "string" }, // unnamed
      { name: "c", type: "bool" },
    ]
    const tupleObject = {
      a: 123n,
      "1": "hello", // unnamed component uses numeric string key
      c: true,
    }
    expect(tupleValues(tupleObject, components)).toEqual([123n, "hello", true])
  })

  it("should preserve order even if object keys are out of order", () => {
    const components: AbiParameter[] = [
      { name: "a", type: "uint256" },
      { name: "b", type: "string" },
      { name: "c", type: "bool" },
    ]
    // Object keys in different order
    const tupleObject = {
      c: true,
      a: 123n,
      b: "hello",
    }
    // Should still return in component order
    expect(tupleValues(tupleObject, components)).toEqual([123n, "hello", true])
  })

  it("should handle empty tuple", () => {
    const components: AbiParameter[] = []
    const tupleObject = {}
    expect(tupleValues(tupleObject, components)).toEqual([])
  })
})
