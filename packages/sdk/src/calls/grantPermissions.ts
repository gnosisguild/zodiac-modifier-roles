import {
  Clearance,
  Operator,
  Function,
  Parameter,
  ParameterType,
  Role,
} from "../types"

import { Call } from "./types"

export const grantPermissions = (permissions: Role): Call[] => {
  const calls: Call[] = []

  permissions.targets.forEach((target) => {
    if (target.clearance === Clearance.Target) {
      calls.push({
        call: "allowTarget",
        targetAddress: target.address,
        options: target.executionOptions,
      })
    }

    if (target.clearance === Clearance.Function) {
      // function scoping requires setting the target to function clearance
      calls.push({
        call: "scopeTarget",
        targetAddress: target.address,
      })

      target.functions.forEach((func) => {
        if (func.wildcarded) {
          calls.push({
            call: "scopeAllowFunction",
            targetAddress: target.address,
            functionSig: func.selector,
            options: func.executionOptions,
          })
        } else {
          if (func.parameters.length === 0) {
            throw new Error("Non-wildcarded function must have parameters")
          }

          calls.push(scopeFunction(func, target.address))

          func.parameters
            .filter((param) => param.comparison === Operator.OneOf)
            .forEach((param) => {
              calls.push({
                call: "scopeParameterAsOneOf",
                targetAddress: target.address,
                functionSig: func.selector,
                paramIndex: param.index,
                type: param.type,
                value: param.comparisonValue,
              })
            })
        }
      })
    }
  })

  return calls
}

const scopeFunction = (func: Function, targetAddress: string): Call => {
  // create an array where parameters are at their actual indices with undefined values filling the gaps
  // we skip over OneOf parameters because they are handled extra
  const paramsSkippingOneOf = func.parameters.map((param) =>
    param?.comparison !== Operator.OneOf ? param : undefined
  )
  const params: (Parameter | undefined)[] = new Array(
    Math.max(...paramsSkippingOneOf.map((param) => param?.index || 0))
  ).fill(undefined)
  paramsSkippingOneOf.forEach((param) => {
    if (param) {
      params[param.index] = param
    }
  })

  return {
    call: "scopeFunction",
    targetAddress,
    functionSig: func.selector,
    options: func.executionOptions,
    isParamScoped: params.map(Boolean),
    paramType: params.map((param) => param?.type || ParameterType.Static),
    paramComp: params.map((param) => param?.comparison || Operator.EqualTo) as (
      | Operator.EqualTo
      | Operator.GreaterThan
      | Operator.LessThan
    )[],
    compValue: params.map((param) => param?.comparisonValue[0] || "0x"),
  }
}
