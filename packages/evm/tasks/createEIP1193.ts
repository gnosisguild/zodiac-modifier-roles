import { EIP1193Provider } from "@gnosis-guild/zodiac-core";
import { Signer } from "ethers";
import { EthereumProvider } from "hardhat/types";
import ethProvider from "eth-provider";

const shallUseFrame = process.env.USE_FRAME === "true";

export function createEIP1193(
  chainId: number | undefined,
  provider: EthereumProvider,
  signer: Signer
): EIP1193Provider {
  return {
    request: async ({ method, params }) => {
      if (method == "eth_sendTransaction") {
        if (shallUseFrame) {
          return requestUsingFrame(chainId, method, params);
        }

        const { hash } = await signer.sendTransaction((params as any[])[0]);
        return hash;
      }

      return provider.request({ method, params });
    },
  };
}

const requestUsingFrame = async (
  chainId: number | undefined,
  method: string,
  params: any
) => {
  if (!chainId) throw new Error("Chain ID is required when using frame");
  const frame = ethProvider("frame");
  frame.setChain(chainId);
  // fix for "Transaction parameter 'gasLimit' is not a valid hex string" RPC error
  if (Array.isArray(params) && typeof params[0].gasLimit === "number") {
    params[0].gasLimit = "0x" + params[0].gasLimit.toString(16);
  }
  return frame.request({ method, params });
};
