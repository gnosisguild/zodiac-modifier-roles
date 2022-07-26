import SUBGRAPH from "./subgraph"
import { RolePermissions, NetworkId } from "./types"

interface Props {
  address: string
  roleId: number
  network: NetworkId
}

const QUERY = `query RolePermissions($id: String) {
  role(id: $id) {
    id
    targets {
      id
      address
      clearance
      executionOptions
      functions {
        id
        sighash
        executionOptions
        wildcarded
        parameters {
          id
          index
          type
          comparison
          comparisonValue
        }
      }
    }
  }
}`

const fetchPermissions = async ({
  address,
  roleId,
  network,
}: Props): Promise<RolePermissions> => {
  const globalRoleId = `${address.toLowerCase()}-ROLE-${roleId}`
  const res = await fetch(SUBGRAPH[network], {
    body: JSON.stringify({
      query: QUERY,
      variables: { id: globalRoleId },
      operationName: "RolePermissions",
    }),
  })
  const { data, error } = await res.json()
  if (error) {
    throw new Error(error)
  }
  if (!data || !data.role) {
    throw new Error(`Role #${roleId} not found`)
  }
  return data.role
}

export default fetchPermissions
