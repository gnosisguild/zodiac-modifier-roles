import { expect } from "chai"
import { TypedData, TypedDataDomain } from "abitype"
import { TypedDataEncoder } from "ethers"
import { __integration } from "zodiac-roles-sdk"
import type { NetworkConnection } from "hardhat/types/network"

const { encodeTypedDomain, encodeTypedMessage, toAbiTypes } = __integration

type Value = Record<string, any>

export function createCompareToEthersHashing({
  ethers,
  networkHelpers,
}: Pick<NetworkConnection, "ethers" | "networkHelpers">) {
  const { loadFixture } = networkHelpers

  async function deployEIP712Encoder() {
    const EIP7127Encoder = await ethers.getContractFactory("MockEIP712Encoder")
    const encoder = await EIP7127Encoder.deploy()

    return { encoder }
  }

  return async function compareToEthersHashing({
    domain,
    types,
    message,
  }: {
    domain: TypedDataDomain
    types: TypedData
    message: Value
  }) {
    const { encoder } = await loadFixture(deployEIP712Encoder)

    const _domain = encodeTypedDomain({ domain })
    const _message = encodeTypedMessage({ types, message })
    const abiTypes = toAbiTypes({ domain, types })

    expect(
      await encoder.hashTypedMessage(_domain, _message, abiTypes)
    ).to.equal(TypedDataEncoder.hash(domain, types as any, message))
  }
}
