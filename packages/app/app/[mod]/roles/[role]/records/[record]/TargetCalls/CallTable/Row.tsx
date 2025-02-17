import { ChainId } from "zodiac-roles-sdk"

import {
  AbiFunction,
  decodeFunctionData,
  formatEther,
  toFunctionSelector,
} from "viem"
import Flex from "@/ui/Flex"
import classes from "./style.module.css"
import LabeledData from "@/ui/LabeledData"
import Switch from "@/ui/Switch"
import Anchor from "@/ui/Anchor"
import { RelativeTime } from "@/components/RelativeTime"
import { Call, Operation } from "@/app/api/records/types"
import { CHAINS } from "@/app/chains"

interface DecodedCall {
  value: string
  operation: Operation
  args: unknown[]
  metadata: any
}

const CallRow: React.FC<
  DecodedCall & {
    chainId: ChainId
    abi?: AbiFunction
  }
> = ({ to, value, data, operation, metadata, chainId, abi }) => {
  const selector = data.slice(0, 10)

  const functionAbi = abi?.find(
    (fragment: any) =>
      fragment.type === "function" && toFunctionSelector(fragment) === selector
  ) as AbiFunction | undefined
  const { args } = abi ? decodeFunctionData({ abi, data }) : {}

  return (
    <tr className={classes.functionContainer}>
      <CallHeader
        {...{ to, value, data, operation, metadata, chainId }}
        abi={functionAbi}
      />

      {args && functionAbi ? (
        <TupleParams value={args} type={functionAbi.inputs} />
      ) : (
        <div>Could not decode this call</div>
      )}
      <div className={classes.verticalGuide} />
    </tr>
  )
}

export default CallRow

const CallRowHeader: React.FC<
  Call & { chainId: ChainId; abi?: AbiFunction }
> = ({ to, data, value, operation, metadata, chainId, abi }) => {
  const selector = data.slice(0, 10)
  const chain = CHAINS[chainId]

  const valueBigInt = BigInt(value)

  return (
    <Flex direction="row" gap={0} justifyContent="space-between">
      <LabeledData label="Function">
        <Flex gap={2} alignItems="center">
          <Anchor name={`${to}-${selector}`} className={classes.anchor} />
          <div className={classes.selector}>{abi ? abi.name : selector}</div>
          {abi && <div className={classes.selectorSmall}>{selector}</div>}
        </Flex>
      </LabeledData>

      <Flex gap={3} alignItems="start">
        <LabeledData label="Send value">
          {valueBigInt === 0n
            ? "-"
            : formatEther(valueBigInt) + " " + chain.nativeCurrency.symbol}
        </LabeledData>

        <LabeledData label="Delegate call">
          <Switch checked={operation === Operation.DelegateCall} disabled />
        </LabeledData>

        {metadata?.recordedAt && (
          <LabeledData label="Recorded">
            <RelativeTime value={metadata.recordedAt} />
          </LabeledData>
        )}
      </Flex>
    </Flex>
  )
}
