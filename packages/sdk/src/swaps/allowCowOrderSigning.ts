import { id } from "ethers"
import { c, forAll, Permission } from "zodiac-roles-sdk"

const gpV2VaultRelayer = "0xC92E8bdf79f0507f65a392b0ab4667716BFE0110"
const cowOrderSigner = "0x23dA9AdE38E4477b23770DeD512fD37b12381FAB"

/**
 * Returns permissions allowing the avatar to sign the specified CowSwap orders.
 */
export const allowCowOrderSigning = ({
  sell,
  buy,
  receiver,
  approveAllowance,
  buyAllowance,
  sellAllowance,
  allowBalancerBalanceAccess,
}: {
  sell: `0x${string}`[]
  buy: `0x${string}`[]

  /** Defaults to the avatar of the Roles Modifier. */
  receiver?: `0x${string}`

  /** Allowance key to restrict approve amounts across sell tokens. If not provided, infinite approvals are allowed. */
  approveAllowance?: string
  /** Allowance key to restrict buy amount within allowance. If not provided, no buy amount restriction is applied. */
  buyAllowance?: string
  /** Allowance key to restrict sell amount within allowance. If not provided, no sell amount restriction is applied. */
  sellAllowance?: string

  /** If set to true, swaps can withdraw and deposit Balancer internal token balances of the avatar. */
  allowBalancerBalanceAccess?: string
}): Permission[] => {
  return [
    ...allowErc20Approve(sell, gpV2VaultRelayer, approveAllowance),
    {
      targetAddress: cowOrderSigner as `0x${string}`,
      signature:
        "signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)",
      condition: c.calldataMatches(
        [
          c.matches({
            sell: oneOf(sell),
            buy: oneOf(buy),
            receiver: receiver ? receiver : c.avatar,
            buyAmount: buyAllowance
              ? c.withinAllowance(buyAllowance)
              : undefined,
            sellAmount: sellAllowance
              ? c.withinAllowance(sellAllowance)
              : undefined,
            sellTokenBalance: allowBalancerBalanceAccess
              ? undefined
              : c.eq(id("erc20")),
            buyTokenBalance: allowBalancerBalanceAccess
              ? undefined
              : c.eq(id("erc20")),
          }),
        ],
        [
          "(address sellToken, address buyToken, address receiver, uint256 sellAmount, uint256 buyAmount, uint32 validTo, bytes32 appData, uint256 feeAmount, bytes32 kind, bool partiallyFillable, bytes32 sellTokenBalance, bytes32 buyTokenBalance)",
          "uint32",
          "uint256",
        ]
      ),
      delegatecall: true,
    },
    {
      targetAddress: cowOrderSigner as `0x${string}`,
      signature:
        "unsignOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32))",
      condition: c.calldataMatches(
        [
          c.matches({
            sell: sell,
            buy: buy,
            receiver: receiver ? receiver : c.avatar,
          }),
        ],
        [
          "(address sellToken, address buyToken, address receiver, uint256 sellAmount, uint256 buyAmount, uint32 validTo, bytes32 appData, uint256 feeAmount, bytes32 kind, bool partiallyFillable, bytes32 sellTokenBalance, bytes32 buyTokenBalance)",
        ]
      ),
      delegatecall: true,
    },
  ]
}

const allowErc20Approve = (
  tokens: readonly `0x${string}`[],
  spender: `0x${string}`,
  allowanceKey?: string
) =>
  forAll(tokens, {
    signature: "approve(address,uint256)",
    condition: c.calldataMatches(
      [spender, allowanceKey ? c.withinAllowance(allowanceKey) : undefined],
      ["address", "uint256"]
    ),
  })

const oneOf = (values: string[]) =>
  values.length === 0
    ? undefined
    : values.length === 1
      ? values[0]
      : c.or(...(values as [string, string, ...string[]]))
