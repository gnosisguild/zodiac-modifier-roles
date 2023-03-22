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
import gnosisDeFiManageGnosisLTDPreset from "../src/presets/gnosisChain/deFiManageGnosisLTD"
import gnosisDeFiRevokeGnosisLTDPreset from "../src/presets/gnosisChain/deFiRevokeGnosisLTD"
import gnosisDeFiHarvestGnosisLTDPreset from "../src/presets/gnosisChain/deFiHarvestGnosisLTD"
import gnosisDeFiDisassembleGnosisLTDPreset from "../src/presets/gnosisChain/deFiDisassembleGnosisLTD"
import gnosisDeFiSwapGnosisLTDPreset from "../src/presets/gnosisChain/deFiSwapGnosisLTD"

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

export const GNOSIS_ADDRESSES = {
    DAO_GNO: {
        AVATAR: "0x458cD345B4C05e8DF39d0A07220feb4Ec19F5e6f",
        MODULE: "0x10785356E66b93432e9E8D6F9e532Fa55e4fc058",
        MANAGER: "0xe4387D4e45F65240Daaf5e046d5AE592566a5076",
        REVOKER: "",
        HARVESTER: "0x360FEAD0fA5cC741bF12cF5A0cC43059BC340e7e", // Santi/Bot
        DISASSEMBLER: "",
        SWAPPER: "",
        NETWORK: 100,
        BRIDGED_SAFE: "0x849D52316331967b6fF1198e5E32A0eB168D039d",
    },
    GNOSIS_LTD_GNO: {
        AVATAR: "0x10E4597fF93cbee194F4879f8f1d54a370DB6969",
        MODULE: "0x494ec5194123487E8A6ba0b6bc96D57e340025e7",
        MANAGER: "0x9d3660d8304B063964A45766bbeD41F4883eBbA8",
        REVOKER: "0xA8f3eEbA3bDFFC4C38B1ea44044BF23dA35027FB",
        HARVESTER: "0xf9e666f0a1eE44a7113D7e53EFE089f9BB3C2dBF",
        DISASSEMBLER: "0x19414ebe07C7Eb0D5463A1E6533f6cF05e26E21e",
        SWAPPER: "",
        NETWORK: 100,
        BRIDGED_SAFE: "0x4971DD016127F390a3EF6b956Ff944d0E2e1e462",
    },
    DAO_ETH: {
        AVATAR: "0x849D52316331967b6fF1198e5E32A0eB168D039d",
        MODULE: "",
        MANAGER: "",
        REVOKER: "",
        HARVESTER: "",
        DISASSEMBLER: "",
        SWAPPER: "",
        NETWORK: 1,
        BRIDGED_SAFE: "0x458cD345B4C05e8DF39d0A07220feb4Ec19F5e6f",
    },
    LTD_ETH: {
        AVATAR: "0x4971DD016127F390a3EF6b956Ff944d0E2e1e462",
        MODULE: "",
        MANAGER: "",
        REVOKER: "",
        HARVESTER: "",
        DISASSEMBLER: "",
        SWAPPER: "",
        NETWORK: 1,
        BRIDGED_SAFE: "0x10E4597fF93cbee194F4879f8f1d54a370DB6969",
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
    if (!(safe in GNOSIS_ADDRESSES)) {
        throw new Error(`safe param value '${safe}' not supported`)
    }
    const safeKey = safe as keyof typeof GNOSIS_ADDRESSES
    if (hre.network.config.chainId !== GNOSIS_ADDRESSES[safeKey].NETWORK) {
        throw new Error(`using wrong network!`)
    }
    const roles = await getContract(safe, hre)

    return { dryRun, safe, roles, config: GNOSIS_ADDRESSES[safeKey] }
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

task("setGnosisMultisend").setAction(async (taskArgs, hre) => {
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

task("assignGnosisManagementRole").setAction(async (taskArgs, hre) => {
    const { dryRun, roles, config } = await processArgs(taskArgs, hre)

    const tx = await roles.assignRoles(config.MANAGER, [1], [true])
    console.log(JSON.stringify({ to: tx.to, data: tx.data }, null, 2))
    if (dryRun) return

    console.log(`TX hash: ${tx.hash}`)
    console.log("Waiting for confirmation...")
    await tx.wait()
    console.log("Done.")
})

task("assignGnosisRevokeRole").setAction(async (taskArgs, hre) => {
    const { dryRun, roles, config } = await processArgs(taskArgs, hre)

    const txData = await addMembers(config.MODULE, 2, [config.REVOKER])
    console.log(JSON.stringify({ to: txData.to, data: txData.data }, null, 2))
    if (dryRun) return

    const tx = await roles.signer.sendTransaction(txData)
    console.log(`TX hash: ${tx.hash}`)
    console.log("Waiting for confirmation...")
    await tx.wait()
    console.log("Done.")
})

task("assignGnosisHarvestRole").setAction(async (taskArgs, hre) => {
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

task("assignGnosisDisassembleRole").setAction(async (taskArgs, hre) => {
    const { dryRun, roles, config } = await processArgs(taskArgs, hre)

    const txData = await addMembers(config.MODULE, 4, [config.DISASSEMBLER])
    console.log(JSON.stringify({ to: txData.to, data: txData.data }, null, 2))
    if (dryRun) return

    const tx = await roles.signer.sendTransaction(txData)
    console.log(`TX hash: ${tx.hash}`)
    console.log("Waiting for confirmation...")
    await tx.wait()
    console.log("Done.")
})

task("assignGnosisSwapRole").setAction(async (taskArgs, hre) => {
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
// GNOSIS LTD gnosis
//-----------------------------------------------------------------------------------------------------------------------------

task("encodeApplyPresetManageGnosisLTDgnosis").setAction(
    async (taskArgs, hre) => {
        const { config } = await processArgs(taskArgs, hre)
        const txBatches = await encodeApplyPresetTxBuilder(
            config.MODULE,
            1,
            gnosisDeFiManageGnosisLTDPreset,
            { AVATAR: config.AVATAR },
            {
                network: config.NETWORK as NetworkId,
            }
        )

        writeFileSync(
            path.join(__dirname, "..", "txDataManageGnosisLTDgnosis.json"),
            JSON.stringify(txBatches, undefined, 2)
        )
        console.log(
            `Transaction builder JSON written to packages/sdk/txDataManageGnosisLTDgnosis.json`
        )
    }
)

task("encodeApplyPresetRevokeGnosisLTDgnosis").setAction(
    async (taskArgs, hre) => {
        const { config } = await processArgs(taskArgs, hre)
        const txBatches = await encodeApplyPresetTxBuilder(
            config.MODULE,
            2,
            gnosisDeFiRevokeGnosisLTDPreset,
            { AVATAR: config.AVATAR },
            {
                network: config.NETWORK as NetworkId,
            }
        )

        writeFileSync(
            path.join(__dirname, "..", "txDataRevokeGnosisLTDgnosis.json"),
            JSON.stringify(txBatches, undefined, 2)
        )
        console.log(
            `Transaction builder JSON written to packages/sdk/txDataRevokeGnosisLTDgnosis.json`
        )
    }
)

task("encodeApplyPresetHarvestGnosisLTDgnosis").setAction(
    async (taskArgs, hre) => {
        const { config } = await processArgs(taskArgs, hre)
        const txBatches = await encodeApplyPresetTxBuilder(
            config.MODULE,
            3,
            gnosisDeFiHarvestGnosisLTDPreset,
            { AVATAR: config.AVATAR },
            {
                network: config.NETWORK as NetworkId,
            }
        )

        writeFileSync(
            path.join(__dirname, "..", "txDataHarvestGnosisLTDgnosis.json"),
            JSON.stringify(txBatches, undefined, 2)
        )
        console.log(
            `Transaction builder JSON written to packages/sdk/txDataHarvestGnosisLTDgnosis.json`
        )
    }
)

task("encodeApplyPresetDisassembleGnosisLTDgnosis").setAction(
    async (taskArgs, hre) => {
        const { config } = await processArgs(taskArgs, hre)
        const txBatches = await encodeApplyPresetTxBuilder(
            config.MODULE,
            4,
            gnosisDeFiDisassembleGnosisLTDPreset,
            { AVATAR: config.AVATAR },
            {
                network: config.NETWORK as NetworkId,
            }
        )

        writeFileSync(
            path.join(__dirname, "..", "txDataDisassembleGnosisLTDgnosis.json"),
            JSON.stringify(txBatches, undefined, 2)
        )
        console.log(
            `Transaction builder JSON written to packages/sdk/txDataDisassembleGnosisLTDgnosis.json`
        )
    }
)

task("encodeApplyPresetSwapGnosisLTDgnosis").setAction(
    async (taskArgs, hre) => {
        const { config } = await processArgs(taskArgs, hre)
        const txBatches = await encodeApplyPresetTxBuilder(
            config.MODULE,
            5,
            gnosisDeFiSwapGnosisLTDPreset,
            { AVATAR: config.AVATAR },
            {
                network: config.NETWORK as NetworkId,
            }
        )

        writeFileSync(
            path.join(__dirname, "..", "txDataSwapGnosisLTDgnosis.json"),
            JSON.stringify(txBatches, undefined, 2)
        )
        console.log(
            `Transaction builder JSON written to packages/sdk/txDataSwapGnosisLTDgnosis.json`
        )
    }
)
