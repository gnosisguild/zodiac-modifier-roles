"use client"
import { useMemo } from "react"
import { Interface } from "ethers"
import { rolesAbi, ChainId } from "zodiac-roles-sdk"

import Box from "@/ui/Box"
import Flex from "@/ui/Flex"
import { WalletProvider } from "@/components/Wallet"
import ApplyViaSafe from "@/components/ApplyUpdate/ApplyViaSafe"
import ApplyViaGovernor from "@/components/ApplyUpdate/ApplyViaGovernor"
import ApplyViaRethinkFactory from "@/components/ApplyUpdate/ApplyViaRethinkFactory"
import {
  MULTISEND_141,
  MULTISEND_CALLONLY_141,
  MULTISEND_SELECTOR,
  MULTISEND_UNWRAPPER,
} from "@/components/ApplyUpdate/const"
import type { UnwrapperStatus } from "./page"
import styles from "./style.module.css"

type Call = { to: `0x${string}`; data: `0x${string}` }

const rolesInterface = new Interface(rolesAbi)

function buildSetUnwrapperCalls(rolesModifier: `0x${string}`): Call[] {
  return [MULTISEND_141, MULTISEND_CALLONLY_141].map((addr) => ({
    to: rolesModifier,
    data: rolesInterface.encodeFunctionData("setTransactionUnwrapper", [
      addr,
      MULTISEND_SELECTOR,
      MULTISEND_UNWRAPPER,
    ]) as `0x${string}`,
  }))
}

interface Props {
  status141: UnwrapperStatus
  statusCallOnly141: UnwrapperStatus
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
  status141,
  statusCallOnly141,
  overallStatus,
  rolesAddress,
  owner,
  chainId,
  applyType,
}) => {
  const calls = useMemo(
    () => buildSetUnwrapperCalls(rolesAddress),
    [rolesAddress]
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
        <UnwrapperRow
          label="MultiSend (v1.4.1)"
          address={MULTISEND_141}
          status={status141}
        />
        <UnwrapperRow
          label="MultiSend CallOnly (v1.4.1)"
          address={MULTISEND_CALLONLY_141}
          status={statusCallOnly141}
        />
      </Flex>

      {overallStatus === "correct" ? (
        <Box p={2} className={styles.successBox}>
          <Flex gap={2} alignItems="center">
            <span className={styles.checkmark}>&#x2713;</span>
            <span>
              MultiSend unwrappers are correctly configured. Batched execution
              through this role is fully supported.
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
                No MultiSend unwrapper is configured. Batched execution through
                this role won&apos;t be possible until the unwrapper is set up.
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
  label: string
  address: string
  status: UnwrapperStatus
}> = ({ label, address, status }) => {
  const { label: statusLabel, className } = STATUS_LABELS[status]
  return (
    <Box p={2}>
      <Flex gap={3} alignItems="center">
        <div className={styles.contractLabel}>
          <div className={styles.contractName}>{label}</div>
          <code className={styles.contractAddress}>{address}</code>
        </div>
        <span className={className}>{statusLabel}</span>
      </Flex>
    </Box>
  )
}
