import Safe from "@safe-global/safe-core-sdk"
import {
  EthAdapter,
  MetaTransactionData,
} from "@safe-global/safe-core-sdk-types"
import EthersAdapter from "@safe-global/safe-ethers-lib"
import SafeServiceClient from "@safe-global/safe-service-client"
import { ethers as defaultEthers, Signer } from "ethers"
import { encodeMulti } from "ethers-multisend"

import { encodeCalls, logCall } from "./calls"
import { fetchRole } from "./fetchRole"
import patchPermissions from "./patchPermissions"
import fillPreset from "./presets/fillPreset"
import { PlaceholderValues, RolePreset } from "./presets/types"
import SAFE_TX_SERVICE from "./safeTxService"
import { NetworkId, Target } from "./types"

let nonce: number

const DEFAULT_BATCH_SIZE = 75

/**
 * Updates a role, setting all permissions of the given preset via the Safe SDK
 *
 * @param address The address of the roles modifier
 * @param roleKey The key of the role to update
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
export const applyPreset = async <P extends RolePreset>(
  address: string,
  roleKey: string,
  preset: P,
  placeholderValues: PlaceholderValues<P>,
  options: {
    safeAddress: string
    signer: Signer
    network: NetworkId
    ethers?: typeof defaultEthers
    multiSendBatchSize?: number
    currentPermissions?: Target[]
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

  const transactionsData = await encodeApplyPreset(
    address,
    roleKey,
    preset,
    placeholderValues,
    {
      network,
      currentPermissions,
    }
  )

  // batch into multi-send transactions of 75 calls each, to avoid gas limits
  const batches = batchArray(
    transactionsData.map((data) => ({
      to: address,
      data: data,
      value: "0",
    })),
    multiSendBatchSize
  )

  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer,
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
    const safeTransaction = await safeSdk.createTransaction({
      safeTransactionData: batches[i],
      onlyCalls: false,
      options: {
        nonce: nonce++,
      },
    })
    const safeTxHash = await safeSdk.getTransactionHash(safeTransaction)
    const senderSignature = await safeSdk.signTransactionHash(safeTxHash)
    await safeService.proposeTransaction({
      safeAddress,
      safeTransactionData: safeTransaction.data,
      safeTxHash,
      senderAddress: await signer.getAddress(),
      senderSignature: senderSignature.data,
      origin: "Zodiac Roles SDK",
    })
  }

  console.debug(
    `Executed a total of ${transactionsData.length} calls in ${batches.length} multi-send batches of ${multiSendBatchSize}`
  )
}

/**
 * Returns a set of populated transactions objects for updating the permissions of the given role.
 *
 * @param address The address of the roles modifier
 * @param roleKey The key of the role to update
 * @param preset Permissions preset to apply
 * @param placeholderValues Values to fill in for placeholders in the preset
 * @param options.network The network ID where the roles modifier is deployed
 * @param [options.currentPermissions] The permissions that are currently set on the role. The new preset will be applied as a patch to these permissions.
 *
 */
export const encodeApplyPreset = async <P extends RolePreset>(
  address: string,
  roleKey: string,
  preset: P,
  placeholderValues: PlaceholderValues<P>,
  options: {
    network: NetworkId
    currentPermissions?: Target[]
  }
) => {
  let currentPermissions = options.currentPermissions
  if (!currentPermissions) {
    const role = await fetchRole({
      address,
      roleKey,
      network: options.network,
    })
    currentPermissions = role.targets
  }

  const nextPermissions = fillPreset(preset, placeholderValues)
  const calls = patchPermissions(currentPermissions, nextPermissions)
  calls.forEach((call) => logCall(call, console.debug))
  return encodeCalls(roleKey, calls)
}

const MULTI_SEND_CALL_ONLY = "0x40A2aCCbd92BCA938b02010E17A5b8929b49130D"

/**
 * Returns the transactions for updating the permissions of the given role, batching them into multi-send calls.
 *
 * @param address The address of the roles modifier
 * @param roleKey The key of the role to update
 * @param preset Permissions preset to apply
 * @param placeholderValues Values to fill in for placeholders in the preset
 * @param options.network The network ID where the roles modifier is deployed
 * @param [options.multiSendAddress] The address of the MultiSend contract to use for executing the transactions
 * @param [options.multiSendBatchSize] The maximum batch size to use for executing the transactions (defaults to 75), should be low enough to not exceed the block gas limit
 * @param [options.currentPermissions] The permissions that are currently set on the role. The new preset will be applied as a patch to these permissions.
 *
 */
export const encodeApplyPresetMultisend = async <P extends RolePreset>(
  address: string,
  roleKey: string,
  preset: P,
  placeholderValues: PlaceholderValues<P>,
  options: {
    network: NetworkId
    multiSendAddress?: string
    multiSendBatchSize?: number
    currentPermissions?: Target[]
  }
): Promise<MetaTransactionData[]> => {
  const {
    network,
    multiSendAddress = MULTI_SEND_CALL_ONLY,
    multiSendBatchSize = DEFAULT_BATCH_SIZE,
    currentPermissions,
  } = options

  const transactionsData = await encodeApplyPreset(
    address,
    roleKey,
    preset,
    placeholderValues,
    {
      network,
      currentPermissions,
    }
  )
  const batches = batchArray(
    transactionsData.map((data) => ({
      to: address,
      data: data,
      value: "0",
    })),
    multiSendBatchSize
  )
  console.debug(
    `Encoded a total of ${transactionsData.length} calls in ${batches.length} multi-send batches of ${multiSendBatchSize}`
  )
  return batches.map((batch) => encodeMulti(batch, multiSendAddress))
}

/**
 * Returns the transactions for updating the permissions of the given role as JSON file that can be uploaded to the Safe Transaction Builder app.
 *
 * @param address The address of the roles modifier
 * @param roleKey The key of the role to update
 * @param preset Permissions preset to apply
 * @param placeholderValues Values to fill in for placeholders in the preset
 * @param options.network The network ID where the roles modifier is deployed
 * @param [options.currentPermissions] The permissions that are currently set on the role. The new preset will be applied as a patch to these permissions.
 *
 */
export const encodeApplyPresetTxBuilder = async <P extends RolePreset>(
  address: string,
  roleKey: string,
  preset: P,
  placeholderValues: PlaceholderValues<P>,
  options: {
    network: NetworkId
    currentPermissions?: Target[]
  }
) => {
  const { network, currentPermissions } = options

  const transactionsData = await encodeApplyPreset(
    address,
    roleKey,
    preset,
    placeholderValues,
    {
      network,
      currentPermissions,
    }
  )
  console.debug(`Encoded a total of ${transactionsData.length} calls`)
  return {
    version: "1.0",
    chainId: network.toString(10),
    meta: {
      name: null,
      description: "",
      txBuilderVersion: "1.8.0",
    },
    createdAt: Date.now(),
    transactions: transactionsData.map((data) => ({
      to: address,
      data: data,
      value: "0",
    })),
  }
}

const batchArray = <T>(array: T[], batchSize: number): T[][] => {
  const result = []
  for (let i = 0; i < array.length; i += batchSize) {
    result.push(array.slice(i, i + batchSize))
  }
  return result
}
