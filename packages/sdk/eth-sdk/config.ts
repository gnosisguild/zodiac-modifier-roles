import { defineConfig } from "@dethcrypto/eth-sdk"

export default defineConfig({
  etherscanURLs: {
    mainnet: "https://api.etherscan.io/api",
    gnosis: "https://api.gnosisscan.io/api"
    //gnosis: "https://blockscout.com/xdai/mainnet/api"
  },
  rpc: {
    mainnet: "https://eth-mainnet.g.alchemy.com/v2/twj7sBzB1_Njwoejwj0EFM-_x-TKJkZb",
    gnosis: "https://rpc.gnosischain.com/"
    //gnosis: "https://rpc.ankr.com/gnosis"
  },
  contracts: {
    mainnet: {
      lido: {
        stETH: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
        wstETH: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0"
      },
      uniswapv3: {
        positions_nft: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
        router_2: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"
      },
      compound: {
        comptroller: "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b",
        cometRewards: "0x1B0e765F6224C21223AeA2af16c1C46E38885a40",
        cUSDC: "0x39AA39c021dfbaE8faC545936693aC917d5E7563",
        cDAI: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
        cAAVE: "0xe65cdB6479BaC1e22340E4E755fAE7E509EcD06c"
      },
      aave: {
        stkAave: "0x4da27a545c0c5B758a6BA100e3a049001de870f5"
      },
      balancer: {
        vault: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
        relayer_library: "0xd02992266BB6a6324A3aB8B62FeCBc9a3C58d1F9",
        B_stETH_stable_gauge: "0xcD4722B7c24C29e0413BDCd9e51404B4539D14aE",
        B_auraBAL_stable_gauge: "0x0312AA8D0BA4a1969Fddb382235870bF55f7f242",
        B_rETH_stable_gauge: "0x79eF6103A513951a3b25743DB509E267685726B7",
        B_80GNO_20WETH_gauge: "0xCB664132622f29943f67FA56CCfD1e24CC8B4995",
        B_50COW_50GNO_gauge: "0xA6468eca7633246Dcb24E5599681767D27d1F978",
        B_50WSTETH_50LDO_gauge: "0x95201b61ef19c867da0d093df20021e1a559452c",
        B_50WETH_50AURA_gauge: "0x275dF57d2B23d53e20322b4bb71Bf1dCb21D0A00",
        B_50COW_50WETH_gauge: "0x158772F59Fe0d3b75805fC11139b46CBc89F70e5",
        bb_a_USD_gauge: "0xa6325e799d266632D347e41265a69aF111b05403",
        BAL_minter: "0x239e55f427d44c3cc793f49bfb507ebe76638a2b",
        fee_distributor: "0xD3cf852898b21fc233251427c2DC93d3d604F3BB",
        veBAL: "0xC128a9954e6c874eA3d62ce62B468bA073093F25"
      },
      idle: {
        stEthCdo: "0x34dCd573C5dE4672C8248cd12A99f875Ca112Ad8",
        wstEthAaGauge: "0x675eC042325535F6e176638Dd2d4994F645502B9",
        distributorProxy: "0x074306bc6a6fc1bd02b425dd41d742adf36ca9c6"
      },
      aura: {
        booster: "0xA57b8d98dAE62B26Ec3bcC4a365338157060B234",
        auraB_stETH_stable_rewarder: "0xe4683Fe8F53da14cA5DAc4251EaDFb3aa614d528",
        auraB_auraBAL_stable_rewarder: "0xACAdA51C320947E7ed1a0D0F6b939b0FF465E4c2",
        auraB_rETH_stable_rewarder: "0x001B78CEC62DcFdc660E06A91Eb1bC966541d758",
        auraB_80GNO_20WETH_rewarder: "0xD3780729035c5b302f76ced0E7F74cF0Fb7c739a",
        aura50COW_50GNO_rewarder: "0x6256518aE9a97C408a03AAF1A244989Ce6B937F6",
        aura50WSTETH_50LDO_rewarder: "0x6c3f6C327DE4aE51a2DfAaF3431b3c508ec8D3EB",
        aura50WETH_50AURA_rewarder: "0x712CC5BeD99aA06fC4D5FB50Aea3750fA5161D0f",
        aura50COW_50WETH_rewarder: "0x228054e9c056F024FC724F515A2a8764Ae175ED6",
        auraBAL_staking_rewarder: "0x00A7BA8Ae7bca0B10A32Ea1f8e2a1Da980c6CAd2",
        aurabb_a_USD_rewarder: "0xFb6b1c1A1eA5618b3CfC20F81a11A97E930fA46B",
        aura_locker: "0x3Fa73f1E5d8A792C80F426fc8F84FBF7Ce9bBCAC",
        snapshot_delegate_registry: "0x469788fE6E9E9681C6ebF3bF78e7Fd26Fc015446",
        claim_zap: "0x623B83755a39B12161A63748f3f595A530917Ab2",
        B_80BAL_20WETH_depositor: "0xeAd792B55340Aa20181A80d6a16db6A0ECd1b827",
        BAL_depositor: "0x68655AD9852a99C87C0934c7290BB62CFa5D4123"
      },
      convex: {
        booster: "0xF403C135812408BFbE8713b5A23a04b3D48AAE31",
        snapshot_delegation: "0x469788fE6E9E9681C6ebF3bF78e7Fd26Fc015446",
        crv_depositor: "0x8014595F2AB54cD7c604B00E9fb932176fDc86Ae",
        stkCvxCrv: "0xaa0C3f5F7DFD688C6E646F66CD2a6B66ACdbE434",
        cvxRewardPool: "0xCF50b810E57Ac33B91dCF525C6ddd9881B139332",
        vlCVX: "0x72a19342e8F1838460eBFCCEf09F6585e32db86E",
        cvxsteCRV_rewarder: "0x0A760466E1B4621579a82a39CB56Dda2F4E70f03",
        cvxcDAIcUSDC_rewarder: "0xf34DFF761145FF0B05e917811d488B441F33a968",
        claim_zap: "0x3f29cb4111cbda8081642da1f75b3c12decf2516"
      },
      curve: {
        crv_minter: "0xd061D61a4d941c39E5453435B6345Dc261C2fcE0",
        stake_deposit_zap: "0x271fbE8aB7f1fB262f81C77Ea5303F03DA9d3d6A",
        steth_eth_pool: "0xDC24316b9AE028F1497c275EB9192a3Ea0f67022",
        steth_eth_gauge: "0x182B723a58739a9c974cFDB385ceaDb237453c28",
        cDAIcUSDC_pool: "0xA2B47E3D5c44877cca798226B7B8118F9BFb7A56",
        cDAIcUSDC_gauge: "0x7ca5b0a2910B33e9759DC7dDB0413949071D7575",
        cDAIcUSDC_zap: "0xeB21209ae4C2c9FF2a86ACA31E123764A3B6Bc06",
        x3CRV_pool: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7"
      },
      stakewise: {
        eth2_staking: "0xC874b064f465bdD6411D45734b56fac750Cda29A",
        merkle_distributor: "0xA3F21010e8b9a3930996C8849Df38f9Ca3647c20"
      },
      sushiswap: {
        router: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"
      },
      weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      omnibridge: "0x88ad09518695c6c3712AC10a214bE5109a655671"
    },
    gnosis: {
      sushiswap: {
        router: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
        minichef_v2: "0xdDCbf776dF3dE60163066A5ddDF2277cB445E0F3"
      },
      curve: {
        crvEUReUSD_pool: "0x056C6C5e684CeC248635eD86033378Cc444459B0",
        crvEUReUSD_gauge: "0xd91770E868c7471a9585d1819143063A40c54D00",
        crvEUReUSD_zap: "0xE3FFF29d4DC930EBb787FeCd49Ee5963DADf60b6",
        sgnoCRV_lp_pool: "0xBdF4488Dcf7165788D438b62B4C8A333879B7078",
        sgnoCRV_gauge: "0x2686d5E477d1AaA58BF8cE598fA95d97985c7Fb1",
        crv3crypto_pool: "0x5633E00994896D0F472926050eCb32E38bef3e65",
        crv3crypto_gauge: "0x3f7693797352A321f8D532A8B297F91DD31898D8",
        crv3crypto_zap: "0xF182926A64C0A19234E7E1FCDfE772aA7A1CA351",
        rgnoCRV_lp_pool: "0x5D7309a01B727d6769153fCB1dF5587858d53B9C",
        rgnoCRV_gauge: "0x9509A9D5C55793858FE8b1C00a99e012a7AF4aaB",
        x3CRV_pool: "0x7f90122BF0700F9E7e1F688fe926940E8839F353",
        x3CRV_gauge: "0xB721Cc32160Ab0da2614CC6aB16eD822Aeebc101",
        MAIx3CRV_lp_pool: "0xA64D8025ddA09bCE94DA2cF2DC175d1831e2dF76",
        MAIx3CRV_gauge: "0xa6DF868420232698c1D0bF9Aa8677D4873307A6a",
        factory_metapools_zap: "0x87C067fAc25f123554a0E76596BF28cFa37fD5E9",
        crv_minter: "0xabC000d88f23Bb45525E447528DBF656A9D55bf5",
        stake_deposit_zap: "0xB7De33440B7171159a9718CBE748086cecDd9685"
      },
      realt: {
        gateway: "0x80Dc050A8C923C0051D438026f1192d53033728c",
        lending_pool: "0x5B8D36De471880Ee21936f328AAB2383a280CB2A",
        variableDebtrmmWXDAI: "0x6a7CeD66902D07066Ad08c81179d17d0fbE36829"
      },
      honeyswap: {
        router: "0x1C232F01118CB8B424793ae03F870aa7D0ac7f77",
      },
      swapr: {
        router: "0xE43e60736b1cb4a75ad25240E2f9a62Bff65c0C0"
      },
      agave: {
        wxdai_gateway: "0x36A644cC38Ae257136EEca5919800f364d73FeFC",
        lending_pool: "0x5E15d5E33d318dCEd84Bfe3F4EACe07909bE6d9c",
        incentives_controller: "0xfa255f5104f129B78f477e9a6D050a02f31A5D86",
        stkAGVE: "0x610525b415c1BFAeAB1a3fc3d85D87b92f048221",
        variableDebtWXDAI: "0xec72De30C3084023F7908002A2252a606CCe0B2c",
      },
      balancer: {
        vault: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
        relayer_library: "0xD7FAD3bd59D6477cbe1BE7f646F7f1BA25b230f8",
        child_chain_gauge_reward_helper: "0xf7D5DcE55E6D47852F054697BAB6A1B48A00ddbd",
        B_50bbagGNO_50bbagWETH_gauge: "0x2165b84b2Ae1Fc01F481fA8c9c762B695c57bB21",
        bb_ag_USD_gauge: "0x266C15970AEEeCc254117b1C366E26718Ad02cEE",
        agUSD_agWETH_agWBTC_gauge: "0xc04672a31C5ba04912BAD418631f9b45E73619EF",
        B_50bbagGNO_50bbagUSD_gauge: "0x793fAF861a78B07c0C8c0ed1450D3919F3473226"
      },
      omnibridge: "0xf6A78083ca3e2a662D6dd1703c939c8aCE2e268d"
    },
  },
})
