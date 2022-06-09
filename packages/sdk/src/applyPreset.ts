import EthersAdapter from "@gnosis.pm/safe-ethers-lib"
import defaultEthers, { Contract, PopulatedTransaction, Signer } from "ethers"
import SafeServiceClient from "@gnosis.pm/safe-service-client"
import Safe from "@gnosis.pm/safe-core-sdk"
import {
  EthAdapter,
  MetaTransactionData,
  OperationType,
} from "@gnosis.pm/safe-core-sdk-types"

import { Roles } from "../../evm/typechain-types"
import ROLES_ABI from "../../evm/build/artifacts/contracts/Roles.sol/Roles.json"

import { RolePreset } from "./types"
import fetchPermissions from "./fetchPermissions"
import { NetworkId } from "./types"
import SAFE_TX_SERVICE from "./safeTxService"
import fillAndUnfoldPreset from "./fillAndUnfoldPreset"
import patchPermissions from "./patchPermissions"
import logCall from "./logCall"
import encodeCalls from "./encodeCalls"

let nonce: number

/**
 * Updates a role, setting all permissions of the given preset
 *
 * @param address The address of the roles modifier
 * @param roleId ID of the role to update
 * @param preset Permissions preset to apply
 * @param options.signer The signer to use for executing the transactions
 * @param options.network The network ID where the roles modifier is deployed
 * @param [options.ethers] The ethers instance to use for executing the transactions
 * @param [options.avatar] The avatar address of the roles modifier
 *
 */
const applyPreset = async (
  address: string,
  roleId: number,
  preset: RolePreset,
  options: {
    signer: Signer
    network: NetworkId
    ethers?: typeof defaultEthers
    avatar?: string
    safeAddress?: string
    multiSendBatchSize?: number
  }
): Promise<void> => {
  const {
    signer,
    ethers = defaultEthers,
    network,
    multiSendBatchSize = 75,
  } = options
  const contract = new Contract(address, ROLES_ABI.abi, signer) as Roles
  const avatar = options.avatar || (await contract.avatar())
  const safeAddress = options.safeAddress || avatar

  const currentPermissions = await fetchPermissions({
    address,
    roleId,
    network,
  })
  const nextPermissions = fillAndUnfoldPreset(preset, avatar)
  const calls = patchPermissions(currentPermissions, nextPermissions)
  const callBatches = batchArray(calls, multiSendBatchSize)

  calls.forEach((call) => logCall(call, console.debug))
  console.debug(
    `For a total of ${calls.length} calls, that will be executed in ${callBatches.length} multi-send batches of ${multiSendBatchSize})}`
  )

  const ethAdapter = new EthersAdapter({
    ethers,
    signer,
  })
  const txServiceUrl = SAFE_TX_SERVICE[network]
  const safeService = new SafeServiceClient({
    txServiceUrl,
    ethAdapter: ethAdapter as EthAdapter,
  })
  const safeSdk = await Safe.create({
    ethAdapter: ethAdapter as EthAdapter,
    safeAddress,
  })

  nonce = await signer.getTransactionCount()

  for (let i = 0; i < callBatches.length; i++) {
    const batch = await encodeCalls(address, roleId, callBatches[i])
    const safeTransaction = await safeSdk.createTransaction(
      batch.map(asMetaTransaction),
      {
        nonce: nonce++,
      }
    )
    await safeSdk.signTransaction(safeTransaction)
    const safeTxHash = await safeSdk.getTransactionHash(safeTransaction)
    await safeService.proposeTransaction({
      safeAddress,
      safeTransaction,
      safeTxHash,
      senderAddress: await signer.getAddress(),
      origin: "Zodiac Roles SDK",
    })
  }
}

export default applyPreset

const asMetaTransaction = (
  populatedTransaction: PopulatedTransaction
): MetaTransactionData => {
  return {
    to: populatedTransaction.to || "",
    data: populatedTransaction.data || "",
    value: populatedTransaction.value?.toHexString() || "0",
    operation: OperationType.Call,
  }
}

const batchArray = <T extends any>(array: T[], batchSize: number): T[][] => {
  const result = []
  for (var i = 0; i < array.length; i += batchSize) {
    result.push(array.slice(i, i + batchSize))
  }
  return result
}
