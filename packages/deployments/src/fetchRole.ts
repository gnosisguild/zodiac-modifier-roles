import { getRoleId } from "./ids"
import { fetchFromSubgraph, FetchOptions } from "./subgraph"
import {
  ChainId,
  Role,
  Clearance,
  ExecutionOptions,
  Function,
  Target,
} from "./types"

type Props = {
  chainId: ChainId
  address: `0x${string}`
  roleKey: `0x${string}`

  /**
   * Specify a block height to fetch a historic state of the Roles mod. Defaults to latest block.
   * @requires A Zodiac OS Enterprise subscription
   **/
  blockNumber?: number
}

export const ROLE_FIELDS = `
    key
    members {
      member {
        address
      }
    }
    targets {
      address
      clearance
      executionOptions
      functions {
        selector
        executionOptions
        wildcarded
        condition {
          id
          json
        }
      }
    }
    annotations {
      uri
      schema
    }
    lastUpdate
`.trim()

const ROLE_QUERY = `
query Role($id: ID!, $blockNumber: Int) {
  role(id: $id, blockNumber: $blockNumber) {
    ${ROLE_FIELDS}
  }
}
`.trim()

export const fetchRole = async (
  { chainId, address, roleKey, blockNumber }: Props,
  options?: FetchOptions
): Promise<Role | null> => {
  const { role } = await fetchFromSubgraph(
    {
      query: ROLE_QUERY,
      variables: {
        id: getRoleId(chainId, address, roleKey),
        blockNumber,
      },
      operationName: "Role",
    },
    options
  )

  if (!role) {
    return null
  }

  return mapGraphQl(role)
}

export const mapGraphQl = (role: any): Role => ({
  ...role,
  members: role.members.map((assignment: any) => assignment.member.address),
  targets: role.targets.map(
    (target: any): Target => ({
      address: target.address,
      clearance: Clearance[target.clearance as keyof typeof Clearance],
      executionOptions:
        ExecutionOptions[
          target.executionOptions as keyof typeof ExecutionOptions
        ],
      functions: target.functions.map(
        (func: any): Function => ({
          selector: func.selector,
          executionOptions:
            ExecutionOptions[
              func.executionOptions as keyof typeof ExecutionOptions
            ],
          wildcarded: func.wildcarded,
          condition: func.condition && JSON.parse(func.condition.json),
        })
      ),
    })
  ),
})
