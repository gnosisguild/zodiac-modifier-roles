import { createClient, gql } from "urql"
import { ethers } from "ethers"
import { Member, Role, Target } from "../typings/role"

// TODO: testing URLs
const API_URL_RINKEBY = "https://api.thegraph.com/subgraphs/name/asgeir-eth/zodiac-modifier-roles"
const API_URL_GNOSIS_CHAIN = "https://api.thegraph.com/subgraphs/name/asgeir-eth/gnosis-zodiac-modifier-roles" // TODO: Use this when on Gnosis Chain

// Using Module = 0xbdfdf9b21e18883a107d185ec80733c402357fdc

const client = createClient({
  url: API_URL_RINKEBY,
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

interface RolesQueryResponse {
  rolesModifier: null | {
    id: string
    address: string
    avatar: string
    roles: {
      id: string
      targets: Target[]
      members: {
        id: string
        member: Member
      }[]
    }[]
  }
}

export const fetchRoles = async (rolesModifierAddress: string): Promise<Role[]> => {
  if (rolesModifierAddress == null || !ethers.utils.isAddress(rolesModifierAddress)) {
    return []
  }
  const roles = await client
    .query<RolesQueryResponse>(RolesQuery, { id: rolesModifierAddress.toLowerCase() })
    .toPromise()
  if (roles.data && roles.data.rolesModifier) {
    return roles.data.rolesModifier.roles.map((role) => ({
      ...role,
      members: role.members.map((roleMember) => roleMember.member),
    }))
  } else {
    return []
  }
}
