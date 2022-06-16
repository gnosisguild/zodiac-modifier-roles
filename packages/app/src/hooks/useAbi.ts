import { useEffect, useState } from "react"
import { JsonFragment } from "@ethersproject/abi"
import { getExplorer } from "../utils/explorer"
import { useRootSelector } from "../store"
import { getChainId } from "../store/main/selectors"

export const useAbi = (address: string) => {
  const network = useRootSelector(getChainId)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [abi, setAbi] = useState<JsonFragment[]>()

  useEffect(() => {
    const explorer = getExplorer(network)
    setLoading(true)
    explorer
      .abi(address)
      .then((result) => {
        setAbi(result)
        setError(undefined)
      })
      .catch((err) => {
        setAbi(undefined)
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [network, address])

  return { abi, setAbi, error, loading }
}
