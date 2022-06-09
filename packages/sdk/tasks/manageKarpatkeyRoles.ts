import "@nomiclabs/hardhat-ethers"

import { task as baseTask, types } from "hardhat/config"
import { HardhatRuntimeEnvironment } from "hardhat/types"

import { Roles } from "../../evm/typechain-types"
import { encodeApplyPreset } from "../src/applyPreset"
import gnosisChainDeFiHarvestPreset from "../src/presets/gnosisChainDeFiHarvest"
import gnosisChainDeFiManagePreset from "../src/presets/gnosisChainDeFiManage"
import addMembers from "../src/addMembers"
import { NetworkId } from "../src/types"

interface Config {
  AVATAR: string
  MODULE: string
  MANAGEMENT: string
  HARVESTERS: string[]
  NETWORK: NetworkId
}

const ADDRESSES: Record<string, Config> = {
  DAO_GNO: {
    AVATAR: "0x0Df1f08f765238dc0b8beAAdDd6681F62e54beC6",
    MODULE: "",
    MANAGEMENT: "",
    HARVESTERS: [],
    NETWORK: 100,
  },
  LTD_GNO: {
    AVATAR: "0x0Df1f08f765238dc0b8beAAdDd6681F62e54beC6",
    MODULE: "",
    MANAGEMENT: "",
    HARVESTERS: [],
    NETWORK: 100,
  },
}

const task = (name: string) =>
  baseTask(name)
    .addParam(
      "safe",
      "one of: 'DAO_GNO' (DAO Safe on Gnosis Chain), 'LTD_GNO' (Limited Safe on Gnosis Chain)",
      undefined,
      types.string
    )
    .addOptionalParam(
      "dryRun",
      "When enabled it only prints the transaction data but does not send it",
      false,
      types.boolean
    )

const processArgs = async (taskArgs: any, hre: HardhatRuntimeEnvironment) => {
  const { dryRun, safe } = taskArgs
  if (!(safe in ADDRESSES)) {
    throw new Error(`safe param value '${safe}' not supported`)
  }
  if (hre.ethers.provider.network.chainId !== ADDRESSES[safe].NETWORK) {
    throw new Error(`using wrong network!`)
  }
  const roles = await getContract(safe, hre)

  return { dryRun, safe, roles, config: ADDRESSES[safe] }
}

const getContract = async (safe: string, hre: HardhatRuntimeEnvironment) => {
  const signers = await hre.ethers.getSigners()
  const Roles = await hre.ethers.getContractFactory("Roles", {
    libraries: { Permissions: "0xc9826D544DBE637F386eA23EEef65ae7a1F5dF33" },
  })
  return new hre.ethers.Contract(
    "0x0Df1f08f765238dc0b8beAAdDd6681F62e54beC6",
    Roles.interface,
    signers[0]
  ) as Roles
}

task("setMultisend").setAction(async (taskArgs, hre) => {
  const { dryRun, roles } = await processArgs(taskArgs, hre)

  const MULTISEND_ADDRESS = "0x8D29bE29923b68abfDD21e541b9374737B49cdAD"
  const tx = await roles.setMultisend(MULTISEND_ADDRESS)
  console.log(JSON.stringify({ to: tx.to, data: tx.data }, null, 2))
  if (dryRun) return

  console.log(`TX hash: ${tx.hash}`)
  console.log("Waiting for confirmation...")
  await tx.wait()
  console.log("Done.")
})

task("assignManagementRole").setAction(async (taskArgs, hre) => {
  const { dryRun, roles, config } = await processArgs(taskArgs, hre)

  const tx = await roles.assignRoles(config.MANAGEMENT, [1], [true])
  console.log(JSON.stringify({ to: tx.to, data: tx.data }, null, 2))
  if (dryRun) return

  console.log(`TX hash: ${tx.hash}`)
  console.log("Waiting for confirmation...")
  await tx.wait()
  console.log("Done.")
})

task("assignHarvestRole").setAction(async (taskArgs, hre) => {
  const { dryRun, roles, config } = await processArgs(taskArgs, hre)

  const txData = await addMembers(config.MODULE, 2, config.HARVESTERS)
  console.log(JSON.stringify({ to: txData.to, data: txData.data }, null, 2))
  if (dryRun) return

  const tx = await roles.signer.sendTransaction(txData)
  console.log(`TX hash: ${tx.hash}`)
  console.log("Waiting for confirmation...")
  await tx.wait()
  console.log("Done.")
})

task("encodeApplyPresetManage").setAction(async (taskArgs, hre) => {
  const { dryRun, roles, config } = await processArgs(taskArgs, hre)

  const txBatches = await encodeApplyPreset(
    config.MODULE,
    1,
    gnosisChainDeFiManagePreset,
    {
      network: config.NETWORK,
      avatar: config.AVATAR,
    }
  )

  for (let i = 0; i < txBatches.length; i++) {
    console.log(
      JSON.stringify({ to: txBatches[i].to, data: txBatches[i].data }, null, 2)
    )
    if (dryRun) continue

    const tx = await roles.signer.sendTransaction(txBatches[i])
    console.log(`TX hash: ${tx.hash}`)
    console.log("Waiting for confirmation...")
    await tx.wait()
    console.log(`Done ${i}/${txBatches.length}.`)
  }
})

task("encodeApplyPresetHarvest").setAction(async (taskArgs, hre) => {
  const { dryRun, roles, config } = await processArgs(taskArgs, hre)

  const txBatches = await encodeApplyPreset(
    config.MODULE,
    2,
    gnosisChainDeFiHarvestPreset,
    {
      network: config.NETWORK,
      avatar: config.AVATAR,
    }
  )

  for (let i = 0; i < txBatches.length; i++) {
    console.log(
      JSON.stringify({ to: txBatches[i].to, data: txBatches[i].data }, null, 2)
    )
    if (dryRun) continue

    const tx = await roles.signer.sendTransaction(txBatches[i])
    console.log(`TX hash: ${tx.hash}`)
    console.log("Waiting for confirmation...")
    await tx.wait()
    console.log(`Done ${i}/${txBatches.length}.`)
  }
})
