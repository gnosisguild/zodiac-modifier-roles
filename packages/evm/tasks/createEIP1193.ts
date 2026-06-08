import type { EIP1193Provider } from "@gnosis-guild/zodiac-core";
import type { Signer } from "ethers";
import type { EthereumProvider } from "hardhat/types";

export function createEIP1193(
  provider: EthereumProvider,
  signer: Signer
): EIP1193Provider {
  return {
    request: async ({ method, params }) => {
      if (method === "eth_sendTransaction") {
        const { hash } = await signer.sendTransaction((params as any[])[0]);
        return hash;
      }

      return provider.request({ method, params });
    },
  };
}
