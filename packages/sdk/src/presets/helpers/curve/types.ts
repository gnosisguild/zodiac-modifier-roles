import pools from "./pools"

type RegularPoolAddresses = keyof typeof pools.regular
type FactoryPoolAddresses = keyof typeof pools.factory
type CryptoV2PoolAddresses = keyof typeof pools.cryptoV2
type CryptoFactoryPoolAddresses = keyof typeof pools.cryptoFactory

type RegularPool = typeof pools.regular[RegularPoolAddresses]
type FactoryPool = typeof pools.factory[FactoryPoolAddresses]
type CryptoV2Pool = typeof pools.cryptoV2[CryptoV2PoolAddresses]
type CryptoFactoryPool = typeof pools.cryptoFactory[CryptoFactoryPoolAddresses]

export type PoolNameOrTokenAddress =
  | RegularPool["name"]
  | RegularPoolAddresses
  | FactoryPool["name"]
  | FactoryPoolAddresses
  | CryptoV2Pool["name"]
  | CryptoV2PoolAddresses
  | CryptoFactoryPool["name"]
  | CryptoFactoryPoolAddresses

export type Pool = RegularPool | FactoryPool | CryptoV2Pool | CryptoFactoryPool
