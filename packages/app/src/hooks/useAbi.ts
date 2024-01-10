import { useCallback, useEffect, useState } from "react"
import { JsonFragment } from "@ethersproject/abi"
import { getExplorer } from "../utils/explorer"
import { useRootSelector } from "../store"
import { getChainId } from "../store/main/selectors"

export const useAbi = (address: string) => {
  const network = useRootSelector(getChainId)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [abi, setAbi] = useState<JsonFragment[]>()

  const fetchAbi = useCallback(async () => {
    const explorer = getExplorer(network)
    setLoading(true)
    try {
      const result = await explorer.abi(address)
      setAbi(result)
      setError(undefined)
    } catch (err) {
      setAbi(undefined)
      console.error(err)
      setError((err as any).message)
    } finally {
      setLoading(false)
    }
  }, [network, address])

  useEffect(() => {
    fetchAbi()
  }, [fetchAbi])

  return { abi, setAbi, fetchAbi, error, loading }
}
