import { flattenCondition } from "../conditions"
import { encodeAnnotationsPost, POSTER_ADDRESS } from "./encodePoster"

import { Call } from "./types"
import { Roles__factory } from "../../../evm/typechain-types"

const rolesInterface = Roles__factory.createInterface()

export const encodeCalls = (
  calls: Call[],
  rolesMod: `0x${string}`
): { to: `0x${string}`; data: `0x${string}` }[] => {
  return calls.map((call) => {
    switch (call.call) {
      case "allowTarget": {
        return {
          to: rolesMod,
          data: rolesInterface.encodeFunctionData("allowTarget", [
            call.roleKey,
            call.targetAddress,
            call.executionOptions,
          ]) as `0x${string}`,
        }
      }

      case "scopeTarget": {
        return {
          to: rolesMod,
          data: rolesInterface.encodeFunctionData("scopeTarget", [
            call.roleKey,
            call.targetAddress,
          ]) as `0x${string}`,
        }
      }

      case "revokeTarget": {
        return {
          to: rolesMod,
          data: rolesInterface.encodeFunctionData("revokeTarget", [
            call.roleKey,
            call.targetAddress,
          ]) as `0x${string}`,
        }
      }

      case "allowFunction": {
        return {
          to: rolesMod,
          data: rolesInterface.encodeFunctionData("allowFunction", [
            call.roleKey,
            call.targetAddress,
            call.selector,
            call.executionOptions,
          ]) as `0x${string}`,
        }
      }

      case "scopeFunction": {
        return {
          to: rolesMod,
          data: rolesInterface.encodeFunctionData("scopeFunction", [
            call.roleKey,
            call.targetAddress,
            call.selector,
            flattenCondition(call.condition).map((c) => ({
              ...c,
              compValue: c.compValue || "0x",
            })),
            call.executionOptions,
          ]) as `0x${string}`,
        }
      }

      case "revokeFunction": {
        return {
          to: rolesMod,
          data: rolesInterface.encodeFunctionData("revokeFunction", [
            call.roleKey,
            call.targetAddress,
            call.selector,
          ]) as `0x${string}`,
        }
      }
      case "assignRoles": {
        return {
          to: rolesMod,
          data: rolesInterface.encodeFunctionData("assignRoles", [
            call.member,
            [call.roleKey],
            [call.join],
          ]) as `0x${string}`,
        }
      }
      case "setAllowance": {
        return {
          to: rolesMod,
          data: rolesInterface.encodeFunctionData("setAllowance", [
            call.key,
            call.balance,
            call.maxRefill,
            call.refill,
            call.period,
            call.timestamp,
          ]) as `0x${string}`,
        }
      }

      case "postAnnotations": {
        const { roleKey, body } = call
        return {
          to: POSTER_ADDRESS,
          data: encodeAnnotationsPost(rolesMod, roleKey, body),
        }
      }
    }
  })
}
