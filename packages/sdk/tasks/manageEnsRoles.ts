import "@nomiclabs/hardhat-ethers"

import { writeFileSync, existsSync, mkdirSync } from "fs"
import path from "path"

import { task as baseTask, types } from "hardhat/config"
import { HardhatRuntimeEnvironment } from "hardhat/types"

import { Roles } from "../../evm/typechain-types"
import addMembers from "../src/addMembers"
import { encodeApplyPresetTxBuilder } from "../src/applyPreset"
import mainnetDeFiHarvestENSPreset from "../src/presets/mainnet/ENS/deFiHarvestENS"
import mainnetDeFiManageENSPreset from "../src/presets/mainnet/ENS/deFiManageENS"
import mainnetDeFiSwapENSPreset from "../src/presets/mainnet/ENS/deFiSwapENS"
// import sparkRepayDebtDAI from "../src/presets/mainnet/ENS/sparkRepayDebtDAI"
// import test_payload_balancer from "../src/presets/mainnet/ENS/test_payload_balancer"
// import test_payload_maker from "../src/presets/mainnet/ENS/test_payload_maker"
import test_payload_rocket from "../src/presets/mainnet/ENS/test_payload_rocket"
import { NetworkId } from "../src/types"

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
  ROLE_IDS: {
    MANAGER: number
    REVOKER: number
    HARVESTER: number
    DISASSEMBLER: number
    SWAPPER: number
  }
}

export const ENS_ADDRESSES = {
  ENS_ETH: {
    AVATAR: "0x4F2083f5fBede34C2714aFfb3105539775f7FE64", //"0xC01318baB7ee1f5ba734172bF7718b5DC6Ec90E1", //"0x4F2083f5fBede34C2714aFfb3105539775f7FE64",
    MODULE: "0xf20325cf84b72e8BBF8D8984B8f0059B984B390B", //"0x1ffAdc16726dd4F91fF275b4bF50651801B06a86", //"0xf20325cf84b72e8BBF8D8984B8f0059B984B390B",
    MANAGER: "0xb423e0f6E7430fa29500c5cC9bd83D28c8BD8978",
    REVOKER: "",
    HARVESTER: "0x14c2d2d64c4860acf7cf39068eb467d7556197de",
    DISASSEMBLER: "",
    SWAPPER: "0x14c2d2d64c4860acf7cf39068eb467d7556197de",
    NETWORK: 1,
    BRIDGED_SAFE: "0x0000000000000000000000000000000000000000",
    ROLE_IDS: {
      MANAGER: 1,
      REVOKER: 2,
      HARVESTER: 3,
      DISASSEMBLER: 4,
      SWAPPER: 5,
    },
  },
} satisfies { [key: string]: Config }

const task = (name: string) =>
  baseTask(name)
    .addParam("safe", "one of: 'ENS_ETH'", undefined, types.string)
    .addOptionalParam(
      "dryRun",
      "When enabled it only prints the transaction data but does not send it",
      false,
      types.boolean
    )

const processArgs = async (taskArgs: any, hre: HardhatRuntimeEnvironment) => {
  const { dryRun, safe } = taskArgs
  if (!(safe in ENS_ADDRESSES)) {
    throw new Error(`safe param value '${safe}' not supported`)
  }
  const safeKey = safe as keyof typeof ENS_ADDRESSES
  if (hre.network.config.chainId !== ENS_ADDRESSES[safeKey].NETWORK) {
    throw new Error(`using wrong network!`)
  }
  const roles = await getContract(safe, hre)

  return { dryRun, safe, roles, config: ENS_ADDRESSES[safeKey] }
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

task("setEnsMultisend").setAction(async (taskArgs, hre) => {
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

task("assignEnsManagementRole").setAction(async (taskArgs, hre) => {
  const { dryRun, roles, config } = await processArgs(taskArgs, hre)

  const tx = await roles.assignRoles(
    config.MANAGER,
    [config.ROLE_IDS.MANAGER],
    [true]
  )
  console.log(JSON.stringify({ to: tx.to, data: tx.data }, null, 2))
  if (dryRun) return

  console.log(`TX hash: ${tx.hash}`)
  console.log("Waiting for confirmation...")
  await tx.wait()
  console.log("Done.")
})

// task("assignEnsRevokeRole").setAction(async (taskArgs, hre) => {
//     const { dryRun, roles, config } = await processArgs(taskArgs, hre)

//     const txData = await addMembers(config.MODULE, config.ROLE_IDS.REVOKER, [config.REVOKER])
//     console.log(JSON.stringify({ to: txData.to, data: txData.data }, null, 2))
//     if (dryRun) return

//     const tx = await roles.signer.sendTransaction(txData)
//     console.log(`TX hash: ${tx.hash}`)
//     console.log("Waiting for confirmation...")
//     await tx.wait()
//     console.log("Done.")
// })

task("assignEnsHarvestRole").setAction(async (taskArgs, hre) => {
  const { dryRun, roles, config } = await processArgs(taskArgs, hre)

  const txData = await addMembers(config.MODULE, config.ROLE_IDS.HARVESTER, [
    config.HARVESTER,
  ])
  console.log(JSON.stringify({ to: txData.to, data: txData.data }, null, 2))
  if (dryRun) return

  const tx = await roles.signer.sendTransaction(txData)
  console.log(`TX hash: ${tx.hash}`)
  console.log("Waiting for confirmation...")
  await tx.wait()
  console.log("Done.")
})

// task("assignEnsDisassembleRole").setAction(async (taskArgs, hre) => {
//     const { dryRun, roles, config } = await processArgs(taskArgs, hre)

//     const txData = await addMembers(config.MODULE, config.ROLE_IDS.DISASSEMBLER, [config.DISASSEMBLER])
//     console.log(JSON.stringify({ to: txData.to, data: txData.data }, null, 2))
//     if (dryRun) return

//     const tx = await roles.signer.sendTransaction(txData)
//     console.log(`TX hash: ${tx.hash}`)
//     console.log("Waiting for confirmation...")
//     await tx.wait()
//     console.log("Done.")
// })

task("assignEnsSwapRole").setAction(async (taskArgs, hre) => {
  const { dryRun, roles, config } = await processArgs(taskArgs, hre)

  const txData = await addMembers(config.MODULE, config.ROLE_IDS.SWAPPER, [
    config.SWAPPER,
  ])
  console.log(JSON.stringify({ to: txData.to, data: txData.data }, null, 2))
  if (dryRun) return

  const tx = await roles.signer.sendTransaction(txData)
  console.log(`TX hash: ${tx.hash}`)
  console.log("Waiting for confirmation...")
  await tx.wait()
  console.log("Done.")
})

//-----------------------------------------------------------------------------------------------------------------------------
// ENS - Mainnet
//-----------------------------------------------------------------------------------------------------------------------------

task("encodeApplyPresetManageENS").setAction(async (taskArgs, hre) => {
  const { config } = await processArgs(taskArgs, hre)
  const txBatches = await encodeApplyPresetTxBuilder(
    config.MODULE,
    config.ROLE_IDS.MANAGER,
    mainnetDeFiManageENSPreset,
    { AVATAR: config.AVATAR },
    {
      network: config.NETWORK as NetworkId,
      //currentPermissions: { targets: [] }
    }
  )

  const filePath = path.join(
    __dirname,
    "..",
    "/presets-output/mainnet/ENS/txDataManageENS.json"
  )
  if (!existsSync(filePath)) {
    // Create the directory structure if it doesn't exist
    mkdirSync(path.dirname(filePath), { recursive: true })
  }
  // Write the JSON data to the file
  writeFileSync(filePath, JSON.stringify(txBatches, undefined, 2))
  console.log(`Transaction builder JSON written to  ${filePath}`)
})

task("encodeApplyPresetsTestRocket").setAction(async (taskArgs, hre) => {
  const { config } = await processArgs(taskArgs, hre)
  const txBatches = await encodeApplyPresetTxBuilder(
    config.MODULE,
    config.ROLE_IDS.REVOKER,
    test_payload_rocket,
    { AVATAR: config.AVATAR },
    {
      network: config.NETWORK as NetworkId,
    }
  )

  const filePath = path.join(
    __dirname,
    "..",
    "/presets-output/mainnet/ENS/test_payload_rocket.json"
  )
  if (!existsSync(filePath)) {
    // Create the directory structure if it doesn't exist
    mkdirSync(path.dirname(filePath), { recursive: true })
  }
  // Write the JSON data to the file
  writeFileSync(filePath, JSON.stringify(txBatches, undefined, 2))
  console.log(`Transaction builder JSON written to  ${filePath}`)
})

// task("encodeApplyPresetsTestBalancer").setAction(async (taskArgs, hre) => {
//   const { config } = await processArgs(taskArgs, hre)
//   const txBatches = await encodeApplyPresetTxBuilder(
//     config.MODULE,
//     config.ROLE_IDS.REVOKER,
//     test_payload_balancer,
//     { AVATAR: config.AVATAR },
//     {
//       network: config.NETWORK as NetworkId,
//     }
//   )

//   const filePath = path.join(
//     __dirname,
//     "..",
//     "/presets-output/mainnet/ENS/test_payload_balancer.json"
//   )
//   if (!existsSync(filePath)) {
//     // Create the directory structure if it doesn't exist
//     mkdirSync(path.dirname(filePath), { recursive: true })
//   }
//   // Write the JSON data to the file
//   writeFileSync(filePath, JSON.stringify(txBatches, undefined, 2))
//   console.log(`Transaction builder JSON written to  ${filePath}`)
// })

// task("encodeApplyPresetsSpark").setAction(async (taskArgs, hre) => {
//   const { config } = await processArgs(taskArgs, hre)
//   const txBatches = await encodeApplyPresetTxBuilder(
//     config.MODULE,
//     config.ROLE_IDS.REVOKER,
//     sparkRepayDebtDAI,
//     { AVATAR: config.AVATAR },
//     {
//       network: config.NETWORK as NetworkId,
//     }
//   )

//   const filePath = path.join(
//     __dirname,
//     "..",
//     "/presets-output/mainnet/ENS/txSparkRepayDebtDAI.json"
//   )
//   if (!existsSync(filePath)) {
//     // Create the directory structure if it doesn't exist
//     mkdirSync(path.dirname(filePath), { recursive: true })
//   }
//   // Write the JSON data to the file
//   writeFileSync(filePath, JSON.stringify(txBatches, undefined, 2))
//   console.log(`Transaction builder JSON written to  ${filePath}`)
// })

task("encodeApplyPresetHarvestENS").setAction(async (taskArgs, hre) => {
  const { config } = await processArgs(taskArgs, hre)
  const txBatches = await encodeApplyPresetTxBuilder(
    config.MODULE,
    config.ROLE_IDS.HARVESTER,
    mainnetDeFiHarvestENSPreset,
    { AVATAR: config.AVATAR },
    {
      network: config.NETWORK as NetworkId,
    }
  )

  const filePath = path.join(
    __dirname,
    "..",
    "/presets-output/mainnet/ENS/txDataHarvestENS.json"
  )
  if (!existsSync(filePath)) {
    // Create the directory structure if it doesn't exist
    mkdirSync(path.dirname(filePath), { recursive: true })
  }
  // Write the JSON data to the file
  writeFileSync(filePath, JSON.stringify(txBatches, undefined, 2))
  console.log(`Transaction builder JSON written to  ${filePath}`)
})

// task("encodeApplyPresetDisassembleENS").setAction(
//     async (taskArgs, hre) => {
//         const { config } = await processArgs(taskArgs, hre)
//         const txBatches = await encodeApplyPresetTxBuilder(
//             config.MODULE,
//             config.ROLE_IDS.DISASSEMBLER,
//             mainnetDeFiDisassembleENSPreset,
//             { AVATAR: config.AVATAR },
//             {
//                 network: config.NETWORK as NetworkId,
//             }
//         )

//         writeFileSync(
//             path.join(__dirname, "..", "/presets_output/mainnet/ENS/txDataDisassembleENS.json"),
//             JSON.stringify(txBatches, undefined, 2)
//         )
//         console.log(
//             `Transaction builder JSON written to packages/sdk/presets_output/mainnet/ENS/txDataDisassembleENS.json`
//         )
//     }
// )

task("encodeApplyPresetSwapENS").setAction(async (taskArgs, hre) => {
  const { config } = await processArgs(taskArgs, hre)
  const txBatches = await encodeApplyPresetTxBuilder(
    config.MODULE,
    config.ROLE_IDS.SWAPPER,
    mainnetDeFiSwapENSPreset,
    { AVATAR: config.AVATAR },
    {
      network: config.NETWORK as NetworkId,
    }
  )

  const filePath = path.join(
    __dirname,
    "..",
    "/presets-output/mainnet/ENS/txDataSwapENS.json"
  )
  if (!existsSync(filePath)) {
    // Create the directory structure if it doesn't exist
    mkdirSync(path.dirname(filePath), { recursive: true })
  }
  // Write the JSON data to the file
  writeFileSync(filePath, JSON.stringify(txBatches, undefined, 2))
  console.log(`Transaction builder JSON written to  ${filePath}`)
})
