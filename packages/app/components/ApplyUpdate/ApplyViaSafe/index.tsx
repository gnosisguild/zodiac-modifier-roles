"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import SafeProvider from "@safe-global/safe-apps-react-sdk"
import ExecuteButton from "./ExecuteButton"
import { parseModParam } from "@/app/params"
import { LinkButton } from "@/ui/Button"

interface Props {
  calls: { to: `0x${string}`; data: `0x${string}` }[]
  owner: `0x${string}`
}

const ApplyViaSafe: React.FC<Props> = ({ calls, owner }) => {
  const [isInIframe, setIsInIframe] = useState<boolean | null>(null)
  const { mod } = useParams<{ mod: string }>()
  const parsed = parseModParam(mod)

  useEffect(() => {
    setIsInIframe(window.self !== window.top)
  }, [])

  if (isInIframe === null) return null

  if (!isInIframe && parsed) {
    const safeUrl = `https://app.safe.global/apps/open?safe=${parsed.chainPrefix}:${owner}&appUrl=${encodeURIComponent(window.location.href)}`
    return (
      <LinkButton href={safeUrl} primary>
        Open in Safe&#123;Wallet&#125;
      </LinkButton>
    )
  }

  return (
    <SafeProvider>
      <ExecuteButton calls={calls} owner={owner} />
    </SafeProvider>
  )
}

export default ApplyViaSafe
