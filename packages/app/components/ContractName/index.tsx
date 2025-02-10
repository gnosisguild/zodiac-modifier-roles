import { ContractInfo } from "@/app/abi"
import classes from "./style.module.css"
import Address from "@/ui/Address"
import addressLabels from "./addressLabels.json"
import { getAddress } from "viem"
import { ChainId } from "@/app/chains"
import Anchor from "@/ui/Anchor"
import Flex from "@/ui/Flex"

const ADDRESS_LABELS = Object.fromEntries(
  Object.entries(addressLabels).map(([chain, labels]) => [
    chain,
    Object.fromEntries(
      Object.entries(labels).map(([address, label]) => [
        address.toLowerCase(),
        label,
      ])
    ),
  ])
)

const ContractName: React.FC<{
  chainId: ChainId
  contractInfo: ContractInfo
}> = ({ chainId, contractInfo }) => {
  const defaultLabel = contractInfo.proxyTo ? (
    <>
      <span className={classes.proxy}>proxy to</span>{" "}
      {contractInfo.name || (
        <span className={classes.proxyTo}>
          {getAddress(contractInfo.proxyTo)}
        </span>
      )}
    </>
  ) : (
    contractInfo.name
  )
  const label =
    (ADDRESS_LABELS as any)[chainId.toString()]?.[
      contractInfo.address.toLowerCase()
    ] || defaultLabel

  const address = (
    <Address
      address={contractInfo.address}
      chainId={chainId}
      displayFull
      copyToClipboard
      explorerLink
      blockieClassName={classes.targetBlockie}
      className={classes.targetAddress}
    />
  )

  return (
    <div>
      <Flex gap={2} alignItems="center">
        <Anchor name={contractInfo.address} className={classes.anchor} />
        {label || address}
      </Flex>
      {label && address}
    </div>
  )
}

export default ContractName
