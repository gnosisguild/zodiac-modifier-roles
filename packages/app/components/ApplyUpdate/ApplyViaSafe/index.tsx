"use client"
import SafeProvider from "@safe-global/safe-apps-react-sdk"
import ExecuteButton from "./ExecuteButton"
import { ChainId } from "@/app/chains"

interface Props {
  calls: { to: `0x${string}`; data: `0x${string}` }[]
  owner: `0x${string}`
  roleKey: `0x${string}`
  rolesModifier: `0x${string}`
  chainId: ChainId
}

const ApplyViaSafe: React.FC<Props> = ({ calls, owner }) => {
  return (
    <SafeProvider>
      <ExecuteButton calls={calls} owner={owner} />
    </SafeProvider>
  )
}

export default ApplyViaSafe
