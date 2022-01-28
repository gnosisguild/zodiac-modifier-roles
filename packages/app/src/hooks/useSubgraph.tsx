import { useState, useEffect } from "react"
import { createClient } from "urql"

const APIURL = "https://api.studio.thegraph.com/query/19089/zodiac-modifier-roles/0.0.19" // TODO: this is for testing

const client = createClient({
  url: APIURL,
})

export type Role = {
  id: string
  rolesModifier: string
  targets: { id: string; address: string }[]
  members: { member: { id: string; address: string } }[]
}

export const useGetRolesForRolesModifier = (rolesModifierAddress: string) => {
  const [roles, setRoles] = useState<Role[]>([])

  useEffect(() => {
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
  })
  return roles
}
