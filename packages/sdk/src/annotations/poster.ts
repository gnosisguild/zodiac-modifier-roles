import { Interface } from "@ethersproject/abi"

import { posterAbi } from "../abi"

// EIP-3722 Poster contract
export const POSTER_ADDRESS = "0x000000000000cd17345801aa8147b8D3950260FF"

const posterInterface = new Interface(posterAbi)

export const encodePost = (content: string, tag: string) => {
  return posterInterface.encodeFunctionData("post", [
    content,
    tag,
  ]) as `0x${string}`
}
