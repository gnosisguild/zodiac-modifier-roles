import { notFound } from "next/navigation"
import { ChainId, Role, fetchRole, fetchRolesMod } from "zodiac-roles-sdk"

interface Props {
  address: string
  roleKey: `0x${string}`
  chainId: ChainId
}

export const fetchOrInitRole = async ({ address, chainId, roleKey }: Props) => {
  let data = await fetchRole(
    { address, chainId, roleKey },
    { next: { revalidate: 1 } }
  )

  if (!data) {
    // If the role doesn't exist, we check if the mod exists.
    // In that case we show an empty role page so the user can start populating it.
    // Otherwise we show a 404.
    const modExists = await fetchRolesMod(
      { address, chainId },
      { next: { revalidate: 1 } }
    )
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
  allowances: [],
})
