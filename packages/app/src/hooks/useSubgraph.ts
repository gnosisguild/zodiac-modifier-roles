import { useState, useEffect } from "react"
import { createClient } from "urql"
import { getRolesModifierAddress } from "../store/main/selectors"
import { useRootSelector } from "../store"
import { ethers } from "ethers"

const API_URL = "https://api.studio.thegraph.com/query/19089/zodiac-modifier-roles/0.0.19" // TODO: this is for testing

const client = createClient({
  url: API_URL,
})

export type Role = {
  id: string
  rolesModifier: string
  targets: { id: string; address: string }[]
  members: { member: { id: string; address: string } }[]
}

export const useGetRolesForRolesModifier = () => {
  const [roles, setRoles] = useState<Role[]>([])
  const rolesModifierAddress = useRootSelector(getRolesModifierAddress)

  useEffect(() => {
    console.log("rolesModifierAddress", rolesModifierAddress)
    if (rolesModifierAddress == null || !ethers.utils.isAddress(rolesModifierAddress)) {
      console.log("No rolesModifierAddress")
      return
    }
    const getRoles = async () => {
      const rolesQuery = `
  			query {
  				rolesModifier(id: "${rolesModifierAddress}") {
    				id
    				address
    				avatar
						roles {
							id
							targets {
							 id
							address
							}
							members{
								id
								member {
									id
									address
								}
							}
						}
  				}
				}
			`
      const roles = await client.query(rolesQuery).toPromise()
      if (roles.data != null) {
        setRoles(roles.data.rolesModifier.roles)
      }
    }
    getRoles()
  }, [rolesModifierAddress])
  return roles
}
