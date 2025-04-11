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
  const hardcodedLabel =
    ADDRESS_LABELS[chainId.toString()]?.[contractInfo.address.toLowerCase()]
  const label =
    hardcodedLabel || (contractInfo.proxyTo ? undefined : contractInfo.name)

  const proxyLabel = !hardcodedLabel && contractInfo.proxyTo && (
    <>
      <span className={classes.proxy}>proxy to</span>{" "}
      {contractInfo.name || (
        <span className={classes.proxyTo}>
          {getAddress(contractInfo.proxyTo)}
        </span>
      )}
    </>
  )

  const address = (
    <Address
      address={contractInfo.address}
      chainId={chainId}
      copyToClipboard
      explorerLink
      className={classes.address}
      noBlockie
      displayFull
      small
    />
  )

  return (
    <Flex gap={3} alignItems="center">
      <Flex gap={2} alignItems="center">
        <Anchor name={contractInfo.address} className={classes.anchor} />
        {label || address}
        {proxyLabel}
      </Flex>
      {label && address}
    </Flex>
  )
}

export default ContractName
