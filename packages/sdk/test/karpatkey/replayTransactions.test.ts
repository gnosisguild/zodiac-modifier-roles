import SafeServiceClient, {
  SafeMultisigTransactionResponse,
} from "@gnosis.pm/safe-service-client"
import hre, { deployments, waffle, ethers } from "hardhat"
import "@nomiclabs/hardhat-ethers"
import EthersAdapter, { EthersAdapterConfig } from "@gnosis.pm/safe-ethers-lib"

import { Roles, TestAvatar } from "../../../evm/typechain-types"
import { encodeApplyPreset } from "../../src/applyPreset"
import gnosisChainDeFiHarvestPreset from "../../src/presets/gnosisChainDeFiHarvest"
import gnosisChainDeFiManagePreset from "../../src/presets/gnosisChainDeFiManage"
import { EthAdapter } from "@gnosis.pm/safe-core-sdk-types"
import { RolePermissions, RolePreset } from "../../src/types"
import daoManageGnosisChain from "./transactions/daoManageGnosisChain.json"
import daoManageGnosisChainPatch from "./transactions/daoManageGnosisChainPatch.json"
import ltdManageGnosisChain from "./transactions/ltdManageGnosisChain.json"
import daoHarvestGnosisChain from "./transactions/daoHarvestGnosisChain.json"
import daoHarvestGnosisChainPatch from "./transactions/daoHarvestGnosisChainPatch.json"
import ltdHarvestGnosisChain from "./transactions/ltdHarvestGnosisChain.json"
import { KARPATKEY_ADDRESSES } from "../../tasks/manageKarpatkeyRoles"
import { writeFileSync } from "fs"
import path from "path"
import fillAndUnfoldPreset from "../../src/fillAndUnfoldPreset"
import grantPermissions from "../../src/grantPermissions"
import logCall from "../../src/logCall"
import encodeCalls from "../../src/encodeCalls"

describe("Karpatkey: Replay Transactions Test", async () => {
  const setup = deployments.createFixture(async () => {
    await deployments.fixture()
    const [owner] = waffle.provider.getWallets()

    const MultiSend = await hre.ethers.getContractFactory("MultiSend")
    const multiSend = await MultiSend.deploy()

    const Avatar = await hre.ethers.getContractFactory("TestAvatar")
    const avatar = (await Avatar.deploy()) as TestAvatar

    const Permissions = await hre.ethers.getContractFactory("Permissions")
    const permissions = await Permissions.deploy()
    const Modifier = await hre.ethers.getContractFactory("Roles", {
      libraries: {
        Permissions: permissions.address,
      },
    })

    const modifier = (await Modifier.deploy(
      owner.address,
      avatar.address,
      avatar.address
    )) as Roles

    await modifier.setMultisend("0x40A2aCCbd92BCA938b02010E17A5b8929b49130D")

    // add ethers default signer to role 1
    const defaultSigner = (await hre.ethers.getSigners())[0]
    await modifier.assignRoles(defaultSigner.address, [1], [true])

    const ethAdapter = new EthersAdapter({
      ethers: ethers as unknown as EthersAdapterConfig["ethers"],
      signer: defaultSigner,
    })
    const txServiceUrl = "https://safe-transaction.xdai.gnosis.io"
    const safeService = new SafeServiceClient({
      txServiceUrl,
      ethAdapter: ethAdapter as EthAdapter,
    })

    return {
      owner,
      Avatar,
      avatar,
      Modifier,
      modifier,
      multiSend,
      safeService,
    }
  })

  const runTransactionSimulation = async ({
    roleId,
    preset,
    safeAddress,
    transactionsJson,
    newTransactionsFileName,
  }: {
    roleId: number
    preset: RolePreset
    safeAddress: string
    transactionsJson: {
      permissions: RolePermissions
      success: string[]
      fail: string[]
    }
    newTransactionsFileName: string
  }) => {
    const { owner, modifier, safeService } = await setup()

    // setup base permissions
    const basePermissionsCalls = grantPermissions(transactionsJson.permissions)
    basePermissionsCalls.forEach((call) => logCall(call, console.debug))
    const basePermissionsSetupTransactions = await encodeCalls(
      modifier.address,
      roleId,
      basePermissionsCalls
    )
    for (let i = 0; i < basePermissionsSetupTransactions.length; i++) {
      await owner.sendTransaction(basePermissionsSetupTransactions[i])

      console.log(
        `Executed base permissions setup tx ${i + 1}/${
          basePermissionsSetupTransactions.length
        }`
      )
    }

    console.log("\n\n------- SUCCESSFULLY SETUP BASE PERMISSIONS -------\n\n")

    const transactions = await encodeApplyPreset(
      modifier.address,
      roleId,
      preset,
      {
        avatar: safeAddress,
        currentPermissions: transactionsJson.permissions,
        network: 100, // this value won't be used
      }
    )
    for (let i = 0; i < transactions.length; i++) {
      await owner.sendTransaction(transactions[i])

      console.log(
        `Executed permissions update tx ${i + 1}/${transactions.length}`
      )
    }
    console.log("\n\n------- SUCCESSFULLY APPLIED PRESET -------\n\n")

    const multisigTransactions = (
      await safeService.getMultisigTransactions(safeAddress)
    ).results

    const newFailingTransactions = []
    const newSucceedingTransactions = []

    for (let i = 0; i < multisigTransactions.length; i++) {
      const tx = multisigTransactions[i]
      // skip unconfirmed txs
      if (!tx.transactionHash) continue

      console.log(`Simulating ${printCallData(tx)} ...`)
      try {
        await modifier.execTransactionWithRole(
          tx.to,
          tx.value,
          tx.data || "0x00",
          tx.operation,
          roleId,
          false
        )

        if (transactionsJson.fail.includes(tx.transactionHash)) {
          console.error("Transaction succeeded that should be failing:", tx)
          throw new Error("Transaction unexpectedly succeeded")
        } else if (!transactionsJson.success.includes(tx.transactionHash)) {
          newSucceedingTransactions.push(tx)
        }
      } catch (e) {
        console.log((e as Error).message + "\n")
        if (transactionsJson.success.includes(tx.transactionHash)) {
          console.error("Transaction failed that should succeed:", tx)
          throw new Error("Transaction unexpectedly failed")
        } else if (!transactionsJson.fail.includes(tx.transactionHash)) {
          newFailingTransactions.push(tx)
        }
      }
    }

    console.log("\n\n------- TRANSACTION SIMULATION FINISHED -------")

    console.log(
      `${newSucceedingTransactions.length} new succeeding transactions:`
    )
    console.log(newSucceedingTransactions.map((tx) => tx.transactionHash))

    console.log(`\n${newFailingTransactions.length} new failing transactions:`)
    console.log(newFailingTransactions.map((tx) => tx.transactionHash))

    writeFileSync(
      path.join(__dirname, "transactions", `${newTransactionsFileName}.json`),
      JSON.stringify(
        {
          permissions: fillAndUnfoldPreset(preset, safeAddress),
          success: newSucceedingTransactions,
          fail: newFailingTransactions,
        },
        null,
        2
      )
    )
  }

  describe("Gnosis Chain DeFi Manage preset", () => {
    it("allows executing all transactions from the history of the Limited Safe on Gnosis Chain", async () => {
      await runTransactionSimulation({
        roleId: 1,
        preset: gnosisChainDeFiManagePreset,
        safeAddress: KARPATKEY_ADDRESSES.LTD_GNO.AVATAR,
        transactionsJson: ltdManageGnosisChain,
        newTransactionsFileName: "ltdManageGnosisChainNew",
      })
    })

    it("allows executing all transactions from the history of the DAO Safe on Gnosis Chain", async () => {
      await runTransactionSimulation({
        roleId: 1,
        preset: gnosisChainDeFiManagePreset,
        safeAddress: KARPATKEY_ADDRESSES.DAO_GNO.AVATAR,
        transactionsJson: daoManageGnosisChain,
        newTransactionsFileName: "daoManageGnosisChainNew",
      })
    })

    it("permissions patch: allows executing all transactions from the history of the DAO Safe on Gnosis Chain", async () => {
      await runTransactionSimulation({
        roleId: 1,
        preset: gnosisChainDeFiManagePreset,
        safeAddress: KARPATKEY_ADDRESSES.DAO_GNO.AVATAR,
        transactionsJson: daoManageGnosisChainPatch,
        newTransactionsFileName: "daoManageGnosisChainPatchNew",
      })
    })
  })

  describe("Gnosis Chain DeFi Harvest preset", () => {
    it("allows executing all harvesting transactions from the history of the Limited Safe on Gnosis Chain", async () => {
      await runTransactionSimulation({
        roleId: 2,
        preset: gnosisChainDeFiHarvestPreset,
        safeAddress: KARPATKEY_ADDRESSES.LTD_GNO.AVATAR,
        transactionsJson: ltdHarvestGnosisChain,
        newTransactionsFileName: "ltdHarvestGnosisChainNew",
      })
    })

    it("allows executing all harvesting transactions from the history of the DAO Safe on Gnosis Chain", async () => {
      await runTransactionSimulation({
        roleId: 2,
        preset: gnosisChainDeFiHarvestPreset,
        safeAddress: KARPATKEY_ADDRESSES.DAO_GNO.AVATAR,
        transactionsJson: daoHarvestGnosisChain,
        newTransactionsFileName: "daoHarvestGnosisChainNew",
      })
    })

    it("permissions patch: allows executing all transactions from the history of the DAO Safe on Gnosis Chain", async () => {
      await runTransactionSimulation({
        roleId: 2,
        preset: gnosisChainDeFiHarvestPreset,
        safeAddress: KARPATKEY_ADDRESSES.DAO_GNO.AVATAR,
        transactionsJson: daoHarvestGnosisChainPatch,
        newTransactionsFileName: "daoHarvestGnosisChainPatchNew",
      })
    })
  })
})

const printCallData = (tx: SafeMultisigTransactionResponse) => {
  if (!tx.data) return `call to ${tx.to}`

  if (!tx.dataDecoded) {
    return `call ${tx.data} to ${tx.to}`
  }

  const decoded = tx.dataDecoded as any
  const params = decoded.parameters?.map((p: any) => p.value).join(", ") || ""
  return `call ${decoded.method}(${params}) to ${tx.to}`
}
