import SafeServiceClient, {
  SafeMultisigTransactionResponse,
} from "@gnosis.pm/safe-service-client"
import { expect } from "chai"
import hre, { deployments, waffle, ethers } from "hardhat"
import "@nomiclabs/hardhat-ethers"
import EthersAdapter, { EthersAdapterConfig } from "@gnosis.pm/safe-ethers-lib"

import { Roles } from "../../evm/typechain-types"
import applyPreset from "../src/applyPreset"
import gnosisChainDeFiHarvestPreset from "../src/presets/gnosisChainDeFiHarvest"
import gnosisChainDeFiManagePreset from "../src/presets/gnosisChainDeFiManage"
import { EthAdapter } from "@gnosis.pm/safe-core-sdk-types"
import { Signer } from "ethers"

describe.skip("Replay Transactions Test", async () => {
  const setup = deployments.createFixture(async () => {
    await deployments.fixture()
    const [owner] = waffle.provider.getWallets()

    const MultiSend = await hre.ethers.getContractFactory("MultiSend")
    const multiSend = await MultiSend.deploy()

    const Avatar = await hre.ethers.getContractFactory("TestAvatar")
    const avatar = await Avatar.deploy()

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

    modifier.connect(owner)

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
      await applyPreset(
        modifier.address,
        1,
        gnosisChainDeFiManagePreset,
        owner,
        "0x10E4597fF93cbee194F4879f8f1d54a370DB6969"
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

    it("allows executing all transactions from the history of the DAO Safe on Gnosis Chain", async () => {
      const { owner, modifier, safeService } = await setup()
      await applyPreset(
        modifier.address,
        1,
        gnosisChainDeFiManagePreset,
        owner,
        "0x458cD345B4C05e8DF39d0A07220feb4Ec19F5e6f"
      )
      console.log("\n\n------- SUCCESSFULLY APPLIED PRESET -------\n\n")

      const multisigTransactions = (
        await safeService.getMultisigTransactions(
          "0x458cD345B4C05e8DF39d0A07220feb4Ec19F5e6f"
        )
      ).results

      const SKIP_TRANSACTIONS = [
        // transactions that shall be performed by harvesting role
        // TODO: add these to test of the harvest role
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

        // on-chain rejections TODO: how do we handle these?
        "0xfebcf5465e098704e3939ccb6b3c32b8f6724ffd6e9b5d1edb559aec410228da",
        "0x539e1a0a39ad1cdab8dc2b3b1ebaba267d1a8cf0eefa1bc7c584fd57a68f9a9f",
        "0x5c9cfa3d9238515348a96c26a536495c9d097cca440ea53d0cce050f2f6c2a19",
        "0x9b80561c27d7bf09a02404e6e843edbd061b441e81eda9f42205e5efbd4c073a",
        "0xa61ee099af0d4ba107bd9cfe7274bf6082ea107191f8dd541eb54bc47cb007a8",
        "0xa623b7edfa7669f6fec59cb2fb772775023aabf5e17419b65339dbba0c785235",
        "0xdc617ae2bf6c586c745e70619a6cc2c432a08d68a11a7eb217e01428b5ee1899",
        "0x310d201bcade1dc6f9514a7100c87e94d0476c30f73db3d18e4b82cec26d2b01",
        "0xe2f4529bcfddef69419ae4b9cb53c8a9e7309c7be537357b688861d8c5bd4c49",

        // some interactions with mGNO pool https://gnosis-safe.io/app/gno:0x458cD345B4C05e8DF39d0A07220feb4Ec19F5e6f/transactions/0x58e504bd809709dfd97ef7f510ede3ee336986963fe0754b698cd931f01f35d8
        "0x107af1b6c4c0a6b9503b8b72dd4d0a893cb158ef9e7ffc08296d0e3fda2b30fd",
        "0x54486fc652192e9959f733e2363f2b0cd6527cd03cecb556bb87cf50c28b8956",

        // transfer GNO to some EOA and Safes
        "0x6911061ee0d8d1454027b09c2b54d6f372f905510210c65982df761fd28d77e0",
        "0x68d51d6db199d3e2aaf7e06312ac2a27058ede21a9ad24a73d3cc1caa83db1c1",
        "0x9da9133e161d306713509944b18c9e5a141b29e92b81849ec8c4fb8979da5be5",
        "0x754357d32bd28001c9b60e2855fcdb86e1a86e6b0d5be30ec82cd788678aff00",
        "0x39acc504bc45ad38c33cf9b5ce059a558d23f942e5ad63d826801be061d97576",

        // add/remove owners of Safe
        "0x57503d60a39be2ddfbd237c48c1e4c8ac6141dfa1b9b6209acf4b9ba323a6c23",
        "0xa23e0b777ccaf85657246f036a53d662c6cef2bc7d58f33695c3d0a6da333622",

        // TODO check what these are
        "0xcef5f37524982b57f18859a01b281d2ed109dd085f56cf00e4880e8c718fb45c",
        "0xd474940cd916c39312c21e50f16f42dd7525e907a88bbdb339ce68796e278007",
        "0x25754ff202703b127b04084c8b12ad5154afa0b2090096e7f087d1bf23c469ee",
        "0x9cbd929c6325deb26774c780fb6efa716bb6858ea25b614fbac189c394a7b101",
        "0x8602997da04b4ec864129bf0acf5ffe7d214074e614fb526b4b2fc49fe485111",
        "0x1cbd086663142dfd59737c3cd92ee9ea49ebd5a3b30da80e05b59b8161ae8ae2",
        "0xbcc936c9ef4f7f2f1ab6d16d9f8c8af8dbb3409d74b83fd57c9cef1661f184ff",
        "0x3e33770b924cfb9ccbe1b611677c19047b20bc34b67b22460f4e4947e7cb6e08", // GNO approve for tx above
        "0xaaee77e8ede7f848c29e7cd6cdd6970305cb9ad51ae4093c5b12813c3199fc49",
        "0xbf17111bcbbc2dea5fc5f4a7c67e30b23b811f5c84d3bde3c27cb9239b674a60",
      ]

      for (let i = 0; i < multisigTransactions.length; i++) {
        const tx = multisigTransactions[i]
        if (
          !tx.transactionHash || // skip unconfirmed txs
          SKIP_TRANSACTIONS.includes(tx.transactionHash)
        )
          continue

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

  describe("Gnosis Chain DeFi Harvest preset", () => {
    it("allows executing all harvesting transactions from the history of the DAO Safe on Gnosis Chain", async () => {
      const { owner, modifier, safeService } = await setup()
      await applyPreset(
        modifier.address,
        1,
        gnosisChainDeFiHarvestPreset,
        owner,
        "0x458cD345B4C05e8DF39d0A07220feb4Ec19F5e6f"
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
