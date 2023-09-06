export default [
  //---------------------------------------------------------------------------------------------------------------------------------
  // LIDO
  //---------------------------------------------------------------------------------------------------------------------------------
  // Approve wstETH as spender for stETH - "approve(address,uint256)"
  {
    from: "0x0EFcCBb9E2C09Ea29551879bd9Da32362b32fc89",
    to: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
    data: "0x095ea7b30000000000000000000000007f39c581f595b53c5cb19bd0b3f8da6c935e2ca0ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
  },
  // Wrap stETH - "wrap(uint256)"
  {
    from: "0x0EFcCBb9E2C09Ea29551879bd9Da32362b32fc89",
    to: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
    data: "0xea598cb00000000000000000000000000000000000000000000000000de0b6b3a7640000",
  },
  // Unwrap wstETH - "unwrap(uint256)"
  {
    from: "0x0EFcCBb9E2C09Ea29551879bd9Da32362b32fc89",
    to: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
    data: "0xde0e9a3e0000000000000000000000000000000000000000000000000de0b6b3a7640000",
  },
  // Stake ETH - "submit(address)"
  {
    from: "0x0EFcCBb9E2C09Ea29551879bd9Da32362b32fc89",
    to: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
    data: "0xa1903eab0000000000000000000000000000000000000000000000000000000000000000",
    value: "1000000000000000000",
  },
]
