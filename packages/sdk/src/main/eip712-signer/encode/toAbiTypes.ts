import { TypedData, TypedDataDomain } from "abitype"
import { ZeroHash } from "ethers"

import {
  allTypes,
  findRootTypes,
  hashType,
  parseType,
  typesForDomain,
} from "../types"
import { Encoding } from "zodiac-roles-deployments"

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

  const abiTypes = [
    ...rootTypes.map((_, index) => ({
      encoding: Encoding.AbiEncoded,
      typeHash: ZeroHash as `0x${string}`,
      typeSignature: "",
      fields: [index],
    })),
    ...allTypes(types, rootTypes).map((type, _, allTypes) => {
      const {
        type: baseType,
        isAtomic,
        isStruct,
        isArray,
        fixedLength,
      } = parseType(type)

      if (isStruct) {
        const { typeSignature, typeHash } = hashType({ types, type })
        return {
          encoding: Encoding.Tuple,
          typeHash,
          typeSignature,
          fields: types[type].map((field) => allTypes.indexOf(field.type)),
        }
      }

      if (isArray && fixedLength) {
        return {
          encoding: Encoding.Tuple,
          typeHash: ZeroHash as `0x${string}`,
          typeSignature: "",
          fields: new Array(fixedLength).fill(allTypes.indexOf(baseType)),
        }
      }

      if (isArray && !fixedLength) {
        return {
          encoding: Encoding.Array,
          typeHash: ZeroHash as `0x${string}`,
          typeSignature: "",
          fields: [allTypes.indexOf(baseType)],
        }
      }

      return {
        encoding: isAtomic ? Encoding.Static : Encoding.Dynamic,
        typeHash: ZeroHash as `0x${string}`,
        typeSignature: "",
        fields: [],
      }
    }),
  ].map((a) => ({ ...a, fields: a.fields.map((f) => f + rootTypes.length) }))

  return {
    layout: abiTypes.map(({ encoding, fields }) => ({ encoding, fields })),
    typeHashes: abiTypes.map(({ typeHash }) => typeHash),
  }
}
