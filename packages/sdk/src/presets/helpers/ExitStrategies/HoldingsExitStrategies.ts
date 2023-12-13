import { PresetAllowEntry } from "../../types"
import { allow } from "../../allow"
import { AVATAR } from "../../placeholders"
import { allowErc20Approve } from "../../helpers/erc20"
import * as mainnetAddresses from "../../mainnet/addresses"
import * as gnoAddresses from "../../gnosisChain/addresses"
import { staticEqual } from "../../helpers/utils"
import { NetworkId } from "../../../types"

export const DaiExitStrategy1 = (
  blockchainId: NetworkId
): PresetAllowEntry[] => {
  const permissions: PresetAllowEntry[] = []

  switch (blockchainId) {
    case 1:
      permissions.push(
        ...allowErc20Approve(
          [mainnetAddresses.DAI],
          [mainnetAddresses.cowswap.GPv2_VAULT_RELAYER]
        ),

        {
          targetAddress: mainnetAddresses.cowswap.ORDER_SIGNER,
          signature:
            "signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)",
          params: {
            [0]: staticEqual(mainnetAddresses.DAI, "address"),
            [1]: staticEqual(mainnetAddresses.USDC, "address"),
            [2]: staticEqual(AVATAR),
          },
          delegatecall: true,
        }
      )
      break

    case 100:
      permissions.push(
        // Wrap XDAI
        allow.gnosis.wxdai.deposit({ send: true }),

        // Cowswap only allows the wrapped version of the native token as tokenIn
        ...allowErc20Approve(
          [gnoAddresses.WXDAI],
          [gnoAddresses.cowswap.GPv2_VAULT_RELAYER]
        ),

        {
          targetAddress: gnoAddresses.cowswap.ORDER_SIGNER,
          signature:
            "signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)",
          params: {
            [0]: staticEqual(gnoAddresses.WXDAI, "address"),
            [1]: staticEqual(gnoAddresses.USDC, "address"),
            [2]: staticEqual(AVATAR),
          },
          delegatecall: true,
        }
      )
      break
  }

  return permissions
}

export const DaiExitStrategy2 = (
  blockchainId: NetworkId
): PresetAllowEntry[] => {
  const permissions: PresetAllowEntry[] = []

  switch (blockchainId) {
    case 1:
      permissions.push(
        ...allowErc20Approve(
          [mainnetAddresses.DAI],
          [mainnetAddresses.cowswap.GPv2_VAULT_RELAYER]
        ),

        {
          targetAddress: mainnetAddresses.cowswap.ORDER_SIGNER,
          signature:
            "signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)",
          params: {
            [0]: staticEqual(mainnetAddresses.DAI, "address"),
            [1]: staticEqual(mainnetAddresses.USDT, "address"),
            [2]: staticEqual(AVATAR),
          },
          delegatecall: true,
        }
      )
      break

    case 100:
      permissions.push(
        // Wrap XDAI
        allow.gnosis.wxdai.deposit({ send: true }),

        // Cowswap only allows the wrapped version of the native token as tokenIn
        ...allowErc20Approve(
          [gnoAddresses.WXDAI],
          [gnoAddresses.cowswap.GPv2_VAULT_RELAYER]
        ),

        {
          targetAddress: gnoAddresses.cowswap.ORDER_SIGNER,
          signature:
            "signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)",
          params: {
            [0]: staticEqual(gnoAddresses.WXDAI, "address"),
            [1]: staticEqual(gnoAddresses.USDT, "address"),
            [2]: staticEqual(AVATAR),
          },
          delegatecall: true,
        }
      )
      break
  }

  return permissions
}

export const DaiExitStrategy3 = (
  blockchainId: NetworkId
): PresetAllowEntry[] => {
  const permissions: PresetAllowEntry[] = []

  switch (blockchainId) {
    case 1:
      permissions.push(
        ...allowErc20Approve(
          [mainnetAddresses.DAI],
          [mainnetAddresses.cowswap.GPv2_VAULT_RELAYER]
        ),

        {
          targetAddress: mainnetAddresses.cowswap.ORDER_SIGNER,
          signature:
            "signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)",
          params: {
            [0]: staticEqual(mainnetAddresses.DAI, "address"),
            [1]: staticEqual(mainnetAddresses.E_ADDRESS, "address"),
            [2]: staticEqual(AVATAR),
          },
          delegatecall: true,
        }
      )
      break

    case 100:
      permissions.push(
        // Wrap XDAI
        allow.gnosis.wxdai.deposit({ send: true }),

        // Cowswap only allows the wrapped version of the native token as tokenIn
        ...allowErc20Approve(
          [gnoAddresses.WXDAI],
          [gnoAddresses.cowswap.GPv2_VAULT_RELAYER]
        ),

        {
          targetAddress: gnoAddresses.cowswap.ORDER_SIGNER,
          signature:
            "signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)",
          params: {
            [0]: staticEqual(gnoAddresses.WXDAI, "address"),
            [1]: staticEqual(gnoAddresses.WETH, "address"),
            [2]: staticEqual(AVATAR),
          },
          delegatecall: true,
        }
      )
      break
  }

  return permissions
}

export const UsdtExitStrategy1 = (
  blockchainId: NetworkId
): PresetAllowEntry[] => {
  const permissions: PresetAllowEntry[] = []

  switch (blockchainId) {
    case 1:
      permissions.push(
        ...allowErc20Approve(
          [mainnetAddresses.USDT],
          [mainnetAddresses.cowswap.GPv2_VAULT_RELAYER]
        ),

        {
          targetAddress: mainnetAddresses.cowswap.ORDER_SIGNER,
          signature:
            "signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)",
          params: {
            [0]: staticEqual(mainnetAddresses.USDT, "address"),
            [1]: staticEqual(mainnetAddresses.USDC, "address"),
            [2]: staticEqual(AVATAR),
          },
          delegatecall: true,
        }
      )
      break

    case 100:
      permissions.push(
        ...allowErc20Approve(
          [gnoAddresses.USDT],
          [gnoAddresses.cowswap.GPv2_VAULT_RELAYER]
        ),

        {
          targetAddress: gnoAddresses.cowswap.ORDER_SIGNER,
          signature:
            "signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)",
          params: {
            [0]: staticEqual(gnoAddresses.USDT, "address"),
            [1]: staticEqual(gnoAddresses.USDC, "address"),
            [2]: staticEqual(AVATAR),
          },
          delegatecall: true,
        }
      )
      break
  }

  return permissions
}

export const UsdtExitStrategy2 = (
  blockchainId: NetworkId
): PresetAllowEntry[] => {
  const permissions: PresetAllowEntry[] = []

  switch (blockchainId) {
    case 1:
      permissions.push(
        ...allowErc20Approve(
          [mainnetAddresses.USDT],
          [mainnetAddresses.cowswap.GPv2_VAULT_RELAYER]
        ),

        {
          targetAddress: mainnetAddresses.cowswap.ORDER_SIGNER,
          signature:
            "signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)",
          params: {
            [0]: staticEqual(mainnetAddresses.USDT, "address"),
            [1]: staticEqual(mainnetAddresses.DAI, "address"),
            [2]: staticEqual(AVATAR),
          },
          delegatecall: true,
        }
      )
      break

    case 100:
      permissions.push(
        ...allowErc20Approve(
          [gnoAddresses.USDT],
          [gnoAddresses.cowswap.GPv2_VAULT_RELAYER]
        ),

        {
          targetAddress: gnoAddresses.cowswap.ORDER_SIGNER,
          signature:
            "signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)",
          params: {
            [0]: staticEqual(gnoAddresses.USDT, "address"),
            [1]: staticEqual(gnoAddresses.E_ADDRESS, "address"),
            [2]: staticEqual(AVATAR),
          },
          delegatecall: true,
        }
      )
      break
  }

  return permissions
}

export const UsdtExitStrategy3 = (
  blockchainId: NetworkId
): PresetAllowEntry[] => {
  const permissions: PresetAllowEntry[] = []

  switch (blockchainId) {
    case 1:
      permissions.push(
        ...allowErc20Approve(
          [mainnetAddresses.USDT],
          [mainnetAddresses.cowswap.GPv2_VAULT_RELAYER]
        ),

        {
          targetAddress: mainnetAddresses.cowswap.ORDER_SIGNER,
          signature:
            "signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)",
          params: {
            [0]: staticEqual(mainnetAddresses.USDT, "address"),
            [1]: staticEqual(mainnetAddresses.E_ADDRESS, "address"),
            [2]: staticEqual(AVATAR),
          },
          delegatecall: true,
        }
      )
      break

    case 100:
      permissions.push(
        ...allowErc20Approve(
          [gnoAddresses.USDT],
          [gnoAddresses.cowswap.GPv2_VAULT_RELAYER]
        ),

        {
          targetAddress: gnoAddresses.cowswap.ORDER_SIGNER,
          signature:
            "signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)",
          params: {
            [0]: staticEqual(gnoAddresses.USDT, "address"),
            [1]: staticEqual(gnoAddresses.WETH, "address"),
            [2]: staticEqual(AVATAR),
          },
          delegatecall: true,
        }
      )
      break
  }

  return permissions
}

export const UsdcExitStrategy1 = (
  blockchainId: NetworkId
): PresetAllowEntry[] => {
  const permissions: PresetAllowEntry[] = []

  switch (blockchainId) {
    case 1:
      permissions.push(
        ...allowErc20Approve(
          [mainnetAddresses.USDC],
          [mainnetAddresses.cowswap.GPv2_VAULT_RELAYER]
        ),

        {
          targetAddress: mainnetAddresses.cowswap.ORDER_SIGNER,
          signature:
            "signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)",
          params: {
            [0]: staticEqual(mainnetAddresses.USDC, "address"),
            [1]: staticEqual(mainnetAddresses.DAI, "address"),
            [2]: staticEqual(AVATAR),
          },
          delegatecall: true,
        }
      )
      break

    case 100:
      permissions.push(
        ...allowErc20Approve(
          [gnoAddresses.USDC],
          [gnoAddresses.cowswap.GPv2_VAULT_RELAYER]
        ),

        {
          targetAddress: gnoAddresses.cowswap.ORDER_SIGNER,
          signature:
            "signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)",
          params: {
            [0]: staticEqual(gnoAddresses.USDC, "address"),
            [1]: staticEqual(gnoAddresses.E_ADDRESS, "address"),
            [2]: staticEqual(AVATAR),
          },
          delegatecall: true,
        }
      )
      break
  }

  return permissions
}

export const UsdcExitStrategy2 = (
  blockchainId: NetworkId
): PresetAllowEntry[] => {
  const permissions: PresetAllowEntry[] = []

  switch (blockchainId) {
    case 1:
      permissions.push(
        ...allowErc20Approve(
          [mainnetAddresses.USDC],
          [mainnetAddresses.cowswap.GPv2_VAULT_RELAYER]
        ),

        {
          targetAddress: mainnetAddresses.cowswap.ORDER_SIGNER,
          signature:
            "signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)",
          params: {
            [0]: staticEqual(mainnetAddresses.USDC, "address"),
            [1]: staticEqual(mainnetAddresses.USDT, "address"),
            [2]: staticEqual(AVATAR),
          },
          delegatecall: true,
        }
      )
      break

    case 100:
      permissions.push(
        ...allowErc20Approve(
          [gnoAddresses.USDC],
          [gnoAddresses.cowswap.GPv2_VAULT_RELAYER]
        ),

        {
          targetAddress: gnoAddresses.cowswap.ORDER_SIGNER,
          signature:
            "signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)",
          params: {
            [0]: staticEqual(gnoAddresses.USDC, "address"),
            [1]: staticEqual(gnoAddresses.USDT, "address"),
            [2]: staticEqual(AVATAR),
          },
          delegatecall: true,
        }
      )
      break
  }

  return permissions
}

export const UsdcExitStrategy3 = (
  blockchainId: NetworkId
): PresetAllowEntry[] => {
  const permissions: PresetAllowEntry[] = []

  switch (blockchainId) {
    case 1:
      permissions.push(
        ...allowErc20Approve(
          [mainnetAddresses.USDC],
          [mainnetAddresses.cowswap.GPv2_VAULT_RELAYER]
        ),

        {
          targetAddress: mainnetAddresses.cowswap.ORDER_SIGNER,
          signature:
            "signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)",
          params: {
            [0]: staticEqual(mainnetAddresses.USDC, "address"),
            [1]: staticEqual(mainnetAddresses.E_ADDRESS, "address"),
            [2]: staticEqual(AVATAR),
          },
          delegatecall: true,
        }
      )
      break

    case 100:
      permissions.push(
        ...allowErc20Approve(
          [gnoAddresses.USDC],
          [gnoAddresses.cowswap.GPv2_VAULT_RELAYER]
        ),

        {
          targetAddress: gnoAddresses.cowswap.ORDER_SIGNER,
          signature:
            "signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)",
          params: {
            [0]: staticEqual(gnoAddresses.USDC, "address"),
            [1]: staticEqual(gnoAddresses.WETH, "address"),
            [2]: staticEqual(AVATAR),
          },
          delegatecall: true,
        }
      )
      break
  }

  return permissions
}

export const EthExitStrategy1 = (
  blockchainId: NetworkId
): PresetAllowEntry[] => {
  const permissions: PresetAllowEntry[] = []

  switch (blockchainId) {
    case 1:
      permissions.push(
        // Wrap ETH
        allow.mainnet.weth.deposit({ send: true }),

        // Cowswap only allows the wrapped version of the native token as tokenIn
        ...allowErc20Approve(
          [mainnetAddresses.WETH],
          [mainnetAddresses.cowswap.GPv2_VAULT_RELAYER]
        ),

        {
          targetAddress: mainnetAddresses.cowswap.ORDER_SIGNER,
          signature:
            "signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)",
          params: {
            [0]: staticEqual(mainnetAddresses.WETH, "address"),
            [1]: staticEqual(mainnetAddresses.DAI, "address"),
            [2]: staticEqual(AVATAR),
          },
          delegatecall: true,
        }
      )
      break

    case 100:
      permissions.push(
        ...allowErc20Approve(
          [gnoAddresses.WETH],
          [gnoAddresses.cowswap.GPv2_VAULT_RELAYER]
        ),

        {
          targetAddress: gnoAddresses.cowswap.ORDER_SIGNER,
          signature:
            "signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)",
          params: {
            [0]: staticEqual(gnoAddresses.WETH, "address"),
            [1]: staticEqual(gnoAddresses.E_ADDRESS, "address"),
            [2]: staticEqual(AVATAR),
          },
          delegatecall: true,
        }
      )
      break
  }

  return permissions
}

export const EthExitStrategy2 = (
  blockchainId: NetworkId
): PresetAllowEntry[] => {
  const permissions: PresetAllowEntry[] = []

  switch (blockchainId) {
    case 1:
      permissions.push(
        // Wrap ETH
        allow.mainnet.weth.deposit({ send: true }),

        // Cowswap only allows the wrapped version of the native token as tokenIn
        ...allowErc20Approve(
          [mainnetAddresses.WETH],
          [mainnetAddresses.cowswap.GPv2_VAULT_RELAYER]
        ),

        {
          targetAddress: mainnetAddresses.cowswap.ORDER_SIGNER,
          signature:
            "signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)",
          params: {
            [0]: staticEqual(mainnetAddresses.WETH, "address"),
            [1]: staticEqual(mainnetAddresses.USDT, "address"),
            [2]: staticEqual(AVATAR),
          },
          delegatecall: true,
        }
      )
      break

    case 100:
      permissions.push(
        ...allowErc20Approve(
          [gnoAddresses.WETH],
          [gnoAddresses.cowswap.GPv2_VAULT_RELAYER]
        ),

        {
          targetAddress: gnoAddresses.cowswap.ORDER_SIGNER,
          signature:
            "signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)",
          params: {
            [0]: staticEqual(gnoAddresses.WETH, "address"),
            [1]: staticEqual(gnoAddresses.USDT, "address"),
            [2]: staticEqual(AVATAR),
          },
          delegatecall: true,
        }
      )
      break
  }

  return permissions
}

export const EthExitStrategy3 = (
  blockchainId: NetworkId
): PresetAllowEntry[] => {
  const permissions: PresetAllowEntry[] = []

  switch (blockchainId) {
    case 1:
      permissions.push(
        // Wrap ETH
        allow.mainnet.weth.deposit({ send: true }),

        // Cowswap only allows the wrapped version of the native token as tokenIn
        ...allowErc20Approve(
          [mainnetAddresses.WETH],
          [mainnetAddresses.cowswap.GPv2_VAULT_RELAYER]
        ),

        {
          targetAddress: mainnetAddresses.cowswap.ORDER_SIGNER,
          signature:
            "signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)",
          params: {
            [0]: staticEqual(mainnetAddresses.WETH, "address"),
            [1]: staticEqual(mainnetAddresses.USDC, "address"),
            [2]: staticEqual(AVATAR),
          },
          delegatecall: true,
        }
      )
      break

    case 100:
      permissions.push(
        ...allowErc20Approve(
          [gnoAddresses.WETH],
          [gnoAddresses.cowswap.GPv2_VAULT_RELAYER]
        ),

        {
          targetAddress: gnoAddresses.cowswap.ORDER_SIGNER,
          signature:
            "signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)",
          params: {
            [0]: staticEqual(gnoAddresses.WETH, "address"),
            [1]: staticEqual(gnoAddresses.USDC, "address"),
            [2]: staticEqual(AVATAR),
          },
          delegatecall: true,
        }
      )
      break
  }

  return permissions
}

export const HoldingsExitStrategy = (
  blockchainId: NetworkId
): PresetAllowEntry[] => {
  return [
    ...DaiExitStrategy1(blockchainId),
    ...DaiExitStrategy2(blockchainId),
    ...DaiExitStrategy3(blockchainId),
    ...UsdtExitStrategy1(blockchainId),
    ...UsdtExitStrategy2(blockchainId),
    ...UsdtExitStrategy3(blockchainId),
    ...UsdcExitStrategy1(blockchainId),
    ...UsdcExitStrategy2(blockchainId),
    ...UsdcExitStrategy3(blockchainId),
    ...EthExitStrategy1(blockchainId),
    ...EthExitStrategy2(blockchainId),
    ...EthExitStrategy3(blockchainId),
  ]
}
