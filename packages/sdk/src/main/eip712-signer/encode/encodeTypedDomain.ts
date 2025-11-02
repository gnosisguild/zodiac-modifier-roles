import { TypedDataDomain } from "abitype"

import { typesForDomain } from "../types"
import { encodeTypedMessage } from "./encodeTypedMessage"

export function encodeTypedDomain({
  domain,
}: {
  domain: TypedDataDomain
}): `0x${string}` {
  return encodeTypedMessage({
    types: { EIP712Domain: typesForDomain(domain) },
    message: domain,
  })
}
