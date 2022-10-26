import { createClient, gql, defaultExchanges } from "urql"
import { ethers } from "ethers"
import {
  ConditionType,
  ExecutionOption,
  FunctionCondition,
  Member,
  ParamComparison,
  ParamCondition,
  ParameterType,
  Role,
  Target,
  TargetConditions,
} from "../typings/role"
import { getFunctionConditionType } from "../utils/conditions"
import { Network } from "../utils/networks"

let client

if (!process.env.REACT_APP_SUBGRAPH_BASE_URL) {
  throw new Error("REACT_APP_SUBGRAPH_BASE_URL is not set")
}
if (!process.env.REACT_APP_SUBGRAPH_GNOSIS_CHAIN) {
  throw new Error("REACT_APP_SUBGRAPH_GNOSIS_CHAIN is not set")
}
if (!process.env.REACT_APP_SUBGRAPH_MAINNET) {
  throw new Error("REACT_APP_SUBGRAPH_MAINNET is not set")
}
if (!process.env.REACT_APP_SUBGRAPH_GOERLI) {
  throw new Error("REACT_APP_SUBGRAPH_GOERLI is not set")
}
if (!process.env.REACT_APP_SUBGRAPH_POLYGON) {
  throw new Error("REACT_APP_SUBGRAPH_POLYGON is not set")
}
if (!process.env.REACT_APP_SUBGRAPH_ARBITRUM) {
  throw new Error("REACT_APP_SUBGRAPH_ARBITRUM is not set")
}
if (!process.env.REACT_APP_SUBGRAPH_OPTIMISM) {
  throw new Error("REACT_APP_SUBGRAPH_OPTIMISM is not set")
}
// if (!process.env.REACT_APP_SUBGRAPH_OPTIMISM_ON_GNOSIS_CHAIN) {
//   throw new Error("REACT_APP_SUBGRAPH_OPTIMISM_ON_GNOSIS_CHAIN is not set")
// }

const BASE_SUBGRAPH_URL = process.env.REACT_APP_SUBGRAPH_BASE_URL
const SUBGRAPH_GNOSIS_CHAIN = process.env.REACT_APP_SUBGRAPH_GNOSIS_CHAIN
const SUBGRAPH_GOERLI = process.env.REACT_APP_SUBGRAPH_GOERLI
const SUBGRAPH_MAINNET = process.env.REACT_APP_SUBGRAPH_MAINNET
const SUBGRAPH_POLYGON = process.env.REACT_APP_SUBGRAPH_POLYGON
const SUBGRAPH_ARBITRUM = process.env.REACT_APP_SUBGRAPH_ARBITRUM
const SUBGRAPH_OPTIMISM = process.env.REACT_APP_SUBGRAPH_OPTIMISM
// const SUBGRAPH_OPTIMISM_ON_GNOSIS_CHAIN = process.env.REACT_APP_SUBGRAPH_OPTIMISM_ON_GNOSIS_CHAIN

const getUrl = (network?: Network) => {
  switch (network) {
    case Network.MAINNET:
      return BASE_SUBGRAPH_URL + SUBGRAPH_MAINNET
    case Network.GNOSIS:
      return BASE_SUBGRAPH_URL + SUBGRAPH_GNOSIS_CHAIN
    case Network.GOERLI:
      return BASE_SUBGRAPH_URL + SUBGRAPH_GOERLI
    case Network.POLYGON:
      return BASE_SUBGRAPH_URL + SUBGRAPH_POLYGON
    case Network.OPTIMISM:
      return BASE_SUBGRAPH_URL + SUBGRAPH_OPTIMISM
    case Network.ARBITRUM:
      return BASE_SUBGRAPH_URL + SUBGRAPH_ARBITRUM
    // case Network.OPTIMISM_ON_GNOSIS:
    //   return BASE_SUBGRAPH_URL + SUBGRAPH_OPTIMISM_ON_GNOSIS_CHAIN
    default:
      return BASE_SUBGRAPH_URL + SUBGRAPH_GOERLI
  }
}

const getSubgraphClient = (network?: Network) =>
  createClient({
    url: getUrl(network),
    exchanges: [...defaultExchanges],
    fetchOptions: {
      cache: "no-cache",
    },
  })

const RolesQuery = gql`
  query ($id: ID!) {
    rolesModifier(id: $id) {
      id
      address
      avatar
      roles {
        id
        name
        targets {
          id
          address
          executionOptions
          clearance
          functions {
            sighash
            executionOptions
            wildcarded
            parameters {
              index
              type
              comparison
              comparisonValue
            }
          }
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
      name: string
      targets: {
        id: string
        address: string
        executionOptions: string
        clearance: ConditionType
        functions: {
          sighash: string
          executionOptions: string
          wildcarded: boolean
          parameters: {
            index: number
            type: ParameterType
            comparison: ParamComparison
            comparisonValue: string[]
          }[]
        }[]
      }[]
      members: {
        id: string
        member: Member
      }[]
    }[]
  }
}

export const fetchRoles = async (network: Network, rolesModifierAddress: string): Promise<Role[]> => {
  client = getSubgraphClient(network)
  if (rolesModifierAddress == null || !ethers.utils.isAddress(rolesModifierAddress)) {
    return []
  }
  try {
    const roles = await client
      .query<RolesQueryResponse>(RolesQuery, { id: rolesModifierAddress.toLowerCase() })
      .toPromise()
    if (roles.data && roles.data.rolesModifier) {
      return roles.data.rolesModifier.roles.map((role) => ({
        ...role,
        members: role.members.map((roleMember) => roleMember.member),
        targets: role.targets.map((target): Target => {
          const conditions: TargetConditions = Object.fromEntries(
            target.functions.map((func) => {
              const paramConditions = func.parameters.map((param) => {
                const paramCondition: ParamCondition = {
                  index: param.index,
                  condition: param.comparison,
                  value: param.comparisonValue,
                  type: param.type,
                }
                return paramCondition
              })

              const funcConditions: FunctionCondition = {
                sighash: func.sighash,
                type: func.wildcarded ? ConditionType.WILDCARDED : getFunctionConditionType(paramConditions),
                executionOption: getExecutionOptionFromLabel(func.executionOptions),
                params: paramConditions,
              }
              return [func.sighash, funcConditions]
            }),
          )
          return {
            id: target.id,
            address: target.address,
            type: target.clearance,
            executionOption: getExecutionOptionFromLabel(target.executionOptions),
            conditions,
          }
        }),
      }))
    } else {
      return []
    }
  } catch (err) {
    console.log("err", err)
    throw err
  }
}

function getExecutionOptionFromLabel(label: string): ExecutionOption {
  switch (label) {
    case "Both":
      return ExecutionOption.BOTH
    case "Send":
      return ExecutionOption.SEND
    case "DelegateCall":
      return ExecutionOption.DELEGATE_CALL
  }
  return ExecutionOption.NONE
}
