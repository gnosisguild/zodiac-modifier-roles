import { TypedData } from "abitype"
import { keccak256, toUtf8Bytes } from "ethers"

import { allTypes } from "./allTypes"
import { isStructType } from "./parseType"

export function hashType({ types, type }: { types: TypedData; type: string }) {
  const typeSignature = signature(types, type)
  const typeHash = keccak256(toUtf8Bytes(typeSignature)) as `0x${string}`
  return { typeSignature, typeHash }
}

function signature(types: TypedData, entrypoint: string) {
  const allStructTypes = [
    entrypoint,
    ...allTypes(types, [entrypoint])
      .slice(1) // we wanna keep the entrypoint at root, only sort the rest
      .filter((type) => isStructType(type))
      .sort(),
  ]

  return allStructTypes
    .map(
      (type) =>
        `${type}(${types[type]
          .map(({ name, type }) => `${type} ${name}`)
          .join(",")})`
    )
    .join("")
}
