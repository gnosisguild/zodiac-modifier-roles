import { CHAINS } from "@/app/chains";
import { isAddress } from "viem";

const chains = Object.values(CHAINS);

export default function parseModParam(mod: string | string[] | undefined) {
  if (!mod || typeof mod !== "string") return null;

  const [chainPrefix, address] = mod.split("%3A"); // %3A is the URL encoded version of ":"

  const chain = chains.find((c) => c.prefix === chainPrefix);
  if (!chain || !isAddress(address)) {
    return null;
  }

  return { chainId: chain.id, address };
}
