import { ChainId, FunctionPermissionCoerced } from "zodiac-roles-sdk"
import { whatsabi } from "@shazow/whatsabi"
import { cache } from "react"
import { ethers } from "ethers"
import { FunctionFragment, Interface } from "ethers/lib/utils"
import Flex from "@/ui/Flex"
import ExecutionOptions from "./ExecutionOptions"
import Box from "@/ui/Box"
import ConditionView from "../ConditionView"
import { CHAINS } from "@/app/chains"
import classes from "./style.module.css"

const FunctionPermissionItem: React.FC<
  FunctionPermissionCoerced & { chainId: ChainId }
> = async ({ chainId, targetAddress, selector, ...rest }) => {
  const { abi } = await fetchAbi(targetAddress, chainId)
  let functionAbi: FunctionFragment | undefined = undefined
  try {
    functionAbi = abi.getFunction(selector)
  } catch (e) {
    console.error(e)
  }

  if (!functionAbi) {
    return (
      <RawFunctionPermissionItem
        targetAddress={targetAddress}
        selector={selector}
        {...rest}
      />
    )
  } else {
    return (
      <AbiFunctionPermissionItem
        targetAddress={targetAddress}
        selector={selector}
        abi={functionAbi}
        {...rest}
      />
    )
  }
}

export default FunctionPermissionItem

const RawFunctionPermissionItem: React.FC<FunctionPermissionCoerced> = async ({
  selector,
  condition,
  delegatecall,
  send,
}) => {
  return (
    <Box p={3}>
      <Flex direction="column" gap={3}>
        <div>
          <code class={classes.functionName}>{selector}</code>
        </div>
        {condition ? (
          <ConditionView condition={condition} />
        ) : (
          <div>No condition set</div>
        )}
        <ExecutionOptions delegatecall={delegatecall} send={send} />
      </Flex>
    </Box>
  )
}

const AbiFunctionPermissionItem: React.FC<
  FunctionPermissionCoerced & { abi: FunctionFragment }
> = async ({ condition, delegatecall, send, abi }) => {
  const signature = abi.format("full")
  const params =
    abi.inputs.length === 0
      ? undefined
      : signature.slice(signature.indexOf("(") + 1, signature.lastIndexOf(")"))
  return (
    <Box p={3}>
      <Flex direction="column" gap={3}>
        <div>
          <code className={classes.functionName}>
            <Flex gap={2} alignItems="center" className={classes.signature}>
              <div>{abi.name}</div>
              {params && (
                <>
                  <div className={classes.params}>(</div>
                  <div className={classes.params}>{params}</div>
                  <div className={classes.params}>)</div>
                </>
              )}
            </Flex>
          </code>
        </div>
        {condition ? (
          <ConditionView condition={condition} abi={abi} />
        ) : (
          <div>No condition set</div>
        )}
        <ExecutionOptions delegatecall={delegatecall} send={send} />
      </Flex>
    </Box>
  )
}

const fetchAbi = cache(async (address: string, chainId: ChainId) => {
  const chain = CHAINS[chainId]
  const provider = new ethers.providers.JsonRpcProvider(
    chain.rpcUrls.default.http[0],
    { chainId, name: chain.name }
  )

  const abiLoader = new whatsabi.loaders.EtherscanABILoader({
    baseURL: chain.blockExplorerAbiUrl,
    apiKey: chain.blockExplorerApiKey,
  })

  const result = await whatsabi.autoload(address, {
    provider,

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

  const iface = new Interface(result.abi)

  return { address: result.address, abi: iface }
})
