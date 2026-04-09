import { id, Interface } from "ethers"
import { Quote } from "./types"
import { encodeKey } from "zodiac-roles-sdk"

const CowswapOrderSignerAddress = "0x23dA9AdE38E4477b23770DeD512fD37b12381FAB"
// Dishonest valid duration checks if block.timestamp + validDuration > order.validTo
// but because we compute validDuration as validTo - Date.now() this simplifies to block.timestamp > Date.now()
// block.timestamp might be behind Date.now() (when sending transaction it's verified against "latest" block).
// This means that signOrder would reject unless we wait some time for block.timestamp to advance.
// Adding buffer here (5 minutes) to ensure signature is immediately valid when generated.
// https://github.com/gnosisguild/cow-order-signer/blob/1fc456e113ded34bfc745456966f72aec9444be1/contracts/CowswapOrderSigner.sol#L46-L49
const signatureValidityBuffer = 5 * 60;

/** Encodes a signOrder call to the CowswapOrderSigner contract */
export const encodeSignOrder = (quote: Quote) => {
  return CowswapOrderSignerInterface.encodeFunctionData("signOrder", [
    {
      ...quote,
      kind: id(quote.kind),
      sellTokenBalance: id(quote.sellTokenBalance ?? "erc20"),
      buyTokenBalance: id(quote.buyTokenBalance ?? "erc20"),
      feeAmount: 0,
      appData: id(quote.appData),
    },
    quote.validTo - Math.floor(Date.now() / 1000) + signatureValidityBuffer,
    0,
  ]) as `0x${string}`
}

export const encodeSignOrderWithRole = (quote: Quote) => {
  const signOrderCalldata = encodeSignOrder(quote)
  return RolesInterface.encodeFunctionData("execTransactionWithRole", [
    CowswapOrderSignerAddress,
    0,
    signOrderCalldata,
    1, // delegatecall
    encodeKey(quote.roleKey),
    true,
  ]) as `0x${string}`
}

const CowswapOrderSignerInterface = new Interface([
  "function signOrder(tuple(address sellToken, address buyToken, address receiver, uint256 sellAmount, uint256 buyAmount, uint32 validTo, bytes32 appData, uint256 feeAmount, bytes32 kind, bool partiallyFillable, bytes32 sellTokenBalance, bytes32 buyTokenBalance) order, uint32 validDuration, uint256 feeAmountBP)",
])

const RolesInterface = new Interface([
  "function execTransactionWithRole(address to, uint256 value, bytes calldata data, uint8 operation, bytes32 roleKey, bool shouldRevert)",
])
