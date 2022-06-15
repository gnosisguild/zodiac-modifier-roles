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
import ltdManageGnosisChain from "./transactions/ltdManageGnosisChain.json"
import daoHarvestGnosisChain from "./transactions/daoHarvestGnosisChain.json"
import ltdHarvestGnosisChain from "./transactions/ltdHarvestGnosisChain.json"
import daoManageGnosisChainSnapshot01 from "./permissions/daoManageGnosisChainSnapshot01.json"
import daoHarvestGnosisChainSnapshot01 from "./permissions/daoHarvestGnosisChainSnapshot01.json"
import { KARPATKEY_ADDRESSES } from "../../tasks/manageKarpatkeyRoles"
import { writeFileSync } from "fs"
import path from "path"
import fillAndUnfoldPreset from "../../src/fillAndUnfoldPreset"
import grantPermissions from "../../src/grantPermissions"
import logCall from "../../src/logCall"
import encodeCalls from "../../src/encodeCalls"
import {
  AVATAR_ADDRESS_PLACEHOLDER,
  OMNI_BRIDGE_DATA_PLACEHOLDER,
} from "../../src/presets/placeholders"
import { defaultAbiCoder } from "ethers/lib/utils"

describe("Karpatkey: Replay Transactions Test", async () => {
  const ROLE_ID = 1

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
    await modifier.assignRoles(defaultSigner.address, [ROLE_ID], [true])

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

  const EMPTY_PERMISSIONS = { targets: [] }

  const runTransactionSimulation = async ({
    preset,
    config,
    transactionsJson,
    basePermissions = EMPTY_PERMISSIONS,
    resultsFileName,
  }: {
    preset: RolePreset
    config: typeof KARPATKEY_ADDRESSES["DAO_GNO"]
    transactionsJson: {
      success: string[]
      fail: string[]
    }
    basePermissions?: RolePermissions
    resultsFileName: string
  }) => {
    const { owner, modifier, safeService } = await setup()

    // setup base permissions
    const basePermissionsCalls = grantPermissions(basePermissions)
    basePermissionsCalls.forEach((call) => logCall(call, console.debug))
    const basePermissionsSetupTransactions = await encodeCalls(
      modifier.address,
      ROLE_ID,
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

    const placeholderValues = {
      [AVATAR_ADDRESS_PLACEHOLDER]: defaultAbiCoder.encode(
        ["address"],
        [config.AVATAR]
      ),
      [OMNI_BRIDGE_DATA_PLACEHOLDER]: defaultAbiCoder.encode(
        ["bytes"],
        [config.BRIDGED_SAFE]
      ),
    }
    const transactions = await encodeApplyPreset(
      modifier.address,
      ROLE_ID,
      preset,
      placeholderValues,
      {
        currentPermissions: basePermissions,
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

    const safeAddress = config.AVATAR
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
          ROLE_ID,
          false
        )
      } catch (e) {
        // tx failed
        console.log((e as Error).message + "\n")
        if (transactionsJson.success.includes(tx.transactionHash)) {
          console.error("Transaction failed that should succeed:", tx)
          throw new Error("Transaction unexpectedly failed")
        } else if (!transactionsJson.fail.includes(tx.transactionHash)) {
          newFailingTransactions.push(tx)
        }
        continue
      }

      // tx succeeded
      if (transactionsJson.fail.includes(tx.transactionHash)) {
        console.error("Transaction succeeded that should be failing:", tx)
        throw new Error("Transaction unexpectedly succeeded")
      } else if (!transactionsJson.success.includes(tx.transactionHash)) {
        newSucceedingTransactions.push(tx)
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
      path.join(__dirname, "results", `${resultsFileName}.json`),
      JSON.stringify(
        {
          permissions: fillAndUnfoldPreset(preset, placeholderValues),
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
        preset: gnosisChainDeFiManagePreset,
        config: KARPATKEY_ADDRESSES.LTD_GNO,
        transactionsJson: ltdManageGnosisChain,
        resultsFileName: "ltdManageGnosisChain",
      })
    })

    it("allows executing all transactions from the history of the DAO Safe on Gnosis Chain", async () => {
      await runTransactionSimulation({
        preset: gnosisChainDeFiManagePreset,
        config: KARPATKEY_ADDRESSES.DAO_GNO,
        transactionsJson: daoManageGnosisChain,
        resultsFileName: "daoManageGnosisChain",
      })
    })

    it("permissions patch: allows executing all transactions from the history of the DAO Safe on Gnosis Chain", async () => {
      await runTransactionSimulation({
        preset: gnosisChainDeFiManagePreset,
        config: KARPATKEY_ADDRESSES.DAO_GNO,
        transactionsJson: daoManageGnosisChain,
        basePermissions: daoManageGnosisChainSnapshot01,
        resultsFileName: "daoManageGnosisChainPatch",
      })
    })
  })

  describe("Gnosis Chain DeFi Harvest preset", () => {
    it("allows executing all harvesting transactions from the history of the Limited Safe on Gnosis Chain", async () => {
      await runTransactionSimulation({
        preset: gnosisChainDeFiHarvestPreset,
        config: KARPATKEY_ADDRESSES.LTD_GNO,
        transactionsJson: ltdHarvestGnosisChain,
        resultsFileName: "ltdHarvestGnosisChain",
      })
    })

    it("allows executing all harvesting transactions from the history of the DAO Safe on Gnosis Chain", async () => {
      await runTransactionSimulation({
        preset: gnosisChainDeFiHarvestPreset,
        config: KARPATKEY_ADDRESSES.DAO_GNO,
        transactionsJson: daoHarvestGnosisChain,
        resultsFileName: "daoHarvestGnosisChain",
      })
    })

    it("permissions patch: allows executing all transactions from the history of the DAO Safe on Gnosis Chain", async () => {
      await runTransactionSimulation({
        preset: gnosisChainDeFiHarvestPreset,
        config: KARPATKEY_ADDRESSES.DAO_GNO,
        transactionsJson: daoHarvestGnosisChain,
        basePermissions: daoHarvestGnosisChainSnapshot01,
        resultsFileName: "daoHarvestGnosisChainPatch",
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
