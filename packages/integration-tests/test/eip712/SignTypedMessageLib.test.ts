import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { TypedData, TypedDataDomain } from "abitype"
import {
  AbiCoder,
  Interface,
  Signer,
  TypedDataEncoder,
  ZeroAddress,
  ZeroHash,
  concat,
  randomBytes,
} from "ethers"
import hre from "hardhat"
import { encodeSignTypedMessage, __integration } from "zodiac-roles-sdk"

import deployMastercopies from "./setup/deploy-mastercopies"
import { iface as ifaceFallback } from "./setup/deploy-mastercopies/fallbackHandler"
import { iface as ifaceSafe } from "./setup/deploy-mastercopies/safeMastercopy"
import { deploySignTypedMessageLib } from "./setup/deploySignTypedMessageLib"
import { deploySafe } from "./setup/safe"

const EIP712_MAGIC_VALUE = "0x1626ba7e"
const EIP712_MAGIC_VALUE_OLD = "0x20c13b0b"

describe("SignTypedMessageLib", () => {
  async function setup() {
    await deployMastercopies()
    const lib = await deploySignTypedMessageLib()
    const [owner, relayer] = await hre.ethers.getSigners()

    const safe = await deploySafe(
      {
        owners: [await owner.getAddress()],
        threshold: 1,
        creationNonce: BigInt(randomHash()),
      },
      owner
    )

    return { owner, relayer, safe, lib: await lib.getAddress() }
  }
  it("signMessage()", async () => {
    const { owner, relayer, safe, lib } = await loadFixture(setup)

    const message = "0xbadfed"

    await owner.sendTransaction(
      await _encodeSignMessage({ owner, safe, lib, message })
    )

    const resultData = await relayer.call({
      to: safe,
      data: ifaceFallback.encodeFunctionData("isValidSignature(bytes,bytes)", [
        message,
        "0x",
      ]),
    })

    const result = ifaceFallback.decodeFunctionResult(
      "isValidSignature(bytes,bytes)",
      resultData
    )

    expect(result).to.deep.equal([EIP712_MAGIC_VALUE_OLD])
  })
  it("signTypedMessage()", async () => {
    const { owner, relayer, safe, lib } = await loadFixture(setup)

    const domain = {
      version: "1",
      chainId: 1, // Mainnet
    }

    const types = {
      Message: [
        { name: "amount", type: "uint256" },
        { name: "message", type: "string" },
      ],
    }

    const message = {
      amount: 100,
      message: "Hello World",
    }

    await owner.sendTransaction(
      await _encodeSignTypedMessage({
        owner,
        safe,
        lib,
        domain,
        message,
        types,
      })
    )

    const resultData = await relayer.call({
      to: safe,
      data: ifaceFallback.encodeFunctionData("isValidSignature(bytes,bytes)", [
        TypedDataEncoder.hash(domain, types, message),
        "0x",
      ]),
    })

    const result = ifaceFallback.decodeFunctionResult(
      "isValidSignature(bytes,bytes)",
      resultData
    )

    expect(result).to.deep.equal([EIP712_MAGIC_VALUE_OLD])
  })

  it("signTypedMessage() via fallback", async () => {
    const { owner, relayer, safe, lib } = await loadFixture(setup)

    const types = {
      Order: [
        { name: "maker", type: "Person" },
        { name: "taker", type: "Person" },
        { name: "asset", type: "Asset" },
        { name: "price", type: "uint256" },
        { name: "expiry", type: "uint256" },
      ],
      Person: [
        { name: "wallet", type: "address" },
        { name: "reputation", type: "uint256" },
      ],
      Asset: [
        { name: "tokenAddress", type: "address" },
        { name: "tokenId", type: "uint256" },
        { name: "amount", type: "uint256" },
      ],
    }

    const domain = {
      name: "TradePlatform",
      version: "1.0",
      chainId: 137,
      verifyingContract:
        "0xABABABababABababABababABababABababABaBab".toLowerCase(),
    }
    const message = {
      maker: {
        wallet: "0x1111111111111111111111111111111111111111",
        reputation: 100,
      },
      taker: {
        wallet: "0x2222222222222222222222222222222222222222",
        reputation: 200,
      },
      asset: {
        tokenAddress: "0x3333333333333333333333333333333333333333",
        tokenId: 12345,
        amount: 1,
      },
      price: 5000000000000,
      expiry: 1710000000,
    }

    const hashFromEthers = TypedDataEncoder.hash(domain, types, message)

    const tx = await _encodeSignTypedMessageFallback({
      owner,
      safe,
      lib,
      domain,
      message,
      types,
    })

    await owner.sendTransaction(tx)

    const resultData = await relayer.call({
      to: safe,
      data: ifaceFallback.encodeFunctionData("isValidSignature(bytes,bytes)", [
        hashFromEthers,
        "0x",
      ]),
    })

    const result = ifaceFallback.decodeFunctionResult(
      "isValidSignature(bytes,bytes)",
      resultData
    )

    expect(result).to.deep.equal([EIP712_MAGIC_VALUE_OLD])
  })
})

async function _encodeSignMessage({
  owner,
  safe,
  lib,
  message,
}: {
  owner: Signer
  safe: string
  lib: string
  message: string
}) {
  const iface = Interface.from(["function signMessage(bytes message)"])

  const data = ifaceSafe.encodeFunctionData("execTransaction", [
    lib,
    0,
    iface.encodeFunctionData("signMessage", [message]),
    1, //Delegatecall,
    0n,
    0n,
    0n,
    ZeroAddress,
    ZeroAddress,
    createPreApprovedSignature(await owner.getAddress()),
  ])

  return {
    to: safe,
    data,
    value: 0n,
  }
}

async function _encodeSignTypedMessage({
  owner,
  safe,
  lib,
  domain,
  message,
  types,
}: {
  owner: Signer
  safe: string
  lib: string
  domain: TypedDataDomain
  message: Record<string, any>
  types: TypedData
}) {
  const data = ifaceSafe.encodeFunctionData("execTransaction", [
    lib,
    0,
    encodeSignTypedMessage({ domain, message, types }),
    1, //Delegatecall,
    0n,
    0n,
    0n,
    ZeroAddress,
    ZeroAddress,
    createPreApprovedSignature(await owner.getAddress()),
  ])
  return {
    to: safe,
    data,
    value: 0n,
  }
}

async function _encodeSignTypedMessageFallback({
  owner,
  safe,
  lib,
  domain,
  message,
  types,
}: {
  owner: Signer
  safe: string
  lib: string
  domain: any
  message: any
  types: any
}) {
  const data = ifaceSafe.encodeFunctionData("execTransaction", [
    lib,
    0,
    `0x11223344${encodeSignTypedMessage({ domain, message, types }).slice(10)}`,
    1, //Delegatecall,
    0n,
    0n,
    0n,
    ZeroAddress,
    ZeroAddress,
    createPreApprovedSignature(await owner.getAddress()),
  ])

  return {
    to: safe,
    data,
    value: 0n,
  }
}

const createPreApprovedSignature = (approver: string) => {
  return concat([
    AbiCoder.defaultAbiCoder().encode(["address"], [approver]),
    ZeroHash,
    "0x01",
  ])
}

function randomHash(): string {
  return (
    "0x" +
    Array.from(randomBytes(32))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  )
}
