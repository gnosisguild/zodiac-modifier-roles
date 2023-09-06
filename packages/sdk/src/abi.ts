import { Roles__factory } from "../../evm/typechain-types"

export const rolesAbi = Roles__factory.abi

export const posterAbi = [
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
