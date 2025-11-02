import { TypedDataDomain, TypedDataParameter } from "abitype";

export function typesForDomain(domain: TypedDataDomain): TypedDataParameter[] {
  return [
    typeof domain?.name === "string" && { name: "name", type: "string" },
    domain?.version && { name: "version", type: "string" },
    typeof domain?.chainId === "number" && {
      name: "chainId",
      type: "uint256",
    },
    domain?.verifyingContract && {
      name: "verifyingContract",
      type: "address",
    },
    domain?.salt && { name: "salt", type: "bytes32" },
  ].filter(Boolean) as TypedDataParameter[];
}
