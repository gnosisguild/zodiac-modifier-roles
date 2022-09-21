import { useCallback, useEffect } from "react"
import { getAddress } from "../utils/address"
import { fetchRoles, setRolesModifierAddress } from "../store/main/rolesSlice"
import { useRootDispatch, useRootSelector } from "../store"
import { useNavigate, useParams } from "react-router-dom"
import { getChainId, getRoles, getRolesModifierAddress } from "../store/main/selectors"
import { setChainId } from "../store/main/web3Slice"

interface FetchRolesOptions {
  lazy?: boolean
}

export const useFetchRoles = ({ lazy = false }: FetchRolesOptions = {}) => {
  const dispatch = useRootDispatch()
  const navigate = useNavigate()
  const { module } = useParams()

  const network = useRootSelector(getChainId)
  const rolesModifierAddress = useRootSelector(getRolesModifierAddress)
  const roles = useRootSelector(getRoles)

  const fetch = useCallback(() => {
    const addressData = module && getAddress(module)
    if (!addressData) {
      navigate("/")
      return
    }
    const address = addressData.address
    dispatch(fetchRoles({ network, address }))
  }, [dispatch, module, navigate, network])

  useEffect(() => {
    const addressData = module && getAddress(module)
    if (!addressData) return

    if (rolesModifierAddress !== addressData.address) {
      dispatch(setRolesModifierAddress(addressData.address))
    }
    if (addressData.chainId && network !== addressData.chainId) {
      dispatch(setChainId(addressData.chainId))
    }
  }, [dispatch, module, network, rolesModifierAddress])

  useEffect(() => {
    if (!lazy) fetch()
  }, [dispatch, navigate, module, fetch, lazy])

  return { fetch, roles }
}
