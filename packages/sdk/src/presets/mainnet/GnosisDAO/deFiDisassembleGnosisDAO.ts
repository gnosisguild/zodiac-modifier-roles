import { allow } from "../../allow"
import {
  ZERO_ADDRESS, AURA, auraBAL, BAL, COW, WETH, GNO, LDO, USDC, wstETH,
  balancer,
  compound_v2,
  compound_v3
} from "../addresses"
import {
  staticEqual,
  staticOneOf,
} from "../../helpers/utils"
import { AVATAR } from "../../placeholders"
import { RolePreset } from "../../types"


const preset = {
  network: 1,
  allow: [

    //---------------------------------------------------------------------------------------------------------------------------------
    // AURA
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura wstETH/WETH pool
    //---------------------------------------------------------------------------------------------------------------------------------

    // {
    //   targetAddress: auraB_stETH_STABLE_REWARDER,
    //   signature: "withdrawAndUnwrap(uint256,bool)",
    // },
    allow.mainnet.aura.auraB_stETH_stable_rewarder["withdrawAndUnwrap"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura B-80BAL-20WETH/auraBAL
    //---------------------------------------------------------------------------------------------------------------------------------

    // {
    //   targetAddress: auraB_auraBAL_STABLE_REWARDER,
    //   signature: "withdrawAndUnwrap(uint256,bool)",
    // },
    allow.mainnet.aura.auraB_auraBAL_stable_rewarder["withdrawAndUnwrap"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura rETH/WETH
    //---------------------------------------------------------------------------------------------------------------------------------

    // {
    //   targetAddress: auraB_rETH_STABLE_REWARDER,
    //   signature: "withdrawAndUnwrap(uint256,bool)",
    // },
    allow.mainnet.aura.auraB_rETH_stable_rewarder["withdrawAllAndUnwrap"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura GNO/WETH
    //---------------------------------------------------------------------------------------------------------------------------------

    // {
    //   targetAddress: auraB_80GNO_20WETH_REWARDER,
    //   signature: "withdrawAndUnwrap(uint256,bool)",
    // },
    allow.mainnet.aura.auraB_80GNO_20WETH_rewarder["withdrawAndUnwrap"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura GNO/COW
    //---------------------------------------------------------------------------------------------------------------------------------

    // {
    //   targetAddress: aura50COW_50GNO_REWARDER,
    //   signature: "withdrawAndUnwrap(uint256,bool)",
    // },
    allow.mainnet.aura.aura50COW_50GNO_rewarder["withdrawAndUnwrap"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura LDO/wstETH
    //---------------------------------------------------------------------------------------------------------------------------------

    // {
    //   targetAddress: aura50WSTETH_50LDO_REWARDER,
    //   signature: "withdrawAndUnwrap(uint256,bool)",
    // },
    allow.mainnet.aura.aura50WSTETH_50LDO_rewarder["withdrawAndUnwrap"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura WETH/AURA
    //---------------------------------------------------------------------------------------------------------------------------------

    // {
    //   targetAddress: aura50WETH_50AURA_REWARDER,
    //   signature: "withdrawAndUnwrap(uint256,bool)",
    // },
    allow.mainnet.aura.aura50WETH_50AURA_rewarder["withdrawAndUnwrap"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura WETH/COW
    //---------------------------------------------------------------------------------------------------------------------------------

    // {
    //   targetAddress: aura50COW_50WETH_REWARDER,
    //   signature: "withdrawAndUnwrap(uint256,bool)",
    // },
    allow.mainnet.aura.aura50COW_50WETH_rewarder["withdrawAndUnwrap"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Staking auraBAL
    //---------------------------------------------------------------------------------------------------------------------------------

    // {
    //   targetAddress: auraBAL_STAKING_REWARDER,
    //   signature: "withdraw(uint256,bool)",
    // },
    allow.mainnet.aura.auraBAL_staking_rewarder["withdraw"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Locking AURA
    //---------------------------------------------------------------------------------------------------------------------------------

    // Process Expired AURA Locks - True -> Relock Expired Locks / False -> Withdraw Expired Locks
    // {
    //   targetAddress: AURA_LOCKER,
    //   signature: "processExpiredLocks(bool)",
    // },
    allow.mainnet.aura.aura_locker["processExpiredLocks"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // BALANCER
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer wstETH/WETH pool
    //---------------------------------------------------------------------------------------------------------------------------------

    // Remove Liquidity
    {
      targetAddress: balancer.VAULT,
      signature:
        "exitPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080",
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
        [9]: staticEqual(wstETH, "address"),
        [10]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
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

    // Unstake
    allow.mainnet.balancer.B_stETH_stable_gauge["withdraw(uint256)"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer B-80BAL-20WETH/auraBAL pool
    //---------------------------------------------------------------------------------------------------------------------------------

    // Remove Liquidity
    {
      targetAddress: balancer.VAULT,
      signature:
        "exitPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0x3dd0843a028c86e0b760b1a76929d1c5ef93a2dd000200000000000000000249",
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
        [9]: staticEqual(balancer.B_80BAL_20WETH, "address"),
        [10]: staticEqual(auraBAL, "address"),
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

    // Unstake
    allow.mainnet.balancer.B_auraBAL_stable_gauge["withdraw(uint256)"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer rETH/WETH pool
    //---------------------------------------------------------------------------------------------------------------------------------

    // Remove Liquidity
    {
      targetAddress: balancer.VAULT,
      signature:
        "exitPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0x1e19cf2d73a72ef1332c882f20534b6519be0276000200000000000000000112",
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
        [9]: staticEqual(wstETH, "address"),
        [10]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
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

    // Unstake
    allow.mainnet.balancer.B_rETH_stable_gauge["withdraw(uint256)"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer GNO/WETH pool
    //---------------------------------------------------------------------------------------------------------------------------------

    // Remove Liquidity
    {
      targetAddress: balancer.VAULT,
      signature:
        "exitPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0xf4c0dd9b82da36c07605df83c8a416f11724d88b000200000000000000000026",
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
        [9]: staticEqual(GNO, "address"),
        [10]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
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

    // Unstake
    allow.mainnet.balancer.B_80GNO_20WETH_gauge["withdraw(uint256)"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer GNO/COW pool
    //---------------------------------------------------------------------------------------------------------------------------------

    // Remove Liquidity
    {
      targetAddress: balancer.VAULT,
      signature:
        "exitPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0x92762b42a06dcdddc5b7362cfb01e631c4d44b40000200000000000000000182",
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
        [9]: staticEqual(GNO, "address"),
        [10]: staticEqual(COW, "address"),
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

    // Unstake
    allow.mainnet.balancer.B_50COW_50GNO_gauge["withdraw(uint256)"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer LDO/wstETH pool
    //---------------------------------------------------------------------------------------------------------------------------------

    // Remove Liquidity
    {
      targetAddress: balancer.VAULT,
      signature:
        "exitPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0x5f1f4e50ba51d723f12385a8a9606afc3a0555f5000200000000000000000465",
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
        [9]: staticEqual(LDO, "address"),
        [10]: staticEqual(wstETH, "address"),
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

    // Unstake
    allow.mainnet.balancer.B_50WSTETH_50LDO_gauge["withdraw(uint256)"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer WETH/AURA pool
    //---------------------------------------------------------------------------------------------------------------------------------

    // Remove Liquidity
    {
      targetAddress: balancer.VAULT,
      signature:
        "exitPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0xcfca23ca9ca720b6e98e3eb9b6aa0ffc4a5c08b9000200000000000000000274",
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
        [9]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
        [10]: staticEqual(AURA, "address"),
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

    // Unstake
    allow.mainnet.balancer.B_50WETH_50AURA_gauge["withdraw(uint256)"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer WETH/COW pool
    //---------------------------------------------------------------------------------------------------------------------------------

    // Remove Liquidity
    {
      targetAddress: balancer.VAULT,
      signature:
        "exitPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0xde8c195aa41c11a0c4787372defbbddaa31306d2000200000000000000000181",
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
        [9]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
        [10]: staticEqual(COW, "address"),
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

    // Unstake
    allow.mainnet.balancer.B_50COW_50WETH_gauge["withdraw(uint256)"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer BAL/WETH pool
    //---------------------------------------------------------------------------------------------------------------------------------

    // Remove Liquidity
    {
      targetAddress: balancer.VAULT,
      signature:
        "exitPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014",
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
        [9]: staticEqual(BAL, "address"),
        [10]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
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

    // Unlock
    allow.mainnet.balancer.veBAL["withdraw"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // CONVEX
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Convex - ETH/stETH
    //---------------------------------------------------------------------------------------------------------------------------------

    // Withdraw
    allow.mainnet.convex.booster["withdraw"](
      25 // poolId (If you don't specify a poolId you can withdraw funds in any pool)
    ),

    // Unstake
    allow.mainnet.convex.cvxsteCRV_rewarder["withdraw"](),

    // Unstake and Withdraw
    allow.mainnet.convex.cvxsteCRV_rewarder["withdrawAndUnwrap"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Convex - cDAI/cUSDC
    //---------------------------------------------------------------------------------------------------------------------------------

    // Withdraw
    allow.mainnet.convex.booster["withdraw"](
      {
        oneOf: [0]
      } // poolId (If you don't specify a poolId you can withdraw funds in any pool)
    ),

    // Unstake
    allow.mainnet.convex.cvxcDAIcUSDC_rewarder["withdraw"](),

    // Unstake and Withdraw
    allow.mainnet.convex.cvxcDAIcUSDC_rewarder["withdrawAndUnwrap"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Convex - Convert CRV to cvxCRV and Stake cvxCRV
    //---------------------------------------------------------------------------------------------------------------------------------

    // Unstake cvxCRV
    allow.mainnet.convex.stkCvxCrv["withdraw"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Convex - Stake CVX
    //---------------------------------------------------------------------------------------------------------------------------------

    // Unstake CVX
    allow.mainnet.convex.cvxRewardPool["withdraw"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Convex - Lock CVX
    //---------------------------------------------------------------------------------------------------------------------------------

    // Process Expired Locks (Withdraw = False or Relock = True)
    allow.mainnet.convex.vlCVX["processExpiredLocks"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // CURVE
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Curve - ETH/stETH
    //---------------------------------------------------------------------------------------------------------------------------------

    // Remove Liquidity
    allow.mainnet.curve.steth_eth_pool["remove_liquidity"](),

    // Removing Liquidity of One Coin
    allow.mainnet.curve.steth_eth_pool["remove_liquidity_one_coin"](),

    // Removing Liquidity Imbalance
    allow.mainnet.curve.steth_eth_pool["remove_liquidity_imbalance"](),

    // Unstake
    allow.mainnet.curve.steth_eth_gauge["withdraw"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Curve - cDAI/cUSDC
    //---------------------------------------------------------------------------------------------------------------------------------

    // Remove Liquidity
    allow.mainnet.curve.cDAIcUSDC_pool["remove_liquidity"](),

    // Remove Liquidity (Underlying, using ZAP)
    allow.mainnet.curve.cDAIcUSDC_zap["remove_liquidity"](),

    // Removing Liquidity Imbalance
    allow.mainnet.curve.cDAIcUSDC_pool["remove_liquidity_imbalance"](),

    // Removing Liquidity Imbalance (Underlying, using ZAP)
    allow.mainnet.curve.cDAIcUSDC_zap["remove_liquidity_imbalance"](),

    // Removing Liquidity of One Coin (Underlying, using ZAP)
    allow.mainnet.curve.cDAIcUSDC_zap["remove_liquidity_one_coin(uint256,int128,uint256)"](),

    // Unstake
    allow.mainnet.curve.cDAIcUSDC_gauge["withdraw"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Compound V2
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Compound V2 - USDC
    //---------------------------------------------------------------------------------------------------------------------------------

    // Withdrawing: sender redeems uint256 cTokens, it is called when MAX is withdrawn
    allow.mainnet.compound_v2.cUSDC["redeem"](),

    // Withdrawing: sender redeems cTokens in exchange for a specified amount of underlying asset (uint256), it is called when MAX isn't withdrawn
    allow.mainnet.compound_v2.cUSDC["redeemUnderlying"](),

    // Stop using as Collateral
    allow.mainnet.compound_v2.comptroller["exitMarket"](
      compound_v2.cUSDC
    ),

    // Repay specified borrowed amount of underlying asset (uint256)
    allow.mainnet.compound_v2.cUSDC["repayBorrow"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Compound V2 - DAI
    //---------------------------------------------------------------------------------------------------------------------------------

    // Withdrawing: sender redeems uint256 cTokens, it is called when MAX is withdrawn
    allow.mainnet.compound_v2.cDAI["redeem"](),

    // Withdrawing: sender redeems cTokens in exchange for a specified amount of underlying asset (uint256), it is called when MAX isn't withdrawn
    allow.mainnet.compound_v2.cDAI["redeemUnderlying"](),

    // Stop using as Collateral
    allow.mainnet.compound_v2.comptroller["exitMarket"](
      compound_v2.cDAI
    ),

    // Repay specified borrowed amount of underlying asset (uint256)
    allow.mainnet.compound_v2.cDAI["repayBorrow"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Compound V3
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Compound V3 - USDC
    //---------------------------------------------------------------------------------------------------------------------------------

    // Withdraw/Borrow
    allow.mainnet.compound_v3.cUSDCv3["withdraw"](
      USDC
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Compound V3 - ETH
    //---------------------------------------------------------------------------------------------------------------------------------

    // Withdraw
    {
      targetAddress: compound_v3.MainnetBulker,
      signature:
        "invoke(bytes32[],bytes[])",
      params: {
        [0]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000040",
          "bytes32"
        ), // Offset of bytes32[] from beginning 64=32*2
        [1]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of bytes[] from beginning 128=32*4
        [2]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000001",
          "bytes32"
        ), // Length of bytes32[] = 1
        [3]: staticEqual(
          "0x414354494f4e5f57495448445241575f4e41544956455f544f4b454e00000000",
          "bytes32"
        ), // ACTION_WITHDRAW_NATIVE_TOKEN Encoded
        [4]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000001",
          "bytes32"
        ), // Length of bytes[] = 1
        [5]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000020",
          "bytes32"
        ), // Offset of the first element of the bytes[] from beginning of bytes[] 32=32*1
        [6]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000060",
          "bytes32"
        ), // Length of the first element of the bytes[] 96=32*3
        [7]: staticEqual(compound_v3.cUSDCv3, "address"),
        [8]: staticEqual(AVATAR)
      },
    },
  ],
  placeholders: { AVATAR },
} satisfies RolePreset

export default preset
