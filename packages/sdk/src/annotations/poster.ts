import { Interface } from "@ethersproject/abi"

// EIP-3722 Poster contract
export const POSTER_ADDRESS = "0x000000000000cd17345801aa8147b8D3950260FF"

const posterInterface = new Interface([
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
])

export const encodePost = (content: string, tag: string) => {
  return posterInterface.encodeFunctionData("post", [content, tag])
}
