import assert from "assert"
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"
import {
  Contract,
  Signer,
  ZeroHash,
  getCreate2Address,
  keccak256,
  parseEther,
} from "ethers"

export async function deployViaFactory(
  { bytecode, salt = ZeroHash }: { bytecode: string; salt?: string },
  deployer: Signer,
  displayName?: string
): Promise<string> {
  const provider = deployer.provider
  assert(provider)

  const factory = new Contract(
    factoryInfo.address,
    [
      "function deploy(bytes memory _initCode, bytes32 _salt) public returns (address payable createdContract)",
    ],
    deployer
  )

  const computedAddress = getCreate2Address(
    factoryInfo.address,
    salt,
    keccak256(bytecode)
  )

  if ((await provider.getCode(computedAddress)) == "0x") {
    const receipt = await (
      await factory.deploy(bytecode, salt, { gasLimit: 10000000 })
    ).wait()

    if (receipt?.status != 1) {
      throw new Error(
        `Couldn't deploy ${displayName || "contract"} eip-2470 factory`
      )
    }
  }

  return computedAddress
}

const factoryInfo = {
  address: "0xce0042b868300000d44a59004da54a005ffdcf9f",
  deployer: "0xBb6e024b9cFFACB947A71991E386681B1Cd1477D",
  transaction:
    "0xf9016c8085174876e8008303c4d88080b90154608060405234801561001057600080fd5b50610134806100206000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80634af63f0214602d575b600080fd5b60cf60048036036040811015604157600080fd5b810190602081018135640100000000811115605b57600080fd5b820183602082011115606c57600080fd5b80359060200191846001830284011164010000000083111715608d57600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550509135925060eb915050565b604080516001600160a01b039092168252519081900360200190f35b6000818351602085016000f5939250505056fea26469706673582212206b44f8a82cb6b156bfcc3dc6aadd6df4eefd204bc928a4397fd15dacf6d5320564736f6c634300060200331b83247000822470",
}

/**
 * If it is not deployed on the network, deploys the singleton factory contract
 *
 * https://eips.ethereum.org/EIPS/eip-2470
 */
export async function deployFactory(signer: SignerWithAddress) {
  const { address, deployer } = factoryInfo

  // fund the singleton factory deployer account
  await signer.sendTransaction({
    to: deployer,
    value: parseEther("0.0247"),
  })

  // deploy the singleton factory
  await (
    await signer.provider.broadcastTransaction(factoryInfo.transaction)
  ).wait()

  return address
}
