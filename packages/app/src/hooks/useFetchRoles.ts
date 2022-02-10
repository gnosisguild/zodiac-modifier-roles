import { useEffect } from "react"
import { getAddress } from "../utils/address"
import { fetchRoles, setRolesModifierAddress } from "../store/main/rolesSlice"
import { useRootDispatch, useRootSelector } from "../store"
import { useNavigate, useParams } from "react-router-dom"
import { getChainId, getRolesModifierAddress } from "../store/main/selectors"
import { setChainId } from "../store/main/web3Slice"

export const useFetchRoles = () => {
  const dispatch = useRootDispatch()
  const navigate = useNavigate()
  const { module } = useParams()

  const chainId = useRootSelector(getChainId)
  const rolesModifierAddress = useRootSelector(getRolesModifierAddress)

  useEffect(() => {
    const addressData = module && getAddress(module)
    if (!addressData) return

    if (rolesModifierAddress !== addressData.address) {
      dispatch(setRolesModifierAddress(addressData.address))
    }
    if (addressData.chainId && chainId !== addressData.chainId) {
      dispatch(setChainId(addressData.chainId))
    }
  }, [dispatch, module, chainId, rolesModifierAddress])

  useEffect(() => {
    const addressData = module && getAddress(module)
    if (!addressData) {
      navigate("/")
      return
    }
    dispatch(fetchRoles(addressData.address))
  }, [dispatch, navigate, module])
}
