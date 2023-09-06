import { BigNumber } from "ethers"
import hre, { deployments, waffle } from "hardhat"

import { Roles__factory } from "../../../evm/typechain-types"
import { encodeApplyPreset } from "../../src/applyPreset"
import { RolePreset } from "../../src/presets/types"
import { NetworkId } from "../../src/types"

import ensManagePreset from "../../src/presets/mainnet/ENS/deFiManageENS"
import { ENS_ADDRESSES } from "../../tasks/manageEnsRoles"
import ensManageTransactions from "./testTransactions/ensManage"

import balancerManagePreset from "../../src/presets/mainnet/Balancer/deFiManageBalancer"
import { BALANCER_ADDRESSES } from "../../tasks/manageBalancerRoles"
import balancerManageTransactions from "./testTransactions/balancerManage"

interface Config {
  AVATAR: string
  MODULE: string
  MANAGER: string
  REVOKER: string
  HARVESTER: string
  DISASSEMBLER: string
  SWAPPER: string
  NETWORK: NetworkId
  BRIDGED_SAFE: string
}

interface SimulateTransaction {
  from: string
  value?: string
  data: string
  to: string
  operation?: number
  expectRevert?: boolean
  revertOnFailingExecution?: boolean
}

describe("Karpatkey: Simulate Transactions Test (patching current config in mainnet fork)", async () => {
  const setup = (config: Config) =>
    deployments.createFixture(async () => {
      const ownerAddress = config.AVATAR // this is true for all current setups
      const owner = await hre.ethers.getImpersonatedSigner(ownerAddress)

      // fund owner with ETH so it can execute transactions
      const [wallet] = waffle.provider.getWallets()
      await wallet.sendTransaction({
        to: ownerAddress,
        value: "1000000000000000000", // 1 ETH
      })
      const modifier = Roles__factory.connect(config.MODULE, owner as any)

      return {
        owner,
        modifier,
      }
    })()

  const simulateTransactions = async ({
    preset,
    roleId,
    roleMember,
    config,
    transactions,
  }: {
    roleId: number
    roleMember: string
    preset: RolePreset
    config: Config
    transactions: SimulateTransaction[]
  }) => {
    const { owner, modifier } = await setup(config)
    const placeholderValues = {
      AVATAR: config.AVATAR,
      BRIDGE_RECIPIENT_GNOSIS_CHAIN: config.BRIDGED_SAFE,
      BRIDGE_RECIPIENT_MAINNET: config.BRIDGED_SAFE,
    }

    if (config.NETWORK !== 1) throw new Error("This config is not for mainnet!")

    const permissionUpdateTransactions = await encodeApplyPreset(
      modifier.address,
      roleId,
      preset,
      placeholderValues,
      {
        network: 1,
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

    const memberSigner = await hre.ethers.getImpersonatedSigner(roleMember)
    // fund memberSigner with 1 ETH so it can execute transactions
    const [wallet] = waffle.provider.getWallets()
    await wallet.sendTransaction({
      to: memberSigner.address,
      value: "1000000000000000000", // 1 ETH
    })

    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i]
      const operation = tx.operation || 0
      console.log(
        `Simulating ${operation === 1 ? "delegate call" : "call"} to ${
          tx.to
        } with data: ${tx.data}`
      )
      try {
        await modifier
          .connect(memberSigner as any)
          .execTransactionWithRole(
            tx.to,
            tx.value || "0x00",
            tx.data || "0x00",
            tx.operation || 0,
            roleId,
            tx.revertOnFailingExecution || false
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
      }
    }

    console.log("\n\n------- TRANSACTION SIMULATION FINISHED -------")
  }

  //---------------------------------------------------------------------------------------------------------------------------------
  // ENS
  //---------------------------------------------------------------------------------------------------------------------------------
  describe("ENS Manage preset [ens:manage]", () => {
    it("allows executing all listed management transactions from the ENS Safe after patching the current permissions", async () => {
      await simulateTransactions({
        config: ENS_ADDRESSES.ENS_ETH,
        preset: ensManagePreset,
        roleId: ENS_ADDRESSES.ENS_ETH.ROLE_IDS.MANAGER,
        roleMember: ENS_ADDRESSES.ENS_ETH.MANAGER,
        transactions: ensManageTransactions,
      })
    })
  })

  //---------------------------------------------------------------------------------------------------------------------------------
  // Balancer
  //---------------------------------------------------------------------------------------------------------------------------------
  describe("Balancer Manage preset [balancer:manage]", () => {
    it("allows executing all listed management transactions from the Balancer Safe after patching the current permissions", async () => {
      await simulateTransactions({
        config: BALANCER_ADDRESSES.BALANCER_ETH,
        preset: balancerManagePreset,
        roleId: BALANCER_ADDRESSES.BALANCER_ETH.ROLE_IDS.MANAGER,
        roleMember: BALANCER_ADDRESSES.BALANCER_ETH.MANAGER,
        transactions: balancerManageTransactions,
      })
    })
  })
})
