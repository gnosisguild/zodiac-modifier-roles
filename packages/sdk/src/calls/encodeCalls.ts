import { Roles__factory } from "../../../evm/typechain-types"

import { Call } from "./types"

const rolesInterface = Roles__factory.createInterface()

export const encodeCalls = (roleId: number, calls: Call[]): string[] => {
  return calls.map((call) => {
    switch (call.call) {
      case "allowTarget": {
        return rolesInterface.encodeFunctionData("allowTarget", [
          roleId,
          call.targetAddress,
          call.executionOptions,
        ])
      }

      case "scopeTarget": {
        return rolesInterface.encodeFunctionData("scopeTarget", [
          roleId,
          call.targetAddress,
        ])
      }

      case "revokeTarget": {
        return rolesInterface.encodeFunctionData("revokeTarget", [
          roleId,
          call.targetAddress,
        ])
      }

      case "allowFunction": {
        return rolesInterface.encodeFunctionData("allowFunction", [
          roleId,
          call.targetAddress,
          call.selector,
          call.executionOptions,
        ])
      }

      case "scopeFunction": {
        return rolesInterface.encodeFunctionData("scopeFunction", [
          roleId,
          call.targetAddress,
          call.selector,
          call.isParamScoped,
          call.paramType,
          call.paramComp,
          call.compValue,
          call.executionOptions,
        ])
      }

      case "revokeFunction": {
        return rolesInterface.encodeFunctionData("revokeFunction", [
          roleId,
          call.targetAddress,
          call.selector,
        ])
      }
    }
  })
}
