import { hashMessage } from "ethers/lib/utils"
import { stat } from "fs"
import { ExecutionOptions, RolePreset } from "../../types"
import { allowCurvePool } from "../helpers/curve"
import { allowErc20Approve } from "../helpers/erc20"
import { allowLido } from "../helpers/lido"
import {
  dynamic32Equal,
  dynamicEqual,
  staticEqual,
  subsetOf,
} from "../helpers/utils"
import {
  AVATAR_ADDRESS_PLACEHOLDER,
  OMNI_BRIDGE_RECEIVER_PLACEHOLDER,
} from "../placeholders"

//Tokens
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"

//Compound V2 contracts
const COMP = "0xc00e94Cb662C3520282E6f5717214004A7f26888"

//Stakewise contracts
const sETH2 = "0xFe2e637202056d30016725477c5da089Ab0A043A"
const rETH2 = "0x20BC832ca081b91433ff6c17f85701B6e92486c5"
const SWISE = "0x48C3399719B582dD63eB5AADf12A40B4C3f52FA2"

//Uniswap V3 contracts
const UV3_ROUTER_2 = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"

//Lido contracts
const LDO = "0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32"

//Curve contracts
const CRV = "0xD533a949740bb3306d119CC777fa900bA034cd52"

//Aura contracts
const AURA = "0xC0c293ce456fF0ED870ADd98a0828Dd4d2903DBF"

//Balancer contracts
const BALANCER_VAULT = "0xBA12222222228d8Ba445958a75a0704d566BF2C8"
const BAL = "0xba100000625a3754423978a60c9317c58a424e3D"

//SushiSwap contracts
const SUSHISWAP_ROUTER = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"

const preset: RolePreset = {
  network: 1,
  allow: [
    //---------------------------------------------------------------------------------------------------------------------------------
    //Unwrapping of WETH
    //---------------------------------------------------------------------------------------------------------------------------------
    {
      targetAddress: WETH,
      signature: "withdraw(uint256)",
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    //Swapping of tokens COMP, CRV, LDO, rETH2, SWISE, sETH2 and WETH in UniswapV3
    //---------------------------------------------------------------------------------------------------------------------------------

    //...allowErc20Approve([COMP, rETH2, SWISE, sETH2, CRV], [UV3_ROUTER_2]),
    ...allowErc20Approve(
      [COMP, CRV, LDO, rETH2, SWISE, sETH2, WETH],
      [UV3_ROUTER_2]
    ),

    //Swapping of COMP for USDC
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([COMP, WETH, USDC], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    //Swapping of COMP for DAI
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([COMP, WETH, DAI], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    //Swapping of COMP for WETH
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([COMP, WETH], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    //------------------------------
    //Swapping of rETH2 for USDC
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([rETH2, sETH2, WETH, USDC], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    //Swapping of rETH2 for DAI
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([rETH2, sETH2, WETH, DAI], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    //Swapping of rETH2 for WETH
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([rETH2, sETH2, WETH], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    //------------------------------
    //Swapping of SWISE for USDC
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([SWISE, sETH2, WETH, USDC], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    //Swapping of SWISE for DAI
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([SWISE, sETH2, WETH, DAI], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    //Swapping of SWISE for WETH
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([SWISE, sETH2, WETH], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    //------------------------------
    //Swapping of sETH2 for WETH
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([sETH2, WETH], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    //------------------------------
    //Swapping of WETH for DAI
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([WETH, DAI], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    //------------------------------
    //Swapping of WETH for USDC
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([WETH, USDC], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    //------------------------------
    //Swapping of CRV for USDC
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([CRV, WETH, USDC], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    //Swapping of CRV for DAI
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([CRV, WETH, DAI], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    //Swapping of CRV for WETH
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([CRV, WETH], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    //------------------------------
    //Swapping of LDO for USDC
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([LDO, WETH, USDC], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    //Swapping of LDO for DAI
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([LDO, WETH, DAI], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
    //Swapping of LDO for WETH
    {
      targetAddress: UV3_ROUTER_2,
      signature: "swapExactTokensForTokens(uint256,uint256,address[],address)",
      params: {
        [2]: dynamic32Equal([LDO, WETH], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    //Swapping of rewards AURA, BAL, COMP in Balancer: https://dev.balancer.fi/guides/swaps/single-swaps
    //---------------------------------------------------------------------------------------------------------------------------------

    /*     
    swap(SingleSwap_struct,FundManagement_struct,token_limit,deadline)

    struct SingleSwap {
      bytes32 poolId;
      SwapKind kind;      0 = GIVEN_IN, 1 = GIVEN_OUT
      IAsset assetIn;
      IAsset assetOut;
      uint256 amount;
      bytes userData;     userData specifies the JoinKind, see https://dev.balancer.fi/resources/joins-and-exits/pool-joins
    }
    struct FundManagement {
      address sender;
      bool fromInternalBalance;
      address payable recipient;
      bool toInternalBalance;
    }
     */

    //Swap AURA for WETH
    ...allowErc20Approve([AURA], [BALANCER_VAULT]),
    {
      targetAddress: BALANCER_VAULT,
      signature:
        "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
      params: {
        [1]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // recipient
        [2]: staticEqual(false, "bool"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // sender
        [4]: staticEqual(false, "bool"),
        [7]: staticEqual(
          "0xcfca23ca9ca720b6e98e3eb9b6aa0ffc4a5c08b9000200000000000000000274",
          "bytes32"
        ), //WETH-AURA pool ID
        [9]: staticEqual(AURA, "address"), //Asset in
        [10]: staticEqual(WETH, "address"), //Asset out
      },
    },

    //Swap BAL for WETH
    ...allowErc20Approve([BAL], [BALANCER_VAULT]),
    {
      targetAddress: BALANCER_VAULT,
      signature:
        "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
      params: {
        [1]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // recipient
        [2]: staticEqual(false, "bool"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // sender
        [4]: staticEqual(false, "bool"),
        [7]: staticEqual(
          "0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014",
          "bytes32"
        ), //BAL-WETH pool ID
        [9]: staticEqual(BAL, "address"), //Asset in
        [10]: staticEqual(WETH, "address"), //Asset out
      },
    },

    //Swap WETH for DAI
    ...allowErc20Approve([WETH], [BALANCER_VAULT]),
    {
      targetAddress: BALANCER_VAULT,
      signature:
        "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
      params: {
        [1]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // recipient
        [2]: staticEqual(false, "bool"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // sender
        [4]: staticEqual(false, "bool"),
        [7]: staticEqual(
          "0x0b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a",
          "bytes32"
        ), //WETH-DAI pool ID
        [9]: staticEqual(WETH, "address"), //Asset in
        [10]: staticEqual(DAI, "address"), //Asset out
      },
    },

    //Swap WETH for USDC
    ...allowErc20Approve([WETH], [BALANCER_VAULT]),
    {
      targetAddress: BALANCER_VAULT,
      signature:
        "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
      params: {
        [1]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // recipient
        [2]: staticEqual(false, "bool"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // sender
        [4]: staticEqual(false, "bool"),
        [7]: staticEqual(
          "0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8000200000000000000000019",
          "bytes32"
        ), //USDC-WETH pool ID
        [9]: staticEqual(WETH, "address"), //Asset in
        [10]: staticEqual(USDC, "address"), //Asset out
      },
    },

    //Swap COMP for WETH
    ...allowErc20Approve([COMP], [BALANCER_VAULT]),
    {
      targetAddress: BALANCER_VAULT,
      signature:
        "swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)",
      params: {
        [1]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // recipient
        [2]: staticEqual(false, "bool"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER), // sender
        [4]: staticEqual(false, "bool"),
        [7]: staticEqual(
          "0xefaa1604e82e1b3af8430b90192c1b9e8197e377000200000000000000000021",
          "bytes32"
        ), //COMP-WETH pool ID
        [9]: staticEqual(COMP, "address"), //Asset in
        [10]: staticEqual(WETH, "address"), //Asset out
      },
    },

    //---------------------------------------------------------------------------------------------------------------------------------
    //Swapping of COMP, LDO, WETH, CRV, BAL for USDC, DAI and WETH in SushiSwap
    //---------------------------------------------------------------------------------------------------------------------------------

    ...allowErc20Approve([COMP, LDO, WETH, CRV, BAL], [SUSHISWAP_ROUTER]),
    // WETH
    {
      targetAddress: SUSHISWAP_ROUTER,
      signature:
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
      params: {
        [2]: dynamic32Equal([WETH, DAI], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    {
      targetAddress: SUSHISWAP_ROUTER,
      signature:
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
      params: {
        [2]: dynamic32Equal([WETH, USDC], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    // COMP
    {
      targetAddress: SUSHISWAP_ROUTER,
      signature:
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
      params: {
        [2]: dynamic32Equal([COMP, WETH], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    {
      targetAddress: SUSHISWAP_ROUTER,
      signature:
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
      params: {
        [2]: dynamic32Equal([COMP, WETH, USDC], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    {
      targetAddress: SUSHISWAP_ROUTER,
      signature:
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
      params: {
        [2]: dynamic32Equal([COMP, WETH, DAI], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    // LDO
    {
      targetAddress: SUSHISWAP_ROUTER,
      signature:
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
      params: {
        [2]: dynamic32Equal([LDO, WETH], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    {
      targetAddress: SUSHISWAP_ROUTER,
      signature:
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
      params: {
        [2]: dynamic32Equal([LDO, WETH, USDC], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    {
      targetAddress: SUSHISWAP_ROUTER,
      signature:
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
      params: {
        [2]: dynamic32Equal([LDO, WETH, DAI], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    // CRV
    {
      targetAddress: SUSHISWAP_ROUTER,
      signature:
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
      params: {
        [2]: dynamic32Equal([CRV, WETH], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    {
      targetAddress: SUSHISWAP_ROUTER,
      signature:
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
      params: {
        [2]: dynamic32Equal([CRV, WETH, USDC], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    {
      targetAddress: SUSHISWAP_ROUTER,
      signature:
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
      params: {
        [2]: dynamic32Equal([CRV, WETH, DAI], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    // BAL
    {
      targetAddress: SUSHISWAP_ROUTER,
      signature:
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
      params: {
        [2]: dynamic32Equal([BAL, WETH], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    {
      targetAddress: SUSHISWAP_ROUTER,
      signature:
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
      params: {
        [2]: dynamic32Equal([BAL, WETH, USDC], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },

    {
      targetAddress: SUSHISWAP_ROUTER,
      signature:
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
      params: {
        [2]: dynamic32Equal([BAL, WETH, DAI], "address[]"),
        [3]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER),
      },
    },
  ],
}
export default preset
