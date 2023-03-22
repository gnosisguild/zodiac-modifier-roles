import { ZERO_ADDRESS } from "../addresses"
import { allowErc20Revoke } from "../../helpers/erc20"
import {
    dynamic32Equal,
    dynamic32OneOf,
    staticEqual,
    dynamicOneOf,
    subsetOf,
    dynamicEqual,
    staticOneOf,
} from "../../helpers/utils"
import { AVATAR } from "../../placeholders"
import { RolePreset } from "../../types"
import { allow } from "../../allow"

// Tokens
const USDC = "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83"
const WXDAI = "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d"
const USDT = "0x4ECaBa5870353805a9F068101A40E0f32ed605C6"
const nextUSDC = "0x44CF74238d840a5fEBB0eAa089D05b763B73faB8"
const USDP = "0xFe7ed09C4956f7cdb54eC4ffCB9818Db2D7025b8"
const x3CRV = "0x1337BedC9D22ecbe766dF105c9623922A27963EC"
const EURe = "0xcB444e90D8198415266c6a2724b7900fb12FC56E"
const WETH = "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1"
const GNO = "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb"
const COW = "0x177127622c4A00F3d409B75571e12cB3c8973d3c"
const NODE = "0xc60e38C6352875c051B481Cbe79Dd0383AdB7817"
const CRV = "0x712b3d230F3C1c19db860d80619288b1F0BDd0Bd"
const SUSHI = "0x2995D1317DcD4f0aB89f4AE60F3f020A4F17C7CE"
const MKR = "0x5fd896D248fbfa54d26855C267859eb1b4DAEe72"
const AAVE = "0xDF613aF6B44a31299E48131e9347F034347E2F00"
const BAL = "0x7eF541E2a22058048904fE5744f9c7E4C57AF717"


const preset = {
    network: 100,
    allow: [
        ...allowErc20Revoke([
            USDC,
            WXDAI,
            USDT,
            nextUSDC,
            USDP,
            x3CRV,
            EURe,
            WETH,
            GNO,
            COW,
            NODE,
            CRV,
            SUSHI,
            MKR,
            AAVE,
            BAL,
        ])
    ],
    placeholders: { AVATAR },
} satisfies RolePreset

export default preset
