import { createClient, gql } from "urql"
import { ethers } from "ethers"
import { Role } from "../typings/role"

const API_URL = "https://api.studio.thegraph.com/query/19089/zodiac-modifier-roles/0.0.22" // TODO: this is for testing

// Using Module = 0xbdfdf9b21e18883a107d185ec80733c402357fdc

const client = createClient({
  url: API_URL,
})

const RolesQuery = gql`
  query ($id: ID!) {
    rolesModifier(id: $id) {
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
        members {
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

export const fetchRoles = async (rolesModifierAddress: string): Promise<Role[]> => {
  if (rolesModifierAddress == null || !ethers.utils.isAddress(rolesModifierAddress)) {
    return []
  }
  const roles = await client.query(RolesQuery, { id: rolesModifierAddress.toLowerCase() }).toPromise()
  if (roles.data != null) {
    return roles.data.rolesModifier.roles
  } else {
    return []
  }
}
