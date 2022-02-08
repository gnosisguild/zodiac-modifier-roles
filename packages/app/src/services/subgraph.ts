import { createClient } from "urql"
import { ethers } from "ethers"
import { Role } from "../typings/role"

const API_URL = "https://api.studio.thegraph.com/query/19089/zodiac-modifier-roles/0.0.22" // TODO: this is for testing

const client = createClient({
  url: API_URL,
})

export const fetchRoles: (rolesModifierAddress: string) => Promise<Role[]> = async (rolesModifierAddress) => {
  console.log("rolesModifierAddress", rolesModifierAddress)
  if (rolesModifierAddress == null || !ethers.utils.isAddress(rolesModifierAddress)) {
    console.log("No rolesModifierAddress")
    return
  }
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
							 executionOptions
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
    return roles.data.rolesModifier.roles
  } else {
    return []
  }
}
