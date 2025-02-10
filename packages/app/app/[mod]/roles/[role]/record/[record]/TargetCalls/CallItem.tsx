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
import { TupleParams } from "./Params"

const CallItem: React.FC<
  Call & {
    chainId: ChainId
    abi?: AbiFunction[]
  }
> = ({ to, value, data, operation, metadata, chainId, abi }) => {
  const selector = data.slice(0, 10)

  const functionAbi = abi?.find(
    (fragment: any) =>
      fragment.type === "function" && toFunctionSelector(fragment) === selector
  ) as AbiFunction | undefined
  const { args } = abi ? decodeFunctionData({ abi, data }) : {}

  return (
    <div className={classes.functionContainer}>
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
    </div>
  )
}

export default CallItem

const CallHeader: React.FC<Call & { chainId: ChainId; abi?: AbiFunction }> = ({
  to,
  data,
  value,
  operation,
  metadata,
  chainId,
  abi,
}) => {
  const selector = data.slice(0, 10)
  const chain = CHAINS[chainId]

  const params =
    abi?.inputs?.map((input) => input.type + " " + input.name) || []

  return (
    <Flex direction="row" gap={0} justifyContent="space-between">
      {abi ? (
        <LabeledData label="Function Signature">
          <Flex gap={2} alignItems="center" className={classes.signature}>
            <Anchor name={`${to}-${selector}`} className={classes.anchor} />
            <div className={classes.selector}>{abi.name}</div>

            <Flex gap={1} alignItems="start" wrap className={classes.params}>
              {params.map((param, i) => (
                <code className={classes.param} key={i}>
                  {param}
                </code>
              ))}
            </Flex>

            <div className={classes.selectorSmall}>{selector}</div>
          </Flex>
        </LabeledData>
      ) : (
        <LabeledData label="Function Selector">
          <Flex gap={2} alignItems="center">
            <Anchor name={`${to}-${selector}`} className={classes.anchor} />
            <div className={classes.selector}>{selector}</div>
          </Flex>
        </LabeledData>
      )}
      <Flex gap={3} alignItems="start">
        <LabeledData label="Send value">
          {value === 0n
            ? "-"
            : formatEther(value) + " " + chain.nativeCurrency.symbol}
        </LabeledData>

        <LabeledData label="Delegate call">
          <Switch checked={operation === Operation.DelegateCall} disabled />
        </LabeledData>

        {metadata && (
          <LabeledData label="Recorded">
            {metadata.recordedAt && (
              <RelativeTime value={metadata.recordedAt} />
            )}
            {metadata.recordedWith && <span>with {metadata.recordedWith}</span>}
          </LabeledData>
        )}
      </Flex>
    </Flex>
  )
}
