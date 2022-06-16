import { Contract, PopulatedTransaction } from "ethers"

import ROLES_ABI from "../../evm/build/artifacts/contracts/Roles.sol/Roles.json"
import { Roles } from "../../evm/typechain-types"

import { Call } from "./types"

const encodeCalls = async (
  rolesContractAddress: string,
  roleId: number,
  calls: Call[]
): Promise<PopulatedTransaction[]> => {
  const contract = new Contract(rolesContractAddress, ROLES_ABI.abi) as Roles
  return Promise.all(
    calls
      .map((call) => {
        switch (call.call) {
          case "allowTarget": {
            return contract.populateTransaction.allowTarget(
              roleId,
              call.targetAddress,
              call.options
            )
          }

          case "scopeTarget": {
            return contract.populateTransaction.scopeTarget(
              roleId,
              call.targetAddress
            )
          }

          case "scopeAllowFunction": {
            return contract.populateTransaction.scopeAllowFunction(
              roleId,
              call.targetAddress,
              call.functionSig,
              call.options
            )
          }

          case "scopeFunction": {
            return contract.populateTransaction.scopeFunction(
              roleId,
              call.targetAddress,
              call.functionSig,
              call.isParamScoped,
              call.paramType,
              call.paramComp,
              call.compValue,
              call.options
            )
          }

          case "scopeParameterAsOneOf": {
            return contract.populateTransaction.scopeParameterAsOneOf(
              roleId,
              call.targetAddress,
              call.functionSig,
              call.paramIndex,
              call.type,
              call.value
            )
          }

          case "revokeTarget": {
            return contract.populateTransaction.revokeTarget(
              roleId,
              call.targetAddress
            )
          }

          case "scopeRevokeFunction": {
            return contract.populateTransaction.scopeRevokeFunction(
              roleId,
              call.targetAddress,
              call.functionSig
            )
          }
        }
      })
      .map((promise, i) =>
        promise.catch((e) => {
          console.error(`Encoding call #${i} failed: ${e.message}`, calls[i])
          throw e
        })
      )
  )
}

export default encodeCalls
