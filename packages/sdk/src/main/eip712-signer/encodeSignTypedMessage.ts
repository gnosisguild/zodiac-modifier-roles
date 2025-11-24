import { TypedData, TypedDataDomain } from "abitype"
import { Interface, keccak256 } from "ethers"

import {
  encodeAbiTypes,
  encodeTypedDomain,
  encodeTypedMessage,
  toAbiTypes,
} from "./encode"

const iface = Interface.from([
  "function hashSafeMessage(bytes message) view returns (bytes32)",
  "function hashTypedDomain(bytes data, ((uint8 encoding, uint256[] fields)[] layout, bytes32[] typeHashes) types) pure returns (bytes32)",
  "function hashTypedMessage(bytes domain, bytes message, ((uint8 encoding, uint256[] fields)[] layout, bytes32[] typeHashes) types) pure returns (bytes32 result)",
  "function hashTypedSafeMessage(bytes domain, bytes message, ((uint8 encoding, uint256[] fields)[] layout, bytes32[] typeHashes) types) view returns (bytes32)",
  "function signMessage(bytes message)",
  "function signTypedMessage(bytes domain, bytes message, ((uint8 encoding, uint256[] fields)[] layout, bytes32[] typeHashes) types)",
])

export function encodeSignTypedMessage({
  domain,
  types,
  message,
}: {
  domain: TypedDataDomain
  types: TypedData
  message: Record<string, any>
}) {
  /*
   * We want to hit the correct roles rule, and so we hash the types, and use
   * 4 leading bytes to determine the selector entrypoint within SignTypedMessageLib
   */
  const selector = keccak256(encodeAbiTypes({ domain, types })).slice(0, 10)

  const data = iface.encodeFunctionData("signTypedMessage", [
    encodeTypedDomain({ domain }),
    encodeTypedMessage({ types, message }),
    toAbiTypes({ domain, types }),
  ])

  return `${selector}${data.slice(10)}`
}

export function encodeSignMessage({ message }: { message: string }) {
  return iface.encodeFunctionData("signMessage", [message])
}
