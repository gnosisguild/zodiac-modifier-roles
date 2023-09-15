import { Interface } from "@ethersproject/abi"

import { posterAbi } from "../abi"

// EIP-3722 Poster contract
export const POSTER_ADDRESS = "0x000000000000cd17345801aa8147b8D3950260FF"

// keccak256 hash of "ROLES_PERMISSION_ANNOTATION"
export const ROLES_ANNOTATION_POSTER_TAG =
  "0x90955ce662a10140d12e9a73ca83a52e6642e4d5155d397b707c8fd6bb41b335"

const posterInterface = new Interface(posterAbi)

export const encodePost = (content: string) => {
  return posterInterface.encodeFunctionData("post", [
    content,
    ROLES_ANNOTATION_POSTER_TAG,
  ]) as `0x${string}`
}
