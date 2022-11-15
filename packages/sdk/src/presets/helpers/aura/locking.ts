import { PresetAllowEntry } from "../../../types"
import { allowErc20Approve } from "../erc20"
import { AVATAR_ADDRESS_PLACEHOLDER } from "../../placeholders"
import { staticEqual } from "../../helpers/utils"

//Tokens
const BAL_ADDRESS = "0xba100000625a3754423978a60c9317c58a424e3D"
const B_80BAL_20WETH_ADDRESS = "0x5c6Ee304399DBdB9C8Ef030aB642B10820DB8F56"
const AURA_ADDRESS = "0xC0c293ce456fF0ED870ADd98a0828Dd4d2903DBF"
const VLAURA_ADDRESS = "0x3Fa73f1E5d8A792C80F426fc8F84FBF7Ce9bBCAC"

//Contracts
const AURABALBT_DEPOSITOR_WRAPPER_ADDRESS = "0x68655AD9852a99C87C0934c7290BB62CFa5D4123"
const AURABALBT_DEPOSITOR_ADDRESS = "0xeAd792B55340Aa20181A80d6a16db6A0ECd1b827"
const AURA_CLAIM_ZAP_ADDRESS = "0x623B83755a39B12161A63748f3f595A530917Ab2"
const AURABAL_BASE_REWARD_POOL_ADDRESS = "0x5e5ea2048475854a5702F5B8468A51Ba1296EFcC"
const SNAPSHOT_DELEGATION_ADDRESS = "0x469788fE6E9E9681C6ebF3bF78e7Fd26Fc015446"


export const allowAuraLocking = (): PresetAllowEntry[] => {
    return [
        ...allowErc20Approve([BAL_ADDRESS], [AURABALBT_DEPOSITOR_WRAPPER_ADDRESS]),
        ...allowErc20Approve([B_80BAL_20WETH_ADDRESS], [AURABALBT_DEPOSITOR_ADDRESS]),
        ...allowErc20Approve([BAL_ADDRESS, AURA_ADDRESS], [AURA_CLAIM_ZAP_ADDRESS]),
        ...allowErc20Approve([AURA_ADDRESS], [VLAURA_ADDRESS]),
        { targetAddress: AURABAL_BASE_REWARD_POOL_ADDRESS, signature: "stake(uint256)" },
        { targetAddress: AURABAL_BASE_REWARD_POOL_ADDRESS, signature: "withdraw(uint256,bool)" },
        { targetAddress: AURABALBT_DEPOSITOR_WRAPPER_ADDRESS, signature: "deposit(uint256,uint256,bool,address)" },
        { targetAddress: AURABALBT_DEPOSITOR_ADDRESS, signature: "deposit(uint256,uint256,bool,address)" },
        { targetAddress: VLAURA_ADDRESS, signature: "getReward(address)", params: { [0]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER) }, },
        { targetAddress: AURABAL_BASE_REWARD_POOL_ADDRESS, signature: "getReward()" },
        { targetAddress: VLAURA_ADDRESS, signature: "lock(address,uint256)", params: { [0]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER) }, },
        { targetAddress: VLAURA_ADDRESS, signature: "delegate(address)" },
        { targetAddress: VLAURA_ADDRESS, signature: "processExpiredLocks(bool)" },
        { targetAddress: SNAPSHOT_DELEGATION_ADDRESS, signature: "setDelegate(bytes32,address)" }
        //The next method needs some constraints on its arguments
        //{ targetAddress: AURA_CLAIM_ZAP_ADDRESS, signature: "claimRewards(address[],address[],address[],address[],uint256,uint256,uint256,uint256)" }
    ]

}