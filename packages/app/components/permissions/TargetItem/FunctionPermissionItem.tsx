import { ChainId, FunctionPermissionCoerced } from "zodiac-roles-sdk"
import { whatsabi } from "@shazow/whatsabi"
import { ABIFunction } from "@shazow/whatsabi/lib.types/abi"
import { cache } from "react"
import { AbiFunction, createPublicClient, http, toFunctionSelector } from "viem"
import Flex from "@/ui/Flex"
import ConditionView, { matchesAbi } from "../ConditionView"
import { CHAINS } from "@/app/chains"
import classes from "./style.module.css"
import { DiffFlag } from "../types"
import DiffBox from "../DiffBox"
import LabeledData from "@/ui/LabeledData"
import Switch from "@/ui/Switch"
import { MdOutlineWarningAmber } from "react-icons/md"

const FunctionPermissionItem: React.FC<
  FunctionPermissionCoerced & {
    diff?: DiffFlag
    modified?: FunctionPermissionCoerced
    chainId: ChainId
  }
> = async ({
  chainId,
  targetAddress,
  selector,
  diff,
  modified,
  condition,
  ...rest
}) => {
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
          condition={condition}
          {...rest}
        />
      ) : (
        <RawFunctionPermissionItem
          targetAddress={targetAddress}
          selector={selector}
          condition={condition}
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
      <Flex direction="row" gap={0} justifyContent="space-between">
        <LabeledData label="Function Selector">
          <div className={classes.selector}>{selector}</div>
        </LabeledData>
        <Flex gap={3} alignItems="start">
          <LabeledData label="Send value">
            <Switch checked={!!send} disabled />
          </LabeledData>
          <LabeledData label="Delegate call">
            <Switch checked={!!delegatecall} disabled />
          </LabeledData>
        </Flex>
      </Flex>
      {condition ? (
        <ConditionView {...{ condition }} />
      ) : (
        <div className={classes.conditionEmpty}>No condition set</div>
      )}
    </Flex>
  )
}

const AbiFunctionPermissionItem: React.FC<
  FunctionPermissionCoerced & { abi: AbiFunction }
> = async ({ condition, delegatecall, send, abi }) => {
  const params = abi.inputs?.map((input) => input.type + " " + input.name) || []

  return (
    <Flex direction="column" gap={3}>
      <Flex direction="row" gap={0} justifyContent="space-between">
        <LabeledData label="Function Signature">
          <Flex gap={2} alignItems="center" className={classes.signature}>
            <div className={classes.selector}>{abi.name}</div>

            <Flex gap={1} alignItems="start">
              {params.map((param, i) => (
                <code className={classes.param} key={i}>
                  {param}
                </code>
              ))}
            </Flex>
          </Flex>
        </LabeledData>
        <Flex gap={3} alignItems="start">
          <LabeledData label="Send value">
            <Switch checked={!!send} disabled />
          </LabeledData>
          <LabeledData label="Delegate call">
            <Switch checked={!!delegatecall} disabled />
          </LabeledData>
        </Flex>
      </Flex>
      {condition ? (
        <ConditionView {...{ condition, abi }} />
      ) : (
        <div className={classes.conditionEmpty}>No condition set</div>
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
