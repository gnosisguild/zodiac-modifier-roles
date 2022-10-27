import pools from "./pools"
// type RegularPoolAddresses = keyof typeof pools.regular
// type FactoryPoolAddresses = keyof typeof pools.factory
// type CryptoV2PoolAddresses = keyof typeof pools.cryptoV2
// type CryptoFactoryPoolAddresses = keyof typeof pools.cryptoFactory
// interface RegularPool  {
//   "name": string,
//   "type": "regular",
//   "meta": true,
//   "address": "0xd81dA8D904b52208541Bade1bD6595D8a251F8dd",
//   "token": "0x2fE94ea3d5d4a175184081439753DE15AeF9d614",
//   "tokens": [
//     "0x8064d9Ae6cDf087b1bcd5BDf3531bD5d8C537a68",
//     "0x075b1bb99792c9E1041bA13afEf80C91a1e70fB3",
//   ],
//   "gauge": {
//     "address": "0x11137B10C210b579405c21A07489e28F3c040AB1",
//     "type": "LiquidityGaugeV2",
//   },
//   "zap": {
//     "address": "0xd5BCf53e2C81e1991570f33Fa881c49EEa570C8D",
//     "basePool": {
//       "address": "0xd5BCf53e2C81e1991570f33Fa881c49EEa570C8D",
//       "tokens": [
//         "0xd5BCf53e2C81e1991570f33Fa881c49EEa570C8D",
//         "0xd5BCf53e2C81e1991570f33Fa881c49EEa570C8D",
//       ],
//     },
//   },
// },
// type FactoryPool = typeof pools.factory[FactoryPoolAddresses]
// type CryptoV2Pool = typeof pools.cryptoV2[CryptoV2PoolAddresses]
// type CryptoFactoryPool = typeof pools.cryptoFactory[CryptoFactoryPoolAddresses]
// export type PoolNameOrTokenAddress =
//   | RegularPool["name"]
//   | RegularPoolAddresses
//   | FactoryPool["name"]
//   | FactoryPoolAddresses
//   | CryptoV2Pool["name"]
//   | CryptoV2PoolAddresses
//   | CryptoFactoryPool["name"]
//   | CryptoFactoryPoolAddresses

type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never

export type Pool = ArrayElement<typeof pools>
