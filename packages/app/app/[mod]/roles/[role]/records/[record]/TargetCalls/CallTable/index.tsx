import { ChainId } from "zodiac-roles-sdk"

import { AbiFunction, decodeFunctionData, toFunctionSelector } from "viem"
import Flex from "@/ui/Flex"
import classes from "./style.module.css"
import LabeledData from "@/ui/LabeledData"
import Anchor from "@/ui/Anchor"
import { Call } from "@/app/api/records/types"
import CallRow from "./Row"

const CallTable: React.FC<{
  to: `0x${string}`
  selector: `0x${string}`
  calls: Call[]
  chainId: ChainId
  abi?: AbiFunction[]
}> = ({ to, selector, calls, chainId, abi }) => {
  const functionAbi = abi?.find(
    (fragment: any) =>
      fragment.type === "function" && toFunctionSelector(fragment) === selector
  ) as AbiFunction | undefined

  const decodedCalls =
    abi &&
    functionAbi &&
    calls.map((call) => {
      const { args } = decodeFunctionData({ abi, data: call.data })
      return {
        value: call.value,
        operation: call.operation,
        args,
        metadata: call.metadata,
      }
    })

  return (
    <div className={classes.functionContainer}>
      <LabeledData label="Function">
        <Flex gap={2} alignItems="center">
          <Anchor name={`${to}-${selector}`} className={classes.anchor} />
          <div className={classes.selector}>
            {functionAbi ? functionAbi.name : selector}
          </div>
          {functionAbi && (
            <div className={classes.selectorSmall}>{selector}</div>
          )}
        </Flex>
      </LabeledData>

      {functionAbi && decodedCalls ? (
        <table>
          <tbody>
            {decodedCalls.map((call, index) => (
              <CallRow
                key={index}
                {...call}
                chainId={chainId}
                abi={functionAbi}
              />
            ))}
          </tbody>
        </table>
      ) : (
        <div>ABI not found</div>
      )}
      <div className={classes.verticalGuide} />
    </div>
  )
}

export default CallTable
