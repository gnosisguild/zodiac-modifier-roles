import "@nomiclabs/hardhat-ethers"

import { writeFileSync } from "fs"
import path from "path"

import { task as baseTask, types } from "hardhat/config"
import { HardhatRuntimeEnvironment } from "hardhat/types"

import { Roles } from "../../evm/typechain-types"
import addMembers from "../src/addMembers"
import { encodeApplyPresetTxBuilder } from "../src/applyPreset"
import gnosisChainDeFiHarvestPreset from "../src/presets/gnosisChain/deFiHarvest"
import gnosisChainDeFiManagePreset from "../src/presets/gnosisChain/deFiManage"
import mainnetDeFiManageBalancerPreset from "../src/presets/mainnet/deFiManageBalancer"
import mainnetDeFiManageTestPreset from "../src/presets/mainnet/deFiManageTest"
import { NetworkId } from "../src/types"

export const KARPATKEY_ADDRESSES = {
  DAO_GNO: {
    AVATAR: "0x458cD345B4C05e8DF39d0A07220feb4Ec19F5e6f",
    MODULE: "0x10785356E66b93432e9E8D6F9e532Fa55e4fc058",
    MANAGEMENT: "0xe4387D4e45F65240Daaf5e046d5AE592566a5076",
    HARVESTERS: [
      // "0x5eD64f02588C8B75582f2f8eFd7A5521e3F897CC", // Alex
      // "0x06DAeB1A97972B9A12e171ed1FC86b392Fa3f89A", // Joaco
      // "0xe9eB7DA58f6B5CE5b0a6cFD778A2fa726203AAD5", // Isabel
      // "0x65E5017A384B2774374812DC766fC4E026BB23e5", // Ale
      "0x360FEAD0fA5cC741bF12cF5A0cC43059BC340e7e", // Santi/Bot
    ],
    NETWORK: 100,
    BRIDGED_SAFE: "0x849D52316331967b6fF1198e5E32A0eB168D039d",
  },
  LTD_GNO: {
    AVATAR: "0x10E4597fF93cbee194F4879f8f1d54a370DB6969",
    MODULE: "0x494ec5194123487E8A6ba0b6bc96D57e340025e7",
    MANAGEMENT: "0x9d3660d8304B063964A45766bbeD41F4883eBbA8",
    HARVESTERS: [
      // "0xf00b8484c9B78136c6AE8773223CFF9bE7a3Af45", // Alex
      // "0x2EDD4cF73B94a0507441A2C477e9Dc5C92f5Db1a", // Joaco
      // "0x0af878166427cA6075979ADe8377f9a5C23bed05", // Isabel
      // "0xe8aA9122832AA971c4802C69D5141Ff4EEB95ec5", // Ale
      "0x360FEAD0fA5cC741bF12cF5A0cC43059BC340e7e", // Santi/Bot
    ],
    NETWORK: 100,
    BRIDGED_SAFE: "0x4971DD016127F390a3EF6b956Ff944d0E2e1e462",
  },
  DAO_ETH: {
    AVATAR: "0x849D52316331967b6fF1198e5E32A0eB168D039d",
    MODULE: "",
    MANAGEMENT: "",
    HARVESTERS: [],
    NETWORK: 1,
    BRIDGED_SAFE: "0x458cD345B4C05e8DF39d0A07220feb4Ec19F5e6f",
  },
  LTD_ETH: {
    AVATAR: "0x4971DD016127F390a3EF6b956Ff944d0E2e1e462",
    MODULE: "",
    MANAGEMENT: "",
    HARVESTERS: [],
    NETWORK: 1,
    BRIDGED_SAFE: "0x10E4597fF93cbee194F4879f8f1d54a370DB6969",
  },
  SANTI_TEST_GNO: {
    AVATAR: "0x3AD295402978659427C179Fb30f319bF6a2c8678",
    MODULE: "0x8422d860d48Bc2aFeA8037d3954db31d5d3b4924",
    MANAGEMENT: "0xa928b0F1582126db08f902066403a3C69D2E7814",
    HARVESTERS: [],
    NETWORK: 100,
    BRIDGED_SAFE: "0x849D52316331967b6fF1198e5E32A0eB168D039d",
  },
  SANTI_TEST_ETH: {
    AVATAR: "0xcfBE92a0482e0d7D1e6501Ecf56d532B2853014F",
    MODULE: "0x8c858908D5f4cEF92f2B2277CB38248D39513f45",
    MANAGEMENT: "0x521041D907AB69Cb95FC0f923Fe5a68541429A2C",
    HARVESTERS: [],
    NETWORK: 1,
    BRIDGED_SAFE: "0x0000000000000000000000000000000000000000",
  },
  BALANCER_TEST_ETH: {
    AVATAR: "0xC01318baB7ee1f5ba734172bF7718b5DC6Ec90E1",
    MODULE: "0x1ffAdc16726dd4F91fF275b4bF50651801B06a86",
    MANAGEMENT: "0x216071B1B5681D67A75f7eEAF92CEC8262bE29f7",
    HARVESTERS: [],
    NETWORK: 1,
    BRIDGED_SAFE: "0x0000000000000000000000000000000000000000",
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
  if (!(safe in KARPATKEY_ADDRESSES)) {
    throw new Error(`safe param value '${safe}' not supported`)
  }
  const safeKey = safe as keyof typeof KARPATKEY_ADDRESSES
  if (hre.network.config.chainId !== KARPATKEY_ADDRESSES[safeKey].NETWORK) {
    throw new Error(`using wrong network!`)
  }
  const roles = await getContract(safe, hre)

  return { dryRun, safe, roles, config: KARPATKEY_ADDRESSES[safeKey] }
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
  ) as unknown as Roles
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
  const { config } = await processArgs(taskArgs, hre)
  const txBatches = await encodeApplyPresetTxBuilder(
    config.MODULE,
    1,
    gnosisChainDeFiManagePreset, // TODO use mainnetDeFiManagePreset if on mainnet
    { OMNI_BRIDGE_RECIPIENT_MAINNET: config.BRIDGED_SAFE },
    {
      network: config.NETWORK as NetworkId,
    }
  )

  writeFileSync(
    path.join(__dirname, "..", "txData.json"),
    JSON.stringify(txBatches, undefined, 2)
  )
  console.log(`Transaction builder JSON written to packages/sdk/txData.json`)
})

task("encodeApplyPresetManageTest").setAction(async (taskArgs, hre) => {
  const { config } = await processArgs(taskArgs, hre)
  const txBatches = await encodeApplyPresetTxBuilder(
    config.MODULE,
    1,
    mainnetDeFiManageTestPreset,
    {},
    {
      network: config.NETWORK as NetworkId,
    }
  )

  writeFileSync(
    path.join(__dirname, "..", "txData.json"),
    JSON.stringify(txBatches, undefined, 2)
  )
  console.log(`Transaction builder JSON written to packages/sdk/txData.json`)
})

task("encodeApplyPresetManageBalancer").setAction(async (taskArgs, hre) => {
  const { config } = await processArgs(taskArgs, hre)
  const txBatches = await encodeApplyPresetTxBuilder(
    config.MODULE,
    1,
    mainnetDeFiManageBalancerPreset,
    { AVATAR: config.AVATAR },
    {
      network: config.NETWORK as NetworkId,
    }
  )

  writeFileSync(
    path.join(__dirname, "..", "txData.json"),
    JSON.stringify(txBatches, undefined, 2)
  )
  console.log(`Transaction builder JSON written to packages/sdk/txData.json`)
})

task("encodeApplyPresetHarvest").setAction(async (taskArgs, hre) => {
  const { config } = await processArgs(taskArgs, hre)
  const txBatches = await encodeApplyPresetTxBuilder(
    config.MODULE,
    2,
    gnosisChainDeFiHarvestPreset, // TODO use mainnetDeFiHarvestPreset if on mainnet
    { AVATAR: config.AVATAR },
    {
      network: config.NETWORK as NetworkId,
    }
  )

  writeFileSync(
    path.join(__dirname, "..", "txData.json"),
    JSON.stringify(txBatches, undefined, 2)
  )
  console.log(`Transaction builder JSON written to packages/sdk/txData.json`)
})
