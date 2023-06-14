import { defineConfig } from "@dethcrypto/eth-sdk"

export default defineConfig({
  etherscanURLs: {
    mainnet: "https://api.etherscan.io/api",
    gnosis: "https://api.gnosisscan.io/api"
    //gnosis: "https://blockscout.com/xdai/mainnet/api",
  },
  rpc: {
    mainnet: "https://ethereum.publicnode.com",
    gnosis: "https://rpc.gnosischain.com/",
    //gnosis: "https://rpc.ankr.com/gnosis"
  },
  contracts: {
    mainnet: {
      aave_v2: {
        lending_pool: "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9",
        stkAave: "0x4da27a545c0c5B758a6BA100e3a049001de870f5",
      },
      aave_v3: {
        pool_v3: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
      },
      aura: {
        booster: "0xA57b8d98dAE62B26Ec3bcC4a365338157060B234",
        auraB_stETH_stable_rewarder:
          "0x59D66C58E83A26d6a0E35114323f65c3945c89c1",
        auraB_auraBAL_stable_rewarder:
          "0x89D3D732da8bf0f88659Cf3738E5E44e553f9ED7",
        auraB_rETH_stable_rewarder:
          "0xDd1fE5AD401D4777cE89959b7fa587e569Bf125D",
        auraB_80GNO_20WETH_rewarder:
          "0xD3780729035c5b302f76ced0E7F74cF0Fb7c739a",
        aura50COW_50GNO_rewarder: "0x82FeB430d9D14eE5E635C41807e03fD8F5FfFDeC",
        aura50WSTETH_50LDO_rewarder:
          "0x5209dB28b3cF22a944401c83370Af7A703ffFb08",
        aura50WETH_50AURA_rewarder:
          "0x1204f5060bE8b716F5A62b4Df4cE32acD01a69f5",
        aura50COW_50WETH_rewarder: "0xA6e54eA1C67396Bde9e92cA462197bE59Af3E875",
        auraBAL_staking_rewarder: "0x00A7BA8Ae7bca0B10A32Ea1f8e2a1Da980c6CAd2",
        aurabb_aV3_USD_rewarder: "0xD48451A61d5190a1Ba7C9D17056490cB5d50999d",
        aura_locker: "0x3Fa73f1E5d8A792C80F426fc8F84FBF7Ce9bBCAC",
        snapshot_delegate_registry:
          "0x469788fE6E9E9681C6ebF3bF78e7Fd26Fc015446",
        claim_zap: "0x5b2364fD757E262253423373E4D57C5c011Ad7F4",
        stkauraBAL: "0xfAA2eD111B4F580fCb85C48E6DC6782Dc5FCD7a6",
        auraBAL_B_80BAL_20WETH_depositor:
          "0xeAd792B55340Aa20181A80d6a16db6A0ECd1b827",
        auraBAL_BAL_depositor: "0x68655AD9852a99C87C0934c7290BB62CFa5D4123",
        auraBAL_compounding_rewarder:
          "0xAc16927429c5c7Af63dD75BC9d8a58c63FfD0147",
      },
      balancer: {
        vault: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
        relayer: "0xfeA793Aa415061C483D2390414275AD314B3F621",
        B_stETH_stable_gauge: "0xcD4722B7c24C29e0413BDCd9e51404B4539D14aE",
        B_auraBAL_stable_gauge: "0x0312AA8D0BA4a1969Fddb382235870bF55f7f242",
        B_rETH_stable_gauge: "0x79eF6103A513951a3b25743DB509E267685726B7",
        B_80GNO_20WETH_gauge: "0xCB664132622f29943f67FA56CCfD1e24CC8B4995",
        B_50COW_50GNO_gauge: "0xA6468eca7633246Dcb24E5599681767D27d1F978",
        B_50WSTETH_50LDO_gauge: "0x95201b61ef19c867da0d093df20021e1a559452c",
        B_50WETH_50AURA_gauge: "0x275dF57d2B23d53e20322b4bb71Bf1dCb21D0A00",
        B_50COW_50WETH_gauge: "0x158772F59Fe0d3b75805fC11139b46CBc89F70e5",
        bb_a_USD_gauge: "0xa6325e799d266632D347e41265a69aF111b05403",
        bb_aV3_USD_gauge: "0x0052688295413b32626D226a205b95cDB337DE86",
        BAL_minter: "0x239e55f427d44c3cc793f49bfb507ebe76638a2b",
        fee_distributor: "0xD3cf852898b21fc233251427c2DC93d3d604F3BB",
        veBAL: "0xC128a9954e6c874eA3d62ce62B468bA073093F25",
      },
      compound_v2: {
        comptroller: "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b",
        cometRewards: "0x1B0e765F6224C21223AeA2af16c1C46E38885a40",
        cUSDC: "0x39AA39c021dfbaE8faC545936693aC917d5E7563",
        cDAI: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
        cAAVE: "0xe65cdB6479BaC1e22340E4E755fAE7E509EcD06c",
      },
      compound_v3: {
        cUSDCv3: "0xc3d688B66703497DAA19211EEdff47f25384cdc3",
        MainnetBulker: "0xa397a8C2086C554B531c02E29f3291c9704B00c7",
        CometRewards: "0x1b0e765f6224c21223aea2af16c1c46e38885a40",
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
        claim_zap: "0x3f29cb4111cbda8081642da1f75b3c12decf2516",
      },
      curve: {
        crv_minter: "0xd061D61a4d941c39E5453435B6345Dc261C2fcE0",
        stake_deposit_zap: "0x271fbE8aB7f1fB262f81C77Ea5303F03DA9d3d6A",
        steth_eth_pool: "0xDC24316b9AE028F1497c275EB9192a3Ea0f67022",
        steth_eth_gauge: "0x182B723a58739a9c974cFDB385ceaDb237453c28",
        cDAIcUSDC_pool: "0xA2B47E3D5c44877cca798226B7B8118F9BFb7A56",
        cDAIcUSDC_gauge: "0x7ca5b0a2910B33e9759DC7dDB0413949071D7575",
        cDAIcUSDC_zap: "0xeB21209ae4C2c9FF2a86ACA31E123764A3B6Bc06",
        x3CRV_pool: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        cvxETH_pool: "0xB576491F1E6e5E62f1d8F26062Ee822B40B0E0d4",
      },
      idle: {
        stEthCdo: "0x34dCd573C5dE4672C8248cd12A99f875Ca112Ad8",
        wstEthAaGauge: "0x675eC042325535F6e176638Dd2d4994F645502B9",
        distributorProxy: "0x074306bc6a6fc1bd02b425dd41d742adf36ca9c6",
      },
      lido: {
        stETH: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
        wstETH: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
      },
      maker: {
        dsr_manager: "0x373238337Bfe1146fb49989fc222523f83081dDb"
      },
      rocket_pool: {
        deposit_pool: "0xDD3f50F8A6CafbE9b31a427582963f465E745AF8", // This address might due to Rocket Pool's Architecture
        rETH: "0xae78736Cd615f374D3085123A210448E74Fc6393",
        swap_router: "0x16D5A408e807db8eF7c578279BEeEe6b228f1c1C"
      },
      stakedao: {
        bribe: "0x0000000BE1d98523B5469AfF51A1e7b4891c6225",
      },
      stakewise: {
        eth2_staking: "0xC874b064f465bdD6411D45734b56fac750Cda29A",
        merkle_distributor: "0xA3F21010e8b9a3930996C8849Df38f9Ca3647c20",
      },
      sushiswap: {
        router: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
      },
      uniswapv3: {
        positions_nft: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
        router_2: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
      },
      votium: {
        bribe: "0x19BBC3463Dd8d07f55438014b021Fb457EBD4595",
      },
      weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      omnibridge: "0x88ad09518695c6c3712AC10a214bE5109a655671",
    },
    gnosis: {
      agave: {
        wxdai_gateway: "0x36A644cC38Ae257136EEca5919800f364d73FeFC",
        lending_pool: "0x5E15d5E33d318dCEd84Bfe3F4EACe07909bE6d9c",
        incentives_controller: "0xfa255f5104f129B78f477e9a6D050a02f31A5D86",
        stkAGVE: "0x610525b415c1BFAeAB1a3fc3d85D87b92f048221",
        variableDebtWXDAI: "0xec72De30C3084023F7908002A2252a606CCe0B2c",
      },
      balancer: {
        vault: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
        relayer: "0x3536fD480CA495Ac91E698A703248A8915c137a3",
        child_chain_gauge_reward_helper: "0xf7D5DcE55E6D47852F054697BAB6A1B48A00ddbd",
        B_50bbagGNO_50bbagWETH_gauge: "0xf752dd899F87a91370C1C8ac1488Aef6be687505",
        bb_ag_USD_gauge: "0xDe3B7eC86B67B05D312ac8FD935B6F59836F2c41",
        agUSD_agWETH_agWBTC_gauge: "0x7eA8B4e2CaBA854C3dD6bf9c5ebABa143BE7Fe9E",
        B_50bbagGNO_50bbagUSD_gauge: "0x7E13b8b95d887c2326C25e71815F33Ea10A2674e",
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
        stake_deposit_zap: "0xB7De33440B7171159a9718CBE748086cecDd9685",
      },
      honeyswap: {
        router: "0x1C232F01118CB8B424793ae03F870aa7D0ac7f77",
      },
      realt: {
        gateway: "0x80Dc050A8C923C0051D438026f1192d53033728c",
        lending_pool: "0x5B8D36De471880Ee21936f328AAB2383a280CB2A",
        variableDebtrmmWXDAI: "0x6a7CeD66902D07066Ad08c81179d17d0fbE36829",
      },
      sushiswap: {
        router: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
        minichef_v2: "0xdDCbf776dF3dE60163066A5ddDF2277cB445E0F3",
      },
      swapr: {
        router: "0xE43e60736b1cb4a75ad25240E2f9a62Bff65c0C0",
      },
      omnibridge: "0xf6A78083ca3e2a662D6dd1703c939c8aCE2e268d",
      xdai_bridge: "0x7301CFA0e1756B71869E93d4e4Dca5c7d0eb0AA6",
    },
  },
})
