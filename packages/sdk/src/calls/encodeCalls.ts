import { Roles__factory } from "../../../evm/typechain-types"
import { flattenCondition } from "../conditions"

import { Call } from "./types"

const rolesInterface = Roles__factory.createInterface()

export const encodeCalls = (
  roleKey: string,
  calls: Call[]
): `0x${string}`[] => {
  return calls.map((call) => {
    switch (call.call) {
      case "allowTarget": {
        return rolesInterface.encodeFunctionData("allowTarget", [
          roleKey,
          call.targetAddress,
          call.executionOptions,
        ])
      }

      case "scopeTarget": {
        return rolesInterface.encodeFunctionData("scopeTarget", [
          roleKey,
          call.targetAddress,
        ])
      }

      case "revokeTarget": {
        return rolesInterface.encodeFunctionData("revokeTarget", [
          roleKey,
          call.targetAddress,
        ])
      }

      case "allowFunction": {
        return rolesInterface.encodeFunctionData("allowFunction", [
          roleKey,
          call.targetAddress,
          call.selector,
          call.executionOptions,
        ])
      }

      case "scopeFunction": {
        return rolesInterface.encodeFunctionData("scopeFunction", [
          roleKey,
          call.targetAddress,
          call.selector,
          flattenCondition(call.condition).map((c) => ({
            ...c,
            compValue: c.compValue || "0x",
          })),
          call.executionOptions,
        ])
      }

      case "revokeFunction": {
        return rolesInterface.encodeFunctionData("revokeFunction", [
          roleKey,
          call.targetAddress,
          call.selector,
        ])
      }
    }
  }) as `0x${string}`[]
}
