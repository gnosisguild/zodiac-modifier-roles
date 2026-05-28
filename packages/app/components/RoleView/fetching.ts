import { notFound } from "next/navigation"
import { ChainId, Role } from "zodiac-roles-sdk"

import { fetchRole, fetchRolesMod } from "@/utils/subgraph"

interface Props {
  address: `0x${string}`
  roleKey: `0x${string}`
  chainId: ChainId
}

export const fetchOrInitRole = async ({ address, chainId, roleKey }: Props) => {
  let data = await fetchRole({ address, chainId, roleKey })

  if (!data) {
    // If the role doesn't exist, we check if the mod exists.
    // In that case we show an empty role page so the user can start populating it.
    // Otherwise we show a 404.
    const modExists = await fetchRolesMod({ address, chainId })
    if (!modExists) {
      notFound()
    }

    data = newRole(roleKey)
  }
  return data
}

const newRole = (roleKey: `0x${string}`): Role => ({
  key: roleKey,
  members: [],
  targets: [],
  annotations: [],
  lastUpdate: 0,
})
