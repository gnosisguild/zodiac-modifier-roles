import SafeServiceClient, {
  SafeMultisigTransactionResponse,
} from "@gnosis.pm/safe-service-client"
import { expect } from "chai"
import hre, { deployments, waffle, ethers } from "hardhat"
import "@nomiclabs/hardhat-ethers"
import EthersAdapter, { EthersAdapterConfig } from "@gnosis.pm/safe-ethers-lib"

import { Roles, TestAvatar } from "../../evm/typechain-types"
import { encodeApplyPreset } from "../src/applyPreset"
import gnosisChainDeFiHarvestPreset from "../src/presets/gnosisChainDeFiHarvest"
import gnosisChainDeFiManagePreset from "../src/presets/gnosisChainDeFiManage"
import { EthAdapter } from "@gnosis.pm/safe-core-sdk-types"
import { Signer } from "ethers"
import { RolePermissions } from "../src/types"
import daoGnosisChain from "./transactions/daoGnosisChain.json"

const EMPTY_PERMISSIONS: RolePermissions = {
  targets: [],
}

describe("Replay Transactions Test", async () => {
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

  describe("Gnosis Chain DeFi Manage preset", () => {
    it("allows executing all transactions from the history of the Limited Safe on Gnosis Chain", async () => {
      const { owner, modifier, safeService } = await setup()
      await encodeApplyPreset(
        modifier.address,
        1,
        gnosisChainDeFiManagePreset,
        {
          avatar: "0x10E4597fF93cbee194F4879f8f1d54a370DB6969",
          network: 100,
          currentPermissions: EMPTY_PERMISSIONS,
        }
      )
      console.log("\n\n------- SUCCESSFULLY APPLIED PRESET -------\n\n")

      const multisigTransactions = (
        await safeService.getMultisigTransactions(
          "0x10E4597fF93cbee194F4879f8f1d54a370DB6969"
        )
      ).results

      const SKIP_TRANSACTIONS = [
        // GNO transfers to some EOAs
        "0x5beb987553ce2d8cd2d033f82a46b3bc5f76552f51e942446ff080c65533469e",
        "0xdc191fec6b1d9dc2c534b28da06822440c2fe06533f0043a7def01a7b2d13567",
      ]

      for (let i = 0; i < multisigTransactions.length; i++) {
        const tx = multisigTransactions[i]
        if (SKIP_TRANSACTIONS.includes(tx.transactionHash)) continue

        console.log(`Simulating ${printCallData(tx)} ...`)
        try {
          await modifier.execTransactionWithRole(
            tx.to,
            tx.value,
            tx.data || "0x00",
            tx.operation,
            1,
            false
          )
        } catch (e) {
          console.log("Reverting transaction:", tx)
          throw e
        }
      }
    })

    it.only("allows executing all transactions from the history of the DAO Safe on Gnosis Chain", async () => {
      const { owner, modifier, avatar, safeService } = await setup()
      const transactions = await encodeApplyPreset(
        modifier.address,
        1,
        gnosisChainDeFiManagePreset,
        {
          avatar: "0x458cD345B4C05e8DF39d0A07220feb4Ec19F5e6f",
          network: 100,
          currentPermissions: EMPTY_PERMISSIONS,
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
        await safeService.getMultisigTransactions(
          "0x458cD345B4C05e8DF39d0A07220feb4Ec19F5e6f"
        )
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
            1,
            false
          )

          if (daoGnosisChain.fail.includes(tx.transactionHash)) {
            console.error("Transaction succeeded that should be failing:", tx)
            throw new Error("Transaction unexpectedly succeeded")
          } else if (!daoGnosisChain.success.includes(tx.transactionHash)) {
            newSucceedingTransactions.push(tx)
          }
        } catch (e) {
          console.log((e as Error).message)
          if (daoGnosisChain.success.includes(tx.transactionHash)) {
            console.error("Transaction failed that should succeed:", tx)
            throw new Error("Transaction unexpectedly failed")
          } else if (!daoGnosisChain.fail.includes(tx.transactionHash)) {
            newFailingTransactions.push(tx)
          }
        }
      }

      console.log("\n\n------- TRANSACTION SIMULATION FINISHED -------")
      console.log(
        `${newSucceedingTransactions.length} new succeeding transactions:`
      )
      console.log(JSON.stringify(newSucceedingTransactions, null, 2))

      console.log(
        `\n${newFailingTransactions.length} new failing transactions:`
      )
      console.log(JSON.stringify(newFailingTransactions, null, 2))
    })
  })

  describe("Gnosis Chain DeFi Harvest preset", () => {
    it("allows executing all harvesting transactions from the history of the DAO Safe on Gnosis Chain", async () => {
      const { owner, modifier, safeService } = await setup()
      await encodeApplyPreset(
        modifier.address,
        1,
        gnosisChainDeFiHarvestPreset,
        {
          avatar: "0x458cD345B4C05e8DF39d0A07220feb4Ec19F5e6f",
          network: 100,
          currentPermissions: EMPTY_PERMISSIONS,
        }
      )
      console.log("\n\n------- SUCCESSFULLY APPLIED PRESET -------\n\n")

      const multisigTransactions = (
        await safeService.getMultisigTransactions(
          "0x458cD345B4C05e8DF39d0A07220feb4Ec19F5e6f"
        )
      ).results

      const HARVEST_TRANSACTIONS = [
        // transactions that shall be performed by harvesting role
        "0x1a5eacb22c7f9f3a0650c00a8eda60e4e59fb268bb56f87fa1640e2bb079a165",
        "0x3627b6009d3bc12688c286818e9d42b69e3d01b57faaa8e9d0217246d429689b",
        "0xeb5ff6c7b1ca7ae47e7c5e516b4567e5ead2f563c93ec2769720bd292cdd8448",
        "0x58e4a66b74da7ce5ca78a84e561d917e4f0b3f88ed91b758ebba19efdf2c2ea6",
        "0xdb0ac2b21aa8f469c10909d96035b4e0f63ff0bd4f8e8d592d5c7f6e997838bd",
        "0x3a3e19198b69cc7bb98f2e525c4cbd25e431abb19bf778f2fd86eae2a3fd2f99",
        "0xdf36282bc6e8672622dd76faff3472688f1dbaa801ff12025bbcde5a58fa8209",
        "0xf30b69fcde21e667a6dfa4b704fc0946719a821b4a81e5a2dd88f5e926607f4a",
        "0x1e89a616c54cbc318689f47d6471c6e36630437fbecdb23b7a1be2f24e37eb5e",
        "0x2b18e34f395acf8d08f90f004a8a4f5206e70f9568c61d5ae0d9918a01855609",
        "0xfdc02d50a4b1cefb685d83a7c46fad155a8a93c1d90c2f4c842162b15a308fdb",
      ]

      for (let i = 0; i < multisigTransactions.length; i++) {
        const tx = multisigTransactions[i]
        if (!HARVEST_TRANSACTIONS.includes(tx.transactionHash)) continue

        console.log(`Simulating ${printCallData(tx)} ...`)
        try {
          await modifier.execTransactionWithRole(
            tx.to,
            tx.value,
            tx.data || "0x00",
            tx.operation,
            1,
            false
          )
        } catch (e) {
          console.log("Reverting transaction:", tx)
          throw e
        }
      }
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
