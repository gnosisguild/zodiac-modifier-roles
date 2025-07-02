export const ethSdkConfig = {
  etherscanURLs: {
    gnosis: "https://api.gnosisscan.io/api",
    base: "https://api.basescan.org/api",
    zkevm: "https://api-zkevm.polygonscan.com/api",
  },
  etherscanKeys: {
    gnosis: "8ENCUFT4D3XVJS7N9ZFS5Z9XQPNUGRKSN5",
    base: "EP2HURF81GKBPX1RQ37T91Z2WXKH4FT78Q",
    zkevm: "GV71WR5UTRQCIPHQ124HNCBYI1KSSXN5DC",
  },
  rpc: {
    gnosis: "https://rpc.gnosischain.com",
    base: "https://mainnet.base.org",
    zkevm: "https://zkevm-rpc.com",
  },
  networkIds: {
    gnosis: 100,
    base: 8453,
    zkevm: 1101,
  },
} as const
