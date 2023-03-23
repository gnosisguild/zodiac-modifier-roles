import { BigNumber } from "ethers"
import { formatBytes32String } from "ethers/lib/utils"
import hre, { deployments, waffle } from "hardhat"

import { Roles, TestAvatar } from "../../../evm/typechain-types"
import { encodeApplyPreset } from "../../src/applyPreset"
import { RolePreset } from "../../src/presets/types"

import balancer1ManagePreset from "./presets/deFiManageBalancer1"
import ens1ManagePreset from "./presets/deFiManageENS1"
import balancerManage1Transactions from "./testTransactions/balancer1Manage"
import ensManage1Transactions from "./testTransactions/ens1Manage"

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

describe("Karpatkey: Simulate Transactions Test", async () => {
  const ROLE_KEY = formatBytes32String("TEST_ROLE")

  const setup = deployments.createFixture(async () => {
    await deployments.fixture()
    const [owner] = waffle.provider.getWallets()

    const MultiSend = await hre.ethers.getContractFactory("MultiSend")
    const multiSend = await MultiSend.deploy()

    const MultiSendUnwrapper = await hre.ethers.getContractFactory(
      "MultiSendUnwrapper"
    )
    const multiSendUnwrapper = await MultiSendUnwrapper.deploy()

    const Avatar = await hre.ethers.getContractFactory("TestAvatar")
    const avatar = (await Avatar.deploy()) as unknown as TestAvatar

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
    )) as unknown as Roles

    await modifier.setTransactionUnwrapper(
      "0x40A2aCCbd92BCA938b02010E17A5b8929b49130D",
      multiSend.interface.getSighash("multiSend(bytes)"),
      multiSendUnwrapper.address
    )

    // add ethers default signer to role 1
    const defaultSigner = (await hre.ethers.getSigners())[0]
    await modifier.assignRoles(defaultSigner.address, [ROLE_KEY], [true])

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
    config: Config
    transactions: {
      from: string
      value?: string
      data: string
      to: string
      expectRevert?: boolean
    }[]
  }) => {
    const { owner, modifier } = await setup()
    const placeholderValues = {
      AVATAR: config.AVATAR,
    }
    const transactionsData = await encodeApplyPreset(
      modifier.address,
      ROLE_KEY,
      preset,
      placeholderValues,
      {
        currentPermissions: { key: ROLE_KEY, members: [], targets: [] },
        network: 100, // this value won't be used
      }
    )

    const permissionUpdateTransactions = transactionsData.map((data) => ({
      to: modifier.address,
      data: data,
      value: "0",
    }))

    let totalGas = BigNumber.from(0)
    for (let i = 0; i < transactionsData.length; i++) {
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
          ROLE_KEY,
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
