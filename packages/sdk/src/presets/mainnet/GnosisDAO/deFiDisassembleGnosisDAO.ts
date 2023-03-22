import { allow, contracts } from "../../allow"
import { ZERO_ADDRESS } from "../../gnosisChain/addresses"
import { allowErc20Approve } from "../../helpers/erc20"
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

// Tokens
const wstETH = "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0"
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
const auraBAL = "0x616e8BfA43F920657B3497DBf40D6b1A02D4608d"
const rETH = "0xae78736Cd615f374D3085123A210448E74Fc6393"
const GNO = "0x6810e776880C02933D47DB1b9fc05908e5386b96"
const COW = "0xDEf1CA1fb7FBcDC777520aa7f396b4E015F497aB"
const LDO = "0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32"
const AURA = "0xC0c293ce456fF0ED870ADd98a0828Dd4d2903DBF"
const BAL = "0xba100000625a3754423978a60c9317c58a424e3D"

// Balancer contracts
const BALANCER_VAULT = "0xBA12222222228d8Ba445958a75a0704d566BF2C8"
const BAL_MINTER = "0x239e55f427d44c3cc793f49bfb507ebe76638a2b"
const FEE_DISTRIBUTOR = "0xD3cf852898b21fc233251427c2DC93d3d604F3BB"
const veBAL = "0xC128a9954e6c874eA3d62ce62B468bA073093F25"

// Balancer LP Tokens
const B_stETH_STABLE = "0x32296969Ef14EB0c6d29669C550D4a0449130230"
const B_auraBAL_STABLE = "0x3dd0843A028C86e0b760b1A76929d1C5Ef93a2dd"
const B_rETH_STABLE = "0x1E19CF2D73a72Ef1332C882F20534B6519Be0276"
const B_80GNO_20WETH = "0xF4C0DD9B82DA36C07605df83c8a416F11724d88b"
const B_50COW_50GNO = "0x92762B42A06dCDDDc5B7362Cfb01E631c4D44B40"
const B_50WSTETH_50LDO = "0x5f1f4E50ba51D723F12385a8a9606afc3A0555f5"
const B_50WETH_50AURA = "0xCfCA23cA9CA720B6E98E3Eb9B6aa0fFC4a5C08B9"
const B_50COW_50WETH = "0xde8C195Aa41C11a0c4787372deFBbDdAa31306D2"
const B_80BAL_20WETH = "0x5c6Ee304399DBdB9C8Ef030aB642B10820DB8F56"

// Balancer Gauges
const B_stETH_STABLE_GAUGE = "0xcD4722B7c24C29e0413BDCd9e51404B4539D14aE"
const B_auraBAL_STABLE_GAUGE = "0x0312AA8D0BA4a1969Fddb382235870bF55f7f242"
const B_rETH_STABLE_GAUGE = "0x79eF6103A513951a3b25743DB509E267685726B7"
const B_80GNO_20WETH_GAUGE = "0xCB664132622f29943f67FA56CCfD1e24CC8B4995"
const B_50COW_50GNO_GAUGE = "0xA6468eca7633246Dcb24E5599681767D27d1F978"
const B_50WSTETH_50LDO_GAUGE = "0x95201b61ef19c867da0d093df20021e1a559452c"
const B_50WETH_50AURA_GAUGE = "0x275dF57d2B23d53e20322b4bb71Bf1dCb21D0A00"
const B_50COW_50WETH_GAUGE = "0x158772F59Fe0d3b75805fC11139b46CBc89F70e5"


// Aura contracts
const BOOSTER_ADDRESS = "0xA57b8d98dAE62B26Ec3bcC4a365338157060B234"
const REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS =
  "0xB188b1CB84Fb0bA13cb9ee1292769F903A9feC59"

const auraB_stETH_STABLE_REWARDER = "0xe4683Fe8F53da14cA5DAc4251EaDFb3aa614d528"
const auraB_auraBAL_STABLE_REWARDER =
  "0xACAdA51C320947E7ed1a0D0F6b939b0FF465E4c2"
const auraB_rETH_STABLE_REWARDER = "0x001B78CEC62DcFdc660E06A91Eb1bC966541d758"
const auraB_80GNO_20WETH_REWARDER = "0xD3780729035c5b302f76ced0E7F74cF0Fb7c739a"
const aura50COW_50GNO_REWARDER = "0x6256518aE9a97C408a03AAF1A244989Ce6B937F6"
const aura50WSTETH_50LDO_REWARDER = "0x6c3f6C327DE4aE51a2DfAaF3431b3c508ec8D3EB"
const aura50WETH_50AURA_REWARDER = "0x712CC5BeD99aA06fC4D5FB50Aea3750fA5161D0f"
const aura50COW_50WETH_REWARDER = "0x228054e9c056F024FC724F515A2a8764Ae175ED6"

const auraBAL_STAKING_REWARDER = "0x00A7BA8Ae7bca0B10A32Ea1f8e2a1Da980c6CAd2"
const B_80BAL_20WETH_DEPOSITOR = "0xeAd792B55340Aa20181A80d6a16db6A0ECd1b827"
const BAL_DEPOSITOR = "0x68655AD9852a99C87C0934c7290BB62CFa5D4123"

const AURA_LOCKER = "0x3Fa73f1E5d8A792C80F426fc8F84FBF7Ce9bBCAC"
const SNAPSHOT_DELEGATE_REGISTRY = "0x469788fE6E9E9681C6ebF3bF78e7Fd26Fc015446"

const AURA_CLAIM_ZAP = "0x623B83755a39B12161A63748f3f595A530917Ab2"

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
      targetAddress: BALANCER_VAULT,
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

    {
      targetAddress: BALANCER_VAULT,
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
        [9]: staticEqual(B_80BAL_20WETH, "address"),
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
      targetAddress: BALANCER_VAULT,
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
      targetAddress: BALANCER_VAULT,
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
      targetAddress: BALANCER_VAULT,
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
      targetAddress: BALANCER_VAULT,
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
      targetAddress: BALANCER_VAULT,
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
      targetAddress: BALANCER_VAULT,
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
      targetAddress: BALANCER_VAULT,
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
  ],
  placeholders: { AVATAR },
} satisfies RolePreset

export default preset
