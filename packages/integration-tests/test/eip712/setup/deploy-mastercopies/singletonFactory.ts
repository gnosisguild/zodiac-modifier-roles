import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"
import { ZeroHash, getCreate2Address, keccak256, parseEther } from "ethers"

export async function deployViaFactory(
  { bytecode, salt = ZeroHash }: { bytecode: string; salt?: string },
  signer: SignerWithAddress
) {
  await signer.sendTransaction({
    to: factory.address,
    data: `${salt}${bytecode.slice(2)}`,
    value: 0,
  })

  return getCreate2Address(factory.address, salt, keccak256(bytecode))
}

const factory = {
  address: "0x4e59b44847b379578588920ca78fbf26c0b4956c",
  signerAddress: "0x3fab184622dc19b6109349b94811493bf2a45362",
  transaction:
    "0xf8a58085174876e800830186a08080b853604580600e600039806000f350fe7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf31ba02222222222222222222222222222222222222222222222222222222222222222a02222222222222222222222222222222222222222222222222222222222222222",
}

export async function deployFactory(signer: SignerWithAddress) {
  const { address, signerAddress, transaction } = factory
  // fund the presined transaction signer
  await signer.sendTransaction({
    to: signerAddress,
    value: parseEther("0.01"),
  })

  // shoot the presigned transaction
  await (await signer.provider.broadcastTransaction(transaction)).wait()

  return address
}
