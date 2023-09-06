import { getCreate2Address, keccak256 } from "ethers/lib/utils";

const ERC2470_SINGLETON_FACTORY_ADDRESS =
  "0xce0042b868300000d44a59004da54a005ffdcf9f";

export const calculateMastercopyAddress = (initCode: string, salt: string) => {
  const initCodeHash = keccak256(initCode);
  return getCreate2Address(
    ERC2470_SINGLETON_FACTORY_ADDRESS,
    salt,
    initCodeHash
  );
};
