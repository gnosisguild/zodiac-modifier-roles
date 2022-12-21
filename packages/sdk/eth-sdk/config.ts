import { defineConfig } from "@dethcrypto/eth-sdk"

export default defineConfig({
  contracts: {
    mainnet: {
      uniswap: {
        nftPositions: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
        test: "0x0000000000000000000000000000000000000000",
      },
      compound: {
        comptroller: "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b",
        cometRewards: "0x1B0e765F6224C21223AeA2af16c1C46E38885a40",
      },
      aave: {
        stkAave: "0x4da27a545c0c5B758a6BA100e3a049001de870f5",
      },
      idle: {
        stEthCdo: "0x34dCd573C5dE4672C8248cd12A99f875Ca112Ad8",
        wstEthAaGauge: "0x675eC042325535F6e176638Dd2d4994F645502B9",
        distributorProxy: "0x074306bc6a6fc1bd02b425dd41d742adf36ca9c6",
      },
    },
  },
})
