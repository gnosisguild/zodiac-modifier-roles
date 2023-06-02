import {
    GNO,
    WETH,
    balancer,
} from "./addresses"
import { allowErc20Approve } from "./../helpers/erc20"
import {
    staticEqual,
    staticOneOf,
} from "./../helpers/utils"
import { AVATAR } from "./../placeholders"
import { RolePreset } from "./../types"
import { allow } from "./../allow"


const preset = {
    network: 100,
    allow: [

        //---------------------------------------------------------------------------------------------------------------------------------
        // Balancer Boosted Agave GNO/WETH
        //---------------------------------------------------------------------------------------------------------------------------------
        ...allowErc20Approve([WETH, GNO], [balancer.VAULT]),
        ...allowErc20Approve([balancer.bb_ag_WETH, balancer.bb_ag_GNO], [balancer.VAULT]),
        ...allowErc20Approve([balancer.B_50bbagGNO_50bbagWETH], [balancer.B_50bbagGNO_50bbagWETH_GAUGE]),

        // joinPool: 0x1c6455b9e8e7cfb9a5fb81a765683be78649af98081c1c2ddec9c80ea18866ef

        // Add Liquidity
        {
            targetAddress: balancer.VAULT,
            signature:
                "joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
            params: {
                [0]: staticEqual(
                    "0xf48f01dcb2cbb3ee1f6aab0e742c2d3941039d56000200000000000000000012",
                    "bytes32"
                ), // Balancer PoolId
                [1]: staticEqual(AVATAR),
                [2]: staticEqual(AVATAR),
                [3]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000080",
                    "bytes32"), // Offset of tuple from beginning 128=32*4
                [4]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000080",
                    "bytes32"), // Offset of address[] from beginning of tuple 128=32*4
                [5]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"), // Offset of uint256[] from beginning of tuple 224=32*7
                [6]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000140",
                    "bytes32"), // Offset of bytes from beginning of tuple 320=32*10
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "bytes32"
                ), // Length of address[] = 2
                [9]: staticEqual(balancer.bb_ag_WETH, "address"),
                [10]: staticEqual(balancer.bb_ag_GNO, "address"),
                [11]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "bytes32"
                ), // Length of unit256[] = 2
                [14]: staticOneOf([
                    "0x00000000000000000000000000000000000000000000000000000000000000a0",
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040"
                ],
                    "bytes32"
                ), // Length of bytes
                [15]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "0x0000000000000000000000000000000000000000000000000000000000000003"
                ],
                    "bytes32"
                ), // Join Kind
            },
        },

        // Remove Liquidity
        {
            targetAddress: balancer.VAULT,
            signature:
                "exitPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
            params: {
                [0]: staticEqual(
                    "0xf48f01dcb2cbb3ee1f6aab0e742c2d3941039d56000200000000000000000012",
                    "bytes32"
                ), // Balancer PoolId
                [1]: staticEqual(AVATAR),
                [2]: staticEqual(AVATAR),
                [3]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000080",
                    "bytes32"), // Offset of tuple from beginning 128=32*4
                [4]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000080",
                    "bytes32"), // Offset of address[] from beginning of tuple 128=32*4
                [5]: staticEqual(
                    "0x00000000000000000000000000000000000000000000000000000000000000e0",
                    "bytes32"), // Offset of uint256[] from beginning of tuple 224=32*7
                [6]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000140",
                    "bytes32"), // Offset of bytes from beginning of tuple 320=32*10
                [8]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "bytes32"
                ), // Length of address[] = 2
                [9]: staticEqual(balancer.bb_ag_WETH, "address"),
                [10]: staticEqual(balancer.bb_ag_GNO, "address"),
                [11]: staticEqual(
                    "0x0000000000000000000000000000000000000000000000000000000000000002",
                    "bytes32"
                ), // Length of unit256[] = 2
                [14]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000060",
                    "0x0000000000000000000000000000000000000000000000000000000000000040",
                    "0x00000000000000000000000000000000000000000000000000000000000000c0",
                ],
                    "bytes32"
                ), // Length of bytes
                [15]: staticOneOf([
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "0x0000000000000000000000000000000000000000000000000000000000000002"
                ],
                    "bytes32"
                ), // Join Kind
            },
        },

        // Stake
        allow.gnosis.balancer.B_50bbagGNO_50bbagWETH_gauge["deposit(uint256)"](),

        // Unstake
        allow.gnosis.balancer.B_50bbagGNO_50bbagWETH_gauge["withdraw(uint256)"](),

        // Claim Rewards
        allow.gnosis.balancer.B_50bbagGNO_50bbagWETH_gauge["claim_rewards()"](),

        // Claim BAL Rewards
        allow.gnosis.balancer.child_chain_gauge_reward_helper["claimRewardsFromGauge"](
            balancer.B_50bbagGNO_50bbagWETH_GAUGE,
            AVATAR
        ),
    ],
    placeholders: { AVATAR },
} satisfies RolePreset

export default preset
