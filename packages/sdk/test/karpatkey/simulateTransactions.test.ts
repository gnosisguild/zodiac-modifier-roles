import { BigNumber } from "ethers"
import hre, { deployments, waffle } from "hardhat"

import { Roles, TestAvatar } from "../../../evm/typechain-types"
import { encodeApplyPreset } from "../../src/applyPreset"

import gnosisDeFiRevokeGnosisLTDPreset from "../../src/presets/gnosisChain/GnosisLTD/deFiRevokeGnosisLTD"

// import gnosisChainDeFiHarvestPreset from "../../src/presets/gnosisChain/deFiHarvest"
// import gnosisChainDeFiManagePreset from "../../src/presets/gnosisChain/deFiManage"
// import mainnetDeFiHarvestPreset from "../../src/presets/mainnet/deFiHarvest"
// import mainnetDeFiManagePreset from "../../src/presets/mainnet/deFiManage"

import balancerManagePreset from "../../src/presets/mainnet/Balancer/deFiManageBalancer"
import balancerAlternativeManagePreset from "../../src/presets/mainnet/Balancer/deFiManageBalancerAlternative"

import ensManagePreset from "../../src/presets/mainnet/ENS/deFiManageENS_old"

import testManagePreset from "../../src/presets/mainnet/deFiManageTest"

import { RolePreset } from "../../src/presets/types"
import { KARPATKEY_ADDRESSES } from "../../tasks/manageKarpatkeyRoles"
import { GNOSIS_ADDRESSES } from "../../tasks/manageGnosisRoles"
import { BALANCER_ADDRESSES } from "../../tasks/manageBalancerRoles"
import { ENS_ADDRESSES } from "../../tasks/manageEnsRoles"

import gnosisRevokeGnosisLTDTransactions from "./testTransactions/gnosisRevokeGnosisLTD"

import balancerManageTransactions from "./testTransactions/balancerManage"
import balancerAlternativeManageTransactions from "./testTransactions/balancerAlternativeManage"

import ensManageTransactions from "./testTransactions/ensManage"

import harvestMainnetTransactions from "./testTransactions/ethHarvest"
import manageMainnetTransactions from "./testTransactions/ethManage"
import harvestGnosisChainTransactions from "./testTransactions/gnoHarvest"
import manageGnosisChainTransactions from "./testTransactions/gnoManage"

interface Config {
  AVATAR: string
  MODULE: string
  MANAGER: string
  REVOKER: string
  HARVESTER: string
  DISASSEMBLER: string
  SWAPPER: string
  NETWORK: number
  BRIDGED_SAFE: string
}

describe("Karpatkey: Simulate Transactions Test", async () => {
  const ROLE_ID = 1

  const setup = deployments.createFixture(async () => {
    await deployments.fixture()
    const [owner] = waffle.provider.getWallets()

    const MultiSend = await hre.ethers.getContractFactory("MultiSend")
    const multiSend = await MultiSend.deploy()

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
      BRIDGE_RECIPIENT_GNOSIS_CHAIN: config.BRIDGED_SAFE,
      BRIDGE_RECIPIENT_MAINNET: config.BRIDGED_SAFE,
    }
    const permissionUpdateTransactions = await encodeApplyPreset(
      modifier.address,
      ROLE_ID,
      preset,
      placeholderValues,
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
        `Executed permissions update tx ${i + 1}/${permissionUpdateTransactions.length
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

  const checkFrom = (txs: { from: string }[], config: Config) => {
    txs.forEach((tx) => {
      if (tx.from.toLowerCase() !== config.AVATAR.toLowerCase()) {
        throw new Error(`Transaction from ${tx.from} is not ${config.AVATAR}`)
      }
    })
  }

  //---------------------------------------------------------------------------------------------------------------------------------
  // Gnosis Chain - GnosisLTD
  //---------------------------------------------------------------------------------------------------------------------------------
  describe("Gnosis Chain DeFi Revoke preset [gnosis:gnosisltd:revoke]", () => {
    it("allows executing all listed revoking transactions from the LTD Safe", async () => {
      await simulateTransactions({
        config: GNOSIS_ADDRESSES.GNOSIS_LTD_GNO,
        preset: gnosisDeFiRevokeGnosisLTDPreset,
        transactions: gnosisRevokeGnosisLTDTransactions,
      })
    })
  })

  //---------------------------------------------------------------------------------------------------------------------------------
  // Mainnet - Balancer
  //---------------------------------------------------------------------------------------------------------------------------------
  describe("Balancer Manage  preset [balancer:manage]", () => {
    it("allows executing all listed management transactions from the Balancer Safe", async () => {
      await simulateTransactions({
        config: BALANCER_ADDRESSES.BALANCER_ETH,
        preset: balancerManagePreset,
        transactions: balancerManageTransactions,
      })
    })
  })

  //---------------------------------------------------------------------------------------------------------------------------------
  // Mainnet - Balancer Alternative
  //---------------------------------------------------------------------------------------------------------------------------------
  describe("Balancer Alternative Manage preset [balancer_alternative:manage]", () => {
    it("allows executing all listed management transactions from the Balancer Alternative Safe", async () => {
      await simulateTransactions({
        config: BALANCER_ADDRESSES.BALANCER_ALTERNATIVE_ETH,
        preset: balancerAlternativeManagePreset,
        transactions: balancerAlternativeManageTransactions,
      })
    })
  })

  //---------------------------------------------------------------------------------------------------------------------------------
  // Mainnet - ENS
  //---------------------------------------------------------------------------------------------------------------------------------
  describe("ENS Manage preset [ens:manage]", () => {
    it("allows executing all listed management transactions from the ENS Safe", async () => {
      await simulateTransactions({
        config: ENS_ADDRESSES.ENS_ETH,
        preset: ensManagePreset,
        transactions: ensManageTransactions,
      })
    })
  })

  // describe("Gnosis Chain DeFi Manage preset [gno:manage]", () => {
  //   it("allows executing all listed management transactions from the DAO Safe", async () => {
  //     await simulateTransactions({
  //       config: GNOSIS_ADDRESSES.GNOSIS_DAO_GNO,
  //       preset: gnosisChainDeFiManagePreset,
  //       transactions: manageGnosisChainTransactions,
  //     })
  //   })
  // })

  // describe("Gnosis Chain DeFi Harvest preset [gno:harvest]", () => {
  //   it("allows executing all listed harvesting transactions from the DAO Safe", async () => {
  //     await simulateTransactions({
  //       config: GNOSIS_ADDRESSES.GNOSIS_DAO_GNO,
  //       preset: gnosisChainDeFiHarvestPreset,
  //       transactions: harvestGnosisChainTransactions,
  //     })
  //   })
  // })

  // describe("Mainnet DeFi Manage preset [eth:manage]", () => {
  //   it("allows executing all listed management transactions from the DAO Safe", async () => {
  //     await simulateTransactions({
  //       config: GNOSIS_ADDRESSES.GNOSIS_DAO_ETH,
  //       preset: mainnetDeFiManagePreset,
  //       transactions: manageMainnetTransactions,
  //     })
  //   })
  // })

  // describe("Mainnet DeFi Harvest preset [eth:harvest]", () => {
  //   it("allows executing all listed harvesting transactions from the DAO Safe", async () => {
  //     await simulateTransactions({
  //       config: GNOSIS_ADDRESSES.GNOSIS_DAO_ETH,
  //       preset: mainnetDeFiHarvestPreset,
  //       transactions: harvestMainnetTransactions,
  //     })
  //   })
  // })

  describe("Test Manage preset [test:manage]", () => {
    it("allows executing all listed management transactions from the DAO Safe", async () => {
      await simulateTransactions({
        config: KARPATKEY_ADDRESSES.TEST_ETH,
        preset: testManagePreset,
        transactions: balancerManageTransactions,
      })
    })
  })
})
