import { ExecutionOptions, RolePreset } from "../../types"
import {
  AVATAR_ADDRESS_PLACEHOLDER,
  OMNI_BRIDGE_RECEIVER_PLACEHOLDER,
} from "../placeholders"
import { allowErc20Approve, staticEqual } from "../utils"

const AURA_TOKEN = "0xC0c293ce456fF0ED870ADd98a0828Dd4d2903DBF"
const AURA_LOCKER = "0x3Fa73f1E5d8A792C80F426fc8F84FBF7Ce9bBCAC"
const AURA_BOOSTER = "0x7818A1DA7BD1E64c199029E86Ba244a9798eEE10"

const BALANCER_VAULT = "0xBA12222222228d8Ba445958a75a0704d566BF2C8"

const CONVEX_BOOSTER = "0xF403C135812408BFbE8713b5A23a04b3D48AAE31"
const CONVEX_LOCKER = "0x72a19342e8F1838460eBFCCEf09F6585e32db86E"
const CONVEX_REWARDS = "0xCF50b810E57Ac33B91dCF525C6ddd9881B139332"

const CURVE_SUSD_SWAP = "0xA5407eAE9Ba41422680e2e00537571bcC53efBfD"

const OMNI_BRIDGE = "0x88ad09518695c6c3712AC10a214bE5109a655671"

// LP TOKENS
const BALANCER_STETH = "0x32296969Ef14EB0c6d29669C550D4a0449130230"
const BALANCER_AURA_BAL = "0x3dd0843A028C86e0b760b1A76929d1C5Ef93a2dd"
const BALANCER_80BAL_20WETH = "0x5c6Ee304399DBdB9C8Ef030aB642B10820DB8F56"
const CURVE_DAI_USDC_USDT_SUSD = "0xC25a3A3b969415c80451098fa907EC722572917F"

// TOKENS
const BALANCER = "0xba100000625a3754423978a60c9317c58a424e3D"
const STETH = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84"
const WSTETH = "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0"
const AURA_BAL = "0x616e8BfA43F920657B3497DBf40D6b1A02D4608d"
const TETHER_USD = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
const CONVEX = "0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B"
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
const COW = "0xDEf1CA1fb7FBcDC777520aa7f396b4E015F497aB"

// TODO continue with txs before AUG 16

const preset: RolePreset = {
  network: 1,
  allowTargets: [],
  allowFunctions: [
    ...allowErc20Approve([
      { tokens: [AURA_TOKEN], spenders: [AURA_LOCKER] },
      { tokens: [BALANCER_STETH, BALANCER_AURA_BAL], spenders: [AURA_BOOSTER] },
      {
        tokens: [WSTETH, AURA_BAL, BALANCER_80BAL_20WETH, BALANCER],
        spenders: [BALANCER_VAULT],
      },
      { tokens: [STETH], spenders: [WSTETH] },
      { tokens: [CURVE_DAI_USDC_USDT_SUSD], spenders: [CONVEX_BOOSTER] },
      { tokens: [TETHER_USD, USDC, DAI], spenders: [CURVE_SUSD_SWAP] },
      { tokens: [CONVEX], spenders: [CONVEX_LOCKER, CONVEX_REWARDS] },
      { tokens: [WETH, COW], spenders: [OMNI_BRIDGE] },
    ]),

    // AURA
    {
      targetAddresses: [AURA_LOCKER],
      signature: "lock(address,uint256)",
      params: { [0]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER) },
    },
    {
      targetAddresses: [AURA_BOOSTER],
      signature: "deposit(uint256,uint256,bool)",
    },

    // BALANCER
    {
      targetAddresses: [BALANCER_VAULT],
      signature:
        "joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))",
      params: {
        [1]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
        [2]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
      options: ExecutionOptions.Send,
    },

    // LIDO
    { targetAddresses: [WSTETH], signature: "wrap(uint256)" },

    // CONVEX
    {
      targetAddresses: [CONVEX_BOOSTER],
      signature: "depositAll(uint256,bool)",
    },
    {
      targetAddresses: [CONVEX_LOCKER],
      signature: "lock(address,uint256,uint256)",
      params: { [0]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER) },
    },
    {
      targetAddresses: [CONVEX_LOCKER],
      signature: "processExpiredLocks(bool)",
    },
    {
      targetAddresses: [CONVEX_REWARDS],
      signature: "stake(uint256)",
    },
    {
      targetAddresses: [CONVEX_REWARDS],
      signature: "withdraw(uint256,bool)",
    },

    // CURVE
    {
      targetAddresses: [CURVE_SUSD_SWAP],
      signature: "add_liquidity(uint256[4],uint256)",
    },

    // WETH
    {
      targetAddresses: [WETH],
      signature: "deposit()",
      options: ExecutionOptions.Send,
    },

    // OMNI BRIDGE
    {
      targetAddresses: [OMNI_BRIDGE],
      signature: "relayTokens(address,address,uint256)",
      params: {
        [1]: staticEqual(OMNI_BRIDGE_RECEIVER_PLACEHOLDER),
      },
    },
  ],
}
export default preset
