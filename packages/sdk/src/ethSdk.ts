// The default eth-sdk config covers alls supported chains, except gnosis.
export const ethSdkConfig = {
  etherscanURLs: {
    gnosis: "https://api.gnosisscan.io/api",
  },
  etherscanKeys: {
    gnosis: "8ENCUFT4D3XVJS7N9ZFS5Z9XQPNUGRKSN5",
  },
  rpc: {
    gnosis: "https://rpc.gnosischain.com",
  },
  networkIds: {
    gnosis: 100,
  },
} as const
