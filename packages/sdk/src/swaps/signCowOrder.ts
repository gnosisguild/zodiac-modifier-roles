import {
  Address,
  AppDataHash,
  BuyTokenDestination,
  OrderKind,
  SellTokenSource,
  SigningScheme,
  TokenAmount,
} from "@cowprotocol/cow-sdk"
import { id, Interface } from "ethers"

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
  sellTokenBalance?: SellTokenSource
  buyTokenBalance?: BuyTokenDestination

  /** Set to true if you have a Zodiac OS Enterprise subscription. */
  noFee?: boolean
}

export const signCowOrder = async ({
  sellToken,
  buyToken,
  sellAmount,
  buyAmount,
  validTo,
  kind,
  partiallyFillable,
  sellTokenBalance = SellTokenSource.ERC20,
  buyTokenBalance = BuyTokenDestination.ERC20,
  receiver,
  noFee = false,
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
      feeAmount,
      appData: id(appData),
    },
    validTo - BigInt(Math.floor(Date.now() / 1000)),
    noFee ? 0n : 25n,
  ])
}

const CowswapOrderSignerInterface = new Interface([
  "function signOrder(tuple(address sellToken, address buyToken, address receiver, uint256 sellAmount, uint256 buyAmount, uint32 validTo, bytes32 appData, uint256 feeAmount, bytes32 kind, bool partiallyFillable, bytes32 sellTokenBalance, bytes32 buyTokenBalance) order, uint32 validDuration, uint256 feeAmountBP)",
])
