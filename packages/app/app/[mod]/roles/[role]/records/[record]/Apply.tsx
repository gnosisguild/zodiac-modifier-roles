"use client"

import Button from "@/ui/Button"
import { useState } from "react"
import { serverApplyPermissions } from "./serverActions"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { parseModParam } from "@/app/params"

const Apply: React.FC<{}> = ({}) => {
  const [isLoading, setIsLoading] = useState(false)
  const { mod, role, record } = useParams<{
    mod: string
    role: string
    record: string
  }>()
  const chainId = parseModParam(mod)?.chainId
  const router = useRouter()

  if (!chainId) {
    return null
  }

  const apply = async () => {
    setIsLoading(true)
    const permissionsHash = await serverApplyPermissions({
      recordId: record,
      chainId,
    })
    router.push(`/${mod}/roles/${role}/diff/${permissionsHash}`)
  }

  return (
    <Button primary disabled={isLoading} onClick={apply}>
      {isLoading ? "Preparing permissions..." : "Apply Permissions"}
    </Button>
  )
}

export default Apply
