import { TypedData, TypedDataDomain } from "abitype"
import { Interface, keccak256, toUtf8Bytes } from "ethers"

import {
  encodeAbiTypes,
  encodeTypedDomain,
  encodeTypedMessage,
  toAbiTypes,
} from "./encode"

const iface = Interface.from([
  "function signMessage(bytes message)",
  "function personalSign(bytes message)",
  "function signTypedMessage(bytes domain, bytes message, (uint256 parent, uint8 encoding, bytes32 typeHash)[] types)",
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
    toAbiTypes({ domain, types }).map((n) => [
      n.parent,
      n.encoding,
      n.typeHash,
    ]),
  ])

  return `${selector}${data.slice(10)}`
}

export function encodeSignMessage({ message }: { message: string }) {
  return iface.encodeFunctionData("signMessage", [message])
}

export function encodePersonalSign({ message }: { message: string }) {
  return iface.encodeFunctionData("personalSign", [toUtf8Bytes(message)])
}
