import { c, Condition, ExecutionOptions, forAll } from "zodiac-roles-sdk"

const gpV2VaultRelayer = "0xC92E8bdf79f0507f65a392b0ab4667716BFE0110"
const cowOrderSigner = "0x23dA9AdE38E4477b23770DeD512fD37b12381FAB"

/**
 * Returns permissions allowing the avatar to sign the specified CowSwap orders.
 */
export const allowCowOrderSigning = ({
  sell,
  buy,
  receiver,
}: {
  sell: `0x${string}`[]
  buy: `0x${string}`[]
  /** Defaults to the avatar of the Roles Modifier. */
  receiver?: `0x${string}`
}) => {
  return [
    ...allowErc20Approve(sell, gpV2VaultRelayer),
    {
      target: cowOrderSigner,
      function:
        "signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)",
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
          "uint32",
          "uint256",
        ]
      ),
      executionOptions: ExecutionOptions.DelegateCall,
    },
    {
      target: cowOrderSigner,
      function:
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
      executionOptions: ExecutionOptions.DelegateCall,
    },
  ]
}

const allowErc20Approve = (
  tokens: readonly `0x${string}`[],
  spender: `0x${string}`
) =>
  forAll(tokens, {
    signature: "approve(address,uint256)",
    condition: c.calldataMatches([spender], ["address", "uint256"]),
  })
