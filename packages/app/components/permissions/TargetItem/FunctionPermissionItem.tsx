import { ChainId, Condition, FunctionPermissionCoerced } from "zodiac-roles-sdk"
import { whatsabi } from "@shazow/whatsabi"
import { ABIFunction } from "@shazow/whatsabi/lib.types/abi"
import { cache } from "react"
import {
  Abi,
  AbiFunction,
  createPublicClient,
  http,
  parseAbi,
  toFunctionSelector,
} from "viem"
import Flex from "@/ui/Flex"
import ExecutionOptions from "./ExecutionOptions"
import ConditionView from "../ConditionView"
import { CHAINS } from "@/app/chains"
import classes from "./style.module.css"
import { DiffFlag } from "../types"
import DiffBox from "../DiffBox"
import LabeledData from "@/ui/LabeledData"

const FunctionPermissionItem: React.FC<
  FunctionPermissionCoerced & {
    diff?: DiffFlag
    modified?: FunctionPermissionCoerced
    chainId: ChainId
  }
> = async ({ chainId, targetAddress, selector, diff, modified, ...rest }) => {
  const { abi } = await fetchAbi(targetAddress, chainId)

  const functionAbi = abi.find(
    (fragment) =>
      fragment.type === "function" && toFunctionSelector(fragment) === selector
  ) as AbiFunction | undefined

  return (
    <DiffBox
      diff={diff}
      borderless
      modified={
        modified && <FunctionPermissionItem {...modified} chainId={chainId} />
      }
    >
      {functionAbi ? (
        <AbiFunctionPermissionItem
          targetAddress={targetAddress}
          selector={selector}
          abi={functionAbi}
          {...rest}
        />
      ) : (
        <RawFunctionPermissionItem
          targetAddress={targetAddress}
          selector={selector}
          {...rest}
        />
      )}
      <div className={classes.verticalGuide} />
    </DiffBox>
  )
}

export default FunctionPermissionItem

const RawFunctionPermissionItem: React.FC<FunctionPermissionCoerced> = async ({
  selector,
  condition,
  delegatecall,
  send,
}) => {
  return (
    <Flex direction="column" gap={3}>
      <LabeledData label="Function Selector">
        <div className={classes.selector}>{selector}</div>
      </LabeledData>
      <ExecutionAndCondition {...{ condition, delegatecall, send }} />
    </Flex>
  )
}

const AbiFunctionPermissionItem: React.FC<
  FunctionPermissionCoerced & { abi: AbiFunction }
> = async ({ condition, delegatecall, send, abi }) => {
  const params =
    abi.inputs?.map((input) => input.type + " " + input.name).join(", ") || ""

  return (
    <Flex direction="column" gap={3}>
      <div>
        <Flex gap={5} alignItems="start" className={classes.signature}>
          <LabeledData label="Function Signature">
            <div className={classes.selector}>{abi.name}</div>
          </LabeledData>
          {params && (
            <LabeledData label="Parameters">
              <code className={classes.params}>{params}</code>
            </LabeledData>
          )}
        </Flex>
      </div>
      <ExecutionAndCondition {...{ condition, delegatecall, send, abi }} />
    </Flex>
  )
}

const ExecutionAndCondition: React.FC<{
  condition?: Condition
  delegatecall?: boolean
  send?: boolean
  abi?: AbiFunction
}> = async ({ condition, delegatecall, send, abi }) => {
  return (
    <Flex direction="column" gap={3}>
      <ExecutionOptions delegatecall={delegatecall} send={send} />
      <div className={classes.calldataHeader}>Calldata Conditions</div>
      {condition ? (
        <ConditionView condition={condition} abi={abi} />
      ) : (
        <div>No condition set</div>
      )}
    </Flex>
  )
}

const fetchAbi = cache(async (address: string, chainId: ChainId) => {
  const chain = CHAINS[chainId]
  const client = createPublicClient({
    chain,
    transport: http(),
  })

  const abiLoader = new whatsabi.loaders.EtherscanABILoader({
    baseURL: chain.blockExplorerAbiUrl,
    apiKey: chain.blockExplorerApiKey,
  })

  const result = await whatsabi.autoload(address, {
    provider: client,

    // * Optional loaders:
    abiLoader,
    // signatureLoader: whatsabi.loaders.defaultSignatureLookup,

    // * Optional hooks:
    // onProgress: (phase: string) => { ... }
    onError: (phase: string, context: any) => {
      console.error(`Could not fetch ABI for ${chain.prefix}:${address}`, {
        phase,
        context,
      })
    },

    // * Optional settings:
    followProxies: true,
    // enableExperimentalMetadata: false,
  })

  return {
    address: result.address,
    abi: (
      result.abi.filter((item) => item.type === "function") as ABIFunction[]
    ).map(coerceAbiFunction) as AbiFunction[],
  }
})

const coerceAbiFunction = (abi: ABIFunction): AbiFunction => ({
  ...abi,
  inputs: abi.inputs || [],
  outputs: abi.outputs || [],
  name: abi.name || "",
  stateMutability:
    abi.stateMutability || (abi.payable ? "payable" : "nonpayable"),
})
