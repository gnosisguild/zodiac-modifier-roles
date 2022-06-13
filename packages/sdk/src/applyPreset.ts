import EthersAdapter from "@gnosis.pm/safe-ethers-lib"
import defaultEthers, { Contract, PopulatedTransaction, Signer } from "ethers"
import SafeServiceClient from "@gnosis.pm/safe-service-client"
import Safe from "@gnosis.pm/safe-core-sdk"
import {
  EthAdapter,
  MetaTransactionData,
  OperationType,
} from "@gnosis.pm/safe-core-sdk-types"
import { encodeMulti } from "ethers-multisend"

import { Roles } from "../../evm/typechain-types"
import ROLES_ABI from "../../evm/build/artifacts/contracts/Roles.sol/Roles.json"

import { RolePermissions, RolePreset } from "./types"
import fetchPermissions from "./fetchPermissions"
import { NetworkId } from "./types"
import SAFE_TX_SERVICE from "./safeTxService"
import fillAndUnfoldPreset from "./fillAndUnfoldPreset"
import patchPermissions from "./patchPermissions"
import logCall from "./logCall"
import encodeCalls from "./encodeCalls"

let nonce: number

const DEFAULT_BATCH_SIZE = 75

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
export const applyPreset = async (
  address: string,
  roleId: number,
  preset: RolePreset,
  options: {
    signer: Signer
    network: NetworkId
    ethers?: typeof defaultEthers
    avatar: string
    safeAddress?: string
    multiSendBatchSize?: number
    currentPermissions?: RolePermissions
  }
): Promise<void> => {
  const {
    signer,
    ethers = defaultEthers,
    network,
    multiSendBatchSize = DEFAULT_BATCH_SIZE,
    currentPermissions,
  } = options
  const avatar = options.avatar || (await readAvatar(address, network))
  const safeAddress = options.safeAddress || avatar

  const transactions = await encodeApplyPreset(address, roleId, preset, {
    network,
    avatar,
    currentPermissions,
  })
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

export const encodeApplyPreset = async (
  address: string,
  roleId: number,
  preset: RolePreset,
  options: {
    network: NetworkId
    avatar?: string
    currentPermissions?: RolePermissions
  }
) => {
  const { network } = options
  const avatar = options.avatar || (await readAvatar(address, network))
  const currentPermissions =
    options.currentPermissions ||
    (await fetchPermissions({
      address,
      roleId,
      network,
    }))
  const nextPermissions = fillAndUnfoldPreset(preset, avatar)
  const calls = patchPermissions(currentPermissions, nextPermissions)
  calls.forEach((call) => logCall(call, console.debug))
  return await encodeCalls(address, roleId, calls)
}

const MULTI_SEND_CALL_ONLY = "0x40A2aCCbd92BCA938b02010E17A5b8929b49130D"

export const encodeApplyPresetMultisend = async (
  address: string,
  roleId: number,
  preset: RolePreset,
  options: {
    avatar: string
    network: NetworkId
    multiSendAddress?: string
    multiSendBatchSize?: number
    currentPermissions?: RolePermissions
  }
): Promise<MetaTransactionData[]> => {
  const {
    avatar,
    network,
    multiSendAddress = MULTI_SEND_CALL_ONLY,
    multiSendBatchSize = DEFAULT_BATCH_SIZE,
    currentPermissions,
  } = options
  const transactions = await encodeApplyPreset(address, roleId, preset, {
    network,
    avatar,
    currentPermissions,
  })
  const batches = batchArray(transactions, multiSendBatchSize)
  console.debug(
    `Encoded a total of ${transactions.length} calls in ${batches.length} multi-send batches of ${multiSendBatchSize}`
  )
  return batches.map((transactions) =>
    encodeMulti(transactions.map(asMetaTransaction), multiSendAddress)
  )
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

const batchArray = <T extends any>(array: T[], batchSize: number): T[][] => {
  const result = []
  for (var i = 0; i < array.length; i += batchSize) {
    result.push(array.slice(i, i + batchSize))
  }
  return result
}
