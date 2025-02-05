import { Roles__factory } from "../../../evm/typechain-types"
import { encodeAnnotationsPost } from "../annotations/poster"
import { flattenCondition } from "../conditions"

import { Call } from "./types"

const rolesInterface = Roles__factory.createInterface()

export const encodeCalls = (
  calls: Call[],
  rolesMod: string
): `0x${string}`[] => {
  return calls.map((call) => {
    switch (call.call) {
      case "allowTarget": {
        return rolesInterface.encodeFunctionData("allowTarget", [
          call.roleKey,
          call.targetAddress,
          call.executionOptions,
        ])
      }

      case "scopeTarget": {
        return rolesInterface.encodeFunctionData("scopeTarget", [
          call.roleKey,
          call.targetAddress,
        ])
      }

      case "revokeTarget": {
        return rolesInterface.encodeFunctionData("revokeTarget", [
          call.roleKey,
          call.targetAddress,
        ])
      }

      case "allowFunction": {
        return rolesInterface.encodeFunctionData("allowFunction", [
          call.roleKey,
          call.targetAddress,
          call.selector,
          call.executionOptions,
        ])
      }

      case "scopeFunction": {
        return rolesInterface.encodeFunctionData("scopeFunction", [
          call.roleKey,
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
          call.roleKey,
          call.targetAddress,
          call.selector,
        ])
      }
      case "assignRoles": {
        return rolesInterface.encodeFunctionData("assignRoles", [
          call.member,
          [call.roleKey],
          [call.join],
        ])
      }
      case "setAllowance": {
        return rolesInterface.encodeFunctionData("setAllowance", [
          call.key,
          call.balance,
          call.maxRefill,
          call.refill,
          call.period,
          call.timestamp,
        ])
      }

      case "postAnnotations": {
        const { roleKey, body } = call
        return encodeAnnotationsPost(rolesMod, roleKey, body)
      }
    }
  }) as `0x${string}`[]
}
