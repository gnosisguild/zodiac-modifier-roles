import { allow, contracts } from "../allow"
import { ZERO_ADDRESS } from "../gnosisChain/addresses"
import { allowErc20Approve } from "../helpers/erc20"
import {
  dynamic32Equal,
  dynamic32OneOf,
  staticEqual,
  dynamicOneOf,
  subsetOf,
  dynamicEqual,
  staticOneOf,
} from "../helpers/utils"
import { AVATAR } from "../placeholders"
import { RolePreset } from "../types"

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
    ...allowErc20Approve([B_stETH_STABLE], [BOOSTER_ADDRESS]),
    ...allowErc20Approve([wstETH, WETH], [REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS]),

    // {
    //   targetAddress: BOOSTER_ADDRESS,
    //   signature: "deposit(uint256,uint256,bool)",
    //   params: {
    //     [0]: staticEqual(29, "uint256"), // Aura poolId
    //   },
    // },
    allow.mainnet.aura.booster["deposit"](
      29), // Aura poolId

    {
      targetAddress: REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS,
      signature:
        "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(auraB_stETH_STABLE_REWARDER, "address"),
        [1]: staticOneOf([wstETH, WETH], "address"),
        [3]: staticEqual(
          "0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080",
          "bytes32"
        ), // Balancer PoolId
        [10]: staticEqual(wstETH, "address"),
        [11]: staticEqual(WETH, "address"),
      },
    },

    // {
    //   targetAddress: auraB_stETH_STABLE_REWARDER,
    //   signature: "withdrawAndUnwrap(uint256,bool)",
    // },
    allow.mainnet.aura.auraB_stETH_stable_rewarder["withdrawAndUnwrap"](),

    // {
    //   targetAddress: auraB_stETH_STABLE_REWARDER,
    //   signature: "getReward()",
    // },
    allow.mainnet.aura.auraB_stETH_stable_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura B-80BAL-20WETH/auraBAL
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([B_auraBAL_STABLE], [BOOSTER_ADDRESS]),
    ...allowErc20Approve(
      [B_80BAL_20WETH, auraBAL],
      [REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS]
    ),

    // {
    //   targetAddress: BOOSTER_ADDRESS,
    //   signature: "deposit(uint256,uint256,bool)",
    //   params: {
    //     [0]: staticEqual(1, "uint256"), // Aura poolId
    //   },
    // },
    allow.mainnet.aura.booster["deposit"](
      1), // Aura poolId

    {
      targetAddress: REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS,
      signature:
        "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(auraB_auraBAL_STABLE_REWARDER, "address"),
        [1]: staticOneOf([B_80BAL_20WETH, auraBAL], "address"),
        [3]: staticEqual(
          "0x3dd0843a028c86e0b760b1a76929d1c5ef93a2dd000200000000000000000249",
          "bytes32"
        ), // Balancer PoolId
        [4]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000a0",
          "bytes32"
        ), // Offset of tuple from beggining 160=32*5
        [5]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [6]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 2224=32*7
        [7]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [9]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [10]: staticEqual(B_80BAL_20WETH, "address"),
        [11]: staticEqual(auraBAL, "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [15]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Length of bytes 192=32*6
      },
    },

    // {
    //   targetAddress: auraB_auraBAL_STABLE_REWARDER,
    //   signature: "withdrawAndUnwrap(uint256,bool)",
    // },
    allow.mainnet.aura.auraB_auraBAL_stable_rewarder["withdrawAndUnwrap"](),

    // {
    //   targetAddress: auraB_auraBAL_STABLE_REWARDER,
    //   signature: "getReward()",
    // },
    allow.mainnet.aura.auraB_auraBAL_stable_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura rETH/WETH
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([B_rETH_STABLE], [BOOSTER_ADDRESS]),
    ...allowErc20Approve([rETH, WETH], [REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS]),

    // {
    //   targetAddress: BOOSTER_ADDRESS,
    //   signature: "deposit(uint256,uint256,bool)",
    //   params: {
    //     [0]: staticEqual(15, "uint256"), // Aura poolId
    //   },
    // },
    allow.mainnet.aura.booster["deposit"](
      15), // Aura poolId

    {
      targetAddress: REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS,
      signature:
        "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(auraB_rETH_STABLE_REWARDER, "address"),
        [1]: staticOneOf([rETH, WETH], "address"),
        [3]: staticEqual(
          "0x1e19cf2d73a72ef1332c882f20534b6519be0276000200000000000000000112",
          "bytes32"
        ), // Balancer PoolId
        [4]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000a0",
          "bytes32"
        ), // Offset of tuple from beggining 160=32*5
        [5]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [6]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 224=32*7
        [7]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [9]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [10]: staticEqual(rETH, "address"),
        [11]: staticEqual(WETH, "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [15]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Length of bytes 192=32*6
      },
    },

    // {
    //   targetAddress: auraB_rETH_STABLE_REWARDER,
    //   signature: "withdrawAndUnwrap(uint256,bool)",
    // },
    allow.mainnet.aura.auraB_rETH_stable_rewarder["withdrawAllAndUnwrap"](),

    // {
    //   targetAddress: auraB_rETH_STABLE_REWARDER,
    //   signature: "getReward()",
    // },
    allow.mainnet.aura.auraB_rETH_stable_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura GNO/WETH
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([B_80GNO_20WETH], [BOOSTER_ADDRESS]),
    ...allowErc20Approve([GNO, WETH], [REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS]),

    // {
    //   targetAddress: BOOSTER_ADDRESS,
    //   signature: "deposit(uint256,uint256,bool)",
    //   params: {
    //     [0]: staticEqual(33, "uint256"), // Aura poolId
    //   },
    // },
    allow.mainnet.aura.booster["deposit"](
      33), // Aura poolId

    {
      targetAddress: REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS,
      signature:
        "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(auraB_80GNO_20WETH_REWARDER, "address"),
        [1]: staticOneOf([GNO, WETH], "address"),
        [3]: staticEqual(
          "0xf4c0dd9b82da36c07605df83c8a416f11724d88b000200000000000000000026",
          "bytes32"
        ), // Balancer PoolId
        [4]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000a0",
          "bytes32"
        ), // Offset of tuple from beggining 160=32*5
        [5]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [6]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 224=32*7
        [7]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [9]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [10]: staticEqual(GNO, "address"),
        [11]: staticEqual(WETH, "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [15]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Length of bytes 192=32*6
      },
    },

    // {
    //   targetAddress: auraB_80GNO_20WETH_REWARDER,
    //   signature: "withdrawAndUnwrap(uint256,bool)",
    // },
    allow.mainnet.aura.auraB_80GNO_20WETH_rewarder["withdrawAndUnwrap"](),

    // {
    //   targetAddress: auraB_80GNO_20WETH_REWARDER,
    //   signature: "getReward()",
    // },
    allow.mainnet.aura.auraB_80GNO_20WETH_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura GNO/COW
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([B_50COW_50GNO], [BOOSTER_ADDRESS]),
    ...allowErc20Approve([GNO, COW], [REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS]),

    // {
    //   targetAddress: BOOSTER_ADDRESS,
    //   signature: "deposit(uint256,uint256,bool)",
    //   params: {
    //     [0]: staticEqual(3, "uint256"), // Aura poolId
    //   },
    // },
    allow.mainnet.aura.booster["deposit"](
      3), // Aura poolId

    {
      targetAddress: REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS,
      signature:
        "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(aura50COW_50GNO_REWARDER, "address"),
        [1]: staticOneOf([GNO, COW], "address"),
        [3]: staticEqual(
          "0x92762b42a06dcdddc5b7362cfb01e631c4d44b40000200000000000000000182",
          "bytes32"
        ), // Balancer PoolId
        [4]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000a0",
          "bytes32"
        ), // Offset of tuple from beggining 160=32*5
        [5]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [6]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 224=32*7
        [7]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [9]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [10]: staticEqual(GNO, "address"),
        [11]: staticEqual(COW, "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [15]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Length of bytes 192=32*6
      },
    },

    // {
    //   targetAddress: aura50COW_50GNO_REWARDER,
    //   signature: "withdrawAndUnwrap(uint256,bool)",
    // },
    allow.mainnet.aura.aura50COW_50GNO_rewarder["withdrawAndUnwrap"](),

    // {
    //   targetAddress: aura50COW_50GNO_REWARDER,
    //   signature: "getReward()",
    // },
    allow.mainnet.aura.aura50COW_50GNO_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura LDO/wstETH
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([B_50WSTETH_50LDO], [BOOSTER_ADDRESS]),
    ...allowErc20Approve([LDO, wstETH], [REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS]),

    // {
    //   targetAddress: BOOSTER_ADDRESS,
    //   signature: "deposit(uint256,uint256,bool)",
    //   params: {
    //     [0]: staticEqual(20, "uint256"), // Aura poolId
    //   },
    // },
    allow.mainnet.aura.booster["deposit"](
      20), // Aura poolId

    {
      targetAddress: REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS,
      signature:
        "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(aura50WSTETH_50LDO_REWARDER, "address"),
        [1]: staticOneOf([LDO, wstETH], "address"),
        [3]: staticEqual(
          "0x6a5ead5433a50472642cd268e584dafa5a394490000200000000000000000366",
          "bytes32"
        ), // Balancer PoolId
        [4]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000a0",
          "bytes32"
        ), // Offset of tuple from beggining 160=32*5
        [5]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [6]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 224=32*7
        [7]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [9]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [10]: staticEqual(LDO, "address"),
        [11]: staticEqual(wstETH, "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [15]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Length of bytes 192=32*6
      },
    },

    // {
    //   targetAddress: aura50WSTETH_50LDO_REWARDER,
    //   signature: "withdrawAndUnwrap(uint256,bool)",
    // },
    allow.mainnet.aura.aura50WSTETH_50LDO_rewarder["withdrawAndUnwrap"](),

    // {
    //   targetAddress: aura50WSTETH_50LDO_REWARDER,
    //   signature: "getReward()",
    // },
    allow.mainnet.aura.aura50WSTETH_50LDO_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura WETH/AURA
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([B_50WETH_50AURA], [BOOSTER_ADDRESS]),
    ...allowErc20Approve([WETH, AURA], [REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS]),

    // {
    //   targetAddress: BOOSTER_ADDRESS,
    //   signature: "deposit(uint256,uint256,bool)",
    //   params: {
    //     [0]: staticEqual(0, "uint256"), // Aura poolId
    //   },
    // },
    allow.mainnet.aura.booster["deposit"](
      0), // Aura poolId

    {
      targetAddress: REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS,
      signature:
        "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(aura50WETH_50AURA_REWARDER, "address"),
        [1]: staticOneOf([WETH, AURA], "address"),
        [3]: staticEqual(
          "0xcfca23ca9ca720b6e98e3eb9b6aa0ffc4a5c08b9000200000000000000000274",
          "bytes32"
        ), // Balancer PoolId
        [4]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000a0",
          "bytes32"
        ), // Offset of tuple from beggining 160=32*5
        [5]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [6]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 224=32*7
        [7]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [9]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [10]: staticEqual(WETH, "address"),
        [11]: staticEqual(AURA, "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [15]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Length of bytes 192=32*6
      },
    },

    // {
    //   targetAddress: aura50WETH_50AURA_REWARDER,
    //   signature: "withdrawAndUnwrap(uint256,bool)",
    // },
    allow.mainnet.aura.aura50WETH_50AURA_rewarder["withdrawAndUnwrap"](),

    // {
    //   targetAddress: aura50WETH_50AURA_REWARDER,
    //   signature: "getReward()",
    // },
    allow.mainnet.aura.aura50WETH_50AURA_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Aura WETH/COW
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([B_50COW_50WETH], [BOOSTER_ADDRESS]),
    ...allowErc20Approve([WETH, COW], [REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS]),

    // {
    //   targetAddress: BOOSTER_ADDRESS,
    //   signature: "deposit(uint256,uint256,bool)",
    //   params: {
    //     [0]: staticEqual(4, "uint256"), // Aura poolId
    //   },
    // },
    allow.mainnet.aura.booster["deposit"](
      4), // Aura poolId

    {
      targetAddress: REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS,
      signature:
        "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(aura50COW_50WETH_REWARDER, "address"),
        [1]: staticOneOf([WETH, COW], "address"),
        [3]: staticEqual(
          "0xde8c195aa41c11a0c4787372defbbddaa31306d2000200000000000000000181",
          "bytes32"
        ), // Balancer PoolId
        [4]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000a0",
          "bytes32"
        ), // Offset of tuple from beggining 160=32*5
        [5]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"
        ), // Offset of address[] from beginning of tuple 128=32*4
        [6]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000e0",
          "bytes32"
        ), // Offset of uint256[] from beginning of tuple 224=32*7
        [7]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000140",
          "bytes32"
        ), // Offset of bytes from beginning of tuple 320=32*10
        [9]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of address[] = 2
        [10]: staticEqual(WETH, "address"),
        [11]: staticEqual(COW, "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [15]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Length of bytes 192=32*6
      },
    },

    // {
    //   targetAddress: aura50COW_50WETH_REWARDER,
    //   signature: "withdrawAndUnwrap(uint256,bool)",
    // },
    allow.mainnet.aura.aura50COW_50WETH_rewarder["withdrawAndUnwrap"](),

    // {
    //   targetAddress: aura50COW_50WETH_REWARDER,
    //   signature: "getReward()",
    // },
    allow.mainnet.aura.aura50COW_50WETH_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Staking auraBAL
    //---------------------------------------------------------------------------------------------------------------------------------

    // Using auraBAL
    ...allowErc20Approve([auraBAL], [auraBAL_STAKING_REWARDER]),

    // {
    //   targetAddress: auraBAL_STAKING_REWARDER,
    //   signature: "stake(uint256)",
    // },
    allow.mainnet.aura.auraBAL_staking_rewarder["stake"](),

    // {
    //   targetAddress: auraBAL_STAKING_REWARDER,
    //   signature: "withdraw(uint256,bool)",
    // },
    allow.mainnet.aura.auraBAL_staking_rewarder["withdraw"](),

    // Using 80BAL-20WETH
    ...allowErc20Approve([B_80BAL_20WETH], [B_80BAL_20WETH_DEPOSITOR]),

    // {
    //   targetAddress: B_80BAL_20WETH_DEPOSITOR,
    //   signature: "deposit(uint256,bool,address)",
    //   params: {
    //     [2]: staticEqual(auraBAL_STAKING_REWARDER, "address"),
    //   },
    // },
    allow.mainnet.aura.B_80BAL_20WETH_depositor["deposit(uint256,bool,address)"](
      undefined,
      undefined,
      auraBAL_STAKING_REWARDER,
    ),

    // Using BAL
    ...allowErc20Approve([BAL], [BAL_DEPOSITOR]),

    // {
    //   targetAddress: BAL_DEPOSITOR,
    //   signature: "deposit(uint256,uint256,bool,address)",
    //   params: {
    //     [3]: staticEqual(auraBAL_STAKING_REWARDER, "address"),
    //   },
    // },
    allow.mainnet.aura.BAL_depositor["deposit"](
      undefined,
      undefined,
      undefined,
      auraBAL_STAKING_REWARDER,
    ),

    // Claiming auraBAL Staking Rewards
    // {
    //   targetAddress: auraBAL_STAKING_REWARDER,
    //   signature: "getReward()",
    // },
    allow.mainnet.aura.auraBAL_staking_rewarder["getReward()"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Locking AURA
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([AURA], [AURA_LOCKER]),

    // Locking AURA
    // {
    //   targetAddress: AURA_LOCKER,
    //   signature: "lock(address,uint256)",
    //   params: {
    //     [0]: staticEqual(AVATAR),
    //   },
    // },
    allow.mainnet.aura.aura_locker["lock"](
      AVATAR
    ),

    // Claiming Locking AURA Rewards
    // {
    //   targetAddress: AURA_LOCKER,
    //   signature: "getReward(address)",
    //   params: {
    //     [0]: staticEqual(AVATAR),
    //   },
    // },
    allow.mainnet.aura.aura_locker["getReward(address)"](
      AVATAR
    ),

    // Process Expired AURA Locks - True -> Relock Expired Locks / False -> Withdraw Expired Locks
    // {
    //   targetAddress: AURA_LOCKER,
    //   signature: "processExpiredLocks(bool)",
    // },
    allow.mainnet.aura.aura_locker["processExpiredLocks"](),

    // Gauge Votes Delegation - IMPORTANT: THE ADDRESS SHOULD BE CONSTRAINED IN ORDER TO AVOID DELEGATING THE VOTING POWER TO UNWANTED ADDRESSES
    // {
    //   targetAddress: AURA_LOCKER,
    //   signature: "delegate(address)",
    // },
    allow.mainnet.aura.aura_locker["delegate"](),

    // Proposals Delegation - IMPORTANT: THE ADDRESS SHOULD BE CONSTRAINED IN ORDER TO AVOID DELEGATING THE VOTING POWER TO UNWANTED ADDRESSES
    // {
    //   targetAddress: SNAPSHOT_DELEGATE_REGISTRY,
    //   signature: "setDelegate(bytes32,address)",
    // },
    allow.mainnet.aura.snapshot_delegate_registry["setDelegate"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // General Rewards Claiming
    //---------------------------------------------------------------------------------------------------------------------------------
    // {
    //   targetAddress: AURA_CLAIM_ZAP,
    //   signature:
    //     "claimRewards(address[],address[],address[],address[],uint256,uint256,uint256,uint256)",
    // },
    allow.mainnet.aura.aura_claim_zap["claimRewards"](),

    //---------------------------------------------------------------------------------------------------------------------------------
    // BALANCER
    //---------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer wstETH/WETH pool
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([wstETH, WETH], [BALANCER_VAULT]),
    ...allowErc20Approve([B_stETH_STABLE], [B_stETH_STABLE_GAUGE]),

    // Add Liquidity (using WETH)
    {
      targetAddress: BALANCER_VAULT,
      signature:
        "joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080",
          "bytes32"
        ), // Balancer PoolId
        [1]: staticEqual(AVATAR),
        [2]: staticEqual(AVATAR),
        [3]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"), // Offset of tuple from beggining 128=32*4
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
        [10]: staticEqual(wstETH, "address"),
        // [11]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
        [11]: staticEqual(WETH, "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Length of bytes 192=32*6
      },
      // send: true, // IMPORTANT: we only allow WETH -> If we allow ETH and WETH we could lose the ETH we send
    },

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
          "bytes32"), // Offset of tuple from beggining 128=32*4
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
        [10]: staticEqual(wstETH, "address"),
        [11]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000040",
          "bytes32"
        ), // Length of bytes 64=32*2
      },
    },

    // Stake
    allow.mainnet.balancer.B_stETH_stable_gauge["deposit(uint256)"](),

    // Unstake
    allow.mainnet.balancer.B_stETH_stable_gauge["withdraw(uint256)"](),

    // Claim Rewards
    allow.mainnet.balancer.B_stETH_stable_gauge["claim_rewards()"](),

    // Claim BAL Rewards
    allow.mainnet.balancer.BAL_minter["mint"](
      B_stETH_STABLE_GAUGE
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer B-80BAL-20WETH/auraBAL pool
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([B_80BAL_20WETH, auraBAL], [BALANCER_VAULT]),
    ...allowErc20Approve([B_auraBAL_STABLE], [B_auraBAL_STABLE_GAUGE]),

    {
      targetAddress: BALANCER_VAULT,
      signature:
        "joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0x3dd0843a028c86e0b760b1a76929d1c5ef93a2dd000200000000000000000249",
          "bytes32"
        ), // Balancer PoolId
        [1]: staticEqual(AVATAR),
        [2]: staticEqual(AVATAR),
        [3]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"), // Offset of tuple from beggining 128=32*4
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
        [10]: staticEqual(B_80BAL_20WETH, "address"),
        [11]: staticEqual(auraBAL, "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Length of bytes 192=32*6
      },
    },

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
          "bytes32"), // Offset of tuple from beggining 128=32*4
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
        [10]: staticEqual(B_80BAL_20WETH, "address"),
        [11]: staticEqual(auraBAL, "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000040",
          "bytes32"
        ), // Length of bytes 64=32*2
      },
    },

    // Stake
    allow.mainnet.balancer.B_auraBAL_stable_gauge["deposit(uint256)"](),

    // Unstake
    allow.mainnet.balancer.B_auraBAL_stable_gauge["withdraw(uint256)"](),

    // Claim Rewards
    allow.mainnet.balancer.B_auraBAL_stable_gauge["claim_rewards()"](),

    // Claim BAL Rewards
    allow.mainnet.balancer.BAL_minter["mint"](
      B_auraBAL_STABLE_GAUGE
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer rETH/WETH pool
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([rETH, WETH], [BALANCER_VAULT]),
    ...allowErc20Approve([B_rETH_STABLE], [B_rETH_STABLE_GAUGE]),

    // Add Liquidity (using WETH)
    {
      targetAddress: BALANCER_VAULT,
      signature:
        "joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0x1e19cf2d73a72ef1332c882f20534b6519be0276000200000000000000000112",
          "bytes32"
        ), // Balancer PoolId
        [1]: staticEqual(AVATAR),
        [2]: staticEqual(AVATAR),
        [3]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"), // Offset of tuple from beggining 128=32*4
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
        [10]: staticEqual(rETH, "address"),
        // [11]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
        [11]: staticEqual(WETH, "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Length of bytes 192=32*6
      },
      // send: true, // IMPORTANT: we only allow WETH -> If we allow ETH and WETH we could lose the ETH we send
    },

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
          "bytes32"), // Offset of tuple from beggining 128=32*4
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
        [10]: staticEqual(wstETH, "address"),
        [11]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000040",
          "bytes32"
        ), // Length of bytes 64=32*2
      },
    },

    // Stake
    allow.mainnet.balancer.B_rETH_stable_gauge["deposit(uint256)"](),

    // Unstake
    allow.mainnet.balancer.B_rETH_stable_gauge["withdraw(uint256)"](),

    // Claim Rewards
    allow.mainnet.balancer.B_rETH_stable_gauge["claim_rewards()"](),

    // Claim BAL Rewards
    allow.mainnet.balancer.BAL_minter["mint"](
      B_rETH_STABLE_GAUGE
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer GNO/WETH pool
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([GNO, WETH], [BALANCER_VAULT]),
    ...allowErc20Approve([B_80GNO_20WETH], [B_80GNO_20WETH_GAUGE]),

    // Add Liquidity (using WETH)
    {
      targetAddress: BALANCER_VAULT,
      signature:
        "joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0xf4c0dd9b82da36c07605df83c8a416f11724d88b000200000000000000000026",
          "bytes32"
        ), // Balancer PoolId
        [1]: staticEqual(AVATAR),
        [2]: staticEqual(AVATAR),
        [3]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"), // Offset of tuple from beggining 128=32*4
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
        [10]: staticEqual(GNO, "address"),
        // [11]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
        [11]: staticEqual(WETH, "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Length of bytes 192=32*6
      },
      // send: true, // IMPORTANT: we only allow WETH -> If we allow ETH and WETH we could lose the ETH we send
    },

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
          "bytes32"), // Offset of tuple from beggining 128=32*4
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
        [10]: staticEqual(GNO, "address"),
        [11]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000040",
          "bytes32"
        ), // Length of bytes 64=32*2
      },
    },

    // Stake
    allow.mainnet.balancer.B_80GNO_20WETH_gauge["deposit(uint256)"](),

    // Unstake
    allow.mainnet.balancer.B_80GNO_20WETH_gauge["withdraw(uint256)"](),

    // Claim Rewards
    allow.mainnet.balancer.B_80GNO_20WETH_gauge["claim_rewards()"](),

    // Claim BAL Rewards
    allow.mainnet.balancer.BAL_minter["mint"](
      B_80GNO_20WETH_GAUGE
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer GNO/COW pool
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([GNO, COW], [BALANCER_VAULT]),
    ...allowErc20Approve([B_50COW_50GNO], [B_50COW_50GNO_GAUGE]),

    // Add Liquidity
    {
      targetAddress: BALANCER_VAULT,
      signature:
        "joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0x92762b42a06dcdddc5b7362cfb01e631c4d44b40000200000000000000000182",
          "bytes32"
        ), // Balancer PoolId
        [1]: staticEqual(AVATAR),
        [2]: staticEqual(AVATAR),
        [3]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"), // Offset of tuple from beggining 128=32*4
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
        [10]: staticEqual(GNO, "address"),
        [11]: staticEqual(COW, "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Length of bytes 192=32*6
      },
    },

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
          "bytes32"), // Offset of tuple from beggining 128=32*4
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
        [10]: staticEqual(GNO, "address"),
        [11]: staticEqual(COW, "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000040",
          "bytes32"
        ), // Length of bytes 64=32*2
      },
    },

    // Stake
    allow.mainnet.balancer.B_50COW_50GNO_gauge["deposit(uint256)"](),

    // Unstake
    allow.mainnet.balancer.B_50COW_50GNO_gauge["withdraw(uint256)"](),

    // Claim Rewards
    allow.mainnet.balancer.B_50COW_50GNO_gauge["claim_rewards()"](),

    // Claim BAL Rewards
    allow.mainnet.balancer.BAL_minter["mint"](
      B_50COW_50GNO_GAUGE
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer LDO/wstETH pool
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([LDO, wstETH], [BALANCER_VAULT]),
    ...allowErc20Approve([B_50WSTETH_50LDO], [B_50WSTETH_50LDO_GAUGE]),

    // Add Liquidity
    {
      targetAddress: BALANCER_VAULT,
      signature:
        "joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0x5f1f4e50ba51d723f12385a8a9606afc3a0555f5000200000000000000000465",
          "bytes32"
        ), // Balancer PoolId
        [1]: staticEqual(AVATAR),
        [2]: staticEqual(AVATAR),
        [3]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"), // Offset of tuple from beggining 128=32*4
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
        [10]: staticEqual(LDO, "address"),
        [11]: staticEqual(wstETH, "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Length of bytes 192=32*6
      },
    },

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
          "bytes32"), // Offset of tuple from beggining 128=32*4
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
        [10]: staticEqual(LDO, "address"),
        [11]: staticEqual(wstETH, "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000040",
          "bytes32"
        ), // Length of bytes 64=32*2
      },
    },

    // Stake
    allow.mainnet.balancer.B_50WSTETH_50LDO_gauge["deposit(uint256)"](),

    // Unstake
    allow.mainnet.balancer.B_50WSTETH_50LDO_gauge["withdraw(uint256)"](),

    // Claim Rewards
    allow.mainnet.balancer.B_50WSTETH_50LDO_gauge["claim_rewards()"](),

    // Claim BAL Rewards
    allow.mainnet.balancer.BAL_minter["mint"](
      B_50WSTETH_50LDO_GAUGE
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer WETH/AURA pool
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([WETH, AURA], [BALANCER_VAULT]),
    ...allowErc20Approve([B_50WETH_50AURA], [B_50WETH_50AURA_GAUGE]),

    // Add Liquidity (using WETH)
    {
      targetAddress: BALANCER_VAULT,
      signature:
        "joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0xcfca23ca9ca720b6e98e3eb9b6aa0ffc4a5c08b9000200000000000000000274",
          "bytes32"
        ), // Balancer PoolId
        [1]: staticEqual(AVATAR),
        [2]: staticEqual(AVATAR),
        [3]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"), // Offset of tuple from beggining 128=32*4
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
        // [10]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
        [10]: staticEqual(WETH, "address"),
        [11]: staticEqual(AURA, "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Length of bytes 192=32*6
      },
      // send: true, // IMPORTANT: we only allow WETH -> If we allow ETH and WETH we could lose the ETH we send
    },

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
          "bytes32"), // Offset of tuple from beggining 128=32*4
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
        [10]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
        [11]: staticEqual(AURA, "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000040",
          "bytes32"
        ), // Length of bytes 64=32*2
      },
    },

    // Stake
    allow.mainnet.balancer.B_50WETH_50AURA_gauge["deposit(uint256)"](),

    // Unstake
    allow.mainnet.balancer.B_50WETH_50AURA_gauge["withdraw(uint256)"](),

    // Claim Rewards
    allow.mainnet.balancer.B_50WETH_50AURA_gauge["claim_rewards()"](),

    // Claim BAL Rewards
    allow.mainnet.balancer.BAL_minter["mint"](
      B_50WETH_50AURA_GAUGE
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer WETH/COW pool
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([WETH, COW], [BALANCER_VAULT]),
    ...allowErc20Approve([B_50COW_50WETH], [B_50COW_50WETH_GAUGE]),

    // Add Liquidity (using WETH)
    {
      targetAddress: BALANCER_VAULT,
      signature:
        "joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0xde8c195aa41c11a0c4787372defbbddaa31306d2000200000000000000000181",
          "bytes32"
        ), // Balancer PoolId
        [1]: staticEqual(AVATAR),
        [2]: staticEqual(AVATAR),
        [3]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"), // Offset of tuple from beggining 128=32*4
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
        // [10]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
        [10]: staticEqual(WETH, "address"),
        [11]: staticEqual(COW, "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Length of bytes 192=32*6
      },
      // send: true, // IMPORTANT: we only allow WETH -> If we allow ETH and WETH we could lose the ETH we send
    },

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
          "bytes32"), // Offset of tuple from beggining 128=32*4
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
        [10]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
        [11]: staticEqual(COW, "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000040",
          "bytes32"
        ), // Length of bytes 64=32*2
      },
    },

    // Stake
    allow.mainnet.balancer.B_50COW_50WETH_gauge["deposit(uint256)"](),

    // Unstake
    allow.mainnet.balancer.B_50COW_50WETH_gauge["withdraw(uint256)"](),

    // Claim Rewards
    allow.mainnet.balancer.B_50COW_50WETH_gauge["claim_rewards()"](),

    // Claim BAL Rewards
    allow.mainnet.balancer.BAL_minter["mint"](
      B_50COW_50WETH_GAUGE
    ),

    //---------------------------------------------------------------------------------------------------------------------------------
    // Balancer BAL/WETH pool
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([BAL, WETH], [BALANCER_VAULT]),

    // Add Liquidity (using WETH)
    {
      targetAddress: BALANCER_VAULT,
      signature:
        "joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [0]: staticEqual(
          "0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014",
          "bytes32"
        ), // Balancer PoolId
        [1]: staticEqual(AVATAR),
        [2]: staticEqual(AVATAR),
        [3]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000080",
          "bytes32"), // Offset of tuple from beggining 128=32*4
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
        [10]: staticEqual(BAL, "address"),
        // [11]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
        [11]: staticEqual(WETH, "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticEqual(
          "0x00000000000000000000000000000000000000000000000000000000000000c0",
          "bytes32"
        ), // Length of bytes 192=32*6
      },
      // send: true, // IMPORTANT: we only allow WETH -> If we allow ETH and WETH we could lose the ETH we send
    },

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
          "bytes32"), // Offset of tuple from beggining 128=32*4
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
        [10]: staticEqual(BAL, "address"),
        [11]: staticOneOf([WETH, ZERO_ADDRESS], "address"),
        [12]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          "bytes32"
        ), // Length of unit256[] = 2
        [14]: staticEqual(
          "0x0000000000000000000000000000000000000000000000000000000000000040",
          "bytes32"
        ), // Length of bytes 64=32*2
      },
    },

    // Create Lock
    allow.mainnet.balancer.veBAL["create_lock"](),

    // Increase locked amount
    allow.mainnet.balancer.veBAL["increase_amount"](),

    // Increase unlock time
    allow.mainnet.balancer.veBAL["increase_unlock_time"](),

    // Unlock
    allow.mainnet.balancer.veBAL["withdraw"](),

    // Claim locking rewards (single token)
    allow.mainnet.balancer.fee_distributor["claimToken"](
      AVATAR
    ),

    // Claim locking rewards (multiple tokens)
    allow.mainnet.balancer.fee_distributor["claimTokens"](
      AVATAR
    ),
  ],
  placeholders: { AVATAR },
} satisfies RolePreset

export default preset
