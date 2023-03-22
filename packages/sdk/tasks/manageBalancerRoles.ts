import "@nomiclabs/hardhat-ethers"

import { writeFileSync } from "fs"
import path from "path"

import { task as baseTask, types } from "hardhat/config"
import { HardhatRuntimeEnvironment } from "hardhat/types"

import { Roles } from "../../evm/typechain-types"
import addMembers from "../src/addMembers"
import { encodeApplyPresetTxBuilder } from "../src/applyPreset"
import mainnetDeFiManageBalancer1Preset from "../src/presets/mainnet/Balancer/deFiManageBalancer1"
import mainnetDeFiHarvestBalancer1Preset from "../src/presets/mainnet/Balancer/deFiHarvestBalancer1"
import mainnetDeFiSwapBalancer1Preset from "../src/presets/mainnet/Balancer/deFiSwapBalancer1"

import mainnetDeFiManageBalancer2Preset from "../src/presets/mainnet/Balancer/deFiManageBalancer2"

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
    BALANCER_1_ETH: {
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
    BALANCER_2_ETH: {
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
// BALANCER 1 - Mainnet
//-----------------------------------------------------------------------------------------------------------------------------

task("encodeApplyPresetManageBalancer1").setAction(async (taskArgs, hre) => {
    const { config } = await processArgs(taskArgs, hre)
    const txBatches = await encodeApplyPresetTxBuilder(
        config.MODULE,
        1,
        mainnetDeFiManageBalancer1Preset,
        { AVATAR: config.AVATAR },
        {
            network: config.NETWORK as NetworkId,
        }
    )

    writeFileSync(
        path.join(__dirname, "..", "txDataManageBalancer1.json"),
        JSON.stringify(txBatches, undefined, 2)
    )
    console.log(
        `Transaction builder JSON written to packages/sdk/txDataManageBalancer1.json`
    )
})

// task("encodeApplyPresetRevokeBalancer1").setAction(
//     async (taskArgs, hre) => {
//         const { config } = await processArgs(taskArgs, hre)
//         const txBatches = await encodeApplyPresetTxBuilder(
//             config.MODULE,
//             2,
//             mainnetDeFiRevokeBalancer1Preset,
//             { AVATAR: config.AVATAR },
//             {
//                 network: config.NETWORK as NetworkId,
//             }
//         )

//         writeFileSync(
//             path.join(__dirname, "..", "txDataRevokeBalancer1.json"),
//             JSON.stringify(txBatches, undefined, 2)
//         )
//         console.log(
//             `Transaction builder JSON written to packages/sdk/txDataRevokeBalancer1.json`
//         )
//     }
// )

task("encodeApplyPresetHarvestBalancer1").setAction(async (taskArgs, hre) => {
    const { config } = await processArgs(taskArgs, hre)
    const txBatches = await encodeApplyPresetTxBuilder(
        config.MODULE,
        3,
        mainnetDeFiHarvestBalancer1Preset,
        { AVATAR: config.AVATAR },
        {
            network: config.NETWORK as NetworkId,
        }
    )

    writeFileSync(
        path.join(__dirname, "..", "txDataHarvestBalancer1.json"),
        JSON.stringify(txBatches, undefined, 2)
    )
    console.log(
        `Transaction builder JSON written to packages/sdk/txDataHarvestBalancer1.json`
    )
})

// task("encodeApplyPresetDisassembleBalancer1").setAction(
//     async (taskArgs, hre) => {
//         const { config } = await processArgs(taskArgs, hre)
//         const txBatches = await encodeApplyPresetTxBuilder(
//             config.MODULE,
//             4,
//             mainnetDeFiDisassembleBalancer1Preset,
//             { AVATAR: config.AVATAR },
//             {
//                 network: config.NETWORK as NetworkId,
//             }
//         )

//         writeFileSync(
//             path.join(__dirname, "..", "txDataDisassembleBalancer1.json"),
//             JSON.stringify(txBatches, undefined, 2)
//         )
//         console.log(
//             `Transaction builder JSON written to packages/sdk/txDataDisassembleBalancer1.json`
//         )
//     }
// )

task("encodeApplyPresetSwapBalancer1").setAction(async (taskArgs, hre) => {
    const { config } = await processArgs(taskArgs, hre)
    const txBatches = await encodeApplyPresetTxBuilder(
        config.MODULE,
        5,
        mainnetDeFiSwapBalancer1Preset,
        { AVATAR: config.AVATAR },
        {
            network: config.NETWORK as NetworkId,
        }
    )

    writeFileSync(
        path.join(__dirname, "..", "txDataSwapBalancer1.json"),
        JSON.stringify(txBatches, undefined, 2)
    )
    console.log(
        `Transaction builder JSON written to packages/sdk/txDataSwapBalancer1.json`
    )
})

//-----------------------------------------------------------------------------------------------------------------------------
// BALANCER 2 - Mainnet
//-----------------------------------------------------------------------------------------------------------------------------

task("encodeApplyPresetManageBalancer2").setAction(async (taskArgs, hre) => {
    const { config } = await processArgs(taskArgs, hre)
    const txBatches = await encodeApplyPresetTxBuilder(
        config.MODULE,
        1,
        mainnetDeFiManageBalancer2Preset,
        { AVATAR: config.AVATAR },
        {
            network: config.NETWORK as NetworkId,
        }
    )

    writeFileSync(
        path.join(__dirname, "..", "txDataManageBalancer2.json"),
        JSON.stringify(txBatches, undefined, 2)
    )
    console.log(
        `Transaction builder JSON written to packages/sdk/txDataManageBalancer2.json`
    )
})


