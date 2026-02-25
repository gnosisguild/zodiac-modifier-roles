"use client"
import { useMemo } from "react"
import { ChainId } from "zodiac-roles-sdk"

import Box from "@/ui/Box"
import Flex from "@/ui/Flex"
import { WalletProvider } from "@/components/Wallet"
import ApplyViaSafe from "@/components/ApplyUpdate/ApplyViaSafe"
import ApplyViaGovernor from "@/components/ApplyUpdate/ApplyViaGovernor"
import ApplyViaRethinkFactory from "@/components/ApplyUpdate/ApplyViaRethinkFactory"
import type { UnwrapperStatus, UnwrapperEntry } from "./checkUnwrappers"
import { buildSetUnwrapperCalls } from "./checkUnwrappers"
import styles from "./style.module.css"

interface Props {
  unwrappers: UnwrapperEntry[]
  overallStatus: UnwrapperStatus
  rolesAddress: `0x${string}`
  owner: `0x${string}`
  chainId: ChainId
  applyType: "safe" | "governor" | "rethink"
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  correct: { label: "Configured", className: styles.correct },
  legacy: { label: "Outdated", className: styles.legacy },
  missing: { label: "Not configured", className: styles.missing },
}

const MultisendStatus: React.FC<Props> = ({
  unwrappers,
  overallStatus,
  rolesAddress,
  owner,
  chainId,
  applyType,
}) => {
  const calls = useMemo(
    () => buildSetUnwrapperCalls(rolesAddress, unwrappers),
    [rolesAddress, unwrappers]
  )

  const applyElement =
    applyType === "rethink" ? (
      <ApplyViaRethinkFactory
        calls={calls}
        owner={owner}
        rolesModifier={rolesAddress}
        chainId={chainId}
      />
    ) : applyType === "governor" ? (
      <ApplyViaGovernor
        calls={calls}
        owner={owner}
        description="Update MultiSend Unwrapper of the Roles mod"
        chainId={chainId}
      />
    ) : (
      <ApplyViaSafe calls={calls} owner={owner} />
    )

  return (
    <Flex direction="column" gap={3}>
      <h2>MultiSend Unwrapper</h2>

      <Flex direction="column" gap={2}>
        {unwrappers.map((u) => (
          <UnwrapperRow
            key={u.address}
            address={u.address}
            status={u.status}
          />
        ))}
      </Flex>

      {overallStatus === "correct" ? (
        <Box p={2} className={styles.successBox}>
          <Flex gap={2} alignItems="center">
            <span className={styles.checkmark}>&#x2713;</span>
            <span>
              MultiSend unwrappers are correctly configured. Batched execution
              is fully supported.
            </span>
          </Flex>
        </Box>
      ) : overallStatus === "legacy" ? (
        <>
          <Box p={2} className={styles.warningBox}>
            <Flex gap={2} alignItems="center">
              <span className={styles.warningIcon}>&#x26A0;</span>
              <span>
                An outdated MultiSend unwrapper is configured. Please update to
                the latest version.
              </span>
            </Flex>
          </Box>
          <WalletProvider>{applyElement}</WalletProvider>
        </>
      ) : (
        <>
          <Box p={2} className={styles.warningBox}>
            <Flex gap={2} alignItems="center">
              <span className={styles.warningIcon}>&#x26A0;</span>
              <span>
                No MultiSend unwrapper is configured. Batched execution
                won&apos;t be possible until the unwrapper is set up.
              </span>
            </Flex>
          </Box>
          <WalletProvider>{applyElement}</WalletProvider>
        </>
      )}
    </Flex>
  )
}

export default MultisendStatus

const UnwrapperRow: React.FC<{
  address: string
  status: UnwrapperStatus
}> = ({ address, status }) => {
  const { label: statusLabel, className } = STATUS_LABELS[status]
  return (
    <Box p={2}>
      <Flex gap={3} alignItems="center">
        <code className={styles.contractAddress}>{address}</code>
        <span className={className}>{statusLabel}</span>
      </Flex>
    </Box>
  )
}
