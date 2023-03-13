import { defineConfig } from "@dethcrypto/eth-sdk"

export default defineConfig({
  etherscanURLs: {
    //gnosis: "https://api.gnosisscan.io/api"
    gnosis: "https://blockscout.com/xdai/mainnet/api"
  },
  rpc: {
    gnosis: "https://rpc.gnosischain.com/"
    //gnosis: "https://rpc.ankr.com/gnosis"
  },
  contracts: {
    mainnet: {
      uniswap: {
        nftPositions: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
      },
      compound: {
        comptroller: "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b",
        cometRewards: "0x1B0e765F6224C21223AeA2af16c1C46E38885a40",
        cUSDC: "0x39AA39c021dfbaE8faC545936693aC917d5E7563",
        cDAI: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"
      },
      aave: {
        stkAave: "0x4da27a545c0c5B758a6BA100e3a049001de870f5"
      },
      balancer: {
        vault: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
        B_stETH_stable_gauge: "0xcD4722B7c24C29e0413BDCd9e51404B4539D14aE",
        B_auraBAL_stable_gauge: "0x0312AA8D0BA4a1969Fddb382235870bF55f7f242",
        B_rETH_stable_gauge: "0x79eF6103A513951a3b25743DB509E267685726B7",
        B_80GNO_20WETH_gauge: "0xCB664132622f29943f67FA56CCfD1e24CC8B4995",
        B_50COW_50GNO_gauge: "0xA6468eca7633246Dcb24E5599681767D27d1F978",
        B_50WSTETH_50LDO_gauge: "0x95201b61ef19c867da0d093df20021e1a559452c",
        B_50WETH_50AURA_gauge: "0x275dF57d2B23d53e20322b4bb71Bf1dCb21D0A00",
        B_50COW_50WETH_gauge: "0x158772F59Fe0d3b75805fC11139b46CBc89F70e5",
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
        aura_claim_zap: "0x623B83755a39B12161A63748f3f595A530917Ab2",
        B_80BAL_20WETH_depositor: "0xeAd792B55340Aa20181A80d6a16db6A0ECd1b827",
        BAL_depositor: "0x68655AD9852a99C87C0934c7290BB62CFa5D4123"
      },
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
        crv3crypto_lp: "0x02E7e2dd3BA409148A49D5cc9a9034D2f884F245",
        crv3crypto_gauge: "0x3f7693797352A321f8D532A8B297F91DD31898D8",
        crv3crypto_zap: "0xF182926A64C0A19234E7E1FCDfE772aA7A1CA351",
        rgnoCRV_lp_pool: "0x5D7309a01B727d6769153fCB1dF5587858d53B9C",
        rgnoCRV_gauge: "0x9509A9D5C55793858FE8b1C00a99e012a7AF4aaB",
        stake_deposit_zap: "0xB7De33440B7171159a9718CBE748086cecDd9685"
      },
      realt: {
        gateway: "0x80Dc050A8C923C0051D438026f1192d53033728c",
        lending_pool: "0x5B8D36De471880Ee21936f328AAB2383a280CB2A",
        variableDebtrmmWXDAI: "0x6a7CeD66902D07066Ad08c81179d17d0fbE36829"

      },
      honeyswap: {
        router: "0x1C232F01118CB8B424793ae03F870aa7D0ac7f77",
        hlp_COW_GNO: "0x6a43be8A3daBf8a0A7B56773F536266aE932a451"
      }
    },
  },
})
