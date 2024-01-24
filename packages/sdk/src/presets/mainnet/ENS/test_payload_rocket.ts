import { allow } from "../../allow"
import { allowErc20Approve } from "../../helpers/erc20"
import { AVATAR } from "../../placeholders"
import { RolePreset } from "../../types"
import { rETH, rocket_pool } from "../addresses"

const preset = {
  network: 1,
  allow: [
    //---------------------------------------------------------------------------------------------------------------------------------
    // ROCKET POOL
    // Current Deployments: https://docs.rocketpool.net/overview/contracts-integrations.html
    // IMPORTANT: https://docs.rocketpool.net/developers/usage/contracts/contracts.html
    // RocketStorage contract: 0x1d8f8f00cfa6758d7bE78336684788Fb0ee0Fa46
    // The central hub of the network is the RocketStorage contract, which is responsible for storing the state of the
    // entire protocol. This is implemented through the use of maps for key-value storage, and getter and setter methods for
    // reading and writing values for a key.
    // The RocketStorage contract also stores the addresses of all other network contracts (keyed by name),
    // and restricts data modification to those contracts only.
    // Because of Rocket Pool's architecture, the addresses of other contracts should not be used directly but retrieved
    // from the blockchain before use. Network upgrades may have occurred since the previous interaction, resulting in
    // outdated addresses. RocketStorage can never change address, so it is safe to store a reference to it.
    //---------------------------------------------------------------------------------------------------------------------------------
    ...allowErc20Approve([rETH], [rocket_pool.SWAP_ROUTER]),

    // Deposit ETH in exchange for rETH
    allow.mainnet.rocket_pool.deposit_pool["deposit"]({
      send: true,
    }),

    // Withdraw ETH - Burns rETH in exchange for ETH
    allow.mainnet.rocket_pool.rETH["burn"](),

    // Swap ETH for rETH through SWAP_ROUTER - When there is not enough rETH in the DEPOSIT_POOL in exchange for the
    // ETH you are depositing, the SWAP_ROUTER swaps the ETH for rETH in secondary markets (Balancer and Uniswap).
    allow.mainnet.rocket_pool.swap_router["swapTo"](
      undefined,
      undefined,
      undefined,
      undefined,
      {
        send: true,
      }
    ),

    // Swap rETH for ETH through SWAP_ROUTER - When there is not enough ETH in the DEPOSIT_POOL in exchange for the
    // rETH you are withdrawing, the SWAP_ROUTER swaps the rETH for ETH in secondary markets (Balancer and Uniswap).
    allow.mainnet.rocket_pool.swap_router["swapFrom"](),
  ],
  placeholders: { AVATAR },
} satisfies RolePreset
export default preset
