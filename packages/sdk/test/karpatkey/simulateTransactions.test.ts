import { defaultAbiCoder } from "ethers/lib/utils"
import hre, { deployments, waffle } from "hardhat"

import { Roles, TestAvatar } from "../../../evm/typechain-types"
import { encodeApplyPreset } from "../../src/applyPreset"
import gnosisChainDeFiHarvestPreset from "../../src/presets/gnosisChain/deFiHarvest"
import gnosisChainDeFiManagePreset from "../../src/presets/gnosisChain/deFiManage"
import mainnetDeFiHarvestPreset from "../../src/presets/mainnet/deFiHarvest"
import mainnetDeFiManagePreset from "../../src/presets/mainnet/deFiManage"
import {
  AVATAR_ADDRESS_PLACEHOLDER,
  OMNI_BRIDGE_DATA_PLACEHOLDER,
  OMNI_BRIDGE_RECEIVER_PLACEHOLDER,
} from "../../src/presets/placeholders"
import { RolePreset } from "../../src/types"
import { KARPATKEY_ADDRESSES } from "../../tasks/manageKarpatkeyRoles"

import harvestMainnetTransactions from "./testTransactions/ethHarvest"
import manageMainnetTransactions from "./testTransactions/ethManage"
import harvestGnosisChainTransactions from "./testTransactions/gnoHarvest"
import manageGnosisChainTransactions from "./testTransactions/gnoManage"

describe("Karpatkey: Simulate Transactions Test", async () => {
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
    }
  })

  const simulateTransactions = async ({
    preset,
    config,
    transactions,
  }: {
    preset: RolePreset
    config: typeof KARPATKEY_ADDRESSES["DAO_GNO"]
    transactions: { from: string; value?: string; data: string; to: string }[]
  }) => {
    const { owner, modifier } = await setup()
    const permissionUpdateTransactions = await encodeApplyPreset(
      modifier.address,
      ROLE_ID,
      preset,
      {
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
      },
      {
        currentPermissions: { targets: [] },
        network: 100, // this value won't be used
      }
    )

    for (let i = 0; i < permissionUpdateTransactions.length; i++) {
      await owner.sendTransaction(permissionUpdateTransactions[i])

      console.log(
        `Executed permissions update tx ${i + 1}/${
          permissionUpdateTransactions.length
        }`
      )
    }

    console.log("\n\n------- SUCCESSFULLY APPLIED PRESET -------\n\n")

    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i]

      console.log(`Simulating call ${tx.data} to ${tx.to} ...`)
      try {
        await modifier.execTransactionWithRole(
          tx.to,
          tx.value || "0x00",
          tx.data || "0x00",
          "0",
          ROLE_ID,
          false
        )
      } catch (e) {
        // tx failed
        console.log((e as Error).message + "\n")
        throw e
        continue
      }
    }

    console.log("\n\n------- TRANSACTION SIMULATION FINISHED -------")
  }

  const checkFrom = (
    txs: { from: string }[],
    config: typeof KARPATKEY_ADDRESSES["DAO_GNO"]
  ) => {
    txs.forEach((tx) => {
      if (tx.from.toLowerCase() !== config.AVATAR.toLowerCase()) {
        throw new Error(`Transaction from ${tx.from} is not ${config.AVATAR}`)
      }
    })
  }

  describe("Gnosis Chain DeFi Manage preset [gno:manage]", () => {
    it("allows executing all listed management transactions from the DAO Safe", async () => {
      await simulateTransactions({
        config: KARPATKEY_ADDRESSES.DAO_GNO,
        preset: gnosisChainDeFiManagePreset,
        transactions: manageGnosisChainTransactions,
      })
    })
  })

  describe("Gnosis Chain DeFi Harvest preset [gno:harvest]", () => {
    it("allows executing all listed harvesting transactions from the DAO Safe", async () => {
      await simulateTransactions({
        config: KARPATKEY_ADDRESSES.DAO_GNO,
        preset: gnosisChainDeFiHarvestPreset,
        transactions: harvestGnosisChainTransactions,
      })
    })
  })

  describe("Mainnet DeFi Manage preset [eth:manage]", () => {
    it("allows executing all listed management transactions from the DAO Safe", async () => {
      await simulateTransactions({
        config: KARPATKEY_ADDRESSES.DAO_ETH,
        preset: mainnetDeFiManagePreset,
        transactions: manageMainnetTransactions,
      })
    })
  })

  describe("Mainnet DeFi Harvest preset [eth:harvest]", () => {
    it("allows executing all listed harvesting transactions from the DAO Safe", async () => {
      await simulateTransactions({
        config: KARPATKEY_ADDRESSES.DAO_ETH,
        preset: mainnetDeFiHarvestPreset,
        transactions: harvestMainnetTransactions,
      })
    })
  })
})
