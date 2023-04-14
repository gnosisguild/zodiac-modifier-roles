import { defineConfig } from "@dethcrypto/eth-sdk"

export default defineConfig({
  etherscanURLs: {
    mainnet: "https://api.etherscan.io/api",
    gnosis: "https://api.gnosisscan.io/api",
    //gnosis: "https://blockscout.com/xdai/mainnet/api"
  },
  rpc: {
    mainnet:
      "https://eth-mainnet.g.alchemy.com/v2/twj7sBzB1_Njwoejwj0EFM-_x-TKJkZb",
    gnosis: "https://rpc.gnosischain.com/",
    //gnosis: "https://rpc.ankr.com/gnosis"
  },
  contracts: {
    mainnet: {
      lido: {
        stETH: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
        wstETH: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
      },
      uniswap: {
        nftPositions: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
        router2: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
      },
      compound: {
        comptroller: "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b",
        cometRewards: "0x1B0e765F6224C21223AeA2af16c1C46E38885a40",
        cUSDC: "0x39AA39c021dfbaE8faC545936693aC917d5E7563",
        cDAI: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
        cAAVE: "0xe65cdB6479BaC1e22340E4E755fAE7E509EcD06c",
      },
      stakewise: {
        eth2Staking: "0xC874b064f465bdD6411D45734b56fac750Cda29A",
        merkleDis: "0xA3F21010e8b9a3930996C8849Df38f9Ca3647c20",
      },
      weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      aave: {
        stkAave: "0x4da27a545c0c5B758a6BA100e3a049001de870f5",
      },
      balancer: {
        vault: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
      },
    },
    gnosis: {},
  },
})
