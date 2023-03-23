import { formatBytes32String } from "ethers/lib/utils"

import { Roles__factory } from "../../../evm/typechain-types"
import { flattenCondition } from "../conditions"

import { Call } from "./types"

const rolesInterface = Roles__factory.createInterface()

export const encodeCalls = (roleKey: string, calls: Call[]): string[] => {
  return calls.map((call) => {
    switch (call.call) {
      case "allowTarget": {
        return rolesInterface.encodeFunctionData("allowTarget", [
          formatBytes32String(roleKey),
          call.targetAddress,
          call.executionOptions,
        ])
      }

      case "scopeTarget": {
        return rolesInterface.encodeFunctionData("scopeTarget", [
          formatBytes32String(roleKey),
          call.targetAddress,
        ])
      }

      case "revokeTarget": {
        return rolesInterface.encodeFunctionData("revokeTarget", [
          formatBytes32String(roleKey),
          call.targetAddress,
        ])
      }

      case "allowFunction": {
        return rolesInterface.encodeFunctionData("allowFunction", [
          formatBytes32String(roleKey),
          call.targetAddress,
          call.selector,
          call.executionOptions,
        ])
      }

      case "scopeFunction": {
        return rolesInterface.encodeFunctionData("scopeFunction", [
          formatBytes32String(roleKey),
          call.targetAddress,
          call.selector,
          flattenCondition(call.condition),
          call.executionOptions,
        ])
      }

      case "revokeFunction": {
        return rolesInterface.encodeFunctionData("revokeFunction", [
          formatBytes32String(roleKey),
          call.targetAddress,
          call.selector,
        ])
      }
    }
  })
}
