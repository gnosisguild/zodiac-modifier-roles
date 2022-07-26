import Safe from "@gnosis.pm/safe-core-sdk"
import {
  EthAdapter,
  MetaTransactionData,
  OperationType,
} from "@gnosis.pm/safe-core-sdk-types"
import EthersAdapter from "@gnosis.pm/safe-ethers-lib"
import SafeServiceClient from "@gnosis.pm/safe-service-client"
import defaultEthers, { Contract, PopulatedTransaction, Signer } from "ethers"
import { encodeMulti } from "ethers-multisend"

import ROLES_ABI from "../../evm/build/artifacts/contracts/Roles.sol/Roles.json"
import { Roles } from "../../evm/typechain-types"

import encodeCalls from "./encodeCalls"
import fetchPermissions from "./fetchPermissions"
import fillAndUnfoldPreset from "./fillAndUnfoldPreset"
import logCall from "./logCall"
import patchPermissions from "./patchPermissions"
import SAFE_TX_SERVICE from "./safeTxService"
import { RolePermissions, RolePreset, NetworkId } from "./types"

let nonce: number

const DEFAULT_BATCH_SIZE = 75

/**
 * Updates a role, setting all permissions of the given preset via the Safe SDK
 *
 * @param address The address of the roles modifier
 * @param roleId ID of the role to update
 * @param preset Permissions preset to apply
 * @param placeholderValues Values to fill in for placeholders in the preset
 * @param options.safeAddress The address of the Safe owning the roles modifier
 * @param options.signer The signer to use for executing the transactions
 * @param options.network The network ID where the roles modifier is deployed
 * @param [options.ethers] The ethers instance to use for executing the transactions
 * @param [options.multiSendBatchSize] The maximum batch size to use for executing the transactions (defaults to 75), should be low enough to not exceed the block gas limit
 * @param [options.currentPermissions] The permissions that are currently set on the role. The new preset will be applied as a patch to these permissions.
 *
 */
export const applyPreset = async (
  address: string,
  roleId: number,
  preset: RolePreset,
  placeholderValues: Record<symbol, string>,
  options: {
    safeAddress: string
    signer: Signer
    network: NetworkId
    ethers?: typeof defaultEthers
    multiSendBatchSize?: number
    currentPermissions?: RolePermissions
  }
): Promise<void> => {
  const {
    safeAddress,
    signer,
    ethers = defaultEthers,
    network,
    multiSendBatchSize = DEFAULT_BATCH_SIZE,
    currentPermissions,
  } = options

  const transactions = await encodeApplyPreset(
    address,
    roleId,
    preset,
    placeholderValues,
    {
      network,
      currentPermissions,
    }
  )

  // batch into multi-send transactions of 75 calls each, to avoid gas limits
  const batches = batchArray(
    transactions.map(asMetaTransaction),
    multiSendBatchSize
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

  nonce = await safeSdk.getNonce()
  for (let i = 0; i < batches.length; i++) {
    const safeTransaction = await safeSdk.createTransaction(batches[i], {
      nonce: nonce++,
    })
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

  console.debug(
    `Executed a total of ${transactions.length} calls in ${batches.length} multi-send batches of ${multiSendBatchSize}`
  )
}

/**
 * Returns a set of populated transactions objects for updating the permissions of the given role.
 *
 * @param address The address of the roles modifier
 * @param roleId ID of the role to update
 * @param preset Permissions preset to apply
 * @param placeholderValues Values to fill in for placeholders in the preset
 * @param options.network The network ID where the roles modifier is deployed
 * @param [options.currentPermissions] The permissions that are currently set on the role. The new preset will be applied as a patch to these permissions.
 *
 */
export const encodeApplyPreset = async (
  address: string,
  roleId: number,
  preset: RolePreset,
  placeholderValues: Record<symbol, string>,
  options: {
    network: NetworkId
    currentPermissions?: RolePermissions
  }
) => {
  const { network } = options
  const currentPermissions =
    options.currentPermissions ||
    (await fetchPermissions({
      address,
      roleId,
      network,
    }))
  const nextPermissions = fillAndUnfoldPreset(preset, placeholderValues)
  const calls = patchPermissions(currentPermissions, nextPermissions)
  calls.forEach((call) => logCall(call, console.debug))
  return await encodeCalls(address, roleId, calls)
}

const MULTI_SEND_CALL_ONLY = "0x40A2aCCbd92BCA938b02010E17A5b8929b49130D"

/**
 * Returns the transactions for updating the permissions of the given role, batching them into multi-send calls.
 *
 * @param address The address of the roles modifier
 * @param roleId ID of the role to update
 * @param preset Permissions preset to apply
 * @param placeholderValues Values to fill in for placeholders in the preset
 * @param options.network The network ID where the roles modifier is deployed
 * @param [options.multiSendAddress] The address of the MultiSend contract to use for executing the transactions
 * @param [options.multiSendBatchSize] The maximum batch size to use for executing the transactions (defaults to 75), should be low enough to not exceed the block gas limit
 * @param [options.currentPermissions] The permissions that are currently set on the role. The new preset will be applied as a patch to these permissions.
 *
 */
export const encodeApplyPresetMultisend = async (
  address: string,
  roleId: number,
  preset: RolePreset,
  placeholderValues: Record<symbol, string>,
  options: {
    network: NetworkId
    multiSendAddress?: string
    multiSendBatchSize?: number
    currentPermissions?: RolePermissions
  }
): Promise<MetaTransactionData[]> => {
  const {
    network,
    multiSendAddress = MULTI_SEND_CALL_ONLY,
    multiSendBatchSize = DEFAULT_BATCH_SIZE,
    currentPermissions,
  } = options

  const transactions = await encodeApplyPreset(
    address,
    roleId,
    preset,
    placeholderValues,
    {
      network,
      currentPermissions,
    }
  )
  const batches = batchArray(transactions, multiSendBatchSize)
  console.debug(
    `Encoded a total of ${transactions.length} calls in ${batches.length} multi-send batches of ${multiSendBatchSize}`
  )
  return batches[0].map(asMetaTransaction)
}

const readAvatar = async (address: string, network: NetworkId) => {
  const contract = new Contract(
    address,
    ROLES_ABI.abi,
    defaultEthers.getDefaultProvider(`${network}`)
  ) as Roles
  return await contract.avatar()
}

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

const batchArray = <T>(array: T[], batchSize: number): T[][] => {
  const result = []
  for (let i = 0; i < array.length; i += batchSize) {
    result.push(array.slice(i, i + batchSize))
  }
  return result
}
