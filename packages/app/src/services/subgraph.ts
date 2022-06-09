import { createClient, gql } from "urql"
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

// TODO: testing URLs
const API_URL_RINKEBY = "https://api.thegraph.com/subgraphs/name/asgeir-eth/zodiac-modifier-roles-rinkeby"
// const API_URL_GNOSIS_CHAIN = "https://api.thegraph.com/subgraphs/name/asgeir-eth/zodiac-modifier-roles-gnosis-chain" // TODO: Use this when on Gnosis Chain

// Using Module = 0xbdfdf9b21e18883a107d185ec80733c402357fdc

const client = createClient({
  url: API_URL_RINKEBY,
  requestPolicy: "cache-and-network",
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
            functionSig
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
          functionSig: string
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

export const fetchRoles = async (rolesModifierAddress: string): Promise<Role[]> => {
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
                sighash: func.functionSig,
                type: func.wildcarded ? ConditionType.WILDCARDED : getFunctionConditionType(paramConditions),
                executionOption: getExecutionOptionFromLabel(func.executionOptions),
                params: paramConditions,
              }
              return [func.functionSig, funcConditions]
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
