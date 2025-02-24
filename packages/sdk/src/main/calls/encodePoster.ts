import { Interface } from "ethers"

const posterAbi = [
  {
    inputs: [
      { internalType: "string", name: "content", type: "string" },
      { internalType: "string", name: "tag", type: "string" },
    ],
    name: "post",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const

interface AnnotationsPost {
  addAnnotations?: {
    uris: string[]
    schema: string
  }[]
  removeAnnotations?: string[] // referenced by `uri` field
}

// EIP-3722 Poster contract
export const POSTER_ADDRESS =
  "0x000000000000cd17345801aa8147b8D3950260FF" as `0x${string}`

const ROLES_ANNOTATION_POSTER_TAG = "ROLES_PERMISSION_ANNOTATION"

const posterInterface = new Interface(posterAbi)

export const encodeAnnotationsPost = (
  rolesMod: string,
  roleKey: string,
  payload: AnnotationsPost
) => {
  const content = JSON.stringify({
    rolesMod,
    roleKey,
    ...payload,
  })

  return posterInterface.encodeFunctionData("post", [
    content,
    ROLES_ANNOTATION_POSTER_TAG,
  ]) as `0x${string}`
}
