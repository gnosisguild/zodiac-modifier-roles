import { chains } from "./chains"
import { assertNoPagination, fetchFromSubgraph, FetchOptions } from "./subgraph"
import {
  ChainId,
  Role,
  Clearance,
  ExecutionOptions,
  Function,
  Target,
} from "./types"

type Props = {
  address: `0x${string}`
  roleKey: `0x${string}`
  /** Specify a block height to fetch a historic role state. Defaults to latest block. */
  blockNumber?: number
} & (
  | {
      /** pass a chainId to use query against the official subgraph deployment */
      chainId: ChainId
      /** pass your own API key from The Graph for production use */
      theGraphApiKey?: string
    }
  | {
      /** pass your own subgraph endpoint */
      subgraph: string
    }
)

const ROLE_FIELDS = `
    key
    members(first: 1000) {
      member {
        address
      }
    }
    targets(first: 1000) {
      address
      clearance
      executionOptions
      functions(first: 1000) {
        selector
        executionOptions
        wildcarded
        condition {
          id
          json
        }
      }
    }
    annotations(first: 1000) {
      uri
      schema
    }
    lastUpdate
`.trim()

const ROLE_QUERY = `
query Role($id: String) {
  role(id: $id) {
    ${ROLE_FIELDS}
  }
}
`.trim()

const ROLE_AT_BLOCK_QUERY = `
query Role($id: String, $block: Int) {
  role(id: $id, block: { number: $block }) {
    ${ROLE_FIELDS}
  }
}
`.trim()

const getRoleId = (address: `0x${string}`, roleKey: `0x${string}`) =>
  `${address.toLowerCase()}-ROLE-${roleKey}`

export const fetchRole = async (
  { address, roleKey, blockNumber, ...subgraphProps }: Props,
  options?: FetchOptions
): Promise<Role | null> => {
  const { role } = await fetchFromSubgraph(
    subgraphProps,
    {
      query: blockNumber ? ROLE_AT_BLOCK_QUERY : ROLE_QUERY,
      variables: { id: getRoleId(address, roleKey), block: blockNumber },
      operationName: "Role",
    },
    options
  )

  if (!role) {
    return null
  }

  assertNoPagination(role.members)
  assertNoPagination(role.targets)
  assertNoPagination(role.annotations)

  return mapGraphQl(role)
}

const mapGraphQl = (role: any): Role => ({
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
