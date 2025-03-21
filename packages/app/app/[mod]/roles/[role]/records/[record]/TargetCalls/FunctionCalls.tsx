import { AbiFunction, toFunctionSelector } from "viem"
import Flex from "@/ui/Flex"
import classes from "./style.module.css"
import LabeledData from "@/ui/LabeledData"
import Anchor from "@/ui/Anchor"
import { Call } from "@/app/api/records/types"
import CallTable from "./CallTable"

type Props = {
  to: `0x${string}`
  selector: `0x${string}`
  calls: Call[]
  wildcards: { [paramPath: string]: boolean | undefined }
  abi?: AbiFunction[]
  recordId: string
}

const FunctionCalls: React.FC<Props> = ({
  to,
  selector,
  calls,
  wildcards,
  abi,
  recordId,
}) => {
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
        <CallTable
          recordId={recordId}
          targetSelector={`${to}:${selector}`}
          calls={calls}
          abi={functionAbi}
          wildcards={wildcards}
        />
      ) : (
        <div>ABI not found</div>
      )}
    </Flex>
  )
}

export default FunctionCalls
