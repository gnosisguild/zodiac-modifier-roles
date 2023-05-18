import "@nomiclabs/hardhat-ethers"

import { writeFileSync, existsSync, mkdirSync } from "fs"
import path from "path"

import { task as baseTask, types } from "hardhat/config"
import { HardhatRuntimeEnvironment } from "hardhat/types"

import { Roles } from "../../evm/typechain-types"
import addMembers from "../src/addMembers"
import { encodeApplyPresetTxBuilder } from "../src/applyPreset"
import mainnetDeFiManageBalancerPreset from "../src/presets/mainnet/Balancer/deFiManageBalancer"
import mainnetDeFiHarvestBalancerPreset from "../src/presets/mainnet/Balancer/deFiHarvestBalancer"
import mainnetDeFiSwapBalancerPreset from "../src/presets/mainnet/Balancer/deFiSwapBalancer"

import mainnetDeFiManageBalancerAlternativePreset from "../src/presets/mainnet/Balancer/deFiManageBalancerAlternative"

import { NetworkId } from "../src/types"

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

export const BALANCER_ADDRESSES = {
  BALANCER_ETH: {
    AVATAR: "0x0EFcCBb9E2C09Ea29551879bd9Da32362b32fc89",
    MODULE: "0xd8dd9164E765bEF903E429c9462E51F0Ea8514F9",
    MANAGER: "0x60716991aCDA9E990bFB3b1224f1f0fB81538267",
    REVOKER: "",
    HARVESTER: "0x19f2ab2c11d818d40b227557d3935ded9e1d201a",
    DISASSEMBLER: "",
    SWAPPER: "0x19f2ab2c11d818d40b227557d3935ded9e1d201a",
    NETWORK: 1,
    BRIDGED_SAFE: "0x0000000000000000000000000000000000000000",
  },
  BALANCER_ALTERNATIVE_ETH: {
    AVATAR: "0xC01318baB7ee1f5ba734172bF7718b5DC6Ec90E1",
    MODULE: "0x1ffAdc16726dd4F91fF275b4bF50651801B06a86",
    MANAGER: "0x216071B1B5681D67A75f7eEAF92CEC8262bE29f7",
    REVOKER: "",
    HARVESTER: "0x14c2d2d64c4860acf7cf39068eb467d7556197de",
    DISASSEMBLER: "",
    SWAPPER: "0x14c2d2d64c4860acf7cf39068eb467d7556197de",
    NETWORK: 1,
    BRIDGED_SAFE: "0x0000000000000000000000000000000000000000",
  },
} satisfies { [key: string]: Config }

const task = (name: string) =>
  baseTask(name)
    .addParam(
      "safe",
      "one of: 'BALANCER_ETH', 'BALANCER_ALTERNATIVE_ETH'",
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
  if (!(safe in BALANCER_ADDRESSES)) {
    throw new Error(`safe param value '${safe}' not supported`)
  }
  const safeKey = safe as keyof typeof BALANCER_ADDRESSES
  if (hre.network.config.chainId !== BALANCER_ADDRESSES[safeKey].NETWORK) {
    throw new Error(`using wrong network!`)
  }
  const roles = await getContract(safe, hre)

  return { dryRun, safe, roles, config: BALANCER_ADDRESSES[safeKey] }
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

task("setBalancerMultisend").setAction(async (taskArgs, hre) => {
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

task("assignBalancerManagementRole").setAction(async (taskArgs, hre) => {
  const { dryRun, roles, config } = await processArgs(taskArgs, hre)

  const tx = await roles.assignRoles(config.MANAGER, [1], [true])
  console.log(JSON.stringify({ to: tx.to, data: tx.data }, null, 2))
  if (dryRun) return

  console.log(`TX hash: ${tx.hash}`)
  console.log("Waiting for confirmation...")
  await tx.wait()
  console.log("Done.")
})

// task("assignBalancerRevokeRole").setAction(async (taskArgs, hre) => {
//     const { dryRun, roles, config } = await processArgs(taskArgs, hre)

//     const txData = await addMembers(config.MODULE, 2, [config.REVOKER])
//     console.log(JSON.stringify({ to: txData.to, data: txData.data }, null, 2))
//     if (dryRun) return

//     const tx = await roles.signer.sendTransaction(txData)
//     console.log(`TX hash: ${tx.hash}`)
//     console.log("Waiting for confirmation...")
//     await tx.wait()
//     console.log("Done.")
// })

task("assignBalancerHarvestRole").setAction(async (taskArgs, hre) => {
  const { dryRun, roles, config } = await processArgs(taskArgs, hre)

  const txData = await addMembers(config.MODULE, 3, [config.HARVESTER])
  console.log(JSON.stringify({ to: txData.to, data: txData.data }, null, 2))
  if (dryRun) return

  const tx = await roles.signer.sendTransaction(txData)
  console.log(`TX hash: ${tx.hash}`)
  console.log("Waiting for confirmation...")
  await tx.wait()
  console.log("Done.")
})

// task("assignBalancerDisassembleRole").setAction(async (taskArgs, hre) => {
//     const { dryRun, roles, config } = await processArgs(taskArgs, hre)

//     const txData = await addMembers(config.MODULE, 4, [config.DISASSEMBLER])
//     console.log(JSON.stringify({ to: txData.to, data: txData.data }, null, 2))
//     if (dryRun) return

//     const tx = await roles.signer.sendTransaction(txData)
//     console.log(`TX hash: ${tx.hash}`)
//     console.log("Waiting for confirmation...")
//     await tx.wait()
//     console.log("Done.")
// })

task("assignBalancerSwapRole").setAction(async (taskArgs, hre) => {
  const { dryRun, roles, config } = await processArgs(taskArgs, hre)

  const txData = await addMembers(config.MODULE, 5, [config.SWAPPER])
  console.log(JSON.stringify({ to: txData.to, data: txData.data }, null, 2))
  if (dryRun) return

  const tx = await roles.signer.sendTransaction(txData)
  console.log(`TX hash: ${tx.hash}`)
  console.log("Waiting for confirmation...")
  await tx.wait()
  console.log("Done.")
})

//-----------------------------------------------------------------------------------------------------------------------------
// BALANCER - Mainnet
//-----------------------------------------------------------------------------------------------------------------------------

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

  const filePath = path.join(
    __dirname,
    "..",
    "/presets-output/mainnet/Balancer/txDataManageBalancer.json"
  )
  // Check if the file exists
  if (!existsSync(filePath)) {
    // Create the directory structure if it doesn't exist
    mkdirSync(path.dirname(filePath), { recursive: true })
  }
  // Write the JSON data to the file
  writeFileSync(filePath, JSON.stringify(txBatches, undefined, 2))
  console.log(`Transaction builder JSON written to  ${filePath}`)
})

// task("encodeApplyPresetRevokeBalancer").setAction(
//     async (taskArgs, hre) => {
//         const { config } = await processArgs(taskArgs, hre)
//         const txBatches = await encodeApplyPresetTxBuilder(
//             config.MODULE,
//             2,
//             mainnetDeFiRevokeBalancerPreset,
//             { AVATAR: config.AVATAR },
//             {
//                 network: config.NETWORK as NetworkId,
//             }
//         )

//         writeFileSync(
//             path.join(__dirname, "..", "/presets_output/mainnet/Balancer/txDataRevokeBalancer.json"),
//             JSON.stringify(txBatches, undefined, 2)
//         )
//         console.log(
//             `Transaction builder JSON written to packages/sdk/presets_output/mainnet/Balancer/txDataRevokeBalancer.json`
//         )
//     }
// )

task("encodeApplyPresetHarvestBalancer").setAction(async (taskArgs, hre) => {
  const { config } = await processArgs(taskArgs, hre)
  const txBatches = await encodeApplyPresetTxBuilder(
    config.MODULE,
    3,
    mainnetDeFiHarvestBalancerPreset,
    { AVATAR: config.AVATAR },
    {
      network: config.NETWORK as NetworkId,
    }
  )

  const filePath = path.join(
    __dirname,
    "..",
    "/presets_output/mainnet/Balancer/txDataHarvestBalancer.json"
  )
  if (!existsSync(filePath)) {
    // Create the directory structure if it doesn't exist
    mkdirSync(path.dirname(filePath), { recursive: true })
  }
  // Write the JSON data to the file
  writeFileSync(filePath, JSON.stringify(txBatches, undefined, 2))
  console.log(`Transaction builder JSON written to  ${filePath}`)
})

// task("encodeApplyPresetDisassembleBalancer").setAction(
//     async (taskArgs, hre) => {
//         const { config } = await processArgs(taskArgs, hre)
//         const txBatches = await encodeApplyPresetTxBuilder(
//             config.MODULE,
//             4,
//             mainnetDeFiDisassembleBalancerPreset,
//             { AVATAR: config.AVATAR },
//             {
//                 network: config.NETWORK as NetworkId,
//             }
//         )

//         writeFileSync(
//             path.join(__dirname, "..", "/presets_output/mainnet/Balancer/txDataDisassembleBalancer.json"),
//             JSON.stringify(txBatches, undefined, 2)
//         )
//         console.log(
//             `Transaction builder JSON written to packages/sdk/presets_output/mainnet/Balancer/txDataDisassembleBalancer.json`
//         )
//     }
// )

task("encodeApplyPresetSwapBalancer").setAction(async (taskArgs, hre) => {
  const { config } = await processArgs(taskArgs, hre)
  const txBatches = await encodeApplyPresetTxBuilder(
    config.MODULE,
    5,
    mainnetDeFiSwapBalancerPreset,
    { AVATAR: config.AVATAR },
    {
      network: config.NETWORK as NetworkId,
    }
  )

  writeFileSync(
    path.join(
      __dirname,
      "..",
      "/presets_output/mainnet/Balancer/txDataSwapBalancer.json"
    ),
    JSON.stringify(txBatches, undefined, 2)
  )
  console.log(
    `Transaction builder JSON written to packages/sdk/presets_output/mainnet/Balancer/txDataSwapBalancer.json`
  )
})

//-----------------------------------------------------------------------------------------------------------------------------
// BALANCER Alternative - Mainnet
//-----------------------------------------------------------------------------------------------------------------------------

task("encodeApplyPresetManageBalancerAlternative").setAction(
  async (taskArgs, hre) => {
    const { config } = await processArgs(taskArgs, hre)
    const txBatches = await encodeApplyPresetTxBuilder(
      config.MODULE,
      1,
      mainnetDeFiManageBalancerAlternativePreset,
      { AVATAR: config.AVATAR },
      {
        network: config.NETWORK as NetworkId,
      }
    )

    writeFileSync(
      path.join(__dirname, "..", "txDataManageBalancerAlternative.json"),
      JSON.stringify(txBatches, undefined, 2)
    )
    console.log(
      `Transaction builder JSON written to packages/sdk/txDataManageBalancerAlternative.json`
    )
  }
)
