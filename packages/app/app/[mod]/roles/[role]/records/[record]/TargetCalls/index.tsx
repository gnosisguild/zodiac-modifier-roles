import { ChainId } from "zodiac-roles-sdk"
import { fetchContractInfo } from "@/app/abi"
import Disclosure from "@/ui/Disclosure"
import Flex from "@/ui/Flex"
import LabeledData from "@/ui/LabeledData"
import StopPropagation from "@/ui/StopPropagation"

import classes from "./style.module.css"
import ContractName from "@/components/ContractName"
import { Call } from "@/app/api/records/types"
import Box from "@/ui/Box"
import { groupBy } from "@/utils/groupBy"
import FunctionCalls from "./FunctionCalls"

type Props = {
  to: `0x${string}`
  chainId: ChainId
  calls: Call[]
  wildcards: { [targetSelector: string]: { [paramPath: string]: boolean } }
  recordId: string
}

const TargetCalls = async ({
  to,
  chainId,
  calls,
  wildcards,
  recordId,
}: Props) => {
  const contractInfo = await fetchContractInfo(to, chainId)

  const callsBySelector = groupBy(calls, (call) => call.data.slice(0, 10))

  return (
    <Box borderless bg p={0}>
      <Disclosure
        defaultOpen
        button={
          <Flex
            gap={4}
            justifyContent="space-between"
            alignItems="start"
            className={classes.targetHeader}
          >
            <LabeledData label="Target Contract">
              {/* Prevent clicks on the anchor or address icons from toggling the panel */}
              <StopPropagation>
                <ContractName chainId={chainId} contractInfo={contractInfo} />
              </StopPropagation>
            </LabeledData>
            <LabeledData label="Recorded Calls">
              <div className={classes.callsCount}>{calls.length}</div>
            </LabeledData>
          </Flex>
        }
      >
        <Flex direction="column" gap={3} className={classes.targetContent}>
          {Object.entries(callsBySelector).map(([selector, calls]) => (
            <FunctionCalls
              key={selector}
              to={to}
              selector={selector as `0x${string}`}
              calls={calls}
              wildcards={wildcards[to + ":" + selector]}
              abi={contractInfo.abi}
              recordId={recordId}
            />
          ))}
        </Flex>
      </Disclosure>
    </Box>
  )
}

export default TargetCalls
