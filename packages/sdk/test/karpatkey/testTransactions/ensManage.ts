export default [
  //---------------------------------------------------------------------------------------------------------------------------------
  // AAVE V3 - ETH
  //---------------------------------------------------------------------------------------------------------------------------------
  // Supply ETH - depositETH(address,address,uint16)
  {
    from: "0x4F2083f5fBede34C2714aFfb3105539775f7FE64",
    to: "0xD322A49006FC828F9B5B37Ab215F99B4E5caB19C",
    data: "0x474cf53d00000000000000000000000087870Bca3F3fD6335C3F4ce8392D69350B4fA4E20000000000000000000000004f2083f5fbede34c2714affb3105539775f7fe640000000000000000000000000000000000000000000000000000000000000000",
    value: 1000000000000000,
  },
  // Approve aETH with WRAPPED_TOKEN_GATEWAY_V3 as spender - "approve(address,uint256)"
  {
    from: "0x4F2083f5fBede34C2714aFfb3105539775f7FE64",
    to: "0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8",
    data: "0x095ea7b3000000000000000000000000d322a49006fc828f9b5b37ab215f99b4e5cab19cffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
  },
  // Withdraw ETH - withdrawETH(address,uint256,address)
  {
    from: "0x4F2083f5fBede34C2714aFfb3105539775f7FE64",
    to: "0xD322A49006FC828F9B5B37Ab215F99B4E5caB19C",
    data: "0x80500d2000000000000000000000000087870Bca3F3fD6335C3F4ce8392D69350B4fA4E2ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000004f2083f5fbede34c2714affb3105539775f7fe64",
  },
]
