import { RolePreset } from "../types";

import { allowErc20Approve } from "./utils";

const ERC20_TOKENS = {
  GNO: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
  "SushiSwap LP Token": "0x8C0C36c85192204c8d782F763fF5a30f5bA0192F",
};

const DEFI_PROTOCOLS = {
  "SushiSwap UniswapV2Router02": "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
};

const preset: RolePreset = {
  network: 100,
  allowTargets: [
    ...Object.values(DEFI_PROTOCOLS).map((address) => ({
      targetAddress: address,
    })),
  ],
  allowFunctions: [
    allowErc20Approve(
      Object.values(ERC20_TOKENS),
      Object.values(DEFI_PROTOCOLS)
    ),
  ],
};
export default preset;
