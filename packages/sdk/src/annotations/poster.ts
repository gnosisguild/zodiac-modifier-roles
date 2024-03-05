import { Interface } from "@ethersproject/abi"

import { posterAbi } from "../abi"

import { UpdateAnnotationsPost } from "./types"

// EIP-3722 Poster contract
export const POSTER_ADDRESS = "0x000000000000cd17345801aa8147b8D3950260FF"

export const ROLES_ANNOTATION_POSTER_TAG = "ROLES_PERMISSION_ANNOTATION"

const posterInterface = new Interface(posterAbi)

export const encodePost = (content: string) => {
  return posterInterface.encodeFunctionData("post", [
    content,
    ROLES_ANNOTATION_POSTER_TAG,
  ]) as `0x${string}`
}

export const encodeAnnotationsPost = (
  rolesMod: `0x${string}`,
  roleKey: string,
  updatePost: UpdateAnnotationsPost
) => {
  return encodePost(
    JSON.stringify({
      rolesMod,
      roleKey,
      ...updatePost,
    })
  )
}
