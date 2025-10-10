import { ChainId } from "zodiac-roles-sdk"

// extracted from https://docs.morpho.org/get-started/resources/addresses/#bundlers
export const addresses = {
  [1]: {
    Bundler3: "0x6566194141eefa99Af43Bb5Aa71460Ca2Dc90245",
    EthereumGeneralAdapter1: "0x4A6c312ec70E8747a587EE860a0353cd42Be0aE0",
    ERC20WrapperAdapter: "0xf83D17dFE160597b19e4FdD8ea61A23e9a87F962",
    ParaswapAdapter: "0x03b5259Bd204BfD4A616E5B79b0B786d90c6C38f",
    AaveV3MigrationAdapter_Core: "0xb09e40EbE31b738fbf20289270a397118707D475",
    AaveV3MigrationAdapter_Prime: "0x2CC8d502a65824B4cF9A58DB03490bA024BDB806",
    AaveV3MigrationAdapter_EtherFi:
      "0x4011dc6581fA05F9B0c7A12AdCd676e2b1a59ca3",
    CompoundV3MigrationAdapter: "0xdBa5bdE29eA030Bfa6A608592dFcA1D02CB26773",
  },
  [10]: {
    Bundler3: "0xFBCd3C258feB131D8E038F2A3a670A7bE0507C05",
    GeneralAdapter1: "0x79481C87f24A3C4332442A2E9faaf675e5F141f0",
    ParaswapAdapter: "0x31F539f4Ed14fA1fd18781e93f6739249692aDC5",
  },
  [56]: {
    Bundler3: "0x16D40b9DF1497468195BFAfeb2718e486E15bF91",
    GeneralAdapter1: "0x87c93660ECe6E68C6492EabBbBdbaafA102ae3a3",
    ParaswapAdapter: "0xBb12B012Fa31f7FE418236cAf625713Edc852F82",
  },
  [100]: {
    Bundler3: "0x2AC3ea771547926D4714078e807eFbeF70D0997f",
    GeneralAdapter1: "0x832625F5C0aAD4bc14d39291156D37898a40973b",
  },
  [130]: {
    Bundler3: "0x7DD85759182495AF7F6757DA75036d24A9B58bc3",
    GeneralAdapter1: "0xC11329d19C2275c9E759867e879ECFcEeD7e30A0",
    ParaswapAdapter: "0xAa870Da2a9F611A3A53d0D2AEe5664B3700a59c9",
    CompoundV3MigrationAdapter: "0x617f8d7885CCE689115Af04576F7cB6F2534fA9a",
  },
  [137]: {
    Bundler3: "0x2d9C3A9E67c966C711208cc78b34fB9E9f8db589",
    GeneralAdapter1: "0xB261B51938A9767406ef83bbFbaAFE16691b7047",
    ParaswapAdapter: "0x5F2617F12D1fDd1e43e72Cb80C92dFcE8124Db8d",
  },
  [146]: {
    Bundler3: "0xB06F1Ad8c908b958E596c42973f67F2f1d9a9afF",
    GeneralAdapter1: "0x31D5aee8D75EEab548cfA0d11C4f9843a5201eaf",
  },
  [42161]: {
    Bundler3: "0x1FA4431bC113D308beE1d46B0e98Cb805FB48C13",
    GeneralAdapter1: "0x9954aFB60BB5A222714c478ac86990F221788B88",
    ParaswapAdapter: "0xAA5c30C1482c189cA0d56057D3ac4dD7Af1e4726",
    AaveV3MigrationAdapter: "0x1923670d4F4eB7435d865E7477d28FEAFfA40C93",
    CompoundV3MigrationAdapter: "0x86Ca77a4a37A9CDBe9bBf4975F6d69531B96444b",
  },
  [42220]: {
    Bundler3: "0xbd142f98f847c170D51d8B23e5FEBc51FC9a67D9",
    GeneralAdapter1: "0x3E7544a07157D03a49359eE89f2fCac9a6467230",
  },
  [480]: {
    Bundler3: "0x3D07BF2FFb23248034bF704F3a4786F1ffE2a448",
    GeneralAdapter1: "0x30fa9A3cF56931ACEea42E28D35519a97D90aA67",
  },
  [57073]: {
    Bundler3: "0x7db0F1E2bf1f47ec82220090F388d75D8B9BB6BC",
    GeneralAdapter1: "0xB8B2aDdCDe1cdC94AaE18a0F8A19df03D8683610",
  },
  [747474]: {
    Bundler3: "0xA8C5e23C9C0DF2b6fF716486c6bBEBB6661548C8",
    GeneralAdapter1: "0x916Aa175C36E845db45fF6DDB886AE437d403B61",
  },
  [8453]: {
    Bundler3: "0x6BFd8137e702540E7A42B74178A4a49Ba43920C4",
    GeneralAdapter1: "0xb98c948CFA24072e58935BC004a8A7b376AE746A",
    ERC20WrapperAdapter: "0xdeEf55F0A7366cC3Baf5E04313269389Fe17E9AE",
    ParaswapAdapter: "0x6abE8ABd0275E5564ed1336F0243A52C32562F71",
    CompoundV3MigrationAdapter: "0x85D4812Ef92c040d4270eD8547b6835e41FbbB70",
    AaveV3MigrationAdapter: "0xb27Aa2a964eAd5ed661D86974b37e4fB995b36f5",
  },
  [999]: {
    Bundler3: "0xa3F50477AfA601C771874260A3B34B40e244Fa0e",
    GeneralAdapter1: "0xD7F48aDE56613E8605863832B7B8A1985B934aE4",
  },
} as const satisfies { [chain in ChainId]?: { [key: string]: `0x${string}` } }
