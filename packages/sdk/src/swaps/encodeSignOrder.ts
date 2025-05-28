import { id, Interface } from "ethers"
import { BuyTokenBalance, OrderKind, SellTokenBalance } from "./types"

const zodiacOsSafe = "0x3ec84da3A9bCed9767490c198E69Aa216A35Df12"

export type Props = {
  /**
   * ERC-20 token to be sold.
   */
  sellToken: `0x${string}`
  /**
   * ERC-20 token to be bought.
   */
  buyToken: `0x${string}`
  /**
   * An optional Ethereum address to receive the proceeds of the trade instead of the owner (i.e. the order signer).
   *
   */
  receiver?: `0x${string}` | null
  /**
   * Amount of `sellToken` to be sold in atoms.
   */
  sellAmount: bigint
  /**
   * Amount of `buyToken` to be bought in atoms.
   */
  buyAmount: bigint
  /**
   * Unix timestamp (`uint32`) until which the order is valid.
   */
  validTo: bigint

  /**
   * The kind is either a buy or sell order.
   */
  kind: OrderKind
  /**
   * Is the order fill-or-kill or partially fillable?
   */
  partiallyFillable: boolean
  sellTokenBalance?: SellTokenBalance
  buyTokenBalance?: BuyTokenBalance
}

/** Encodes a signOrder call to the CowswapOrderSigner contract */
export const encodeSignOrder = async ({
  sellToken,
  buyToken,
  sellAmount,
  buyAmount,
  validTo,
  kind,
  partiallyFillable,
  sellTokenBalance = SellTokenBalance.ERC20,
  buyTokenBalance = BuyTokenBalance.ERC20,
  receiver,
}: Props) => {
  let feeAmount = 0n
  if (!noFee) {
    feeAmount =
      kind === OrderKind.BUY
        ? (sellAmount * 25n) / 10000n
        : (buyAmount * 25n) / 10000n
  }

  CowswapOrderSignerInterface.encodeFunctionData("signOrder", [
    {
      sellToken,
      buyToken,
      sellAmount,
      buyAmount,
      validTo,
      partiallyFillable,
      receiver,
      kind: id(kind),
      sellTokenBalance: id(sellTokenBalance),
      buyTokenBalance: id(buyTokenBalance),
      feeAmount: 0n,
      appData: id(appData),
    },
    validTo - BigInt(Math.floor(Date.now() / 1000)),
    0n,
  ])
}

const CowswapOrderSignerInterface = new Interface([
  "function signOrder(tuple(address sellToken, address buyToken, address receiver, uint256 sellAmount, uint256 buyAmount, uint32 validTo, bytes32 appData, uint256 feeAmount, bytes32 kind, bool partiallyFillable, bytes32 sellTokenBalance, bytes32 buyTokenBalance) order, uint32 validDuration, uint256 feeAmountBP)",
])
