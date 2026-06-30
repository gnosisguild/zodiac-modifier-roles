import dotenv from "dotenv";
import { defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

import deployMastercopies from "./tasks/deploy-mastercopies.js";
import deployMastercopy from "./tasks/deploy-mastercopy.js";
import extractMastercopy from "./tasks/extract-mastercopy.js";
import verifyMastercopies from "./tasks/verify-mastercopies.js";
import verifyMastercopy from "./tasks/verify-mastercopy.js";

dotenv.config();

const { INFURA_KEY, PK, MNEMONIC, ETHERSCAN_API_KEY } = process.env;

const accounts = PK
  ? [PK]
  : {
      mnemonic:
        MNEMONIC ||
        "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat",
    };

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  paths: {
    artifacts: "build/artifacts",
    cache: "build/cache",
    sources: "contracts",
  },
  solidity: {
    version: "0.8.30",
    settings: {
      evmVersion: "cancun",
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 100,
      },
    },
    npmFilesToBuild: [
      "@gnosis-guild/zodiac-core/contracts/factory/ModuleProxyFactory.sol",
    ],
  },
  typechain: {
    outDir: "typechain-types",
    tsNocheck: true,
  },
  networks: {
    default: {
      type: "edr-simulated",
      allowUnlimitedContractSize: true,
    },
    mainnet: {
      type: "http",
      chainId: 1,
      accounts,
      url: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
    },
    sepolia: {
      type: "http",
      chainId: 11155111,
      accounts,
      url: `https://sepolia.infura.io/v3/${INFURA_KEY}`,
    },
    optimism: {
      type: "http",
      chainId: 10,
      accounts,
      url: "https://mainnet.optimism.io",
    },
    gnosis: {
      type: "http",
      chainId: 100,
      accounts,
      url: "https://rpc.gnosischain.com",
    },
    base: {
      type: "http",
      chainId: 8453,
      accounts,
      url: "https://mainnet.base.org",
    },
    baseSepolia: {
      type: "http",
      chainId: 84532,
      accounts,
      url: "https://sepolia.base.org",
    },
    polygon: {
      type: "http",
      chainId: 137,
      accounts,
      url: "https://polygon.gateway.tenderly.co",
    },
    arbitrum: {
      type: "http",
      chainId: 42161,
      accounts,
      url: "https://arb1.arbitrum.io/rpc",
    },
    avalanche: {
      type: "http",
      chainId: 43114,
      accounts,
      url: "https://avalanche-mainnet.gateway.tenderly.co",
    },
    zkevm: {
      type: "http",
      chainId: 1101,
      accounts,
      url: "https://zkevm-rpc.com",
    },
    bsc: { type: "http", chainId: 56, accounts, url: "https://1rpc.io/bnb" },
    celo: {
      type: "http",
      chainId: 42220,
      accounts,
      url: "https://forno.celo.org",
    },
    lisk: {
      type: "http",
      chainId: 1135,
      accounts,
      url: "https://rpc.api.lisk.com",
    },
    "lisk-sepolia": {
      type: "http",
      chainId: 4202,
      accounts,
      url: "https://rpc.sepolia-api.lisk.com",
      gasPrice: 1000000000,
    },
    liskSepolia: {
      type: "http",
      chainId: 4202,
      accounts,
      url: "https://rpc.sepolia-api.lisk.com",
    },
    "bob-sepolia": {
      type: "http",
      chainId: 808813,
      accounts,
      url: "https://bob-sepolia.rpc.gobob.xyz/",
      gasPrice: 1000000000,
    },
    unichain: {
      type: "http",
      chainId: 130,
      accounts,
      url: "https://mainnet.unichain.org",
    },
    mantle: {
      type: "http",
      chainId: 5000,
      accounts,
      url: "https://rpc.mantle.xyz",
    },
    sonic: {
      type: "http",
      chainId: 146,
      accounts,
      url: "https://rpc.soniclabs.com",
    },
    berachain: {
      type: "http",
      chainId: 80094,
      accounts,
      url: "https://rpc.berachain.com",
    },
    hyperevm: {
      type: "http",
      chainId: 999,
      accounts,
      url: "https://rpc.hyperliquid.xyz/evm",
    },
    worldchain: {
      type: "http",
      chainId: 480,
      accounts,
      url: "https://worldchain-mainnet.g.alchemy.com/public",
    },
    plasma: {
      type: "http",
      chainId: 9745,
      accounts,
      url: "https://rpc.plasma.to",
    },
    scroll: {
      type: "http",
      chainId: 534352,
      accounts,
      url: "https://rpc.scroll.io",
    },
    flare: {
      type: "http",
      chainId: 14,
      accounts,
      url: "https://flare-api.flare.network/ext/C/rpc",
    },
    katana: {
      type: "http",
      chainId: 747474,
      accounts,
      url: "https://rpc.katana.network",
    },
    megaeth: {
      type: "http",
      chainId: 4326,
      accounts,
      url: "https://mainnet.megaeth.com/rpc",
    },
    linea: {
      type: "http",
      chainId: 59144,
      accounts,
      url: "https://linea-rpc.publicnode.com",
    },
    ink: {
      type: "http",
      chainId: 57073,
      accounts,
      url: "https://rpc-qnd.inkonchain.com",
    },
  },
  chainDescriptors: {
    10: {
      name: "optimism",
      blockExplorers: {
        etherscan: {
          apiUrl: "https://api-optimistic.etherscan.io/api",
          url: "https://optimistic.etherscan.io",
        },
      },
    },
    100: {
      name: "gnosis",
      blockExplorers: {
        etherscan: {
          apiUrl: "https://api.gnosisscan.io/api",
          url: "https://www.gnosisscan.io",
        },
      },
    },
    137: {
      name: "polygon",
      blockExplorers: {
        etherscan: {
          apiUrl: "https://api.polygonscan.com/api",
          url: "https://www.polygonscan.com",
        },
      },
    },
    42161: {
      name: "arbitrum",
      blockExplorers: {
        etherscan: {
          apiUrl: "https://api.arbiscan.io/api",
          url: "https://www.arbiscan.io",
        },
      },
    },
    43114: {
      name: "avalanche",
      blockExplorers: {
        etherscan: {
          apiUrl: "https://api.snowtrace.io/api",
          url: "https://www.snowtrace.io",
        },
      },
    },
    1101: {
      name: "zkevm",
      blockExplorers: {
        etherscan: {
          apiUrl: "https://api-zkevm.polygonscan.com/api",
          url: "https://zkevm.polygonscan.com",
        },
      },
    },
    56: {
      name: "bsc",
      blockExplorers: {
        etherscan: {
          apiUrl: "https://api.bscscan.com/api",
          url: "https://bscscan.com",
        },
      },
    },
    42220: {
      name: "celo",
      blockExplorers: {
        etherscan: {
          apiUrl: "https://api.celoscan.io/api",
          url: "https://celoscan.io",
        },
      },
    },
    5000: {
      name: "mantle",
      blockExplorers: {
        etherscan: {
          apiUrl: "https://api.mantlescan.xyz/api",
          url: "https://mantlescan.xyz",
        },
      },
    },
    130: {
      name: "unichain",
      blockExplorers: {
        etherscan: {
          apiUrl: "https://api.uniscan.xyz/api",
          url: "https://uniscan.xyz",
        },
      },
    },
    146: {
      name: "sonic",
      blockExplorers: {
        etherscan: {
          apiUrl: "https://api.sonicscan.org/api",
          url: "https://sonicscan.org",
        },
      },
    },
    80094: {
      name: "berachain",
      blockExplorers: {
        etherscan: {
          apiUrl: "https://api.berascan.com/api",
          url: "https://berascan.com",
        },
      },
    },
    999: {
      name: "hyperevm",
      blockExplorers: {
        etherscan: {
          apiUrl: "https://www.hyperscan.com/api",
          url: "https://www.hyperscan.com",
        },
      },
    },
    4202: {
      name: "lisk-sepolia",
      blockExplorers: {
        blockscout: {
          apiUrl: "https://sepolia-blockscout.lisk.com/api",
          url: "https://sepolia-blockscout.lisk.com",
        },
      },
    },
    808813: {
      name: "bob-sepolia",
      blockExplorers: {
        blockscout: {
          apiUrl: "https://bob-sepolia.explorer.gobob.xyz/api",
          url: "https://bob-sepolia.explorer.gobob.xyz",
        },
      },
    },
    480: {
      name: "worldchain",
      blockExplorers: {
        etherscan: {
          apiUrl: "https://api.worldscan.org/api",
          url: "https://worldscan.org",
        },
      },
    },
    14: {
      name: "flare",
      blockExplorers: {
        etherscan: {
          apiUrl: "https://api.flarescan.com/api",
          url: "https://flarescan.com",
        },
      },
    },
    747474: {
      name: "katana",
      blockExplorers: {
        etherscan: {
          apiUrl: "https://api.katanascan.com/api",
          url: "https://katanascan.com",
        },
      },
    },
    4326: {
      name: "megaeth",
      blockExplorers: {
        etherscan: {
          apiUrl: "https://api-mega.etherscan.io/api",
          url: "https://mega.etherscan.io",
        },
      },
    },
    9745: {
      name: "plasma",
      blockExplorers: {
        etherscan: {
          apiUrl: "https://api.plasmascan.to/api",
          url: "https://plasmascan.to",
        },
      },
    },
    57073: {
      name: "ink",
      blockExplorers: {
        etherscan: {
          apiUrl: "https://explorer.inkonchain.com/api",
          url: "https://explorer.inkonchain.com",
        },
      },
    },
  },
  verify: {
    etherscan: {
      apiKey: ETHERSCAN_API_KEY ?? "",
      enabled: true,
    },
    sourcify: {
      enabled: false,
    },
  },
  tasks: [
    deployMastercopies,
    deployMastercopy,
    extractMastercopy,
    verifyMastercopies,
    verifyMastercopy,
  ],
});
