import { defaultAbiCoder } from "ethers/lib/utils"
import hre, { deployments, waffle, ethers } from "hardhat"

import { Roles, TestAvatar } from "../../../evm/typechain-types"
import { encodeApplyPreset } from "../../src/applyPreset"
import encodeCalls from "../../src/encodeCalls"
import grantPermissions from "../../src/grantPermissions"
import logCall from "../../src/logCall"
import gnosisChainDeFiHarvestPreset from "../../src/presets/gnosisChainDeFiHarvest"
import {
  AVATAR_ADDRESS_PLACEHOLDER,
  OMNI_BRIDGE_DATA_PLACEHOLDER,
} from "../../src/presets/placeholders"
import { KARPATKEY_ADDRESSES } from "../../tasks/manageKarpatkeyRoles"

import harvestGnosisChainTransactions from "./transactionData/harvestGnosisChain"

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

  describe.only("Gnosis Chain DeFi Harvest preset", () => {
    it("allows executing all listed harvesting transactions", async () => {
      const { owner, avatar, multiSend, modifier } = await setup()
      const transactions = await encodeApplyPreset(
        modifier.address,
        ROLE_ID,
        gnosisChainDeFiHarvestPreset,
        {
          [AVATAR_ADDRESS_PLACEHOLDER]: defaultAbiCoder.encode(
            ["address"],
            [KARPATKEY_ADDRESSES.DAO_GNO.AVATAR]
          ),
          [OMNI_BRIDGE_DATA_PLACEHOLDER]: defaultAbiCoder.encode(
            ["bytes"],
            [KARPATKEY_ADDRESSES.DAO_GNO.BRIDGED_SAFE]
          ),
        },
        {
          currentPermissions: { targets: [] },
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

      for (let i = 0; i < harvestGnosisChainTransactions.length; i++) {
        const tx = harvestGnosisChainTransactions[i]

        console.log(`Simulating call ${tx.data} to ${tx.to} ...`)
        try {
          await modifier.execTransactionWithRole(
            tx.to,
            "0x00",
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
    })
  })
})
