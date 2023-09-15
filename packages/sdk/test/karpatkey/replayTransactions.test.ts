import { writeFileSync } from "fs"
import path from "path"

import { EthAdapter } from "@gnosis.pm/safe-core-sdk-types"
import EthersAdapter, { EthersAdapterConfig } from "@gnosis.pm/safe-ethers-lib"
import SafeServiceClient, {
  SafeMultisigTransactionResponse,
} from "@gnosis.pm/safe-service-client"
import { defaultAbiCoder } from "ethers/lib/utils"
import hre, { deployments, waffle, ethers } from "hardhat"
import "@nomiclabs/hardhat-ethers"

import { Roles, TestAvatar } from "../../../evm/typechain-types"
import { encodeApplyPreset } from "../../src/applyPreset"
import encodeCalls from "../../src/encodeCalls"
import fillAndUnfoldPreset from "../../src/fillAndUnfoldPreset"
import grantPermissions from "../../src/grantPermissions"
import logCall from "../../src/logCall"
import gnosisChainDeFiHarvestPreset from "../../src/presets/gnosisChain/deFiHarvest"
import gnosisChainDeFiManagePreset from "../../src/presets/gnosisChain/deFiManage"
import mainnetDeFiHarvestPreset from "../../src/presets/mainnet/deFiHarvest"
import mainnetDeFiManagePreset from "../../src/presets/mainnet/deFiManage"
import {
  AVATAR_ADDRESS_PLACEHOLDER,
  OMNI_BRIDGE_DATA_PLACEHOLDER,
  OMNI_BRIDGE_RECEIVER_PLACEHOLDER,
} from "../../src/presets/placeholders"
import { RolePermissions, RolePreset } from "../../src/types"
import { KARPATKEY_ADDRESSES } from "../../tasks/manageKarpatkeyRoles"

import daoHarvestGnosisChain from "./expectedTransactionResults/daoHarvestGnosisChain.json"
import daoHarvestMainnet from "./expectedTransactionResults/daoHarvestMainnet.json"
import daoManageGnosisChain from "./expectedTransactionResults/daoManageGnosisChain.json"
import daoManageMainnet from "./expectedTransactionResults/daoManageMainnet.json"
import ltdHarvestGnosisChain from "./expectedTransactionResults/ltdHarvestGnosisChain.json"
import ltdHarvestMainnet from "./expectedTransactionResults/ltdHarvestMainnet.json"
import ltdManageGnosisChain from "./expectedTransactionResults/ltdManageGnosisChain.json"
import ltdManageMainnet from "./expectedTransactionResults/ltdManageMainnet.json"
import daoHarvestGnosisChainSnapshot01 from "./permissionSnapshots/daoHarvestGnosisChainSnapshot01.json"
import daoManageGnosisChainSnapshot01 from "./permissionSnapshots/daoManageGnosisChainSnapshot01.json"

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

    return {
      owner,
      Avatar,
      avatar,
      Modifier,
      modifier,
      multiSend,
      defaultSigner,
    }
  })

  const EMPTY_PERMISSIONS = { targets: [] }

  const replayTransactions = async ({
    preset,
    config,
    transactionsJson,
    basePermissions = EMPTY_PERMISSIONS,
    testSummaryFileName,
    network,
  }: {
    preset: RolePreset
    config: (typeof KARPATKEY_ADDRESSES)["DAO_GNO"]
    transactionsJson: {
      success: string[]
      fail: string[]
    }
    basePermissions?: RolePermissions
    testSummaryFileName: string
    network: 1 | 100
  }) => {
    const { owner, modifier, defaultSigner } = await setup()

    const ethAdapter = new EthersAdapter({
      ethers: ethers as unknown as EthersAdapterConfig["ethers"],
      signer: defaultSigner,
    })
    const safeService = new SafeServiceClient({
      txServiceUrl:
        network === 100
          ? "https://safe-transaction-gnosis-chain.safe.global"
          : "https://safe-transaction-mainnet.safe.global",
      ethAdapter: ethAdapter as EthAdapter,
    })

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
      [OMNI_BRIDGE_RECEIVER_PLACEHOLDER]: defaultAbiCoder.encode(
        ["address"],
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
        network, // this value won't be used when passing currentPermissions
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
    const wronglySucceedingTransactions = []
    const wronglyFailingTransactions = []

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
          wronglyFailingTransactions.push(tx)
        } else if (!transactionsJson.fail.includes(tx.transactionHash)) {
          newFailingTransactions.push(tx)
        }
        continue
      }

      // tx succeeded
      if (transactionsJson.fail.includes(tx.transactionHash)) {
        console.error("Transaction succeeded that should be failing:", tx)
        wronglySucceedingTransactions.push(tx)
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

    console.error(
      `\n${wronglySucceedingTransactions.length} wrongly succeeding transactions:`
    )
    console.log(wronglySucceedingTransactions.map((tx) => tx.transactionHash))

    console.error(
      `\n${wronglyFailingTransactions.length} wrongly failing transactions:`
    )
    console.log(wronglyFailingTransactions.map((tx) => tx.transactionHash))

    writeFileSync(
      path.join(__dirname, "testSummaries", `${testSummaryFileName}.json`),
      JSON.stringify(
        {
          wronglySucceedingTransactions,
          wronglyFailingTransactions,
          newSucceedingTransactions,
          newFailingTransactions,
          permissions: fillAndUnfoldPreset(preset, placeholderValues),
        },
        null,
        2
      )
    )

    if (wronglySucceedingTransactions.length > 0) {
      throw new Error(
        `${wronglySucceedingTransactions.length} transactions succeeded wrongly!`
      )
    }
    if (wronglyFailingTransactions.length > 0) {
      throw new Error(
        `${wronglyFailingTransactions.length} transactions failed wrongly!`
      )
    }
  }

  describe("Gnosis Chain DeFi Manage preset", () => {
    it("allows executing all transactions from the history of the Limited Safe on Gnosis Chain", async () => {
      await replayTransactions({
        network: 100,
        preset: gnosisChainDeFiManagePreset,
        config: KARPATKEY_ADDRESSES.LTD_GNO,
        transactionsJson: ltdManageGnosisChain,
        testSummaryFileName: "ltdManageGnosisChain",
      })
    })

    it("allows executing all transactions from the history of the DAO Safe on Gnosis Chain", async () => {
      await replayTransactions({
        network: 100,
        preset: gnosisChainDeFiManagePreset,
        config: KARPATKEY_ADDRESSES.DAO_GNO,
        transactionsJson: daoManageGnosisChain,
        testSummaryFileName: "daoManageGnosisChain",
      })
    })

    it("permissions patch: allows executing all transactions from the history of the DAO Safe on Gnosis Chain", async () => {
      await replayTransactions({
        network: 100,
        preset: gnosisChainDeFiManagePreset,
        config: KARPATKEY_ADDRESSES.DAO_GNO,
        transactionsJson: daoManageGnosisChain,
        basePermissions: daoManageGnosisChainSnapshot01,
        testSummaryFileName: "daoManageGnosisChainPatch",
      })
    })
  })

  describe("Gnosis Chain DeFi Harvest preset", () => {
    it("allows executing all harvesting transactions from the history of the Limited Safe on Gnosis Chain", async () => {
      await replayTransactions({
        network: 100,
        preset: gnosisChainDeFiHarvestPreset,
        config: KARPATKEY_ADDRESSES.LTD_GNO,
        transactionsJson: ltdHarvestGnosisChain,
        testSummaryFileName: "ltdHarvestGnosisChain",
      })
    })

    it("allows executing all harvesting transactions from the history of the DAO Safe on Gnosis Chain", async () => {
      await replayTransactions({
        network: 100,
        preset: gnosisChainDeFiHarvestPreset,
        config: KARPATKEY_ADDRESSES.DAO_GNO,
        transactionsJson: daoHarvestGnosisChain,
        testSummaryFileName: "daoHarvestGnosisChain",
      })
    })

    it("permissions patch: allows executing all transactions from the history of the DAO Safe on Gnosis Chain", async () => {
      await replayTransactions({
        network: 100,
        preset: gnosisChainDeFiHarvestPreset,
        config: KARPATKEY_ADDRESSES.DAO_GNO,
        transactionsJson: daoHarvestGnosisChain,
        basePermissions: daoHarvestGnosisChainSnapshot01,
        testSummaryFileName: "daoHarvestGnosisChainPatch",
      })
    })
  })

  describe("Mainnet DeFi Manage preset", () => {
    it("allows executing all transactions from the history of the Limited Safe on Mainnet", async () => {
      await replayTransactions({
        network: 1,
        preset: mainnetDeFiManagePreset,
        config: KARPATKEY_ADDRESSES.LTD_ETH,
        transactionsJson: ltdManageMainnet,
        testSummaryFileName: "ltdManageMainnet",
      })
    })

    it("allows executing all transactions from the history of the DAO Safe on Mainnet", async () => {
      await replayTransactions({
        network: 1,
        preset: mainnetDeFiManagePreset,
        config: KARPATKEY_ADDRESSES.DAO_ETH,
        transactionsJson: daoManageMainnet,
        testSummaryFileName: "daoManageMainnet",
      })
    })
  })

  describe("Mainnet Harvest preset", () => {
    it("allows executing all harvesting transactions from the history of the Limited Safe on Gnosis Chain", async () => {
      await replayTransactions({
        network: 1,
        preset: mainnetDeFiHarvestPreset,
        config: KARPATKEY_ADDRESSES.LTD_ETH,
        transactionsJson: ltdHarvestMainnet,
        testSummaryFileName: "ltdHarvestMainnet",
      })
    })

    it("allows executing all harvesting transactions from the history of the DAO Safe on Gnosis Chain", async () => {
      await replayTransactions({
        network: 1,
        preset: mainnetDeFiHarvestPreset,
        config: KARPATKEY_ADDRESSES.DAO_ETH,
        transactionsJson: daoHarvestMainnet,
        testSummaryFileName: "daoHarvestMainnet",
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
