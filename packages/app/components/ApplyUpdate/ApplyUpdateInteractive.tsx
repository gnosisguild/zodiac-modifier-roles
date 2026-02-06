"use client"
import { useState, useMemo } from "react"
import { MdOutlineFileDownload, MdAdd } from "react-icons/md"
import { ChainId } from "zodiac-roles-sdk"

import Box from "@/ui/Box"
import Flex from "@/ui/Flex"

import CallData from "../CallData"
import { WalletProvider } from "../Wallet"
import ApplyViaSafe from "./ApplyViaSafe"
import ApplyViaGovernor from "./ApplyViaGovernor"
import ApplyViaRethinkFactory from "./ApplyViaRethinkFactory"
import AppendCallsModal from "./AppendCallsModal"
import { exportToSafeTransactionBuilder } from "./txBuilder"
import styles from "./style.module.css"

type Call = { to: `0x${string}`; data: `0x${string}` }

interface Props {
  initialCalls: Call[]
  comments: string[]
  address: `0x${string}`
  owner: `0x${string}`
  roleKey: string
  chainId: ChainId
  applyType: "safe" | "governor" | "rethink"
}

const ApplyUpdateInteractive: React.FC<Props> = ({
  initialCalls,
  comments,
  address,
  owner,
  roleKey,
  chainId,
  applyType,
}) => {
  const [appendedCalls, setAppendedCalls] = useState<Call[]>([])
  const [modalOpen, setModalOpen] = useState(false)

  const allCalls = useMemo(
    () => [...initialCalls, ...appendedCalls],
    [initialCalls, appendedCalls]
  )

  const txBuilderJson = exportToSafeTransactionBuilder(
    allCalls,
    chainId,
    roleKey
  )

  const handleAppend = (calls: Call[]) => {
    setAppendedCalls((prev) => [...prev, ...calls])
  }

  const applyElement =
    applyType === "rethink" ? (
      <ApplyViaRethinkFactory
        calls={allCalls}
        owner={owner}
        rolesModifier={address}
        chainId={chainId}
      />
    ) : applyType === "governor" ? (
      <ApplyViaGovernor
        calls={allCalls}
        owner={owner}
        rolesModifier={address}
        roleKey={roleKey as `0x${string}`}
        chainId={chainId}
      />
    ) : (
      <ApplyViaSafe
        calls={allCalls}
        owner={owner}
        rolesModifier={address}
        roleKey={roleKey as `0x${string}`}
        chainId={chainId}
      />
    )

  return (
    <Box p={3} className={styles.calls}>
      <Flex direction="column" gap={3}>
        <Flex direction="row" gap={3}>
          <h5>Calls to apply the diff</h5>
          <a
            href={
              "data:application/json," +
              encodeURI(JSON.stringify(txBuilderJson))
            }
            download="safeTransactionBuilder.json"
            title="Download JSON for Safe Transaction Builder"
          >
            <MdOutlineFileDownload />
          </a>
          <button
            className={styles.appendButton}
            onClick={() => setModalOpen(true)}
            title="Append additional calls"
          >
            <MdAdd />
          </button>
        </Flex>
        <CallList calls={initialCalls} startIndex={0} address={address} comments={comments} />
        {appendedCalls.length > 0 && (
          <>
            <h5 className={styles.separator}>Additional calls</h5>
            <CallList calls={appendedCalls} startIndex={initialCalls.length} address={address} />
          </>
        )}
        <AppendCallsModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onAppend={handleAppend}
        />
        <WalletProvider>{applyElement}</WalletProvider>
      </Flex>
    </Box>
  )
}

export default ApplyUpdateInteractive

const CallList: React.FC<{
  calls: Call[]
  startIndex: number
  address: `0x${string}`
  comments?: string[]
}> = ({ calls, startIndex, address, comments }) => (
  <Flex direction="column" gap={3}>
    {calls.map((call, i) => (
      <Flex gap={3} key={i}>
        <div className={styles.index}>{startIndex + i + 1}</div>
        <div className={styles.callTo}>
          <label title={call.to}>
            {call.to === address ? "Roles" : "Poster"}
          </label>
        </div>
        <CallData className={styles.callData}>{call.data}</CallData>
        {comments && <div className={styles.comment}>{comments[i]}</div>}
      </Flex>
    ))}
  </Flex>
)
