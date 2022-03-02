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
              parameterIndex
              parameterType
              parameterComparison
              parameterComparisonValue
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
        executionOptions: ExecutionOption
        clearance: ConditionType
        functions: {
          functionSig: string
          executionOptions: ExecutionOption
          wildcarded: boolean
          parameters: {
            parameterIndex: number
            parameterType: ParameterType
            parameterComparison: ParamComparison
            parameterComparisonValue: string
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
              const lastParamIndex = Math.max(0, ...func.parameters.map((param) => param.parameterIndex))
              const paramConditions = new Array(lastParamIndex).fill(undefined).map((current, index) => {
                const param = func.parameters.find((param) => param.parameterIndex === index)
                if (param) {
                  const paramCondition: ParamCondition = {
                    index: param.parameterIndex,
                    condition: param.parameterComparison,
                    value: param.parameterComparisonValue,
                    type: param.parameterType,
                  }
                  return paramCondition
                }
                return current
              })

              const funcConditions: FunctionCondition = {
                sighash: func.functionSig,
                type: func.wildcarded ? ConditionType.WILDCARDED : getFunctionConditionType(paramConditions),
                executionOption: func.executionOptions,
                params: paramConditions,
              }
              return [func.functionSig, funcConditions]
            }),
          )
          return {
            id: target.id,
            address: target.address,
            type: target.clearance,
            executionOption: target.executionOptions,
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
