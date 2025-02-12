import { ChainId } from "zodiac-roles-sdk"
import { fetchContractInfo } from "@/app/abi"
import Disclosure from "@/ui/Disclosure"
import Flex from "@/ui/Flex"
import LabeledData from "@/ui/LabeledData"
import StopPropagation from "@/ui/StopPropagation"

import classes from "./style.module.css"
import ContractName from "@/components/ContractName"
import { Call } from "@/app/api/records/types"
import CallItem from "./CallItem"

interface Props {
  // Define your component props here if needed.
  targetAddress: `0x${string}`
  chainId: ChainId
  calls: Call[]
}

export const TargetCalls = async ({ targetAddress, chainId, calls }: Props) => {
  const contractInfo = await fetchContractInfo(targetAddress, chainId)

  return (
    <Disclosure
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
        {calls.map((call, index) => (
          <CallItem
            key={index}
            {...call}
            abi={contractInfo.abi}
            chainId={chainId}
          />
        ))}
      </Flex>
    </Disclosure>
  )
}

export default TargetCalls
