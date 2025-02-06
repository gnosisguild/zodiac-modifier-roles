import { Interface } from "ethers"
import { Roles__factory } from "../../../evm/typechain-types"
import { flattenCondition } from "../conditions"

import { Call } from "./types"
import { encodeAnnotationsPost, POSTER_ADDRESS } from "./encodePoster"

const rolesInterface = Roles__factory.createInterface()

export const encodeCalls = (
  calls: Call[],
  rolesMod: string
): { to: string; data: string }[] => {
  return calls.map((call) => {
    switch (call.call) {
      case "allowTarget": {
        return {
          to: rolesMod,
          data: rolesInterface.encodeFunctionData("allowTarget", [
            call.roleKey,
            call.targetAddress,
            call.executionOptions,
          ]),
        }
      }

      case "scopeTarget": {
        return {
          to: rolesMod,
          data: rolesInterface.encodeFunctionData("scopeTarget", [
            call.roleKey,
            call.targetAddress,
          ]),
        }
      }

      case "revokeTarget": {
        return {
          to: rolesMod,
          data: rolesInterface.encodeFunctionData("revokeTarget", [
            call.roleKey,
            call.targetAddress,
          ]),
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
          ]),
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
          ]),
        }
      }

      case "revokeFunction": {
        return {
          to: rolesMod,
          data: rolesInterface.encodeFunctionData("revokeFunction", [
            call.roleKey,
            call.targetAddress,
            call.selector,
          ]),
        }
      }
      case "assignRoles": {
        return {
          to: rolesMod,
          data: rolesInterface.encodeFunctionData("assignRoles", [
            call.member,
            [call.roleKey],
            [call.join],
          ]),
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
          ]),
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
