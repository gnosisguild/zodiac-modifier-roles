import { TypedData, TypedDataDomain } from "abitype"
import { ZeroHash } from "ethers"

import { findRootTypes, hashType, parseType, typesForDomain } from "../types"
import { Encoding } from "zodiac-roles-deployments"

interface LayoutNode {
  parent: number
  encoding: Encoding
  typeHash: `0x${string}`
}

export function toAbiTypes({
  domain,
  types = {},
}: {
  domain?: TypedDataDomain
  types?: TypedData
}) {
  if (domain) {
    types = {
      ...types,
      EIP712Domain: typesForDomain(domain),
    } as any
  }

  const rootTypes = findRootTypes({ types })
  const result: LayoutNode[] = []

  // BFS queue: { type, parentIndex }
  const queue: { type: string; parentIndex: number }[] = []

  // Add root struct nodes directly. The encoded bytes are the tuple block for
  // the root struct itself, not `abi.encode(rootStruct)` with an outer wrapper.
  for (const rootType of rootTypes) {
    const { isStruct } = parseType(rootType)
    if (!isStruct) {
      throw new Error(`EIP-712 root type must be a struct, got: ${rootType}`)
    }

    const { typeHash } = hashType({ types, type: rootType })
    const rootIndex = result.length
    result.push({
      parent: rootIndex,
      encoding: Encoding.Tuple,
      typeHash,
    })

    for (const field of types[rootType]) {
      queue.push({ type: field.type, parentIndex: rootIndex })
    }
  }

  // BFS expansion
  while (queue.length > 0) {
    const { type, parentIndex } = queue.shift()!
    const currentIndex = result.length

    const {
      type: baseType,
      isAtomic,
      isStruct,
      isArray,
      fixedLength,
    } = parseType(type)

    if (isStruct) {
      const { typeHash } = hashType({ types, type })
      result.push({
        parent: parentIndex,
        encoding: Encoding.Tuple,
        typeHash,
      })
      // Add all fields to queue
      for (const field of types[type]) {
        queue.push({ type: field.type, parentIndex: currentIndex })
      }
    } else if (isArray && fixedLength) {
      // Fixed-length array treated as Tuple
      result.push({
        parent: parentIndex,
        encoding: Encoding.Tuple,
        typeHash: ZeroHash as `0x${string}`,
      })
      // Add each element to queue
      for (let i = 0; i < fixedLength; i++) {
        queue.push({ type: baseType, parentIndex: currentIndex })
      }
    } else if (isArray && !fixedLength) {
      // Dynamic array
      result.push({
        parent: parentIndex,
        encoding: Encoding.Array,
        typeHash: ZeroHash as `0x${string}`,
      })
      // Add element type to queue
      queue.push({ type: baseType, parentIndex: currentIndex })
    } else {
      // Atomic or dynamic primitive
      result.push({
        parent: parentIndex,
        encoding: isAtomic ? Encoding.Static : Encoding.Dynamic,
        typeHash: ZeroHash as `0x${string}`,
      })
      // No children for primitives
    }
  }

  return result
}
