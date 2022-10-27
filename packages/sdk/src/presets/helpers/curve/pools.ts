export default [
  {
    name: "Curve DAI/USDC/USDT",
    type: "regular",
    meta: false,
    address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
    token: "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    tokens: [
      "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    ],
    gauge: {
      address: "0xbFcF63294aD7105dEa65aA58F8AE5BE2D9d0952A",
      type: "LiquidityGauge",
    },
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve aDAI/aUSDC/aUSDT",
    type: "regular",
    meta: false,
    address: "0xDeBF20617708857ebe4F679508E7b7863a8A8EeE",
    token: "0xFd2a8fA60Abd58Efe3EeE34dd494cD491dC14900",
    tokens: [
      "0x028171bCA77440897B824Ca71D1c56caC55b68A3",
      "0xBcca60bB61934080951369a648Fb03DF4F96263C",
      "0x3Ed3B47Dd13EC9a98b44e6204A523E766B225811",
    ],
    gauge: {
      address: "0xd662908ADA2Ea1916B3318327A97eB18aD588b5d",
      type: "LiquidityGaugeV2",
    },
  },
  {
    name: "Curve ETH/aETHc",
    type: "regular",
    meta: false,
    address: "0xA96A65c051bF88B4095Ee1f2451C2A9d43F53Ae2",
    token: "0xaA17A236F2bAdc98DDc0Cf999AbB47D47Fc0A6Cf",
    tokens: [
      "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      "0xE95A203B1a91a908F9B9CE46459d101078c2c3cb",
    ],
    gauge: {
      address: "0x6d10ed2cF043E6fcf51A0e7b4C2Af3Fa06695707",
      type: "LiquidityGaugeV2",
    },
  },
  {
    name: "Curve yDAI/yUSDC/yUSDT/yBUSD",
    type: "regular",
    meta: false,
    address: "0x79a8C46DeA5aDa233ABaFFD40F3A0A2B1e5A4F27",
    token: "0x3B3Ac5386837Dc563660FB6a0937DFAa5924333B",
    tokens: [
      "0xC2cB1040220768554cf699b0d863A3cd4324ce32",
      "0x26EA744E5B887E5205727f55dFBE8685e3b21951",
      "0xE6354ed5bC4b393a5Aad09f21c46E101e692d447",
      "0x04bC0Ab673d88aE9dbC9DA2380cB6B79C4BCa9aE",
    ],
    gauge: {
      address: "0x69Fb7c45726cfE2baDeE8317005d3F94bE838840",
      type: "LiquidityGauge",
    },
    zap: {
      address: "0xb6c057591E073249F2D9D88Ba59a46CFC9B59EdB",
    },
  },
  {
    name: "Curve cDAI/cUSDC",
    type: "regular",
    meta: false,
    address: "0xA2B47E3D5c44877cca798226B7B8118F9BFb7A56",
    token: "0x845838DF265Dcd2c412A1Dc9e959c7d08537f8a2",
    tokens: [
      "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
      "0x39AA39c021dfbaE8faC545936693aC917d5E7563",
    ],
    gauge: {
      address: "0x7ca5b0a2910B33e9759DC7dDB0413949071D7575",
      type: "LiquidityGauge",
    },
    zap: {
      address: "0xeB21209ae4C2c9FF2a86ACA31E123764A3B6Bc06",
    },
  },
  {
    name: "Curve EURS/sEUR",
    type: "regular",
    meta: false,
    address: "0x0Ce6a5fF5217e38315f87032CF90686C96627CAA",
    token: "0x194eBd173F6cDacE046C53eACcE9B953F28411d1",
    tokens: [
      "0xdB25f211AB05b1c97D595516F45794528a807ad8",
      "0xD71eCFF9342A5Ced620049e616c5035F1dB98620",
    ],
    gauge: {
      address: "0x90Bb609649E0451E5aD952683D64BD2d1f245840",
      type: "LiquidityGaugeV2",
    },
  },
  {
    name: "Curve HBTC/WBTC",
    type: "regular",
    meta: false,
    address: "0x4CA9b3063Ec5866A4B82E437059D2C43d1be596F",
    token: "0xb19059ebb43466C323583928285a49f558E572Fd",
    tokens: [
      "0x0316EB71485b0Ab14103307bf65a021042c6d380",
      "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    ],
    gauge: {
      address: "0x4c18E409Dc8619bFb6a1cB56D114C3f592E0aE79",
      type: "LiquidityGauge",
    },
  },
  {
    name: "Curve iDAI/iUSDC/iUSDT",
    type: "regular",
    meta: false,
    address: "0x2dded6Da1BF5DBdF597C45fcFaa3194e53EcfeAF",
    token: "0x5282a4eF67D9C33135340fB3289cc1711c13638C",
    tokens: [
      "0x8e595470Ed749b85C6F7669de83EAe304C2ec68F",
      "0x76Eb2FE28b36B3ee97F3Adae0C69606eeDB2A37c",
      "0x48759F220ED983dB51fA7A8C0D2AAb8f3ce4166a",
    ],
    gauge: {
      address: "0xF5194c3325202F456c95c1Cf0cA36f8475C1949F",
      type: "LiquidityGaugeV2",
    },
  },
  {
    name: "Curve LINK/sLINK",
    type: "regular",
    meta: false,
    address: "0xF178C0b5Bb7e7aBF4e12A4838C7b7c5bA2C623c0",
    token: "0xcee60cFa923170e4f8204AE08B4fA6A3F5656F3a",
    tokens: [
      "0x514910771AF9Ca656af840dff83E8264EcF986CA",
      "0xbBC455cb4F1B9e4bFC4B73970d360c8f032EfEE6",
    ],
    gauge: {
      address: "0xFD4D8a17df4C27c1dD245d153ccf4499e806C87D",
      type: "LiquidityGaugeV2",
    },
  },
  {
    name: "Curve ycDAI/ycUSDC/ycUSDT/USDP",
    type: "regular",
    meta: false,
    address: "0x06364f10B501e868329afBc005b3492902d6C763",
    token: "0xD905e2eaeBe188fc92179b6350807D8bd91Db0D8",
    tokens: [
      "0x99d1Fa417f94dcD62BfE781a1213c092a47041Bc",
      "0x9777d7E2b60bB01759D0E2f8be2095df444cb07E",
      "0x1bE5d71F2dA660BFdee8012dDc58D024448A0A59",
      "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
    ],
    gauge: {
      address: "0x64E3C23bfc40722d3B649844055F1D51c1ac041d",
      type: "LiquidityGauge",
    },
    zap: {
      address: "0xA50cCc70b6a011CffDdf45057E39679379187287",
    },
  },
  {
    name: "Curve renBTC/WBTC",
    type: "regular",
    meta: false,
    address: "0x93054188d876f558f4a66B2EF1d97d16eDf0895B",
    token: "0x49849C98ae39Fff122806C06791Fa73784FB3675",
    tokens: [
      "0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D",
      "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    ],
    gauge: {
      address: "0xB1F2cdeC61db658F091671F5f199635aEF202CAC",
      type: "LiquidityGauge",
    },
  },
  {
    name: "Curve aDAI/aSUSD",
    type: "regular",
    meta: false,
    address: "0xEB16Ae0052ed37f479f7fe63849198Df1765a733",
    token: "0x02d341CcB60fAaf662bC0554d13778015d1b285C",
    tokens: [
      "0x028171bCA77440897B824Ca71D1c56caC55b68A3",
      "0x6C5024Cd4F8A59110119C56f8933403A539555EB",
    ],
    gauge: {
      address: "0x462253b8F74B72304c145DB0e4Eebd326B22ca39",
      type: "LiquidityGaugeV2",
    },
  },
  {
    name: "Curve renBTC/WBTC/sBTC",
    type: "regular",
    meta: false,
    address: "0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714",
    token: "0x075b1bb99792c9E1041bA13afEf80C91a1e70fB3",
    tokens: [
      "0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D",
      "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      "0xfE18be6b3Bd88A2D2A7f928d00292E7a9963CfC6",
    ],
    gauge: {
      address: "0x705350c4BcD35c9441419DdD5d2f097d7a55410F",
      type: "LiquidityGaugeReward",
    },
    zap: {
      address: "0x7AbDBAf29929e7F8621B757D2a7c04d78d633834",
    },
  },
  {
    name: "Curve ETH/sETH",
    type: "regular",
    meta: false,
    address: "0xc5424B857f758E906013F3555Dad202e4bdB4567",
    token: "0xA3D87FffcE63B53E0d54fAa1cc983B7eB0b74A9c",
    tokens: [
      "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      "0x5e74C9036fb86BD7eCdcb084a0673EFc32eA31cb",
    ],
    gauge: {
      address: "0x3C0FFFF15EA30C35d7A85B85c0782D6c94e1d238",
      type: "LiquidityGaugeV2",
    },
  },
  {
    name: "Curve ETH/stETH",
    type: "regular",
    meta: false,
    address: "0xDC24316b9AE028F1497c275EB9192a3Ea0f67022",
    token: "0x06325440D014e39736583c165C2963BA99fAf14E",
    tokens: [
      "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
    ],
    gauge: {
      address: "0x182B723a58739a9c974cFDB385ceaDb237453c28",
      type: "LiquidityGaugeV2",
    },
  },
  {
    name: "Curve DAI/USDC/USDT/sUSD",
    type: "regular",
    meta: false,
    address: "0xA5407eAE9Ba41422680e2e00537571bcC53efBfD",
    token: "0xC25a3A3b969415c80451098fa907EC722572917F",
    tokens: [
      "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      "0x57Ab1ec28D129707052df4dF418D58a2D46d5f51",
    ],
    gauge: {
      address: "0xA90996896660DEcC6E997655E065b23788857849",
      type: "LiquidityGaugeReward",
    },
    zap: {
      address: "0xFCBa3E75865d2d561BE8D220616520c171F12851",
    },
  },
  {
    name: "Curve cDAI/cUSDC/USDT",
    type: "regular",
    meta: false,
    address: "0x52EA46506B9CC5Ef470C5bf89f17Dc28bB35D85C",
    token: "0x9fC689CCaDa600B6DF723D9E47D84d76664a1F23",
    tokens: [
      "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
      "0x39AA39c021dfbaE8faC545936693aC917d5E7563",
      "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    ],
    gauge: {
      address: "0xBC89cd85491d81C6AD2954E6d0362Ee29fCa8F53",
      type: "LiquidityGauge",
    },
    zap: {
      address: "0xac795D2c97e60DF6a99ff1c814727302fD747a80",
    },
  },
  {
    name: "Curve yDAI/yUSDC/yUSDT/yTUSD",
    type: "regular",
    meta: false,
    address: "0x45F783CCE6B7FF23B2ab2D70e416cdb7D6055f51",
    token: "0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8",
    tokens: [
      "0x16de59092dAE5CcF4A1E6439D611fd0653f0Bd01",
      "0xd6aD7a6750A7593E092a9B218d66C0A814a3436e",
      "0x83f798e925BcD4017Eb265844FDDAbb448f1707D",
      "0x73a052500105205d34Daf004eAb301916DA8190f",
    ],
    gauge: {
      address: "0xFA712EE4788C042e2B7BB55E6cb8ec569C4530c1",
      type: "LiquidityGauge",
    },
    zap: {
      address: "0xbBC81d23Ea2c3ec7e56D39296F0cbB648873a5d3",
    },
  },
  {
    name: "Curve DUSD/3Crv",
    type: "regular",
    meta: true,
    address: "0x8038C01A0390a8c547446a0b2c18fc9aEFEcc10c",
    token: "0x3a664Ab939FD8482048609f652f9a0B0677337B9",
    tokens: [
      "0x5BC25f649fc4e26069dDF4cF4010F9f706c23831",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0xAEA6c312f4b3E04D752946d329693F7293bC2e6D",
      type: "LiquidityGaugeReward",
    },
    zap: {
      address: "0x61E10659fe3aa93d036d099405224E4Ac24996d0",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve GUSD/3Crv",
    type: "regular",
    meta: true,
    address: "0x4f062658EaAF2C1ccf8C8e36D6824CDf41167956",
    token: "0xD2967f45c4f384DEEa880F807Be904762a3DeA07",
    tokens: [
      "0x056Fd409E1d7A124BD7017459dFEa2F387b6d5Cd",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0xC5cfaDA84E902aD92DD40194f0883ad49639b023",
      type: "LiquidityGauge",
    },
    zap: {
      address: "0x64448B78561690B70E17CBE8029a3e5c1bB7136e",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve HUSD/3Crv",
    type: "regular",
    meta: true,
    address: "0x3eF6A01A0f81D6046290f3e2A8c5b843e738E604",
    token: "0x5B5CFE992AdAC0C9D48E05854B2d91C73a003858",
    tokens: [
      "0xdF574c24545E5FfEcb9a659c229253D4111d87e1",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0x2db0E83599a91b508Ac268a6197b8B14F5e72840",
      type: "LiquidityGauge",
    },
    zap: {
      address: "0x09672362833d8f703D5395ef3252D4Bfa51c15ca",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve LINKUSD/3Crv",
    type: "regular",
    meta: true,
    address: "0xE7a24EF0C5e95Ffb0f6684b813A78F2a3AD7D171",
    token: "0x6D65b498cb23deAba52db31c93Da9BFFb340FB8F",
    tokens: [
      "0x0E2EC54fC0B509F445631Bf4b91AB8168230C752",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    zap: {
      address: "0x1de7f0866e2c4adAC7b457c58Cc25c8688CDa1f2",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve mUSD/3Crv",
    type: "regular",
    meta: true,
    address: "0x8474DdbE98F5aA3179B3B3F5942D724aFcdec9f6",
    token: "0x1AEf73d49Dedc4b1778d0706583995958Dc862e6",
    tokens: [
      "0xe2f2a5C287993345a840Db3B0845fbC70f5935a5",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0x5f626c30EC1215f4EdCc9982265E8b1F411D1352",
      type: "LiquidityGaugeReward",
    },
    zap: {
      address: "0x803A2B40c5a9BB2B86DD630B274Fa2A9202874C2",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve RSV/3Crv",
    type: "regular",
    meta: true,
    address: "0xC18cC39da8b11dA8c3541C598eE022258F9744da",
    token: "0xC2Ee6b0334C261ED60C72f6054450b61B8f18E35",
    tokens: [
      "0x196f4727526eA7FB1e17b2071B3d8eAA38486988",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0x4dC4A289a8E33600D8bD4cf5F6313E43a37adec7",
      type: "LiquidityGaugeReward",
    },
    zap: {
      address: "0xBE175115BF33E12348ff77CcfEE4726866A0Fbd5",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve USDK/3Crv",
    type: "regular",
    meta: true,
    address: "0x3E01dD8a5E1fb3481F0F589056b428Fc308AF0Fb",
    token: "0x97E2768e8E73511cA874545DC5Ff8067eB19B787",
    tokens: [
      "0x1c48f86ae57291F7686349F12601910BD8D470bb",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0xC2b1DF84112619D190193E48148000e3990Bf627",
      type: "LiquidityGauge",
    },
    zap: {
      address: "0xF1f85a74AD6c64315F85af52d3d46bF715236ADc",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve USDN/3Crv",
    type: "regular",
    meta: true,
    address: "0x0f9cb53Ebe405d49A0bbdBD291A65Ff571bC83e1",
    token: "0x4f3E8F405CF5aFC05D68142F3783bDfE13811522",
    tokens: [
      "0x674C6Ad92Fd080e4004b2312b45f796a192D27a0",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0xF98450B5602fa59CC66e1379DFfB6FDDc724CfC4",
      type: "LiquidityGauge",
    },
    zap: {
      address: "0x094d12e5b541784701FD8d65F11fc0598FBC6332",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve USDP/3Crv",
    type: "regular",
    meta: true,
    address: "0x42d7025938bEc20B69cBae5A77421082407f053A",
    token: "0x7Eb40E450b9655f4B3cC4259BCC731c63ff55ae6",
    tokens: [
      "0x1456688345527bE1f37E9e627DA0837D6f08C925",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0x055be5DDB7A925BfEF3417FC157f53CA77cA7222",
      type: "LiquidityGaugeV2",
    },
    zap: {
      address: "0x3c8cAee4E09296800f8D29A68Fa3837e2dae4940",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve UST/3Crv",
    type: "regular",
    meta: true,
    address: "0x890f4e345B1dAED0367A877a1612f86A1f86985f",
    token: "0x94e131324b6054c0D789b190b2dAC504e4361b53",
    tokens: [
      "0xa47c8bf37f92aBed4A126BDA807A7b7498661acD",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0x3B7020743Bc2A4ca9EaF9D0722d42E20d6935855",
      type: "LiquidityGaugeV2",
    },
    zap: {
      address: "0xB0a0716841F2Fc03fbA72A891B8Bb13584F52F2d",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve BBTC/crvRenWSBTC",
    type: "regular",
    meta: true,
    address: "0x071c661B4DeefB59E2a3DdB20Db036821eeE8F4b",
    token: "0x410e3E86ef427e30B9235497143881f717d93c2A",
    tokens: [
      "0x9BE89D2a4cd102D8Fecc6BF9dA793be995C22541",
      "0x075b1bb99792c9E1041bA13afEf80C91a1e70fB3",
    ],
    gauge: {
      address: "0xdFc7AdFa664b08767b735dE28f9E84cd30492aeE",
      type: "LiquidityGaugeV2",
    },
    zap: {
      address: "0xC45b2EEe6e09cA176Ca3bB5f7eEe7C47bF93c756",
      basePool: {
        address: "0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714",
        tokens: [
          "0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D",
          "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
          "0xfE18be6b3Bd88A2D2A7f928d00292E7a9963CfC6",
        ],
      },
    },
  },
  {
    name: "Curve oBTC/crvRenWSBTC",
    type: "regular",
    meta: true,
    address: "0xd81dA8D904b52208541Bade1bD6595D8a251F8dd",
    token: "0x2fE94ea3d5d4a175184081439753DE15AeF9d614",
    tokens: [
      "0x8064d9Ae6cDf087b1bcd5BDf3531bD5d8C537a68",
      "0x075b1bb99792c9E1041bA13afEf80C91a1e70fB3",
    ],
    gauge: {
      address: "0x11137B10C210b579405c21A07489e28F3c040AB1",
      type: "LiquidityGaugeV2",
    },
    zap: {
      address: "0xd5BCf53e2C81e1991570f33Fa881c49EEa570C8D",
      basePool: {
        address: "0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714",
        tokens: [
          "0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D",
          "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
          "0xfE18be6b3Bd88A2D2A7f928d00292E7a9963CfC6",
        ],
      },
    },
  },
  {
    name: "Curve pBTC/crvRenWSBTC",
    type: "regular",
    meta: true,
    address: "0x7F55DDe206dbAD629C080068923b36fe9D6bDBeF",
    token: "0xDE5331AC4B3630f94853Ff322B66407e0D6331E8",
    tokens: [
      "0x5228a22e72ccC52d415EcFd199F99D0665E7733b",
      "0x075b1bb99792c9E1041bA13afEf80C91a1e70fB3",
    ],
    gauge: {
      address: "0xd7d147c6Bb90A718c3De8C0568F9B560C79fa416",
      type: "LiquidityGaugeV2",
    },
    zap: {
      address: "0x11F419AdAbbFF8d595E7d5b223eee3863Bb3902C",
      basePool: {
        address: "0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714",
        tokens: [
          "0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D",
          "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
          "0xfE18be6b3Bd88A2D2A7f928d00292E7a9963CfC6",
        ],
      },
    },
  },
  {
    name: "Curve TBTC/crvRenWSBTC",
    type: "regular",
    meta: true,
    address: "0xC25099792E9349C7DD09759744ea681C7de2cb66",
    token: "0x64eda51d3Ad40D56b9dFc5554E06F94e1Dd786Fd",
    tokens: [
      "0x8dAEBADE922dF735c38C80C7eBD708Af50815fAa",
      "0x075b1bb99792c9E1041bA13afEf80C91a1e70fB3",
    ],
    gauge: {
      address: "0x6828bcF74279eE32f2723eC536c22c51Eed383C6",
      type: "LiquidityGaugeReward",
    },
    zap: {
      address: "0xaa82ca713D94bBA7A89CEAB55314F9EfFEdDc78c",
      basePool: {
        address: "0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714",
        tokens: [
          "0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D",
          "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
          "0xfE18be6b3Bd88A2D2A7f928d00292E7a9963CfC6",
        ],
      },
    },
  },
  {
    name: "Curve TUSD/3Crv",
    type: "regular",
    meta: true,
    address: "0xEcd5e75AFb02eFa118AF914515D6521aaBd189F1",
    token: "0xEcd5e75AFb02eFa118AF914515D6521aaBd189F1",
    tokens: [
      "0x0000000000085d4780B73119b644AE5ecd22b376",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0x359FD5d6417aE3D8D6497d9B2e7A890798262BA4",
      type: "LiquidityGaugeV2",
    },
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve LUSD/3Crv",
    type: "regular",
    meta: true,
    address: "0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA",
    token: "0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA",
    tokens: [
      "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0x9B8519A9a00100720CCdC8a120fBeD319cA47a14",
      type: "LiquidityGaugeV2",
    },
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve FRAX/3Crv",
    type: "regular",
    meta: true,
    address: "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B",
    token: "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B",
    tokens: [
      "0x853d955aCEf822Db058eb8505911ED77F175b99e",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0x72E158d38dbd50A483501c24f792bDAAA3e7D55C",
      type: "LiquidityGaugeV2",
    },
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve BUSD/3Crv",
    type: "regular",
    meta: true,
    address: "0x4807862AA8b2bF68830e4C8dc86D0e9A998e085a",
    token: "0x4807862AA8b2bF68830e4C8dc86D0e9A998e085a",
    tokens: [
      "0x4Fabb145d64652a948d72533023f6E7A623C7C53",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0xd4B22fEdcA85E684919955061fDf353b9d38389b",
      type: "LiquidityGaugeV2",
    },
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve ETH/rETH",
    type: "regular",
    meta: false,
    address: "0xF9440930043eb3997fc70e1339dBb11F341de7A8",
    token: "0x53a901d48795C58f485cBB38df08FA96a24669D5",
    tokens: [
      "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      "0x9559Aaa82d9649C7A7b220E7c461d2E74c9a3593",
    ],
    gauge: {
      address: "0x824F13f1a2F29cFEEa81154b46C0fc820677A637",
      type: "LiquidityGaugeV3",
    },
  },
  {
    name: "Curve alUSD/3Crv",
    type: "regular",
    meta: true,
    address: "0x43b4FdFD4Ff969587185cDB6f0BD875c5Fc83f8c",
    token: "0x43b4FdFD4Ff969587185cDB6f0BD875c5Fc83f8c",
    tokens: [
      "0xBC6DA0FE9aD5f3b0d58160288917AA56653660E9",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0x9582C4ADACB3BCE56Fea3e590F05c3ca2fb9C477",
      type: "LiquidityGaugeV3",
    },
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve USDT/WBTC/WETH",
    type: "regular",
    meta: false,
    address: "0x80466c64868E1ab14a1Ddf27A676C3fcBE638Fe5",
    token: "0xcA3d75aC011BF5aD07a98d02f18225F9bD9A6BDF",
    tokens: [
      "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    ],
    gauge: {
      address: "0x6955a55416a06839309018A8B0cB72c4DDC11f15",
      type: "LiquidityGaugeV3",
    },
    zap: {
      address: "0x331aF2E331bd619DefAa5DAc6c038f53FCF9F785",
    },
  },
  {
    name: "Curve RAI/3Crv",
    type: "regular",
    meta: true,
    address: "0x618788357D0EBd8A37e763ADab3bc575D54c2C7d",
    token: "0x6BA5b4e438FA0aAf7C1bD179285aF65d13bD3D90",
    tokens: [
      "0x03ab458634910AaD20eF5f1C8ee96F1D6ac54919",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0x66ec719045bBD62db5eBB11184c18237D3Cc2E62",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0xcB636B81743Bb8a7F1E355DEBb7D33b07009cCCC",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve MIM/3Crv",
    type: "regular",
    meta: true,
    address: "0x5a6A4D54456819380173272A5E8E9B9904BdF41B",
    token: "0x5a6A4D54456819380173272A5E8E9B9904BdF41B",
    tokens: [
      "0x99D8a9C45b2ecA8864373A26D1459e3Dff1e17F3",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0xd8b712d29381748dB89c36BCa0138d7c75866ddF",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve EURT/sEUR",
    type: "regular",
    meta: false,
    address: "0xFD5dB7463a3aB53fD211b4af195c5BCCC1A03890",
    token: "0xFD5dB7463a3aB53fD211b4af195c5BCCC1A03890",
    tokens: [
      "0xC581b735A1688071A1746c968e0798D642EDE491",
      "0xD71eCFF9342A5Ced620049e616c5035F1dB98620",
    ],
    gauge: {
      address: "0xe8060Ad8971450E624d5289A10017dD30F5dA85F",
      type: "LiquidityGaugeV3",
    },
  },
  {
    name: "Curve USDC/USDT/UST/FRAX",
    type: "regular",
    meta: false,
    address: "0x4e0915C88bC70750D68C481540F081fEFaF22273",
    token: "0x4e0915C88bC70750D68C481540F081fEFaF22273",
    tokens: [
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      "0xa693B19d2931d498c5B318dF961919BB4aee87a5",
      "0x853d955aCEf822Db058eb8505911ED77F175b99e",
    ],
    gauge: {
      address: "0x34883134A39B206A451c2D3B0E7Cac44BE4D9181",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve USDC/USDT",
    type: "regular",
    meta: false,
    address: "0x1005F7406f32a61BD760CfA14aCCd2737913d546",
    token: "0x1005F7406f32a61BD760CfA14aCCd2737913d546",
    tokens: [
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    ],
    gauge: {
      address: "0x9f330Db38caAAe5B61B410e2f0aaD63fff2109d8",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve FRAX/USDC",
    type: "regular",
    meta: false,
    address: "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2",
    token: "0x3175Df0976dFA876431C2E9eE6Bc45b65d3473CC",
    tokens: [
      "0x853d955aCEf822Db058eb8505911ED77F175b99e",
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    ],
    gauge: {
      address: "0xCFc25170633581Bf896CB6CDeE170e3E3Aa59503",
      type: "LiquidityGaugeV5",
    },
    zap: {
      address: "0x08780fb7E580e492c1935bEe4fA5920b94AA95Da",
    },
  },
  {
    name: "Curve ETH/frxETH",
    type: "regular",
    meta: false,
    address: "0xa1F8A6807c402E4A15ef4EBa36528A3FED24E577",
    token: "0xf43211935C781D5ca1a41d2041F397B8A7366C7A",
    tokens: [
      "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      "0x5E8422345238F34275888049021821E8E08CAa1f",
    ],
    gauge: {
      address: "0x2932a86df44Fe8D2A706d8e9c5d51c24883423F5",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve ibEUR/sUSD",
    type: "factory",
    meta: false,
    address: "0x1F71f05CF491595652378Fe94B7820344A551B8E",
    token: "0x1F71f05CF491595652378Fe94B7820344A551B8E",
    tokens: [
      "0x96E61422b6A9bA0e068B6c5ADd4fFaBC6a4aae27",
      "0x57Ab1ec28D129707052df4dF418D58a2D46d5f51",
    ],
  },
  {
    name: "Curve EURT/sEUR",
    type: "factory",
    meta: false,
    address: "0xFD5dB7463a3aB53fD211b4af195c5BCCC1A03890",
    token: "0xFD5dB7463a3aB53fD211b4af195c5BCCC1A03890",
    tokens: [
      "0xC581b735A1688071A1746c968e0798D642EDE491",
      "0xD71eCFF9342A5Ced620049e616c5035F1dB98620",
    ],
  },
  {
    name: "Curve ibKRW/sKRW",
    type: "factory",
    meta: false,
    address: "0x8461A004b50d321CB22B7d034969cE6803911899",
    token: "0x8461A004b50d321CB22B7d034969cE6803911899",
    tokens: [
      "0x95dFDC8161832e4fF7816aC4B6367CE201538253",
      "0x269895a3dF4D73b077Fc823dD6dA1B95f72Aaf9B",
    ],
    gauge: {
      address: "0x1750a3a3d80A3F5333BBe9c4695B0fAd41061ab1",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve ibEUR/sEUR",
    type: "factory",
    meta: false,
    address: "0x19b080FE1ffA0553469D20Ca36219F17Fcf03859",
    token: "0x19b080FE1ffA0553469D20Ca36219F17Fcf03859",
    tokens: [
      "0x96E61422b6A9bA0e068B6c5ADd4fFaBC6a4aae27",
      "0xD71eCFF9342A5Ced620049e616c5035F1dB98620",
    ],
    gauge: {
      address: "0x99fb76F75501039089AAC8f20f487bf84E51d76F",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve CRV/yvBOOST/cvxCRV/sCRV",
    type: "factory",
    meta: false,
    address: "0xDa5B670CcD418a187a3066674A8002Adc9356Ad1",
    token: "0xDa5B670CcD418a187a3066674A8002Adc9356Ad1",
    tokens: [
      "0xD533a949740bb3306d119CC777fa900bA034cd52",
      "0x9d409a0A012CFbA9B15F6D4B36Ac57A46966Ab9a",
      "0x62B9c7356A2Dc64a1969e19C23e4f579F9810Aa7",
      "0xD38aEb759891882e78E957c80656572503D8c1B1",
    ],
  },
  {
    name: "Curve OUSD/3Crv",
    type: "factory",
    meta: true,
    address: "0x87650D7bbfC3A9F10587d7778206671719d9910D",
    token: "0x87650D7bbfC3A9F10587d7778206671719d9910D",
    tokens: [
      "0x2A8e1E676Ec238d8A992307B495b45B3fEAa5e86",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0x25f0cE4E2F8dbA112D9b115710AC297F816087CD",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve aUSDC/aDAI",
    type: "factory",
    meta: false,
    address: "0x6A274dE3e2462c7614702474D64d376729831dCa",
    token: "0x6A274dE3e2462c7614702474D64d376729831dCa",
    tokens: [
      "0xBcca60bB61934080951369a648Fb03DF4F96263C",
      "0x028171bCA77440897B824Ca71D1c56caC55b68A3",
    ],
    gauge: {
      address: "0xD81370Cad41b244B8D2129153997E26CeeAB3bEf",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve FEI/3Crv",
    type: "factory",
    meta: true,
    address: "0x06cb22615BA53E60D67Bf6C341a0fD5E718E1655",
    token: "0x06cb22615BA53E60D67Bf6C341a0fD5E718E1655",
    tokens: [
      "0x956F47F50A910163D8BF957Cf5846D573E7f87CA",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0xdC69D4cB5b86388Fff0b51885677e258883534ae",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve alUSD/3Crv",
    type: "factory",
    meta: true,
    address: "0x43b4FdFD4Ff969587185cDB6f0BD875c5Fc83f8c",
    token: "0x43b4FdFD4Ff969587185cDB6f0BD875c5Fc83f8c",
    tokens: [
      "0xBC6DA0FE9aD5f3b0d58160288917AA56653660E9",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve FRAX/3Crv",
    type: "factory",
    meta: true,
    address: "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B",
    token: "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B",
    tokens: [
      "0x853d955aCEf822Db058eb8505911ED77F175b99e",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve GrapefruitUSD/3Crv",
    type: "factory",
    meta: true,
    address: "0xf5A95ccDe486B5fE98852bB02d8eC80a4b9422BD",
    token: "0xf5A95ccDe486B5fE98852bB02d8eC80a4b9422BD",
    tokens: [
      "0x71dF9Dd3e658f0136c40E2E8eC3988a5226E9A67",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve LUSD/3Crv",
    type: "factory",
    meta: true,
    address: "0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA",
    token: "0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA",
    tokens: [
      "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve MIM/3Crv",
    type: "factory",
    meta: true,
    address: "0x5a6A4D54456819380173272A5E8E9B9904BdF41B",
    token: "0x5a6A4D54456819380173272A5E8E9B9904BdF41B",
    tokens: [
      "0x99D8a9C45b2ecA8864373A26D1459e3Dff1e17F3",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve nUSD/3Crv",
    type: "factory",
    meta: true,
    address: "0x67d9eAe741944D4402eB0D1cB3bC3a168EC1764c",
    token: "0x67d9eAe741944D4402eB0D1cB3bC3a168EC1764c",
    tokens: [
      "0x1BEf2e5DE862034Fb0ed456DF59d29Ecadc9934C",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve CRV/cvxCRV",
    type: "factory",
    meta: false,
    address: "0x9D0464996170c6B9e75eED71c68B99dDEDf279e8",
    token: "0x9D0464996170c6B9e75eED71c68B99dDEDf279e8",
    tokens: [
      "0xD533a949740bb3306d119CC777fa900bA034cd52",
      "0x62B9c7356A2Dc64a1969e19C23e4f579F9810Aa7",
    ],
    gauge: {
      address: "0x903dA6213a5A12B61c821598154EfAd98C3B20E4",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve USDM/3Crv",
    type: "factory",
    meta: true,
    address: "0x5B3b5DF2BF2B6543f78e053bD91C4Bdd820929f1",
    token: "0x5B3b5DF2BF2B6543f78e053bD91C4Bdd820929f1",
    tokens: [
      "0x31d4Eb09a216e181eC8a43ce79226A487D6F0BA9",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0x9AF13a7B1f1Bbf1A2B05c6fBF23ac23A9E573b4E",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve PAR/EURT/EURS/sEUR",
    type: "factory",
    meta: false,
    address: "0x3CFAa1596777CAD9f5004F9a0c443d912E262243",
    token: "0x3CFAa1596777CAD9f5004F9a0c443d912E262243",
    tokens: [
      "0x68037790A0229e9Ce6EaA8A99ea92964106C4703",
      "0xC581b735A1688071A1746c968e0798D642EDE491",
      "0xdB25f211AB05b1c97D595516F45794528a807ad8",
      "0xD71eCFF9342A5Ced620049e616c5035F1dB98620",
    ],
  },
  {
    name: "Curve waUSD/3Crv",
    type: "factory",
    meta: true,
    address: "0x9f6664205988C3bf4B12B851c075102714869535",
    token: "0x9f6664205988C3bf4B12B851c075102714869535",
    tokens: [
      "0xc2db4c131ADaF01c15a1DB654c040c8578929D55",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve DOLA/3Crv",
    type: "factory",
    meta: true,
    address: "0xAA5A67c256e27A5d80712c51971408db3370927D",
    token: "0xAA5A67c256e27A5d80712c51971408db3370927D",
    tokens: [
      "0x865377367054516e17014CcdED1e7d814EDC9ce4",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0x8Fa728F393588E8D8dD1ca397E9a710E53fA553a",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve ibJPY/sJPY",
    type: "factory",
    meta: false,
    address: "0x8818a9bb44Fbf33502bE7c15c500d0C783B73067",
    token: "0x8818a9bb44Fbf33502bE7c15c500d0C783B73067",
    tokens: [
      "0x5555f75e3d5278082200Fb451D1b6bA946D8e13b",
      "0xF6b1C627e95BFc3c1b4c9B825a032Ff0fBf3e07d",
    ],
    gauge: {
      address: "0xeFF437A56A22D7dD86C1202A308536ED8C7da7c1",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve ibAUD/sAUD",
    type: "factory",
    meta: false,
    address: "0x3F1B0278A9ee595635B61817630cC19DE792f506",
    token: "0x3F1B0278A9ee595635B61817630cC19DE792f506",
    tokens: [
      "0xFAFdF0C4c1CB09d430Bf88c75D88BB46DAe09967",
      "0xF48e200EAF9906362BB1442fca31e0835773b8B4",
    ],
    gauge: {
      address: "0x05ca5c01629a8E5845f12ea3A03fF7331932233A",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve ibGBP/sGBP",
    type: "factory",
    meta: false,
    address: "0xD6Ac1CB9019137a896343Da59dDE6d097F710538",
    token: "0xD6Ac1CB9019137a896343Da59dDE6d097F710538",
    tokens: [
      "0x69681f8fde45345C3870BCD5eaf4A05a60E7D227",
      "0x97fe22E7341a0Cd8Db6F6C021A24Dc8f4DAD855F",
    ],
    gauge: {
      address: "0x63d9f3aB7d0c528797A12a0684E50C397E9e79dC",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve ibCHF/sCHF",
    type: "factory",
    meta: false,
    address: "0x9c2C8910F113181783c249d8F6Aa41b51Cde0f0c",
    token: "0x9c2C8910F113181783c249d8F6Aa41b51Cde0f0c",
    tokens: [
      "0x1CC481cE2BD2EC7Bf67d1Be64d4878b16078F309",
      "0x0F83287FF768D1c1e17a42F44d644D7F22e8ee1d",
    ],
    gauge: {
      address: "0x2fA53e8fa5fAdb81f4332C8EcE39Fe62eA2f919E",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve OPEN/MATIC",
    type: "factory",
    meta: false,
    address: "0xc8a7C1c4B748970F57cA59326BcD49F5c9dc43E3",
    token: "0xc8a7C1c4B748970F57cA59326BcD49F5c9dc43E3",
    tokens: [
      "0x69e8b9528CABDA89fe846C67675B5D73d463a916",
      "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
    ],
  },
  {
    name: "Curve EURN/EURT",
    type: "factory",
    meta: false,
    address: "0x3Fb78e61784C9c637D560eDE23Ad57CA1294c14a",
    token: "0x3Fb78e61784C9c637D560eDE23Ad57CA1294c14a",
    tokens: [
      "0x9fcf418B971134625CdF38448B949C8640971671",
      "0xC581b735A1688071A1746c968e0798D642EDE491",
    ],
    gauge: {
      address: "0xD9277b0D007464eFF133622eC0d42081c93Cef02",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve ETH/alETH",
    type: "factory",
    meta: false,
    address: "0xC4C319E2D4d66CcA4464C0c2B32c9Bd23ebe784e",
    token: "0xC4C319E2D4d66CcA4464C0c2B32c9Bd23ebe784e",
    tokens: [
      "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      "0x0100546F2cD4C9D97f798fFC9755E47865FF7Ee6",
    ],
    gauge: {
      address: "0x12dCD9E8D1577b5E4F066d8e7D404404Ef045342",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve tBTC/crvRenWSBTC",
    type: "factory",
    meta: true,
    address: "0xfa65aa60a9D45623c57D383fb4cf8Fb8b854cC4D",
    token: "0xfa65aa60a9D45623c57D383fb4cf8Fb8b854cC4D",
    tokens: [
      "0x18084fbA666a33d37592fA2633fD49a74DD93a88",
      "0x075b1bb99792c9E1041bA13afEf80C91a1e70fB3",
    ],
    gauge: {
      address: "0x29284d30bcb70e86a6C3f84CbC4de0Ce16b0f1CA",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0x7AbDBAf29929e7F8621B757D2a7c04d78d633834",
      basePool: {
        address: "0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714",
        tokens: [
          "0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D",
          "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
          "0xfE18be6b3Bd88A2D2A7f928d00292E7a9963CfC6",
        ],
      },
    },
  },
  {
    name: "Curve kUSD/3Crv",
    type: "factory",
    meta: true,
    address: "0xAc5f019a302c4c8caAC0a7F28183ac62E6e80034",
    token: "0xAc5f019a302c4c8caAC0a7F28183ac62E6e80034",
    tokens: [
      "0xEF779cf3D260dBE6177b30ff08b10Db591a6Dd9C",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve PWRD/3Crv",
    type: "factory",
    meta: true,
    address: "0xbcb91E689114B9Cc865AD7871845C95241Df4105",
    token: "0xbcb91E689114B9Cc865AD7871845C95241Df4105",
    tokens: [
      "0xF0a93d4994B3d98Fb5e3A2F90dBc2d69073Cb86b",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0xb07d00e0eE9b1b2eb9f1B483924155Af7AF0c8Fa",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve fUSD/3Crv",
    type: "factory",
    meta: true,
    address: "0xC2F5FeA5197a3d92736500Fd7733Fcc7a3bBDf3F",
    token: "0xC2F5FeA5197a3d92736500Fd7733Fcc7a3bBDf3F",
    tokens: [
      "0x42ef9077d8e79689799673ae588E046f8832CB95",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve wCOINBASE-IOU/3Crv",
    type: "factory",
    meta: true,
    address: "0x705DA2596cf6aaA2FEA36f2a59985EC9e8aeC7E2",
    token: "0x705DA2596cf6aaA2FEA36f2a59985EC9e8aeC7E2",
    tokens: [
      "0x4185cf99745B2a20727B37EE798193DD4a56cDfa",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve DEI/3Crv",
    type: "factory",
    meta: true,
    address: "0x6870F9b4DD5d34C7FC53D0d85D9dBd1aAB339BF7",
    token: "0x6870F9b4DD5d34C7FC53D0d85D9dBd1aAB339BF7",
    tokens: [
      "0xDE12c7959E1a72bbe8a5f7A1dc8f8EeF9Ab011B3",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve MIM/UST",
    type: "factory",
    meta: false,
    address: "0x55A8a39bc9694714E2874c1ce77aa1E599461E18",
    token: "0x55A8a39bc9694714E2874c1ce77aa1E599461E18",
    tokens: [
      "0x99D8a9C45b2ecA8864373A26D1459e3Dff1e17F3",
      "0xa47c8bf37f92aBed4A126BDA807A7b7498661acD",
    ],
    gauge: {
      address: "0xB518f5e3242393d4eC792BD3f44946A3b98d0E48",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve vETH2/WETH",
    type: "factory",
    meta: false,
    address: "0xf03bD3cfE85f00bF5819AC20f0870cE8a8d1F0D8",
    token: "0xf03bD3cfE85f00bF5819AC20f0870cE8a8d1F0D8",
    tokens: [
      "0x898BAD2774EB97cF6b94605677F43b41871410B1",
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    ],
  },
  {
    name: "Curve CVX/bveCVX",
    type: "factory",
    meta: false,
    address: "0x04c90C198b2eFF55716079bc06d7CCc4aa4d7512",
    token: "0x04c90C198b2eFF55716079bc06d7CCc4aa4d7512",
    tokens: [
      "0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B",
      "0xfd05D3C7fe2924020620A8bE4961bBaA747e6305",
    ],
    gauge: {
      address: "0x1b759A88543931F4Bb983bCA4194306039cb979C",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve UST/3Crv",
    type: "factory",
    meta: true,
    address: "0xCEAF7747579696A2F0bb206a14210e3c9e6fB269",
    token: "0xCEAF7747579696A2F0bb206a14210e3c9e6fB269",
    tokens: [
      "0xa693B19d2931d498c5B318dF961919BB4aee87a5",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0xb0f5d00e5916c8b8981e99191A1458704B587b2b",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve ETH/aETHb",
    type: "factory",
    meta: false,
    address: "0xFB9a265b5a1f52d97838Ec7274A0b1442efAcC87",
    token: "0xFB9a265b5a1f52d97838Ec7274A0b1442efAcC87",
    tokens: [
      "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      "0xD01ef7C0A5d8c432fc2d1a85c66cF2327362E5C6",
    ],
    gauge: {
      address: "0xdD9b30168AeDed944042568BfE16F73EF2B4573E",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve FRAX/FEI/alUSD",
    type: "factory",
    meta: false,
    address: "0xBaaa1F5DbA42C3389bDbc2c9D2dE134F5cD0Dc89",
    token: "0xBaaa1F5DbA42C3389bDbc2c9D2dE134F5cD0Dc89",
    tokens: [
      "0x853d955aCEf822Db058eb8505911ED77F175b99e",
      "0x956F47F50A910163D8BF957Cf5846D573E7f87CA",
      "0xBC6DA0FE9aD5f3b0d58160288917AA56653660E9",
    ],
    gauge: {
      address: "0x16C2beE6f55dAB7F494dBa643fF52ef2D47FBA36",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve MATIC/aMATICb",
    type: "factory",
    meta: false,
    address: "0x1F6bb2a7a2A84d08bb821B89E38cA651175aeDd4",
    token: "0x1F6bb2a7a2A84d08bb821B89E38cA651175aeDd4",
    tokens: [
      "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
      "0x99534Ef705Df1FFf4e4bD7bbaAF9b0dFf038EbFe",
    ],
    gauge: {
      address: "0xD4A0DB2627670A3fC1390f0947eD1CcD29bEd28c",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve USDP/3Crv",
    type: "factory",
    meta: true,
    address: "0xc270b3B858c335B6BA5D5b10e2Da8a09976005ad",
    token: "0xc270b3B858c335B6BA5D5b10e2Da8a09976005ad",
    tokens: [
      "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0xC95bdf13A08A547E4dD9f29B00aB7fF08C5d093d",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve wibBTC/crvRenWSBTC",
    type: "factory",
    meta: true,
    address: "0xFbdCA68601f835b27790D98bbb8eC7f05FDEaA9B",
    token: "0xFbdCA68601f835b27790D98bbb8eC7f05FDEaA9B",
    tokens: [
      "0x8751D4196027d4e6DA63716fA7786B5174F04C15",
      "0x075b1bb99792c9E1041bA13afEf80C91a1e70fB3",
    ],
    gauge: {
      address: "0x346C7BB1A7a6A30c8e81c14e90FC2f0FBddc54d8",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0x7AbDBAf29929e7F8621B757D2a7c04d78d633834",
      basePool: {
        address: "0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714",
        tokens: [
          "0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D",
          "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
          "0xfE18be6b3Bd88A2D2A7f928d00292E7a9963CfC6",
        ],
      },
    },
  },
  {
    name: "Curve ZARP/ibZAR",
    type: "factory",
    meta: false,
    address: "0xcbD5cC53C5b846671C6434Ab301AD4d210c21184",
    token: "0xcbD5cC53C5b846671C6434Ab301AD4d210c21184",
    tokens: [
      "0x8CB24ed2e4f7e2065f4eB2bE5f6B0064B1919850",
      "0x81d66D255D47662b6B16f3C5bbfBb15283B05BC2",
    ],
    gauge: {
      address: "0xDB190E4d9c9A95fdF066b258892b8D6Bb107434e",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve agEUR/EURT/EURS",
    type: "factory",
    meta: false,
    address: "0xb9446c4Ef5EBE66268dA6700D26f96273DE3d571",
    token: "0xb9446c4Ef5EBE66268dA6700D26f96273DE3d571",
    tokens: [
      "0x1a7e4e63778B4f12a199C062f3eFdD288afCBce8",
      "0xC581b735A1688071A1746c968e0798D642EDE491",
      "0xdB25f211AB05b1c97D595516F45794528a807ad8",
    ],
    gauge: {
      address: "0x1E212e054d74ed136256fc5a5DDdB4867c6E003F",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve tWETH/WETH",
    type: "factory",
    meta: false,
    address: "0x06d39e95977349431E3d800d49C63B4D472e10FB",
    token: "0x06d39e95977349431E3d800d49C63B4D472e10FB",
    tokens: [
      "0xD3D13a578a53685B4ac36A1Bab31912D2B2A2F36",
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    ],
  },
  {
    name: "Curve XSTUSD/3Crv",
    type: "factory",
    meta: true,
    address: "0x1033812EFeC8716BBaE0c19e5678698D25E26eDf",
    token: "0x1033812EFeC8716BBaE0c19e5678698D25E26eDf",
    tokens: [
      "0xc7D9c108D4E1dD1484D3e2568d7f74bfD763d356",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0xb3D8e2a22A28dc55B26236c45Cc1DF75E5081eF5",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve XIM/3Crv",
    type: "factory",
    meta: true,
    address: "0x6d8fF88973b15dF3e2dc6ABb9aF29Cad8C2B5Ef5",
    token: "0x6d8fF88973b15dF3e2dc6ABb9aF29Cad8C2B5Ef5",
    tokens: [
      "0x573d2505a7ee69D136A8667b4Cd915f039AC54e5",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0x63093C86472469F55C4F6C7cBFF83ec18CD8a94B",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve HOME/3Crv",
    type: "factory",
    meta: true,
    address: "0x3b22B869ba3c0a495Cead0B8A009b70886d37fAC",
    token: "0x3b22B869ba3c0a495Cead0B8A009b70886d37fAC",
    tokens: [
      "0xb8919522331C59f5C16bDfAA6A121a6E03A91F62",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve JPYC/ibJPY",
    type: "factory",
    meta: false,
    address: "0xbB2dC673E1091abCA3eaDB622b18f6D4634b2CD9",
    token: "0xbB2dC673E1091abCA3eaDB622b18f6D4634b2CD9",
    tokens: [
      "0x2370f9d504c7a6E775bf6E14B3F12846b594cD53",
      "0x5555f75e3d5278082200Fb451D1b6bA946D8e13b",
    ],
  },
  {
    name: "Curve CVX/bentCVX",
    type: "factory",
    meta: false,
    address: "0xf083FBa98dED0f9C970e5a418500bad08D8b9732",
    token: "0xf083FBa98dED0f9C970e5a418500bad08D8b9732",
    tokens: [
      "0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B",
      "0x9E0441E084F5dB0606565737158aa6Ab6B970fE0",
    ],
  },
  {
    name: "Curve USX/3Crv",
    type: "factory",
    meta: true,
    address: "0x76264772707c8Bc24261516b560cBF3Cbe6F7819",
    token: "0x76264772707c8Bc24261516b560cBF3Cbe6F7819",
    tokens: [
      "0x0a5E677a6A24b2F1A2Bf4F3bFfC443231d2fDEc8",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve ibEUR/agEUR",
    type: "factory",
    meta: false,
    address: "0xB37D6c07482Bc11cd28a1f11f1a6ad7b66Dec933",
    token: "0xB37D6c07482Bc11cd28a1f11f1a6ad7b66Dec933",
    tokens: [
      "0x96E61422b6A9bA0e068B6c5ADd4fFaBC6a4aae27",
      "0x1a7e4e63778B4f12a199C062f3eFdD288afCBce8",
    ],
    gauge: {
      address: "0x38039dD47636154273b287F74C432Cac83Da97e2",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve tFRAX/FRAX",
    type: "factory",
    meta: false,
    address: "0x694650a0B2866472c2EEA27827CE6253C1D13074",
    token: "0x694650a0B2866472c2EEA27827CE6253C1D13074",
    tokens: [
      "0x94671A3ceE8C7A12Ea72602978D1Bb84E920eFB2",
      "0x853d955aCEf822Db058eb8505911ED77F175b99e",
    ],
  },
  {
    name: "Curve BEAN/3Crv",
    type: "factory",
    meta: true,
    address: "0x3a70DfA7d2262988064A2D051dd47521E43c9BdD",
    token: "0x3a70DfA7d2262988064A2D051dd47521E43c9BdD",
    tokens: [
      "0xDC59ac4FeFa32293A95889Dc396682858d52e5Db",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0x6F98dA2D5098604239C07875C6B7Fd583BC520b9",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve USDV/3Crv",
    type: "factory",
    meta: true,
    address: "0x7abD51BbA7f9F6Ae87aC77e1eA1C5783adA56e5c",
    token: "0x7abD51BbA7f9F6Ae87aC77e1eA1C5783adA56e5c",
    tokens: [
      "0xea3Fb6f331735252E7Bfb0b24b3B761301293DBe",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve BaoUSD/3Crv",
    type: "factory",
    meta: true,
    address: "0x0FaFaFD3C393ead5F5129cFC7e0E12367088c473",
    token: "0x0FaFaFD3C393ead5F5129cFC7e0E12367088c473",
    tokens: [
      "0x7945b0A6674b175695e5d1D08aE1e6F13744Abb0",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve tGAMMA/GAMMA",
    type: "factory",
    meta: false,
    address: "0x9462F2b3C9bEeA8afc334Cdb1D1382B072e494eA",
    token: "0x9462F2b3C9bEeA8afc334Cdb1D1382B072e494eA",
    tokens: [
      "0x2Fc6e9c1b2C07E18632eFE51879415a580AD22E1",
      "0x6BeA7CFEF803D1e3d5f7C0103f7ded065644e197",
    ],
  },
  {
    name: "Curve tSNX/SNX",
    type: "factory",
    meta: false,
    address: "0x50B0D9171160d6EB8Aa39E090Da51E7e078E81c4",
    token: "0x50B0D9171160d6EB8Aa39E090Da51E7e078E81c4",
    tokens: [
      "0xeff721Eae19885e17f5B80187d6527aad3fFc8DE",
      "0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F",
    ],
  },
  {
    name: "Curve rETH/wstETH",
    type: "factory",
    meta: false,
    address: "0x447Ddd4960d9fdBF6af9a790560d0AF76795CB08",
    token: "0x447Ddd4960d9fdBF6af9a790560d0AF76795CB08",
    tokens: [
      "0xae78736Cd615f374D3085123A210448E74Fc6393",
      "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
    ],
    gauge: {
      address: "0x8aD7e0e6EDc61bC48ca0DD07f9021c249044eD30",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve tAPW/APW",
    type: "factory",
    meta: false,
    address: "0xCaf8703f8664731cEd11f63bB0570E53Ab4600A9",
    token: "0xCaf8703f8664731cEd11f63bB0570E53Ab4600A9",
    tokens: [
      "0xDc0b02849Bb8E0F126a216A2840275Da829709B0",
      "0x4104b135DBC9609Fc1A9490E61369036497660c8",
    ],
  },
  {
    name: "Curve tTCR/TCR",
    type: "factory",
    meta: false,
    address: "0x01FE650EF2f8e2982295489AE6aDc1413bF6011F",
    token: "0x01FE650EF2f8e2982295489AE6aDc1413bF6011F",
    tokens: [
      "0x15A629f0665A3Eb97D7aE9A7ce7ABF73AeB79415",
      "0x9C4A4204B79dd291D6b6571C5BE8BbcD0622F050",
    ],
  },
  {
    name: "Curve tFOX/FOX",
    type: "factory",
    meta: false,
    address: "0xC250B22d15e43d95fBE27B12d98B6098f8493eaC",
    token: "0xC250B22d15e43d95fBE27B12d98B6098f8493eaC",
    tokens: [
      "0x808D3E6b23516967ceAE4f17a5F9038383ED5311",
      "0xc770EEfAd204B5180dF6a14Ee197D99d808ee52d",
    ],
  },
  {
    name: "Curve tSUSHI/SUSHI",
    type: "factory",
    meta: false,
    address: "0x0437ac6109e8A366A1F4816edF312A36952DB856",
    token: "0x0437ac6109e8A366A1F4816edF312A36952DB856",
    tokens: [
      "0xf49764c9C5d644ece6aE2d18Ffd9F1E902629777",
      "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2",
    ],
  },
  {
    name: "Curve tALCX/ALCX",
    type: "factory",
    meta: false,
    address: "0x9001a452d39A8710D27ED5c2E10431C13F5Fba74",
    token: "0x9001a452d39A8710D27ED5c2E10431C13F5Fba74",
    tokens: [
      "0xD3B5D9a561c293Fb42b446FE7e237DaA9BF9AA84",
      "0xdBdb4d16EdA451D0503b854CF79D55697F90c8DF",
    ],
  },
  {
    name: "Curve tFXS/FXS",
    type: "factory",
    meta: false,
    address: "0x961226B64AD373275130234145b96D100Dc0b655",
    token: "0x961226B64AD373275130234145b96D100Dc0b655",
    tokens: [
      "0xADF15Ec41689fc5b6DcA0db7c53c9bFE7981E655",
      "0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0",
    ],
  },
  {
    name: "Curve tFXS/FXS",
    type: "factory",
    meta: false,
    address: "0xe7E4366f6ED6aFd23e88154C00B532BDc0352333",
    token: "0xe7E4366f6ED6aFd23e88154C00B532BDc0352333",
    tokens: [
      "0xADF15Ec41689fc5b6DcA0db7c53c9bFE7981E655",
      "0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0",
    ],
  },
  {
    name: "Curve DYDX/stkDYDX",
    type: "factory",
    meta: false,
    address: "0x04EcD49246bf5143E43e2305136c46AeB6fAd400",
    token: "0x04EcD49246bf5143E43e2305136c46AeB6fAd400",
    tokens: [
      "0x92D6C1e31e14520e676a687F0a93788B716BEff5",
      "0x65f7BA4Ec257AF7c55fd5854E5f6356bBd0fb8EC",
    ],
  },
  {
    name: "Curve pBTC/crvRenWSBTC",
    type: "factory",
    meta: true,
    address: "0xC9467E453620f16b57a34a770C6bceBECe002587",
    token: "0xC9467E453620f16b57a34a770C6bceBECe002587",
    tokens: [
      "0x62199B909FB8B8cf870f97BEf2cE6783493c4908",
      "0x075b1bb99792c9E1041bA13afEf80C91a1e70fB3",
    ],
    gauge: {
      address: "0xB5efA93d5D23642f970aF41a1ea9A26f19CbD2Eb",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0x7AbDBAf29929e7F8621B757D2a7c04d78d633834",
      basePool: {
        address: "0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714",
        tokens: [
          "0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D",
          "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
          "0xfE18be6b3Bd88A2D2A7f928d00292E7a9963CfC6",
        ],
      },
    },
  },
  {
    name: "Curve FXS/sdFXS",
    type: "factory",
    meta: false,
    address: "0x8c524635d52bd7b1Bd55E062303177a7d916C046",
    token: "0x8c524635d52bd7b1Bd55E062303177a7d916C046",
    tokens: [
      "0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0",
      "0x402F878BDd1f5C66FdAF0fabaBcF74741B68ac36",
    ],
    gauge: {
      address: "0xa9A9BC60fc80478059A83f516D5215185eeC2fc0",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve ANGLE/sdANGLE",
    type: "factory",
    meta: false,
    address: "0x48fF31bBbD8Ab553Ebe7cBD84e1eA3dBa8f54957",
    token: "0x48fF31bBbD8Ab553Ebe7cBD84e1eA3dBa8f54957",
    tokens: [
      "0x31429d1856aD1377A8A0079410B297e1a9e214c2",
      "0x752B4c6e92d96467fE9b9a2522EF07228E00F87c",
    ],
    gauge: {
      address: "0x03fFC218C7A9306D21193565CbDc4378952faA8c",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve dfxCAD/CADC",
    type: "factory",
    meta: false,
    address: "0x9CA41a2DaB3CEE15308998868ca644e2e3be5C59",
    token: "0x9CA41a2DaB3CEE15308998868ca644e2e3be5C59",
    tokens: [
      "0xFE32747d0251BA92bcb80b6D16C8257eCF25AB1C",
      "0xcaDC0acd4B445166f12d2C07EAc6E2544FbE2Eef",
    ],
    gauge: {
      address: "0xa5f483571C126B173E33c327e8A293A3492E4566",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve sETH2/stETH",
    type: "factory",
    meta: false,
    address: "0xE95E4c2dAC312F31Dc605533D5A4d0aF42579308",
    token: "0xE95E4c2dAC312F31Dc605533D5A4d0aF42579308",
    tokens: [
      "0xFe2e637202056d30016725477c5da089Ab0A043A",
      "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
    ],
    gauge: {
      address: "0xeCb860e54E33FEA8fAb5B076734e2591D1A9ebA4",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve FIAT/3Crv",
    type: "factory",
    meta: true,
    address: "0xDB8Cc7eCeD700A4bfFdE98013760Ff31FF9408D8",
    token: "0xDB8Cc7eCeD700A4bfFdE98013760Ff31FF9408D8",
    tokens: [
      "0x586Aa273F262909EEF8fA02d90Ab65F5015e0516",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0x71c5dC1B395b02834A97Ecf5a0CA062bf8801B07",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve CRV/sdCRV",
    type: "factory",
    meta: false,
    address: "0xf7b55C3732aD8b2c2dA7c24f30A69f55c54FB717",
    token: "0xf7b55C3732aD8b2c2dA7c24f30A69f55c54FB717",
    tokens: [
      "0xD533a949740bb3306d119CC777fa900bA034cd52",
      "0xD1b5651E55D4CeeD36251c61c50C889B36F6abB5",
    ],
    gauge: {
      address: "0x663FC22e92f26C377Ddf3C859b560C4732ee639a",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve ARTH.usd/FRAX",
    type: "factory",
    meta: false,
    address: "0x5a59Fd6018186471727FAAeAE4e57890aBC49B08",
    token: "0x5a59Fd6018186471727FAAeAE4e57890aBC49B08",
    tokens: [
      "0x973F054eDBECD287209c36A2651094fA52F99a71",
      "0x853d955aCEf822Db058eb8505911ED77F175b99e",
    ],
  },
  {
    name: "Curve PUSd/3Crv",
    type: "factory",
    meta: true,
    address: "0x8EE017541375F6Bcd802ba119bdDC94dad6911A1",
    token: "0x8EE017541375F6Bcd802ba119bdDC94dad6911A1",
    tokens: [
      "0x466a756E9A7401B5e2444a3fCB3c2C12FBEa0a54",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0x89664D561E79Ca22Fd2eA4076b3e5deF0b219C15",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve USDD/3Crv",
    type: "factory",
    meta: true,
    address: "0xe6b5CC1B4b47305c58392CE3D359B10282FC36Ea",
    token: "0xe6b5CC1B4b47305c58392CE3D359B10282FC36Ea",
    tokens: [
      "0x0C10bF8FcB7Bf5412187A595ab97a3609160b5c6",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0xd5d3efC90fFB38987005FdeA303B68306aA5C624",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve WETH/stETH",
    type: "factory",
    meta: false,
    address: "0x828b154032950C8ff7CF8085D841723Db2696056",
    token: "0x828b154032950C8ff7CF8085D841723Db2696056",
    tokens: [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
    ],
    gauge: {
      address: "0xF668E6D326945d499e5B35E7CD2E82aCFbcFE6f0",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve ApeUSD/FRAX",
    type: "factory",
    meta: false,
    address: "0x1977870a4c18a728C19Dd4eB6542451DF06e0A4b",
    token: "0x1977870a4c18a728C19Dd4eB6542451DF06e0A4b",
    tokens: [
      "0xfF709449528B6fB6b88f557F7d93dEce33bca78D",
      "0x853d955aCEf822Db058eb8505911ED77F175b99e",
    ],
  },
  {
    name: "Curve HOME/3Crv",
    type: "factory",
    meta: true,
    address: "0x5c6A6Cf9Ae657A73b98454D17986AF41fC7b44ee",
    token: "0x5c6A6Cf9Ae657A73b98454D17986AF41fC7b44ee",
    tokens: [
      "0xb8919522331C59f5C16bDfAA6A121a6E03A91F62",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0xE277Dd681d966e83F68e5bC7FBfeAf5f1341195F",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve xFraxTempleLP/UNI-V2",
    type: "factory",
    meta: false,
    address: "0xdaDfD00A2bBEb1abc4936b1644a3033e1B653228",
    token: "0xdaDfD00A2bBEb1abc4936b1644a3033e1B653228",
    tokens: [
      "0xBcB8b7FC9197fEDa75C101fA69d3211b5a30dCD9",
      "0x6021444f1706f15465bEe85463BCc7d7cC17Fc03",
    ],
    gauge: {
      address: "0x8f162742a7BCDb87EB52d83c687E43356055a68B",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve wOMI/OMI",
    type: "factory",
    meta: false,
    address: "0xeE98d56f60A5905CbB52348c8719B247DaFe60ec",
    token: "0xeE98d56f60A5905CbB52348c8719B247DaFe60ec",
    tokens: [
      "0x04969cD041C0cafB6AC462Bd65B536A5bDB3A670",
      "0xeD35af169aF46a02eE13b9d79Eb57d6D68C1749e",
    ],
  },
  {
    name: "Curve OMI/3Crv",
    type: "factory",
    meta: true,
    address: "0x8116E7c29f60FdacF3954891A038f845565EF5A0",
    token: "0x8116E7c29f60FdacF3954891A038f845565EF5A0",
    tokens: [
      "0xeD35af169aF46a02eE13b9d79Eb57d6D68C1749e",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve USDS/3Crv",
    type: "factory",
    meta: true,
    address: "0xdE495223F7cD7EE0cDe1AddbD6836046bBdf3ad3",
    token: "0xdE495223F7cD7EE0cDe1AddbD6836046bBdf3ad3",
    tokens: [
      "0x45fDb1b92a649fb6A64Ef1511D3Ba5Bf60044838",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve USDI/3Crv",
    type: "factory",
    meta: true,
    address: "0x63594B2011a0F2616586Bf3EeF8096d42272F916",
    token: "0x63594B2011a0F2616586Bf3EeF8096d42272F916",
    tokens: [
      "0x2A54bA2964C8Cd459Dc568853F79813a60761B58",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve lvUSD/3Crv",
    type: "factory",
    meta: true,
    address: "0x67C7f0a63BA70a2dAc69477B716551FC921aed00",
    token: "0x67C7f0a63BA70a2dAc69477B716551FC921aed00",
    tokens: [
      "0x99899399C097a55afb6b48f797Dc5AcfA7d343B1",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0x427AA775edAb0f2d9301CD988a5A99ba6cC792E6",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve USDD/crvFRAX",
    type: "factory",
    meta: true,
    address: "0x4606326b4Db89373F5377C316d3b0F6e55Bc6A20",
    token: "0x4606326b4Db89373F5377C316d3b0F6e55Bc6A20",
    tokens: [
      "0x0C10bF8FcB7Bf5412187A595ab97a3609160b5c6",
      "0x3175Df0976dFA876431C2E9eE6Bc45b65d3473CC",
    ],
    gauge: {
      address: "0xb8b9dfCB48614FA873ccEC72c79D728d39EC9a5c",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0x08780fb7E580e492c1935bEe4fA5920b94AA95Da",
      basePool: {
        address: "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2",
        tokens: [
          "0x853d955aCEf822Db058eb8505911ED77F175b99e",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        ],
      },
    },
  },
  {
    name: "Curve sUSD/crvFRAX",
    type: "factory",
    meta: true,
    address: "0xe3c190c57b5959Ae62EfE3B6797058B76bA2f5eF",
    token: "0xe3c190c57b5959Ae62EfE3B6797058B76bA2f5eF",
    tokens: [
      "0x57Ab1ec28D129707052df4dF418D58a2D46d5f51",
      "0x3175Df0976dFA876431C2E9eE6Bc45b65d3473CC",
    ],
    gauge: {
      address: "0xf6D7087D4Ae4dCf85956d743406E63cDA74D99AD",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0x08780fb7E580e492c1935bEe4fA5920b94AA95Da",
      basePool: {
        address: "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2",
        tokens: [
          "0x853d955aCEf822Db058eb8505911ED77F175b99e",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        ],
      },
    },
  },
  {
    name: "Curve LUSD/crvFRAX",
    type: "factory",
    meta: true,
    address: "0x497CE58F34605B9944E6b15EcafE6b001206fd25",
    token: "0x497CE58F34605B9944E6b15EcafE6b001206fd25",
    tokens: [
      "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0",
      "0x3175Df0976dFA876431C2E9eE6Bc45b65d3473CC",
    ],
    gauge: {
      address: "0x389Fc079a15354E9cbcE8258433CC0F85B755A42",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0x08780fb7E580e492c1935bEe4fA5920b94AA95Da",
      basePool: {
        address: "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2",
        tokens: [
          "0x853d955aCEf822Db058eb8505911ED77F175b99e",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        ],
      },
    },
  },
  {
    name: "Curve ApeUSD/crvFRAX",
    type: "factory",
    meta: true,
    address: "0x04b727C7e246CA70d496ecF52E6b6280f3c8077D",
    token: "0x04b727C7e246CA70d496ecF52E6b6280f3c8077D",
    tokens: [
      "0xfF709449528B6fB6b88f557F7d93dEce33bca78D",
      "0x3175Df0976dFA876431C2E9eE6Bc45b65d3473CC",
    ],
    gauge: {
      address: "0xD6e48Cc0597a1Ee12a8BeEB88e22bFDb81777164",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0x08780fb7E580e492c1935bEe4fA5920b94AA95Da",
      basePool: {
        address: "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2",
        tokens: [
          "0x853d955aCEf822Db058eb8505911ED77F175b99e",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        ],
      },
    },
  },
  {
    name: "Curve GUSD/crvFRAX",
    type: "factory",
    meta: true,
    address: "0x4e43151b78b5fbb16298C1161fcbF7531d5F8D93",
    token: "0x4e43151b78b5fbb16298C1161fcbF7531d5F8D93",
    tokens: [
      "0x056Fd409E1d7A124BD7017459dFEa2F387b6d5Cd",
      "0x3175Df0976dFA876431C2E9eE6Bc45b65d3473CC",
    ],
    gauge: {
      address: "0xda7F9DD286577cC338047B040c289463743a474e",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0x08780fb7E580e492c1935bEe4fA5920b94AA95Da",
      basePool: {
        address: "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2",
        tokens: [
          "0x853d955aCEf822Db058eb8505911ED77F175b99e",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        ],
      },
    },
  },
  {
    name: "Curve BUSD/crvFRAX",
    type: "factory",
    meta: true,
    address: "0x8fdb0bB9365a46B145Db80D0B1C5C5e979C84190",
    token: "0x8fdb0bB9365a46B145Db80D0B1C5C5e979C84190",
    tokens: [
      "0x4Fabb145d64652a948d72533023f6E7A623C7C53",
      "0x3175Df0976dFA876431C2E9eE6Bc45b65d3473CC",
    ],
    gauge: {
      address: "0xAeac6Dcd12CC0BE74c8f99EfE4bB5205a1f9A608",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0x08780fb7E580e492c1935bEe4fA5920b94AA95Da",
      basePool: {
        address: "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2",
        tokens: [
          "0x853d955aCEf822Db058eb8505911ED77F175b99e",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        ],
      },
    },
  },
  {
    name: "Curve TUSD/crvFRAX",
    type: "factory",
    meta: true,
    address: "0x33baeDa08b8afACc4d3d07cf31d49FC1F1f3E893",
    token: "0x33baeDa08b8afACc4d3d07cf31d49FC1F1f3E893",
    tokens: [
      "0x0000000000085d4780B73119b644AE5ecd22b376",
      "0x3175Df0976dFA876431C2E9eE6Bc45b65d3473CC",
    ],
    gauge: {
      address: "0xf865FDd6a5F307F398a94Dc40687995Cfaa77BC9",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0x08780fb7E580e492c1935bEe4fA5920b94AA95Da",
      basePool: {
        address: "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2",
        tokens: [
          "0x853d955aCEf822Db058eb8505911ED77F175b99e",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        ],
      },
    },
  },
  {
    name: "Curve cEUR/agEUR/EUROC",
    type: "factory",
    meta: false,
    address: "0xe7A3b38c39F97E977723bd1239C3470702568e7B",
    token: "0xe7A3b38c39F97E977723bd1239C3470702568e7B",
    tokens: [
      "0xEE586e7Eaad39207F0549BC65f19e336942C992f",
      "0x1a7e4e63778B4f12a199C062f3eFdD288afCBce8",
      "0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c",
    ],
    gauge: {
      address: "0x9f57569EaA61d427dEEebac8D9546A745160391C",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve alUSD/crvFRAX",
    type: "factory",
    meta: true,
    address: "0xB30dA2376F63De30b42dC055C93fa474F31330A5",
    token: "0xB30dA2376F63De30b42dC055C93fa474F31330A5",
    tokens: [
      "0xBC6DA0FE9aD5f3b0d58160288917AA56653660E9",
      "0x3175Df0976dFA876431C2E9eE6Bc45b65d3473CC",
    ],
    gauge: {
      address: "0x740BA8aa0052E07b925908B380248cb03f3DE5cB",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0x08780fb7E580e492c1935bEe4fA5920b94AA95Da",
      basePool: {
        address: "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2",
        tokens: [
          "0x853d955aCEf822Db058eb8505911ED77F175b99e",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        ],
      },
    },
  },
  {
    name: "Curve GCD/USDP",
    type: "factory",
    meta: false,
    address: "0x649c1B0e70A80210bcFB3C4eb5DDAd175B90BE4d",
    token: "0x649c1B0e70A80210bcFB3C4eb5DDAd175B90BE4d",
    tokens: [
      "0x213ecAe6b3CbC0AD976f7d82626546d5b63A71cB",
      "0x1456688345527bE1f37E9e627DA0837D6f08C925",
    ],
  },
  {
    name: "Curve stETH/aETHb",
    type: "factory",
    meta: false,
    address: "0x875DF0bA24ccD867f8217593ee27253280772A97",
    token: "0x875DF0bA24ccD867f8217593ee27253280772A97",
    tokens: [
      "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
      "0xD01ef7C0A5d8c432fc2d1a85c66cF2327362E5C6",
    ],
  },
  {
    name: "Curve LFT/sdLFT",
    type: "factory",
    meta: false,
    address: "0xC69b00366F07840fF939cc9fdF866C3dCCB10804",
    token: "0xC69b00366F07840fF939cc9fdF866C3dCCB10804",
    tokens: [
      "0xB620Be8a1949AA9532e6a3510132864EF9Bc3F82",
      "0x0879c1a344910c2944C29b892A1CF0c216122C66",
    ],
  },
  {
    name: "Curve BEAN/3Crv",
    type: "factory",
    meta: true,
    address: "0xc9C32cd16Bf7eFB85Ff14e0c8603cc90F6F2eE49",
    token: "0xc9C32cd16Bf7eFB85Ff14e0c8603cc90F6F2eE49",
    tokens: [
      "0xBEA0000029AD1c77D3d5D23Ba2D8893dB9d1Efab",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve ETH/frxETH",
    type: "factory",
    meta: false,
    address: "0x7c0316C925E12eBfC55e0f325794B43eaD425157",
    token: "0x7c0316C925E12eBfC55e0f325794B43eaD425157",
    tokens: [
      "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      "0x00000000008FD4F395Ec6F12920bae9Cb6C722e4",
    ],
  },
  {
    name: "Curve tMYC/MYC",
    type: "factory",
    meta: false,
    address: "0x83D78bf3f861e898cCA47BD076b3839Ab5469d70",
    token: "0x83D78bf3f861e898cCA47BD076b3839Ab5469d70",
    tokens: [
      "0x061aee9ab655e73719577EA1df116D7139b2A7E7",
      "0x4b13006980aCB09645131b91D259eaA111eaF5Ba",
    ],
  },
  {
    name: "Curve fxUSD/crvFRAX",
    type: "factory",
    meta: true,
    address: "0x0AaCe9b6c491d5cD9F80665A2fCc1af09e9CCf00",
    token: "0x0AaCe9b6c491d5cD9F80665A2fCc1af09e9CCf00",
    tokens: [
      "0x8616E8EA83f048ab9A5eC513c9412Dd2993bcE3F",
      "0x3175Df0976dFA876431C2E9eE6Bc45b65d3473CC",
    ],
    zap: {
      address: "0x08780fb7E580e492c1935bEe4fA5920b94AA95Da",
      basePool: {
        address: "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2",
        tokens: [
          "0x853d955aCEf822Db058eb8505911ED77F175b99e",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        ],
      },
    },
  },
  {
    name: "Curve xUSD1/3Crv",
    type: "factory",
    meta: true,
    address: "0x92Da88e2e6f96cC7c667Cd1367BD090ADF3c6053",
    token: "0x92Da88e2e6f96cC7c667Cd1367BD090ADF3c6053",
    tokens: [
      "0xBFEf1f07018B3a87fc1E12877038f9616512D587",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve xUSD1/3Crv",
    type: "factory",
    meta: true,
    address: "0xc5481720517e1B170CF1d19cEaaBE07c37896Eb2",
    token: "0xc5481720517e1B170CF1d19cEaaBE07c37896Eb2",
    tokens: [
      "0xBFEf1f07018B3a87fc1E12877038f9616512D587",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve agEUR/EUROC",
    type: "factory",
    meta: false,
    address: "0xBa3436Fd341F2C8A928452Db3C5A3670d1d5Cc73",
    token: "0xBa3436Fd341F2C8A928452Db3C5A3670d1d5Cc73",
    tokens: [
      "0x1a7e4e63778B4f12a199C062f3eFdD288afCBce8",
      "0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c",
    ],
    gauge: {
      address: "0xF9F46eF781b9C7B76e8B505226d5E0e0E7FE2f04",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve APW/sdAPW",
    type: "factory",
    meta: false,
    address: "0x6788f608CfE5CfCD02e6152eC79505341E0774be",
    token: "0x6788f608CfE5CfCD02e6152eC79505341E0774be",
    tokens: [
      "0x4104b135DBC9609Fc1A9490E61369036497660c8",
      "0x26f01FE3BE55361b0643bc9d5D60980E37A2770D",
    ],
  },
  {
    name: "Curve PUSd/crvFRAX",
    type: "factory",
    meta: true,
    address: "0xC47EBd6c0f68fD5963005D28D0ba533750E5C11B",
    token: "0xC47EBd6c0f68fD5963005D28D0ba533750E5C11B",
    tokens: [
      "0x466a756E9A7401B5e2444a3fCB3c2C12FBEa0a54",
      "0x3175Df0976dFA876431C2E9eE6Bc45b65d3473CC",
    ],
    gauge: {
      address: "0x28216318D85b2D6d8c2cB38eed08001d9348803b",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0x08780fb7E580e492c1935bEe4fA5920b94AA95Da",
      basePool: {
        address: "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2",
        tokens: [
          "0x853d955aCEf822Db058eb8505911ED77F175b99e",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        ],
      },
    },
  },
  {
    name: "Curve MAI/crvFRAX",
    type: "factory",
    meta: true,
    address: "0x66E335622ad7a6C9c72c98dbfCCE684996a20Ef9",
    token: "0x66E335622ad7a6C9c72c98dbfCCE684996a20Ef9",
    tokens: [
      "0x8D6CeBD76f18E1558D4DB88138e2DeFB3909fAD6",
      "0x3175Df0976dFA876431C2E9eE6Bc45b65d3473CC",
    ],
    gauge: {
      address: "0xB3783f527B7704DeeD4993f7c1c779E426A04368",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0x08780fb7E580e492c1935bEe4fA5920b94AA95Da",
      basePool: {
        address: "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2",
        tokens: [
          "0x853d955aCEf822Db058eb8505911ED77F175b99e",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        ],
      },
    },
  },
  {
    name: "Curve DOLA/crvFRAX",
    type: "factory",
    meta: true,
    address: "0xE57180685E3348589E9521aa53Af0BCD497E884d",
    token: "0xE57180685E3348589E9521aa53Af0BCD497E884d",
    tokens: [
      "0x865377367054516e17014CcdED1e7d814EDC9ce4",
      "0x3175Df0976dFA876431C2E9eE6Bc45b65d3473CC",
    ],
    gauge: {
      address: "0xBE266d68Ce3dDFAb366Bb866F4353B6FC42BA43c",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0x08780fb7E580e492c1935bEe4fA5920b94AA95Da",
      basePool: {
        address: "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2",
        tokens: [
          "0x853d955aCEf822Db058eb8505911ED77F175b99e",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        ],
      },
    },
  },
  {
    name: "Curve BPT/sdBPT",
    type: "factory",
    meta: false,
    address: "0x9d259cA698746586107C234e9E9461d385ca1041",
    token: "0x9d259cA698746586107C234e9E9461d385ca1041",
    tokens: [
      "0x0eC9F76202a7061eB9b3a7D6B59D36215A7e37da",
      "0x825Ba129b3EA1ddc265708fcbB9dd660fdD2ef73",
    ],
  },
  {
    name: "Curve MAI/LUSD",
    type: "factory",
    meta: false,
    address: "0xF8048E871dF466BD187078cb38CB914476319d33",
    token: "0xF8048E871dF466BD187078cb38CB914476319d33",
    tokens: [
      "0x8D6CeBD76f18E1558D4DB88138e2DeFB3909fAD6",
      "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0",
    ],
    gauge: {
      address: "0xdf81a4d691B2Ab7f359D5B981D1f273a815809DC",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve CRV/yCRV",
    type: "factory",
    meta: false,
    address: "0x453D92C7d4263201C69aACfaf589Ed14202d83a4",
    token: "0x453D92C7d4263201C69aACfaf589Ed14202d83a4",
    tokens: [
      "0xD533a949740bb3306d119CC777fa900bA034cd52",
      "0xFCc5c47bE19d06BF83eB04298b026F81069ff65b",
    ],
    gauge: {
      address: "0x5980d25B4947594c26255C0BF301193ab64ba803",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve ETH/pETH",
    type: "factory",
    meta: false,
    address: "0x9848482da3Ee3076165ce6497eDA906E66bB85C5",
    token: "0x9848482da3Ee3076165ce6497eDA906E66bB85C5",
    tokens: [
      "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      "0x836A808d4828586A69364065A1e064609F5078c7",
    ],
    gauge: {
      address: "0x3eE0bD06D004C25273339c5aD91e1443523DC2dF",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve UZD/3Crv",
    type: "factory",
    meta: true,
    address: "0x28B0Cf1baFB707F2c6826d10caf6DD901a6540C5",
    token: "0x28B0Cf1baFB707F2c6826d10caf6DD901a6540C5",
    tokens: [
      "0xe5c987F93734cb44AB03F1B18e30A374254891b6",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0x8550DF44c5b4DD1394Ca08546Cd0286Ba78Ab388",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve tCVX/tclevCVX",
    type: "factory",
    meta: false,
    address: "0xd0E24cB3e766581952dBf258b78e89c63A37f5fb",
    token: "0xd0E24cB3e766581952dBf258b78e89c63A37f5fb",
    tokens: [
      "0x1Ee4dE3CD1505Ddb2e60C20651A4aB7FfABDc8F6",
      "0x246BE97fda42375c39E21377Ad80D8290AfdB994",
    ],
  },
  {
    name: "Curve CVX/clevCVX",
    type: "factory",
    meta: false,
    address: "0xF9078Fb962A7D13F55d40d49C8AA6472aBD1A5a6",
    token: "0xF9078Fb962A7D13F55d40d49C8AA6472aBD1A5a6",
    tokens: [
      "0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B",
      "0xf05e58fCeA29ab4dA01A495140B349F8410Ba904",
    ],
  },
  {
    name: "Curve US/3Crv",
    type: "factory",
    meta: true,
    address: "0xC0Ec468c1B6B94a107B0A83c7a0f6529B388f43A",
    token: "0xC0Ec468c1B6B94a107B0A83c7a0f6529B388f43A",
    tokens: [
      "0xe661493a2F94ccA7f0A7C0566290F9c12e69bd52",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0x72150e9d1562512e32e7b25e0efeB519cFEe4406",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve UZD/3Crv",
    type: "factory",
    meta: true,
    address: "0xbeDca4252b27cc12ed7DaF393F331886F86cd3CE",
    token: "0xbeDca4252b27cc12ed7DaF393F331886F86cd3CE",
    tokens: [
      "0x015B94AB2B0A14A96030573FBcD0F3D3d763541F",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0xf476d99F892C23b3ec828762eBA2b46c3fDa949F",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve USDT/WBTC/WETH",
    type: "crypto v2",
    meta: false,
    address: "0xD51a44d3FaE010294C616388b506AcdA1bfAAE46",
    token: "0xc4AD29ba4B3c580e6D59105FFf484999997675Ff",
    tokens: [
      "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    ],
    gauge: {
      address: "0xDeFd8FdD20e0f34115C7018CCfb655796F6B2168",
      type: "LiquidityGaugeV3",
    },
    zap: {
      address: "0x3993d34e7e99Abf6B6f367309975d1360222D446",
    },
  },
  {
    name: "Curve EURT/3Crv",
    type: "crypto v2",
    meta: true,
    address: "0x9838eCcC42659FA8AA7daF2aD134b53984c9427b",
    token: "0x3b6831c0077a1e44ED0a21841C3bC4dC11bCE833",
    tokens: [
      "0xC581b735A1688071A1746c968e0798D642EDE491",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0x4Fd86Ce7Ecea88F7E0aA78DC12625996Fb3a04bC",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0x5D0F47B32fDd343BfA74cE221808e2abE4A53827",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve USDC/EURS",
    type: "crypto v2",
    meta: false,
    address: "0x98a7F18d4E56Cfe84E3D081B40001B3d5bD3eB8B",
    token: "0x3D229E1B4faab62F621eF2F6A610961f7BD7b23B",
    tokens: [
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "0xdB25f211AB05b1c97D595516F45794528a807ad8",
    ],
    gauge: {
      address: "0x65CA7Dc5CB661fC58De57B1E1aF404649a27AD35",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve WETH/CRV",
    type: "crypto v2",
    meta: false,
    address: "0x8301AE4fc9c624d1D396cbDAa1ed877821D7C511",
    token: "0xEd4064f376cB8d68F770FB1Ff088a3d0F3FF5c4d",
    tokens: [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "0xD533a949740bb3306d119CC777fa900bA034cd52",
    ],
    gauge: {
      address: "0x1cEBdB0856dd985fAe9b8fEa2262469360B8a3a6",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve WETH/CVX",
    type: "crypto v2",
    meta: false,
    address: "0xB576491F1E6e5E62f1d8F26062Ee822B40B0E0d4",
    token: "0x3A283D9c08E8b55966afb64C515f5143cf907611",
    tokens: [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B",
    ],
    gauge: {
      address: "0x7E1444BA99dcdFfE8fBdb42C02F0005D14f13BE1",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve XAUt/3Crv",
    type: "crypto v2",
    meta: true,
    address: "0xAdCFcf9894335dC340f6Cd182aFA45999F45Fc44",
    token: "0x8484673cA7BfF40F82B041916881aeA15ee84834",
    tokens: [
      "0x68749665FF8D2d112Fa859AA293F07A622782F38",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0x1B3E14157ED33F60668f2103bCd5Db39a1573E5B",
      type: "LiquidityGaugeV4",
    },
    zap: {
      address: "0xc5FA220347375ac4f91f9E4A4AAb362F22801504",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve WETH/SPELL",
    type: "crypto v2",
    meta: false,
    address: "0x98638FAcf9a3865cd033F36548713183f6996122",
    token: "0x8282BD15dcA2EA2bDf24163E8f2781B30C43A2ef",
    tokens: [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "0x090185f2135308BaD17527004364eBcC2D37e5F6",
    ],
    gauge: {
      address: "0x08380a4999Be1a958E2abbA07968d703C7A3027C",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve WETH/T",
    type: "crypto v2",
    meta: false,
    address: "0x752eBeb79963cf0732E9c0fec72a49FD1DEfAEAC",
    token: "0xCb08717451aaE9EF950a2524E33B6DCaBA60147B",
    tokens: [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "0xCdF7028ceAB81fA0C6971208e83fa7872994beE5",
    ],
    gauge: {
      address: "0x6070fBD4E608ee5391189E7205d70cc4A274c017",
      type: "LiquidityGaugeV4",
    },
  },
  {
    name: "Curve EUROC/3Crv",
    type: "crypto v2",
    meta: true,
    address: "0xE84f5b1582BA325fDf9cE6B0c1F087ccfC924e54",
    token: "0x70fc957eb90E37Af82ACDbd12675699797745F68",
    tokens: [
      "0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    gauge: {
      address: "0x4329c8F09725c0e3b6884C1daB1771bcE17934F9",
      type: "LiquidityGaugeV5",
    },
    zap: {
      address: "0xd446A98F88E1d053d1F64986E3Ed083bb1Ab7E5A",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve WETH/FXS",
    type: "crypto factory",
    meta: false,
    address: "0x941Eb6F616114e4Ecaa85377945EA306002612FE",
    token: "0x90244F43D548a4f8dFecfAD91a193465B1fad6F7",
    tokens: [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0",
    ],
    "liquidity gauge": {
      address: "0x009aCD89535DAbC270C93F9b39D3232105Fef453",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve BADGER/WBTC",
    type: "crypto factory",
    meta: false,
    address: "0x50f3752289e1456BfA505afd37B241bca23e685d",
    token: "0x137469B55D1f15651BA46A89D0588e97dD0B6562",
    tokens: [
      "0x3472A5A71965499acd81997a54BBA8D852C6E53d",
      "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    ],
    "liquidity gauge": {
      address: "0x02246583870b36Be0fEf2819E1d3A771d6C07546",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve WETH/YFI",
    type: "crypto factory",
    meta: false,
    address: "0xC26b89A667578ec7b3f11b2F98d6Fd15C07C54ba",
    token: "0x29059568bB40344487d62f7450E78b8E6C74e0e5",
    tokens: [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e",
    ],
    "liquidity gauge": {
      address: "0x05255C5BD33672b9FEA4129C13274D1E6193312d",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve AAVE/palStkAAVE",
    type: "crypto factory",
    meta: false,
    address: "0x48536EC5233297C367fd0b6979B75d9270bB6B15",
    token: "0x6085deF4343a0b5d97820F131a362Dae9fE59841",
    tokens: [
      "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
      "0x24E79e946dEa5482212c38aaB2D0782F04cdB0E0",
    ],
    "liquidity gauge": {
      address: "0x82d0aDea8C4CF2fc84A499b568F4C1194d63113d",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve DYDX/WETH",
    type: "crypto factory",
    meta: false,
    address: "0x8b0aFa4b63a3581b731dA9D79774a3eaE63B5ABD",
    token: "0x4aCc1BF7D6a591016641325aA6664A1Cd178F002",
    tokens: [
      "0x92D6C1e31e14520e676a687F0a93788B716BEff5",
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    ],
    "liquidity gauge": {
      address: "0xB81465Ac19B9a57158a79754bDaa91C60fDA91ff",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve WETH/SDT",
    type: "crypto factory",
    meta: false,
    address: "0xfB8814D005C5f32874391e888da6eB2fE7a27902",
    token: "0x6359B6d3e327c497453d4376561eE276c6933323",
    tokens: [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "0x73968b9a57c6E53d41345FD57a6E6ae27d6CDB2F",
    ],
    "liquidity gauge": {
      address: "0x60355587a8D4aa67c2E64060Ab36e566B9bCC000",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve CADC/USDC",
    type: "crypto factory",
    meta: false,
    address: "0xE07BDe9Eb53DEFfa979daE36882014B758111a78",
    token: "0x1054Ff2ffA34c055a13DCD9E0b4c0cA5b3aecEB9",
    tokens: [
      "0xcaDC0acd4B445166f12d2C07EAc6E2544FbE2Eef",
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    ],
    "liquidity gauge": {
      address: "0xE786Df7076AFeECC3faCD841ED4AD20d0F04CF19",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve RAI/agEUR",
    type: "crypto factory",
    meta: false,
    address: "0xB6d9b32407BfA562D9211acDba2631a46c850956",
    token: "0xcA7c3Ac4e5FB7B2Ae60472C80344ea9403C6D2b1",
    tokens: [
      "0x03ab458634910AaD20eF5f1C8ee96F1D6ac54919",
      "0x1a7e4e63778B4f12a199C062f3eFdD288afCBce8",
    ],
    "liquidity gauge": {
      address: "0xCE911692414b38fdfc805c89E6EEa3f8bedbC01B",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve PAR/USDC",
    type: "crypto factory",
    meta: false,
    address: "0xDaD60C5B748306BA5a0c9a3c3482A8D1153DAd2a",
    token: "0x030cAFAE2EcE75eD411aeb53633FBeD3092C3e32",
    tokens: [
      "0x68037790A0229e9Ce6EaA8A99ea92964106C4703",
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    ],
  },
  {
    name: "Curve WETH/DUCK",
    type: "crypto factory",
    meta: false,
    address: "0xd8C49617e6A2C7584Ddbeab652368ee84954BF5c",
    token: "0x91f2f1b9D9c7D838c87B687d2AcCD1f0bE8FaE5d",
    tokens: [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "0x92E187a03B6CD19CB6AF293ba17F2745Fd2357D5",
    ],
    "liquidity gauge": {
      address: "0x474D83Fc6c358242d8638Cb0f733E7B3a457a109",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve WETH/BTRFLY",
    type: "crypto factory",
    meta: false,
    address: "0xF43b15Ab692fDe1F9c24a9FCE700AdCC809D5391",
    token: "0xE160364FD8407FFc8b163e278300c6C5D18Ff61d",
    tokens: [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "0xC0d4Ceb216B3BA9C3701B291766fDCbA977ceC3A",
    ],
    "liquidity gauge": {
      address: "0x5AC6886Edd18ED0AD01C0B0910660637c551FBd6",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve FXS/cvxFXS",
    type: "crypto factory",
    meta: false,
    address: "0xd658A338613198204DCa1143Ac3F01A722b5d94A",
    token: "0xF3A43307DcAFa93275993862Aae628fCB50dC768",
    tokens: [
      "0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0",
      "0xFEEf77d3f69374f66429C91d732A244f074bdf74",
    ],
    "liquidity gauge": {
      address: "0xAB1927160EC7414C6Fa71763E2a9f3D107c126dd",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve OHM/WETH",
    type: "crypto factory",
    meta: false,
    address: "0x6ec38b3228251a0C5D491Faf66858e2E23d7728B",
    token: "0x3660BD168494d61ffDac21E403d0F6356cF90fD7",
    tokens: [
      "0x64aa3364F17a4D01c6f1751Fd97C2BD3D7e7f1D5",
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    ],
    "liquidity gauge": {
      address: "0x8dF6FdAe05C9405853dd4cF2809D5dc2b5E77b0C",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve Silo/FRAX",
    type: "crypto factory",
    meta: false,
    address: "0x9a22CDB1CA1cdd2371cD5BB5199564C4E89465eb",
    token: "0x2302aaBe69e6E7A1b0Aa23aAC68fcCB8A4D2B460",
    tokens: [
      "0x6f80310CA7F2C654691D1383149Fa1A57d8AB1f8",
      "0x853d955aCEf822Db058eb8505911ED77F175b99e",
    ],
    "liquidity gauge": {
      address: "0x784342E983E9283A7108F20FcA21995534b3fE65",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve FIDU/USDC",
    type: "crypto factory",
    meta: false,
    address: "0x80aa1a80a30055DAA084E599836532F3e58c95E2",
    token: "0x42ec68ca5c2C80036044f3EeAd675447aB3A8065",
    tokens: [
      "0x6a445E9F40e0b97c92d0b8a3366cEF1d67F700BF",
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    ],
  },
  {
    name: "Curve ibEUR/USDC",
    type: "crypto factory",
    meta: false,
    address: "0x1570af3dF649Fc74872c5B8F280A162a3bdD4EB6",
    token: "0x8682Fbf0CbF312C891532BA9F1A91e44f81ad7DF",
    tokens: [
      "0x96E61422b6A9bA0e068B6c5ADd4fFaBC6a4aae27",
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    ],
    "liquidity gauge": {
      address: "0xE1D520B1263D6Be5678568BD699c84F7f9086023",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve ibAUD/USDC",
    type: "crypto factory",
    meta: false,
    address: "0x5b692073F141C31384faE55856CfB6CBfFE91E60",
    token: "0x54c8Ecf46A81496eEB0608BD3353388b5D7a2a33",
    tokens: [
      "0xFAFdF0C4c1CB09d430Bf88c75D88BB46DAe09967",
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    ],
    "liquidity gauge": {
      address: "0x1779AEB087C5BdBe48749ab03575f5f25D1DEeaF",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve ibCHF/USDC",
    type: "crypto factory",
    meta: false,
    address: "0x6Df0D77F0496CE44e72D695943950D8641fcA5Cf",
    token: "0x08ceA8E5B4551722dEB97113C139Dd83C26c5398",
    tokens: [
      "0x1CC481cE2BD2EC7Bf67d1Be64d4878b16078F309",
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    ],
    "liquidity gauge": {
      address: "0x36C66bC294fEf4e94B3e40A1801d0AB0085Fe96e",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve ibGBP/USDC",
    type: "crypto factory",
    meta: false,
    address: "0xAcCe4Fe9Ce2A6FE9af83e7CF321a3fF7675e0AB6",
    token: "0x22CF19EB64226e0E1A79c69b345b31466fD273A7",
    tokens: [
      "0x69681f8fde45345C3870BCD5eaf4A05a60E7D227",
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    ],
    "liquidity gauge": {
      address: "0x1Ba86c33509013c937344f6e231DA2E63ea45197",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve ibJPY/USDC",
    type: "crypto factory",
    meta: false,
    address: "0xEB0265938c1190Ab4E3E1f6583bC956dF47C0F93",
    token: "0x127091edE112aEd7Bae281747771b3150Bb047bB",
    tokens: [
      "0x5555f75e3d5278082200Fb451D1b6bA946D8e13b",
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    ],
    "liquidity gauge": {
      address: "0x3A748A2F4765BDFB119Cb7143b884Db7594a68c3",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve ibKRW/USDC",
    type: "crypto factory",
    meta: false,
    address: "0xef04f337fCB2ea220B6e8dB5eDbE2D774837581c",
    token: "0x80CAcCdBD3f07BbdB558DB4a9e146D099933D677",
    tokens: [
      "0x95dFDC8161832e4fF7816aC4B6367CE201538253",
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    ],
    "liquidity gauge": {
      address: "0xb6d7C2bda5a907832d4556AE5f7bA800FF084C2a",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve STG/USDC",
    type: "crypto factory",
    meta: false,
    address: "0x3211C6cBeF1429da3D0d58494938299C92Ad5860",
    token: "0xdf55670e27bE5cDE7228dD0A6849181891c9ebA1",
    tokens: [
      "0xAf5191B0De278C7286d6C7CC6ab6BB8A73bA2Cd6",
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    ],
    "liquidity gauge": {
      address: "0x95d16646311fDe101Eb9F897fE06AC881B7Db802",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve WETH/PAL",
    type: "crypto factory",
    meta: false,
    address: "0x75A6787C7EE60424358B449B539A8b774c9B4862",
    token: "0xbE4f3AD6C9458b901C81b734CB22D9eaE9Ad8b50",
    tokens: [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "0xAB846Fb6C81370327e784Ae7CbB6d6a6af6Ff4BF",
    ],
    "liquidity gauge": {
      address: "0x4fb13b55D6535584841dbBdb14EDC0258F7aC414",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve WETH/KP3R",
    type: "crypto factory",
    meta: false,
    address: "0x21410232B484136404911780bC32756D5d1a9Fa9",
    token: "0x4647B6D835f3B393C7A955df51EEfcf0db961606",
    tokens: [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "0x1cEB5cB57C4D4E2b2433641b95Dd330A33185A44",
    ],
    "liquidity gauge": {
      address: "0x6d3328F0333f6FB0B2FaC87cF5a0FFa7e77beB60",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve WETH/LFT",
    type: "crypto factory",
    meta: false,
    address: "0xfE4A08f22FE65759Ba91dB2E2CADa09B4415B0d7",
    token: "0x401322B9FDdba8c0a8D40fbCECE1D1752C12316B",
    tokens: [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "0xB620Be8a1949AA9532e6a3510132864EF9Bc3F82",
    ],
    "liquidity gauge": {
      address: "0x46521Db0D31A62A2CBF8D1A7Cdc6bBBBC441A1fc",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve WETH/JPEG",
    type: "crypto factory",
    meta: false,
    address: "0x7E050cf658777cc1Da4a4508E79d71859044B60E",
    token: "0x34eD182D0812D119c92907852D2B429f095A9b07",
    tokens: [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "0xE80C0cd204D654CEbe8dd64A4857cAb6Be8345a3",
    ],
    "liquidity gauge": {
      address: "0xFA49B2a5D9E77f6748bf05801aa22356D514137b",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve WETH/CNC",
    type: "crypto factory",
    meta: false,
    address: "0x782115c863A05abF8795dF377D89AAd1AAdF4Dfa",
    token: "0xc0f888D0987287Aa1D09CaC49F2ccA89f7bbe774",
    tokens: [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "0x9aE380F0272E2162340a5bB646c354271c0F5cFC",
    ],
  },
  {
    name: "Curve WETH/CNC",
    type: "crypto factory",
    meta: false,
    address: "0x838af967537350D2C44ABB8c010E49E32673ab94",
    token: "0xF9835375f6b268743Ea0a54d742Aa156947f8C06",
    tokens: [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "0x9aE380F0272E2162340a5bB646c354271c0F5cFC",
    ],
    "liquidity gauge": {
      address: "0x5A8fa46ebb404494D718786e55c4E043337B10bF",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve FRAX/FPI",
    type: "crypto factory",
    meta: false,
    address: "0xf861483fa7E511fbc37487D91B6FAa803aF5d37c",
    token: "0x4704aB1fb693ce163F7c9D3A31b3FF4eaF797714",
    tokens: [
      "0x853d955aCEf822Db058eb8505911ED77F175b99e",
      "0x5Ca135cB8527d76e932f34B5145575F9d8cbE08E",
    ],
    "liquidity gauge": {
      address: "0xdB7cbbb1d5D5124F86E92001C9dFDC068C05801D",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve WETH/VIRTUE",
    type: "crypto factory",
    meta: false,
    address: "0xD0a1D2a9350824516ae8729b8311557BA7E55BFF",
    token: "0x94f6C0201E1BFcba290345338C3C4aBC1901d336",
    tokens: [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "0x9416bA76e88D873050A06e5956A3EBF10386b863",
    ],
  },
  {
    name: "Curve WETH/CXD",
    type: "crypto factory",
    meta: false,
    address: "0x5D898FD41875b14c1781fb497AeCAb8E9B24dfC9",
    token: "0x1979F8296492fF9E6527ECA47FC44BB30c391139",
    tokens: [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "0x5A56Da75c50aA2733F5Fa9A2442AaEfcBc60B2e6",
    ],
    "liquidity gauge": {
      address: "0x14b421BDA47D0ac5c32449b294431D0301c6A25F",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve USDC/CXD",
    type: "crypto factory",
    meta: false,
    address: "0x4535913573D299A6372ca43b90aA6Be1CF68f779",
    token: "0x70A03471B4F2dEe5174AdE1165742E2d3fEd2E27",
    tokens: [
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "0x5A56Da75c50aA2733F5Fa9A2442AaEfcBc60B2e6",
    ],
  },
  {
    name: "Curve Test CTDL/WBTC",
    type: "crypto factory",
    meta: false,
    address: "0x3c42B0f384D2912661C940d46cfFE1CD10F1c66F",
    token: "0xE2b11613bBe8E09F73fA81B4A09F0dadB20F5Df6",
    tokens: [
      "0xaF0b1FDf9c6BfeC7b3512F207553c0BA00D7f1A2",
      "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    ],
  },
  {
    name: "Curve WETH/TOKE",
    type: "crypto factory",
    meta: false,
    address: "0xe0e970a99bc4F53804D8145beBBc7eBc9422Ba7F",
    token: "0x7ea4aD8C803653498bF6AC1D2dEbc04DCe8Fd2aD",
    tokens: [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "0x2e9d63788249371f1DFC918a52f8d799F4a38C94",
    ],
    "liquidity gauge": {
      address: "0xa0C08C0Aede65a0306F7dD042D2560dA174c91fC",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve DAI/bSTBL",
    type: "crypto factory",
    meta: false,
    address: "0xA148BD19E26Ff9604f6A608E22BFb7B772D0d1A3",
    token: "0x7657Ceb382013f1Ce9Ac7b08Dd8db4F28D3a7538",
    tokens: [
      "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      "0x5ee08f40b637417bcC9d2C51B62F4820ec9cF5D8",
    ],
  },
  {
    name: "Curve CVX/pxCVX",
    type: "crypto factory",
    meta: false,
    address: "0xF3456E8061461e144b3f252E69DcD5b6070fdEE0",
    token: "0xaCe78D9BaB82b6B4783120Dba82aa10B040A14D9",
    tokens: [
      "0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B",
      "0xBCe0Cf87F513102F22232436CCa2ca49e815C3aC",
    ],
  },
  {
    name: "Curve WETH/UNBNK",
    type: "crypto factory",
    meta: false,
    address: "0x5114f86027d4c9a509Cba072B8135A171402C6d5",
    token: "0x20A1512284DC88102BfE169c08530c743d85dcC7",
    tokens: [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "0x06B884e60794Ce02AafAb13791B59A2e6A07442f",
    ],
    "liquidity gauge": {
      address: "0xE4cDe146984e431B2923eec7A42adb0C650eE3BF",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve frETH/WETH",
    type: "crypto factory",
    meta: false,
    address: "0x6E77889Ff348A16547cABa3Ce011cB120Ed73bFc",
    token: "0x517E47a2e8c38E5A96708ED866A39CcbAA105640",
    tokens: [
      "0xB4Bd4628e6EFb0Cb521D9ec35050C75840320374",
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    ],
    "liquidity gauge": {
      address: "0x25530F3C929d3f4137A766dE3d37700d2Fc00FF8",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve aCRV/CRV",
    type: "crypto factory",
    meta: false,
    address: "0x95f3672a418230c5664b7154Dfce0ACfa7EEd68D",
    token: "0x2C97c40C24E2FF11c6965dc40Ca77967bCeC4719",
    tokens: [
      "0x2b95A1Dcc3D405535f9ed33c219ab38E8d7e0884",
      "0xD533a949740bb3306d119CC777fa900bA034cd52",
    ],
  },
  {
    name: "Curve WETH/RAREPEPE",
    type: "crypto factory",
    meta: false,
    address: "0xdDBDCEBb989B1ef804338d6c9a902f91c2738936",
    token: "0xaf47cEd866c824FDBd3E00f651bDde19ac9CBd03",
    tokens: [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "0xd6242E984E6db6B5286FB2c26C69330Da639da12",
    ],
  },
  {
    name: "Curve MATIC/SHIB",
    type: "crypto factory",
    meta: false,
    address: "0xb2c248C0B0DB7d28dfa0123438B40Bb31FB8AA05",
    token: "0x38f730B5A96FD79B97bb64210021FA67db1eD147",
    tokens: [
      "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
      "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
    ],
  },
  {
    name: "Curve MATIC/FLEET",
    type: "crypto factory",
    meta: false,
    address: "0x799D141e83D88996C48B98A4f8EB3D96AB422DD3",
    token: "0x359b630eF33A40b0AbEEeED5467fE839F9f7E561",
    tokens: [
      "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
      "0xfd56a3DCFc0690881A466AE432D71bB2dB588083",
    ],
  },
  {
    name: "Curve WETH/CTR",
    type: "crypto factory",
    meta: false,
    address: "0x383aD525211B8A1A9c13532CC021773052b2F4f8",
    token: "0x4cE6803F108a667e53fE09a93Cf91a18d9d2Ad31",
    tokens: [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "0xb3Ad645dB386D7F6D753B2b9C3F4B853DA6890B8",
    ],
  },
  {
    name: "Curve WETH/BTRFLY",
    type: "crypto factory",
    meta: false,
    address: "0x6e314039f4C56000F4ebb3a7854A84cC6225Fb92",
    token: "0x7483Dd57f6488b0e194A151C57Df6Ec85C00aCE9",
    tokens: [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "0xc55126051B22eBb829D00368f4B12Bde432de5Da",
    ],
    "liquidity gauge": {
      address: "0x72D36D0EAd377425BD6DB66Fe334a42fdCebff28",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve RAI/LUSD",
    type: "crypto factory",
    meta: false,
    address: "0xc58fDB8A50AB921A73535656A7c69387Dd863ff6",
    token: "0xD29f1A967441AE1a4ff2EA35EdE54fe01CF6B95f",
    tokens: [
      "0x03ab458634910AaD20eF5f1C8ee96F1D6ac54919",
      "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0",
    ],
  },
  {
    name: "Curve FXS/FPIS",
    type: "crypto factory",
    meta: false,
    address: "0xD4e2fdC354c5DFfb865798Ca98c2b9d5382F687C",
    token: "0xB83e5Af00b321d2280382B8634625826fbd75c5b",
    tokens: [
      "0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0",
      "0xc2544A32872A91F4A553b404C6950e89De901fdb",
    ],
  },
  {
    name: "Curve WETH/cbETH",
    type: "crypto factory",
    meta: false,
    address: "0x5FAE7E604FC3e24fd43A72867ceBaC94c65b404A",
    token: "0x5b6C539b224014A09B3388e51CaAA8e354c959C8",
    tokens: [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "0xBe9895146f7AF43049ca1c1AE358B0541Ea49704",
    ],
    "liquidity gauge": {
      address: "0xAd96E10123Fa34a01cf2314C42D75150849C9295",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve agEUR/crvFRAX",
    type: "crypto factory",
    meta: true,
    address: "0x58257e4291F95165184b4beA7793a1d6F8e7b627",
    token: "0x22e859Ee894c2068920858A60b51DC03ac5581c1",
    tokens: [
      "0x1a7e4e63778B4f12a199C062f3eFdD288afCBce8",
      "0x3175Df0976dFA876431C2E9eE6Bc45b65d3473CC",
    ],
    "liquidity gauge": {
      address: "0xf74175aCe638E612a0a3B09E6bE89795ff48E06D",
      type: "LiquidityGaugeV5",
    },
    zap: {
      address: "0x5de4ef4879f4fe3bbadf2227d2ac5d0e2d76c895",
      basePool: {
        address: "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2",
        tokens: [
          "0x853d955aCEf822Db058eb8505911ED77F175b99e",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        ],
      },
    },
  },
  {
    name: "Curve cvxFXS/crvFRAX",
    type: "crypto factory",
    meta: true,
    address: "0x21d158d95C2e150e144c36FC64E3653B8D6c6267",
    token: "0xF57ccaD8122B898A147Cc8601B1ECA88B1662c7E",
    tokens: [
      "0xFEEf77d3f69374f66429C91d732A244f074bdf74",
      "0x3175Df0976dFA876431C2E9eE6Bc45b65d3473CC",
    ],
    "liquidity gauge": {
      address: "0xc7A770dE69479bEEEEf22b2C9851760BaC3630Da",
      type: "LiquidityGaugeV5",
    },
    zap: {
      address: "0x5de4ef4879f4fe3bbadf2227d2ac5d0e2d76c895",
      basePool: {
        address: "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2",
        tokens: [
          "0x853d955aCEf822Db058eb8505911ED77F175b99e",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        ],
      },
    },
  },
  {
    name: "Curve CVX/crvFRAX",
    type: "crypto factory",
    meta: true,
    address: "0xBEc570d92AFB7fFc553bdD9d4B4638121000b10D",
    token: "0x7F17A6C77C3938D235b014818092eb6305BdA110",
    tokens: [
      "0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B",
      "0x3175Df0976dFA876431C2E9eE6Bc45b65d3473CC",
    ],
    "liquidity gauge": {
      address: "0xaa386EF96A910Ee2F9cbEf7B139e99A88DF3b2ba",
      type: "LiquidityGaugeV5",
    },
    zap: {
      address: "0x5de4ef4879f4fe3bbadf2227d2ac5d0e2d76c895",
      basePool: {
        address: "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2",
        tokens: [
          "0x853d955aCEf822Db058eb8505911ED77F175b99e",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        ],
      },
    },
  },
  {
    name: "Curve ALCX/crvFRAX",
    type: "crypto factory",
    meta: true,
    address: "0x4149d1038575CE235E03E03B39487a80FD709D31",
    token: "0xf985005a3793DbA4cCe241B3C19ddcd3Fe069ff4",
    tokens: [
      "0xdBdb4d16EdA451D0503b854CF79D55697F90c8DF",
      "0x3175Df0976dFA876431C2E9eE6Bc45b65d3473CC",
    ],
    "liquidity gauge": {
      address: "0xD5bE6A05B45aEd524730B6d1CC05F59b021f6c87",
      type: "LiquidityGaugeV5",
    },
    zap: {
      address: "0x5de4ef4879f4fe3bbadf2227d2ac5d0e2d76c895",
      basePool: {
        address: "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2",
        tokens: [
          "0x853d955aCEf822Db058eb8505911ED77F175b99e",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        ],
      },
    },
  },
  {
    name: "Curve cvxCRV/crvFRAX",
    type: "crypto factory",
    meta: true,
    address: "0x31c325A01861c7dBd331a9270296a31296D797A0",
    token: "0x527331F3F550f6f85ACFEcAB9Cc0889180C6f1d5",
    tokens: [
      "0x62B9c7356A2Dc64a1969e19C23e4f579F9810Aa7",
      "0x3175Df0976dFA876431C2E9eE6Bc45b65d3473CC",
    ],
    "liquidity gauge": {
      address: "0xa47d0837F84Fb2d1aA08077D10d10101316a959d",
      type: "LiquidityGaugeV5",
    },
    zap: {
      address: "0x5de4ef4879f4fe3bbadf2227d2ac5d0e2d76c895",
      basePool: {
        address: "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2",
        tokens: [
          "0x853d955aCEf822Db058eb8505911ED77F175b99e",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        ],
      },
    },
  },
  {
    name: "Curve GYEN/USDC",
    type: "crypto factory",
    meta: false,
    address: "0x611a95bf3cc0EF593f22c4E4D8EB4d6C937E006C",
    token: "0xbb839df3b6Dfbc5956bCb484f91F1C555075A642",
    tokens: [
      "0xC08512927D12348F6620a698105e1BAac6EcD911",
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    ],
  },
  {
    name: "Curve BADGER/crvFRAX",
    type: "crypto factory",
    meta: true,
    address: "0x13B876C26Ad6d21cb87AE459EaF6d7A1b788A113",
    token: "0x09b2E090531228d1b8E3d948C73b990Cb6e60720",
    tokens: [
      "0x3472A5A71965499acd81997a54BBA8D852C6E53d",
      "0x3175Df0976dFA876431C2E9eE6Bc45b65d3473CC",
    ],
    "liquidity gauge": {
      address: "0x455279344f84a496615DC0ffa0511D2E19ec19d8",
      type: "LiquidityGaugeV5",
    },
    zap: {
      address: "0x5de4ef4879f4fe3bbadf2227d2ac5d0e2d76c895",
      basePool: {
        address: "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2",
        tokens: [
          "0x853d955aCEf822Db058eb8505911ED77F175b99e",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        ],
      },
    },
  },
  {
    name: "Curve ZARP/USDC",
    type: "crypto factory",
    meta: false,
    address: "0x4D19E7fD118FD751fEa7c0324D7E7b0A3D05EbA4",
    token: "0x0d1d69876b55080e92119C9e2c3C8FF46667e7fe",
    tokens: [
      "0x8CB24ed2e4f7e2065f4eB2bE5f6B0064B1919850",
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    ],
  },
  {
    name: "Curve BENT/crvFRAX",
    type: "crypto factory",
    meta: true,
    address: "0x825722AF244432319C1E32b6b18AdED2d4A014Df",
    token: "0xA620C45a2b723C2b44de1412dD8aDEe19ec16A57",
    tokens: [
      "0x01597E397605Bf280674Bf292623460b4204C375",
      "0x3175Df0976dFA876431C2E9eE6Bc45b65d3473CC",
    ],
    "liquidity gauge": {
      address: "0xCE8dFBe985acBBd4476CCB9c4e316dCCD41996Dd",
      type: "LiquidityGaugeV5",
    },
    zap: {
      address: "0x5de4ef4879f4fe3bbadf2227d2ac5d0e2d76c895",
      basePool: {
        address: "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2",
        tokens: [
          "0x853d955aCEf822Db058eb8505911ED77F175b99e",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        ],
      },
    },
  },
  {
    name: "Curve bentCVX/crvFRAX",
    type: "crypto factory",
    meta: true,
    address: "0x02dFA5C793A9CE4d767a86259245A162a57f2dB4",
    token: "0xbb23C0361D3e436Fb7942a0E103EdeCAb3AfA917",
    tokens: [
      "0x9E0441E084F5dB0606565737158aa6Ab6B970fE0",
      "0x3175Df0976dFA876431C2E9eE6Bc45b65d3473CC",
    ],
    zap: {
      address: "0x5de4ef4879f4fe3bbadf2227d2ac5d0e2d76c895",
      basePool: {
        address: "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2",
        tokens: [
          "0x853d955aCEf822Db058eb8505911ED77F175b99e",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        ],
      },
    },
  },
  {
    name: "Curve OHM/ARTH",
    type: "crypto factory",
    meta: false,
    address: "0x27A8697fBD2ed137d88E74132a5558FA43656175",
    token: "0x025D7DcE7ad345bd55C4c972614E720ab67E1B2b",
    tokens: [
      "0x64aa3364F17a4D01c6f1751Fd97C2BD3D7e7f1D5",
      "0x8CC0F052fff7eaD7f2EdCCcaC895502E884a8a71",
    ],
  },
  {
    name: "Curve RAI/LUSD",
    type: "crypto factory",
    meta: false,
    address: "0x167dE3887eDEbE5012544373C5871481bD95Cc4e",
    token: "0x02438B7EB7e2Ab61FB1A1Ea0f6761F6dd5A7Badf",
    tokens: [
      "0x03ab458634910AaD20eF5f1C8ee96F1D6ac54919",
      "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0",
    ],
  },
  {
    name: "Curve WETH/FRAX",
    type: "crypto factory",
    meta: false,
    address: "0x1631D0E588D475CEe4be0f51b7410DaaAaBD7034",
    token: "0x19a0d1D428425ef397966Bce6c798bEDC3030035",
    tokens: [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "0x853d955aCEf822Db058eb8505911ED77F175b99e",
    ],
  },
  {
    name: "Curve RAI/USDC",
    type: "crypto factory",
    meta: false,
    address: "0x96A3F551c99797998dC33E2D816D567db61EE1c2",
    token: "0x4A699ed946615f67e2d0D7FB3264E22E1FCCfDcc",
    tokens: [
      "0x03ab458634910AaD20eF5f1C8ee96F1D6ac54919",
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    ],
  },
  {
    name: "Curve DUCK/USDP",
    type: "crypto factory",
    meta: false,
    address: "0xF039050dC36fD59Ff1117B14BFdFf92dFA9dE9Fc",
    token: "0x0852035A7CB0c67C5f3A3A1eD38f3E673Dc01158",
    tokens: [
      "0x92E187a03B6CD19CB6AF293ba17F2745Fd2357D5",
      "0x1456688345527bE1f37E9e627DA0837D6f08C925",
    ],
    "liquidity gauge": {
      address: "0x524112c63458644bc8bC1429e055eEa3D320bf12",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve DUCK/USDT",
    type: "crypto factory",
    meta: false,
    address: "0xFEB0784F5D0940686143b3A025Af731Ee6A81197",
    token: "0x82aBdc39E7207555bc81ad58E8AeDCD6fcC96B98",
    tokens: [
      "0x92E187a03B6CD19CB6AF293ba17F2745Fd2357D5",
      "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    ],
    "liquidity gauge": {
      address: "0x37ffEE1C3C321663f7fe0FF90fc44f8ce5f731ff",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve DCHF/3Crv",
    type: "crypto factory",
    meta: true,
    address: "0xDcb11E81C8B8a1e06BF4b50d4F6f3bb31f7478C3",
    token: "0x8Bc3F1e82Ca3d63987dc12F90538c6bF818FcD0f",
    tokens: [
      "0x045da4bFe02B320f4403674B3b7d121737727A36",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    "liquidity gauge": {
      address: "0xb0a6F55a758C8F035C067672e89903d76A5AbE9b",
      type: "LiquidityGaugeV5",
    },
    zap: {
      address: "0x97adc08fa1d849d2c48c5dcc1dab568b169b0267",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve RAI/DAI",
    type: "crypto factory",
    meta: false,
    address: "0xBCAA09F2873F87aB4bf3A6fE97991f4bCC959e7e",
    token: "0x2A81F4a86344FFd69477ebD003c31aFf7F347904",
    tokens: [
      "0x03ab458634910AaD20eF5f1C8ee96F1D6ac54919",
      "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    ],
  },
  {
    name: "Curve bl/LUSD3CRV-f",
    type: "crypto factory",
    meta: false,
    address: "0xF4A3cca34470b5Ba21E2bb1eD365ACf68B4d4598",
    token: "0xEeb7a7120CdF4440f08A9FD646Cca9D78e463f01",
    tokens: [
      "0x1E2391a261217c93D09Ff3Ae9aB1903EA237BdA8",
      "0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA",
    ],
    "liquidity gauge": {
      address: "0x8bCf6C7A49045E9f78648F9969c4bd2f12F8C504",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve bLUSD/LUSD3CRV-f",
    type: "crypto factory",
    meta: false,
    address: "0x74ED5d42203806c8CDCf2F04Ca5F60DC777b901c",
    token: "0x5ca0313D44551e32e0d7a298EC024321c4BC59B4",
    tokens: [
      "0xB9D7DdDca9a4AC480991865EfEf82E01273F79C3",
      "0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA",
    ],
    "liquidity gauge": {
      address: "0xdA0DD1798BE66E17d5aB1Dc476302b56689C2DB4",
      type: "LiquidityGaugeV5",
    },
  },
  {
    name: "Curve SDT/crvFRAX",
    type: "crypto factory",
    meta: true,
    address: "0x3e3C6c7db23cdDEF80B694679aaF1bCd9517D0Ae",
    token: "0x893DA8A02b487FEF2F7e3F35DF49d7625aE549a3",
    tokens: [
      "0x73968b9a57c6E53d41345FD57a6E6ae27d6CDB2F",
      "0x3175Df0976dFA876431C2E9eE6Bc45b65d3473CC",
    ],
    "liquidity gauge": {
      address: "0x805Aef679B1379Ee1d24c52158E7F56098D199D9",
      type: "LiquidityGaugeV5",
    },
    zap: {
      address: "0x5de4ef4879f4fe3bbadf2227d2ac5d0e2d76c895",
      basePool: {
        address: "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2",
        tokens: [
          "0x853d955aCEf822Db058eb8505911ED77F175b99e",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        ],
      },
    },
  },
  {
    name: "Curve RSR/crvFRAX",
    type: "crypto factory",
    meta: true,
    address: "0x6a6283aB6e31C2AeC3fA08697A8F806b740660b2",
    token: "0x3F436954afb722F5D14D868762a23faB6b0DAbF0",
    tokens: [
      "0x320623b8E4fF03373931769A31Fc52A4E78B5d70",
      "0x3175Df0976dFA876431C2E9eE6Bc45b65d3473CC",
    ],
    "liquidity gauge": {
      address: "0xCf79921D99b99FEe3DcF1A4657fCDA95195B46d1",
      type: "LiquidityGaugeV5",
    },
    zap: {
      address: "0x5de4ef4879f4fe3bbadf2227d2ac5d0e2d76c895",
      basePool: {
        address: "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2",
        tokens: [
          "0x853d955aCEf822Db058eb8505911ED77F175b99e",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        ],
      },
    },
  },
  {
    name: "Curve WETH/CLEV",
    type: "crypto factory",
    meta: false,
    address: "0x342D1C4Aa76EA6F5E5871b7f11A019a0eB713A4f",
    token: "0x6C280dB098dB673d30d5B34eC04B6387185D3620",
    tokens: [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "0x72953a5C32413614d24C29c84a66AE4B59581Bbf",
    ],
  },
  {
    name: "Curve ARTH/3Crv",
    type: "crypto factory",
    meta: true,
    address: "0x96f34Bb82fcA57e475e6ad218b0dd0C5c78DF423",
    token: "0xbCCEb5b710E3eB07d1AC6a079e87D799bE30A71f",
    tokens: [
      "0x8CC0F052fff7eaD7f2EdCCcaC895502E884a8a71",
      "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    zap: {
      address: "0x97adc08fa1d849d2c48c5dcc1dab568b169b0267",
      basePool: {
        address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        tokens: [
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        ],
      },
    },
  },
  {
    name: "Curve ARTH/WETH",
    type: "crypto factory",
    meta: false,
    address: "0x19a0CA9a0dc2A5034F47DcC164169Cffd7ed2410",
    token: "0x2c448c8E13b7866AC35fdA46a605429C48362818",
    tokens: [
      "0x8CC0F052fff7eaD7f2EdCCcaC895502E884a8a71",
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    ],
  },
  {
    name: "Curve SMKL/SMKL",
    type: "crypto factory",
    meta: false,
    address: "0x1628E0A42682570c815da52480734a8c2A2Ca2DD",
    token: "0xf1A0b0A0e9Ec8faA8F43CBcBb3D7EeeFF39D4d55",
    tokens: [
      "0xcdD12A15dF22faaa77D3678EdA2236B1FA3800eB",
      "0x28a7190805c3646F7Bf63b00C569F7bF06145268",
    ],
  },
  {
    name: "Curve SMKL/WETH",
    type: "crypto factory",
    meta: false,
    address: "0x4E6706889d519ba6e6CED330D76582f875DF3C9c",
    token: "0x0BA6D8e30a13b7692d88368c79FAf68ceD356859",
    tokens: [
      "0x28a7190805c3646F7Bf63b00C569F7bF06145268",
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    ],
  },
  {
    name: "Curve PETAL/RAI",
    type: "crypto factory",
    meta: false,
    address: "0x29b2178F5f9FB4f775A2f1a7fEA685FFbA0fAe32",
    token: "0x4f018C06810Ea979F0E8a5D73CB8aa977Ba17aBA",
    tokens: [
      "0x2e60f6C4CA05bC55A8e577DEeBD61FCe727c4a6e",
      "0x03ab458634910AaD20eF5f1C8ee96F1D6ac54919",
    ],
  },
  {
    name: "Curve WETH/CTR",
    type: "crypto factory",
    meta: false,
    address: "0xf2f12B364F614925aB8E2C8BFc606edB9282Ba09",
    token: "0x3f0e7916681452D23Cd36B1281457DA721F2E5dF",
    tokens: [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "0xb3Ad645dB386D7F6D753B2b9C3F4B853DA6890B8",
    ],
  },
] as const
