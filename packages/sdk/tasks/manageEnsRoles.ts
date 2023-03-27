import "@nomiclabs/hardhat-ethers"

import { writeFileSync } from "fs"
import path from "path"

import { task as baseTask, types } from "hardhat/config"
import { HardhatRuntimeEnvironment } from "hardhat/types"

import { Roles } from "../../evm/typechain-types"
import addMembers from "../src/addMembers"
import { encodeApplyPresetTxBuilder } from "../src/applyPreset"
import mainnetDeFiManageENS1Preset from "../src/presets/mainnet/ENS/deFiManageENS"
import mainnetDeFiHarvestENS1Preset from "../src/presets/mainnet/ENS/deFiHarvestENS"
import mainnetDeFiSwapENS1Preset from "../src/presets/mainnet/ENS/deFiSwapENS"

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

export const ENS_ADDRESSES = {
    ENS_ETH: {
        AVATAR: "0x4F2083f5fBede34C2714aFfb3105539775f7FE64",
        MODULE: "0xf20325cf84b72e8BBF8D8984B8f0059B984B390B",
        MANAGER: "0xb423e0f6E7430fa29500c5cC9bd83D28c8BD8978",
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

    const tx = await roles.assignRoles(config.MANAGER, [1], [true])
    console.log(JSON.stringify({ to: tx.to, data: tx.data }, null, 2))
    if (dryRun) return

    console.log(`TX hash: ${tx.hash}`)
    console.log("Waiting for confirmation...")
    await tx.wait()
    console.log("Done.")
})

// task("assignEnsRevokeRole").setAction(async (taskArgs, hre) => {
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

task("assignEnsHarvestRole").setAction(async (taskArgs, hre) => {
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

// task("assignEnsDisassembleRole").setAction(async (taskArgs, hre) => {
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

task("assignEnsSwapRole").setAction(async (taskArgs, hre) => {
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
// ENS 1 - Mainnet
//-----------------------------------------------------------------------------------------------------------------------------

task("encodeApplyPresetManageENS1").setAction(async (taskArgs, hre) => {
    const { config } = await processArgs(taskArgs, hre)
    const txBatches = await encodeApplyPresetTxBuilder(
        config.MODULE,
        1,
        mainnetDeFiManageENS1Preset,
        { AVATAR: config.AVATAR },
        {
            network: config.NETWORK as NetworkId,
        }
    )

    writeFileSync(
        path.join(__dirname, "..", "txDataManageENS1.json"),
        JSON.stringify(txBatches, undefined, 2)
    )
    console.log(
        `Transaction builder JSON written to packages/sdk/txDataManageENS1.json`
    )
})

// task("encodeApplyPresetRevokeENS1").setAction(
//     async (taskArgs, hre) => {
//         const { config } = await processArgs(taskArgs, hre)
//         const txBatches = await encodeApplyPresetTxBuilder(
//             config.MODULE,
//             2,
//             mainnetDeFiRevokeENS1Preset,
//             { AVATAR: config.AVATAR },
//             {
//                 network: config.NETWORK as NetworkId,
//             }
//         )

//         writeFileSync(
//             path.join(__dirname, "..", "txDataRevokeENS1.json"),
//             JSON.stringify(txBatches, undefined, 2)
//         )
//         console.log(
//             `Transaction builder JSON written to packages/sdk/txDataRevokeENS1.json`
//         )
//     }
// )

task("encodeApplyPresetHarvestENS1").setAction(async (taskArgs, hre) => {
    const { config } = await processArgs(taskArgs, hre)
    const txBatches = await encodeApplyPresetTxBuilder(
        config.MODULE,
        3,
        mainnetDeFiHarvestENS1Preset,
        { AVATAR: config.AVATAR },
        {
            network: config.NETWORK as NetworkId,
        }
    )

    writeFileSync(
        path.join(__dirname, "..", "txDataHarvestENS1.json"),
        JSON.stringify(txBatches, undefined, 2)
    )
    console.log(
        `Transaction builder JSON written to packages/sdk/txDataHarvestENS1.json`
    )
})

// task("encodeApplyPresetDisassembleENS1").setAction(
//     async (taskArgs, hre) => {
//         const { config } = await processArgs(taskArgs, hre)
//         const txBatches = await encodeApplyPresetTxBuilder(
//             config.MODULE,
//             4,
//             mainnetDeFiDisassembleENS1Preset,
//             { AVATAR: config.AVATAR },
//             {
//                 network: config.NETWORK as NetworkId,
//             }
//         )

//         writeFileSync(
//             path.join(__dirname, "..", "txDataDisassembleENS1.json"),
//             JSON.stringify(txBatches, undefined, 2)
//         )
//         console.log(
//             `Transaction builder JSON written to packages/sdk/txDataDisassembleENS1.json`
//         )
//     }
// )

task("encodeApplyPresetSwapENS1").setAction(async (taskArgs, hre) => {
    const { config } = await processArgs(taskArgs, hre)
    const txBatches = await encodeApplyPresetTxBuilder(
        config.MODULE,
        5,
        mainnetDeFiSwapENS1Preset,
        { AVATAR: config.AVATAR },
        {
            network: config.NETWORK as NetworkId,
        }
    )

    writeFileSync(
        path.join(__dirname, "..", "txDataSwapENS1.json"),
        JSON.stringify(txBatches, undefined, 2)
    )
    console.log(
        `Transaction builder JSON written to packages/sdk/txDataSwapENS1.json`
    )
})
