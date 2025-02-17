import { ChainId } from "zodiac-roles-sdk"

import { AbiFunction, toFunctionSelector } from "viem"
import Flex from "@/ui/Flex"
import classes from "./style.module.css"
import LabeledData from "@/ui/LabeledData"
import Anchor from "@/ui/Anchor"
import { Call } from "@/app/api/records/types"
import CallTable from "./CallTable"

const FunctionCalls: React.FC<{
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

  return (
    <Flex direction="column" gap={3} className={classes.functionContainer}>
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

      {functionAbi ? (
        <CallTable calls={calls} abi={functionAbi} />
      ) : (
        <div>ABI not found</div>
      )}
    </Flex>
  )
}

export default FunctionCalls
