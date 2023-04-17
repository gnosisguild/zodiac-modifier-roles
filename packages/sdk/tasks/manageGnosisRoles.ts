import "@nomiclabs/hardhat-ethers"

import { writeFileSync } from "fs"
import path from "path"

import { task as baseTask, types } from "hardhat/config"
import { HardhatRuntimeEnvironment } from "hardhat/types"

import { Roles } from "../../evm/typechain-types"
import addMembers from "../src/addMembers"
import { encodeApplyPresetTxBuilder } from "../src/applyPreset"

// GnosisDAO in Gnosis Chain
import mainnetDeFiManageGnosisDAOPreset from "../src/presets/mainnet/GnosisDAO/deFiManageGnosisDAO"
import mainnetDeFiRevokeGnosisDAOPreset from "../src/presets/mainnet/GnosisDAO/deFiRevokeGnosisDAO"
import mainnetDeFiHarvestGnosisDAOPreset from "../src/presets/mainnet/GnosisDAO/deFiHarvestGnosisDAO"
import mainnetDeFiDisassembleGnosisDAOPreset from "../src/presets/mainnet/GnosisDAO/deFiDisassembleGnosisDAO"
import mainnetDeFiSwapGnosisDAOPreset from "../src/presets/mainnet/GnosisDAO/deFiSwapGnosisDAO"

// GnosisLTD in Gnosis Chain
import mainnetDeFiManageGnosisLTDPreset from "../src/presets/mainnet/GnosisLTD/deFiManageGnosisLTD"
import mainnetDeFiRevokeGnosisLTDPreset from "../src/presets/mainnet/GnosisLTD/deFiRevokeGnosisLTD"
import mainnetDeFiHarvestGnosisLTDPreset from "../src/presets/mainnet/GnosisLTD/deFiHarvestGnosisLTD"
import mainnetDeFiDisassembleGnosisLTDPreset from "../src/presets/mainnet/GnosisLTD/deFiDisassembleGnosisLTD"
import mainnetDeFiSwapGnosisLTDPreset from "../src/presets/mainnet/GnosisLTD/deFiSwapGnosisLTD"

// GnosisDAO in Gnosis Chain
import gnosisDeFiManageGnosisDAOPreset from "../src/presets/gnosisChain/GnosisDAO/deFiManageGnosisDAO"
import gnosisDeFiRevokeGnosisDAOPreset from "../src/presets/gnosisChain/GnosisDAO/deFiRevokeGnosisDAO"
import gnosisDeFiHarvestGnosisDAOPreset from "../src/presets/gnosisChain/GnosisDAO/deFiHarvestGnosisDAO"
import gnosisDeFiDisassembleGnosisDAOPreset from "../src/presets/gnosisChain/GnosisDAO/deFiDisassembleGnosisDAO"
import gnosisDeFiSwapGnosisDAOPreset from "../src/presets/gnosisChain/GnosisDAO/deFiSwapGnosisDAO"

// GnosisLTD in Gnosis Chain
import gnosisDeFiManageGnosisLTDPreset from "../src/presets/gnosisChain/GnosisLTD/deFiManageGnosisLTD"
import gnosisDeFiRevokeGnosisLTDPreset from "../src/presets/gnosisChain/GnosisLTD/deFiRevokeGnosisLTD"
import gnosisDeFiHarvestGnosisLTDPreset from "../src/presets/gnosisChain/GnosisLTD/deFiHarvestGnosisLTD"
import gnosisDeFiDisassembleGnosisLTDPreset from "../src/presets/gnosisChain/GnosisLTD/deFiDisassembleGnosisLTD"
import gnosisDeFiSwapGnosisLTDPreset from "../src/presets/gnosisChain/GnosisLTD/deFiSwapGnosisLTD"

import { NetworkId } from "../src/types"
import { AVATAR } from "../src/presets/placeholders"

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
    GNOSIS_DAO_GNO: {
        AVATAR: "0x458cD345B4C05e8DF39d0A07220feb4Ec19F5e6f",
        MODULE: "0x10785356E66b93432e9E8D6F9e532Fa55e4fc058",
        MANAGER: "0xe4387D4e45F65240Daaf5e046d5AE592566a5076",
        REVOKER: "0x3E93B731364A31BdEFaA7B96F4ae48e5F058cD41",
        HARVESTER: "0x4f767b852782C2e2e17CF2150051F622b8892F77",
        DISASSEMBLER: "0x23bE4206Ae8bC9aC9cF6F7E99749C896ef75022f",
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
    GNOSIS_DAO_ETH: {
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
    GNOSIS_LTD_ETH: {
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
// GNOSIS DAO - Mainnet
//-----------------------------------------------------------------------------------------------------------------------------

task("encodeApplyPresetManageGnosisDAOmainnet").setAction(
    async (taskArgs, hre) => {
        const { config } = await processArgs(taskArgs, hre)
        const txBatches = await encodeApplyPresetTxBuilder(
            config.MODULE,
            1,
            mainnetDeFiManageGnosisDAOPreset,
            { AVATAR: config.AVATAR, BRIDGE_RECIPIENT_GNOSIS_CHAIN: config.BRIDGED_SAFE },
            {
                network: config.NETWORK as NetworkId,
            }
        )

        writeFileSync(
            path.join(__dirname, "..", "/presets_output/mainnet/GnosisDAO/txDataManageGnosisDAOmainnet.json"),
            JSON.stringify(txBatches, undefined, 2)
        )
        console.log(
            `Transaction builder JSON written to packages/sdk/presets_output/mainnet/GnosisDAO/txDataManageGnosisDAOmainnet.json`
        )
    }
)

task("encodeApplyPresetRevokeGnosisDAOmainnet").setAction(
    async (taskArgs, hre) => {
        const { config } = await processArgs(taskArgs, hre)
        const txBatches = await encodeApplyPresetTxBuilder(
            config.MODULE,
            2,
            mainnetDeFiRevokeGnosisDAOPreset,
            { AVATAR: config.AVATAR },
            {
                network: config.NETWORK as NetworkId,
            }
        )

        writeFileSync(
            path.join(__dirname, "..", "/presets_output/mainnet/GnosisDAO/txDataRevokeGnosisDAOmainnet.json"),
            JSON.stringify(txBatches, undefined, 2)
        )
        console.log(
            `Transaction builder JSON written to packages/sdk/presets_output/mainnet/GnosisDAO/txDataRevokeGnosisDAOmainnet.json`
        )
    }
)

task("encodeApplyPresetHarvestGnosisDAOmainnet").setAction(
    async (taskArgs, hre) => {
        const { config } = await processArgs(taskArgs, hre)
        const txBatches = await encodeApplyPresetTxBuilder(
            config.MODULE,
            3,
            mainnetDeFiHarvestGnosisDAOPreset,
            { AVATAR: config.AVATAR },
            {
                network: config.NETWORK as NetworkId,
            }
        )

        writeFileSync(
            path.join(__dirname, "..", "/presets_output/mainnet/GnosisDAO/txDataHarvestGnosisDAOmainnet.json"),
            JSON.stringify(txBatches, undefined, 2)
        )
        console.log(
            `Transaction builder JSON written to packages/sdk/presets_output/mainnet/GnosisDAO/txDataHarvestGnosisDAOmainnet.json`
        )
    }
)

task("encodeApplyPresetDisassembleGnosisDAOmainnet").setAction(
    async (taskArgs, hre) => {
        const { config } = await processArgs(taskArgs, hre)
        const txBatches = await encodeApplyPresetTxBuilder(
            config.MODULE,
            4,
            mainnetDeFiDisassembleGnosisDAOPreset,
            { AVATAR: config.AVATAR },
            {
                network: config.NETWORK as NetworkId,
            }
        )

        writeFileSync(
            path.join(__dirname, "..", "/presets_output/mainnet/GnosisDAO/txDataDisassembleGnosisDAOmainnet.json"),
            JSON.stringify(txBatches, undefined, 2)
        )
        console.log(
            `Transaction builder JSON written to packages/sdk/presets_output/mainnet/GnosisDAO/txDataDisassembleGnosisDAOmainnet.json`
        )
    }
)

task("encodeApplyPresetSwapGnosisDAOmainnet").setAction(
    async (taskArgs, hre) => {
        const { config } = await processArgs(taskArgs, hre)
        const txBatches = await encodeApplyPresetTxBuilder(
            config.MODULE,
            5,
            mainnetDeFiSwapGnosisDAOPreset,
            { AVATAR: config.AVATAR },
            {
                network: config.NETWORK as NetworkId,
            }
        )

        writeFileSync(
            path.join(__dirname, "..", "/presets_output/mainnet/GnosisDAO/txDataSwapGnosisDAOmainnet.json"),
            JSON.stringify(txBatches, undefined, 2)
        )
        console.log(
            `Transaction builder JSON written to packages/sdk/presets_output/mainnet/GnosisDAO/txDataSwapGnosisDAOmainnet.json`
        )
    }
)

//-----------------------------------------------------------------------------------------------------------------------------
// GNOSIS LTD - Mainnet
//-----------------------------------------------------------------------------------------------------------------------------

task("encodeApplyPresetManageGnosisLTDmainnet").setAction(
    async (taskArgs, hre) => {
        const { config } = await processArgs(taskArgs, hre)
        const txBatches = await encodeApplyPresetTxBuilder(
            config.MODULE,
            1,
            mainnetDeFiManageGnosisLTDPreset,
            { AVATAR: config.AVATAR, BRIDGE_RECIPIENT_GNOSIS_CHAIN: config.BRIDGED_SAFE },
            {
                network: config.NETWORK as NetworkId,
            }
        )

        writeFileSync(
            path.join(__dirname, "..", "/presets_output/mainnet/GnosisLTD/txDataManageGnosisLTDmainnet.json"),
            JSON.stringify(txBatches, undefined, 2)
        )
        console.log(
            `Transaction builder JSON written to packages/sdk/presets_output/mainnet/GnosisLTD/txDataManageGnosisLTDmainnet.json`
        )
    }
)

task("encodeApplyPresetRevokeGnosisLTDmainnet").setAction(
    async (taskArgs, hre) => {
        const { config } = await processArgs(taskArgs, hre)
        const txBatches = await encodeApplyPresetTxBuilder(
            config.MODULE,
            2,
            mainnetDeFiRevokeGnosisLTDPreset,
            { AVATAR: config.AVATAR },
            {
                network: config.NETWORK as NetworkId,
            }
        )

        writeFileSync(
            path.join(__dirname, "..", "/presets_output/mainnet/GnosisLTD/txDataRevokeGnosisLTDmainnet.json"),
            JSON.stringify(txBatches, undefined, 2)
        )
        console.log(
            `Transaction builder JSON written to packages/sdk/presets_output/mainnet/GnosisLTD/txDataRevokeGnosisLTDmainnet.json`
        )
    }
)

task("encodeApplyPresetHarvestGnosisLTDmainnet").setAction(
    async (taskArgs, hre) => {
        const { config } = await processArgs(taskArgs, hre)
        const txBatches = await encodeApplyPresetTxBuilder(
            config.MODULE,
            3,
            mainnetDeFiHarvestGnosisLTDPreset,
            { AVATAR: config.AVATAR },
            {
                network: config.NETWORK as NetworkId,
            }
        )

        writeFileSync(
            path.join(__dirname, "..", "/presets_output/mainnet/GnosisLTD/txDataHarvestGnosisLTDmainnet.json"),
            JSON.stringify(txBatches, undefined, 2)
        )
        console.log(
            `Transaction builder JSON written to packages/sdk/presets_output/mainnet/GnosisLTD/txDataHarvestGnosisLTDmainnet.json`
        )
    }
)

task("encodeApplyPresetDisassembleGnosisLTDmainnet").setAction(
    async (taskArgs, hre) => {
        const { config } = await processArgs(taskArgs, hre)
        const txBatches = await encodeApplyPresetTxBuilder(
            config.MODULE,
            4,
            mainnetDeFiDisassembleGnosisLTDPreset,
            { AVATAR: config.AVATAR },
            {
                network: config.NETWORK as NetworkId,
            }
        )

        writeFileSync(
            path.join(__dirname, "..", "/presets_output/mainnet/GnosisLTD/txDataDisassembleGnosisLTDmainnet.json"),
            JSON.stringify(txBatches, undefined, 2)
        )
        console.log(
            `Transaction builder JSON written to packages/sdk/presets_output/mainnet/GnosisLTD/txDataDisassembleGnosisLTDmainnet.json`
        )
    }
)

task("encodeApplyPresetSwapGnosisLTDmainnet").setAction(
    async (taskArgs, hre) => {
        const { config } = await processArgs(taskArgs, hre)
        const txBatches = await encodeApplyPresetTxBuilder(
            config.MODULE,
            5,
            mainnetDeFiSwapGnosisLTDPreset,
            { AVATAR: config.AVATAR },
            {
                network: config.NETWORK as NetworkId,
            }
        )

        writeFileSync(
            path.join(__dirname, "..", "/presets_output/mainnet/GnosisLTD/txDataSwapGnosisLTDmainnet.json"),
            JSON.stringify(txBatches, undefined, 2)
        )
        console.log(
            `Transaction builder JSON written to packages/sdk/presets_output/mainnet/GnosisLTD/txDataSwapGnosisLTDmainnet.json`
        )
    }
)

//-----------------------------------------------------------------------------------------------------------------------------
// GNOSIS DAO - Gnosis Chain
//-----------------------------------------------------------------------------------------------------------------------------

task("encodeApplyPresetManageGnosisDAOgnosis").setAction(
    async (taskArgs, hre) => {
        const { config } = await processArgs(taskArgs, hre)
        const txBatches = await encodeApplyPresetTxBuilder(
            config.MODULE,
            1,
            gnosisDeFiManageGnosisDAOPreset,
            { AVATAR: config.AVATAR, BRIDGE_RECIPIENT_MAINNET: config.BRIDGED_SAFE },
            {
                network: config.NETWORK as NetworkId,
            }
        )

        writeFileSync(
            path.join(__dirname, "..", "/presets_output/gnosis/GnosisDAO/txDataManageGnosisDAOgnosis.json"),
            JSON.stringify(txBatches, undefined, 2)
        )
        console.log(
            `Transaction builder JSON written to packages/sdk/presets_output/gnosis/GnosisDAO/txDataManageGnosisDAOgnosis.json`
        )
    }
)

task("encodeApplyPresetRevokeGnosisDAOgnosis").setAction(
    async (taskArgs, hre) => {
        const { config } = await processArgs(taskArgs, hre)
        const txBatches = await encodeApplyPresetTxBuilder(
            config.MODULE,
            2,
            gnosisDeFiRevokeGnosisDAOPreset,
            { AVATAR: config.AVATAR },
            {
                network: config.NETWORK as NetworkId,
            }
        )

        writeFileSync(
            path.join(__dirname, "..", "/presets_output/gnosis/GnosisDAO/txDataRevokeGnosisDAOgnosis.json"),
            JSON.stringify(txBatches, undefined, 2)
        )
        console.log(
            `Transaction builder JSON written to packages/sdk/presets_output/gnosis/GnosisDAO/txDataRevokeGnosisDAOgnosis.json`
        )
    }
)

task("encodeApplyPresetHarvestGnosisDAOgnosis").setAction(
    async (taskArgs, hre) => {
        const { config } = await processArgs(taskArgs, hre)
        const txBatches = await encodeApplyPresetTxBuilder(
            config.MODULE,
            3,
            gnosisDeFiHarvestGnosisDAOPreset,
            { AVATAR: config.AVATAR },
            {
                network: config.NETWORK as NetworkId,
            }
        )

        writeFileSync(
            path.join(__dirname, "..", "/presets_output/gnosis/GnosisDAO/txDataHarvestGnosisDAOgnosis.json"),
            JSON.stringify(txBatches, undefined, 2)
        )
        console.log(
            `Transaction builder JSON written to packages/sdk/presets_output/gnosis/GnosisDAO/txDataHarvestGnosisDAOgnosis.json`
        )
    }
)

task("encodeApplyPresetDisassembleGnosisDAOgnosis").setAction(
    async (taskArgs, hre) => {
        const { config } = await processArgs(taskArgs, hre)
        const txBatches = await encodeApplyPresetTxBuilder(
            config.MODULE,
            4,
            gnosisDeFiDisassembleGnosisDAOPreset,
            { AVATAR: config.AVATAR },
            {
                network: config.NETWORK as NetworkId,
            }
        )

        writeFileSync(
            path.join(__dirname, "..", "/presets_output/gnosis/GnosisDAO/txDataDisassembleGnosisDAOgnosis.json"),
            JSON.stringify(txBatches, undefined, 2)
        )
        console.log(
            `Transaction builder JSON written to packages/sdk/presets_output/gnosis/GnosisDAO/txDataDisassembleGnosisDAOgnosis.json`
        )
    }
)

task("encodeApplyPresetSwapGnosisDAOgnosis").setAction(
    async (taskArgs, hre) => {
        const { config } = await processArgs(taskArgs, hre)
        const txBatches = await encodeApplyPresetTxBuilder(
            config.MODULE,
            5,
            gnosisDeFiSwapGnosisDAOPreset,
            { AVATAR: config.AVATAR },
            {
                network: config.NETWORK as NetworkId,
            }
        )

        writeFileSync(
            path.join(__dirname, "..", "/presets_output/gnosis/GnosisDAO/txDataSwapGnosisDAOgnosis.json"),
            JSON.stringify(txBatches, undefined, 2)
        )
        console.log(
            `Transaction builder JSON written to packages/sdk/presets_output/gnosis/GnosisDAO/txDataSwapGnosisDAOgnosis.json`
        )
    }
)

//-----------------------------------------------------------------------------------------------------------------------------
// GNOSIS LTD - Gnosis Chain
//-----------------------------------------------------------------------------------------------------------------------------

task("encodeApplyPresetManageGnosisLTDgnosis").setAction(
    async (taskArgs, hre) => {
        const { config } = await processArgs(taskArgs, hre)
        const txBatches = await encodeApplyPresetTxBuilder(
            config.MODULE,
            1,
            gnosisDeFiManageGnosisLTDPreset,
            { AVATAR: config.AVATAR, BRIDGE_RECIPIENT_MAINNET: config.BRIDGED_SAFE },
            {
                network: config.NETWORK as NetworkId,
            }
        )

        writeFileSync(
            path.join(__dirname, "..", "/presets_output/gnosis/GnosisLTD/txDataManageGnosisLTDgnosis.json"),
            JSON.stringify(txBatches, undefined, 2)
        )
        console.log(
            `Transaction builder JSON written to packages/sdk/presets_output/gnosis/GnosisLTD/txDataManageGnosisLTDgnosis.json`
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
            path.join(__dirname, "..", "/presets_output/gnosis/GnosisLTD/txDataRevokeGnosisLTDgnosis.json"),
            JSON.stringify(txBatches, undefined, 2)
        )
        console.log(
            `Transaction builder JSON written to packages/sdk/presets_output/gnosis/GnosisLTD/txDataRevokeGnosisLTDgnosis.json`
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
            path.join(__dirname, "..", "/presets_output/gnosis/GnosisLTD/txDataHarvestGnosisLTDgnosis.json"),
            JSON.stringify(txBatches, undefined, 2)
        )
        console.log(
            `Transaction builder JSON written to packages/sdk/presets_output/gnosis/GnosisLTD/txDataHarvestGnosisLTDgnosis.json`
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
            path.join(__dirname, "..", "/presets_output/gnosis/GnosisLTD/txDataDisassembleGnosisLTDgnosis.json"),
            JSON.stringify(txBatches, undefined, 2)
        )
        console.log(
            `Transaction builder JSON written to packages/sdk/presets_output/gnosis/GnosisLTD/txDataDisassembleGnosisLTDgnosis.json`
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
            path.join(__dirname, "..", "/presets_output/gnosis/GnosisLTD/txDataSwapGnosisLTDgnosis.json"),
            JSON.stringify(txBatches, undefined, 2)
        )
        console.log(
            `Transaction builder JSON written to packages/sdk/presets_output/gnosis/GnosisLTD/txDataSwapGnosisLTDgnosis.json`
        )
    }
)
