// The default eth-sdk config covers alls supported chains, except gnosis.
export const ethSdkConfig = {
  etherscanURLs: {
    gnosis: "https://api.gnosisscan.io/api",
    base: "https://api.basescan.org/api",
  },
  etherscanKeys: {
    gnosis: "8ENCUFT4D3XVJS7N9ZFS5Z9XQPNUGRKSN5",
    base: "EP2HURF81GKBPX1RQ37T91Z2WXKH4FT78Q",
  },
  rpc: {
    gnosis: "https://rpc.gnosischain.com",
    base: "https://mainnet.base.org",
  },
  networkIds: {
    gnosis: 100,
    base: 8453,
  },
} as const
