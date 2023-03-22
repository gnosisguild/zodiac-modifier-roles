import { BigNumber } from "ethers"
import { defaultAbiCoder } from "ethers/lib/utils"
import hre, { deployments, waffle } from "hardhat"

import { Roles, TestAvatar } from "../../../evm/typechain-types"
import { encodeApplyPreset } from "../../src/applyPreset"
<<<<<<< HEAD
import gnosisChainDeFiHarvestPreset from "../../src/presets/gnosisChain/deFiHarvest"
import gnosisChainDeFiManagePreset from "../../src/presets/gnosisChain/deFiManage"
import mainnetDeFiHarvestPreset from "../../src/presets/mainnet/deFiHarvest"
import mainnetDeFiManagePreset from "../../src/presets/mainnet/deFiManage"
import testManagePreset from "../../src/presets/mainnet/deFiManageTest"
import balancer1ManagePreset from "../../src/presets/mainnet/deFiManageBalancer1"
import balancer2ManagePreset from "../../src/presets/mainnet/deFiManageBalancer2"
import ens1ManagePreset from "../../src/presets/mainnet/deFiManageENS1"
import {
  AVATAR_ADDRESS_PLACEHOLDER,
  OMNI_BRIDGE_DATA_PLACEHOLDER,
  OMNI_BRIDGE_RECEIVER_PLACEHOLDER,
} from "../../src/presets/placeholders"
import { RolePreset } from "../../src/types"
import { KARPATKEY_ADDRESSES } from "../../tasks/manageKarpatkeyRoles"

import testManageTransactions from "./testTransactions/testManage"
=======
import { RolePreset } from "../../src/presets/types"

import balancer1ManagePreset from "./presets/deFiManageBalancer1"
import ens1ManagePreset from "./presets/deFiManageENS1"
>>>>>>> cda97a9 (clean up sdk presets)
import balancerManage1Transactions from "./testTransactions/balancer1Manage"
import ensManage1Transactions from "./testTransactions/ens1Manage"

<<<<<<< HEAD
=======
const KARPATKEY_ADDRESSES = {
  BALANCER_1_ETH: {
    AVATAR: "0x0EFcCBb9E2C09Ea29551879bd9Da32362b32fc89",
    MODULE: "0xd8dd9164E765bEF903E429c9462E51F0Ea8514F9",
    MANAGEMENT: "0x60716991aCDA9E990bFB3b1224f1f0fB81538267",
    HARVESTERS: ["0x19f2ab2c11d818d40b227557d3935ded9e1d201a"],
    SWAPPERS: ["0x19f2ab2c11d818d40b227557d3935ded9e1d201a"],
    NETWORK: 1,
  },
  ENS_1_ETH: {
    AVATAR: "0x4F2083f5fBede34C2714aFfb3105539775f7FE64",
    MODULE: "0xf20325cf84b72e8BBF8D8984B8f0059B984B390B",
    MANAGEMENT: "0xb423e0f6E7430fa29500c5cC9bd83D28c8BD8978",
    HARVESTERS: ["0x14c2d2d64c4860acf7cf39068eb467d7556197de"],
    SWAPPERS: ["0x14c2d2d64c4860acf7cf39068eb467d7556197de"],
    NETWORK: 1,
  },
}
type Configs = typeof KARPATKEY_ADDRESSES
type Config = Configs["BALANCER_1_ETH"]

>>>>>>> cda97a9 (clean up sdk presets)
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
    transactions: {
      from: string
      value?: string
      data: string
      to: string
      expectRevert?: boolean
    }[]
  }) => {
    const { owner, modifier } = await setup()
<<<<<<< HEAD
=======
    const placeholderValues = {
      AVATAR: config.AVATAR,
    }
>>>>>>> cda97a9 (clean up sdk presets)
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

    let totalGas = BigNumber.from(0)
    for (let i = 0; i < permissionUpdateTransactions.length; i++) {
      totalGas = totalGas.add(
        await owner.estimateGas(permissionUpdateTransactions[i])
      )
      await owner.sendTransaction(permissionUpdateTransactions[i])

      console.log(
        `Executed permissions update tx ${i + 1}/${
          permissionUpdateTransactions.length
        }`
      )
    }

    console.log("\n\n------- SUCCESSFULLY APPLIED PRESET -------")
    console.log("Total gas used for permissions update:", totalGas.toString())
    console.log("\n\n")

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

        if (tx.expectRevert) {
          throw new Error(`Expected revert, but tx #${i} did not revert`)
        }
      } catch (e) {
        if (tx.expectRevert) {
          continue
        }

        // tx failed
        console.log((e as Error).message + "\n")
        throw e
        continue
      }
    }

    console.log("\n\n------- TRANSACTION SIMULATION FINISHED -------")
  }
<<<<<<< HEAD

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

  describe("Test Manage preset [test:manage]", () => {
    it("allows executing all listed management transactions from the DAO Safe", async () => {
      await simulateTransactions({
        config: KARPATKEY_ADDRESSES.TEST_ETH,
        preset: testManagePreset,
        transactions: balancerManage1Transactions,
      })
    })
  })

=======
>>>>>>> cda97a9 (clean up sdk presets)
  describe("Balancer1 Manage  preset [balancer1:manage]", () => {
    it("allows executing all listed management transactions from the DAO Safe", async () => {
      await simulateTransactions({
        config: KARPATKEY_ADDRESSES.BALANCER_1_ETH,
        preset: balancer1ManagePreset,
        transactions: balancerManage1Transactions,
      })
    })
  })

  describe("ENS1 Manage preset [ens1:manage]", () => {
    it("allows executing all listed management transactions from the DAO Safe", async () => {
      await simulateTransactions({
        config: KARPATKEY_ADDRESSES.ENS_1_ETH,
        preset: ens1ManagePreset,
        transactions: ensManage1Transactions,
      })
    })
  })
})
