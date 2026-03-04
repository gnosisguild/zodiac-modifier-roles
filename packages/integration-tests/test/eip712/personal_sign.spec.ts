import { expect } from "chai"
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import {
  AbiCoder,
  Interface,
  Signer,
  ZeroAddress,
  ZeroHash,
  concat,
  keccak256,
  randomBytes,
  solidityPacked,
  toUtf8Bytes,
} from "ethers"
import hre, { ethers } from "hardhat"
import { createPublicClient, custom } from "viem"
import { hardhat } from "viem/chains"

import { iface as ifaceFallback } from "./setup/deploy-mastercopies/fallbackHandler"
import { iface as ifaceSafe } from "./setup/deploy-mastercopies/safeMastercopy"
import { deploySafe } from "./setup/safe"
import deployMastercopies from "./setup/deploy-mastercopies"

const EIP712_MAGIC_VALUE = "0x1626ba7e"

const SAFE_MSG_TYPEHASH = keccak256(
  toUtf8Bytes("SafeMessage(bytes message)")
)

// It's not possible to verify a contract signature (on-chain, "0x") directly
// with viem's standard tooling because it throws on "0x" signatures.
// So we verify with an off-chain EOA 1271 signature via viem's verifyMessage,
// and then compare that the same dataHash is produced by the lib and call
// isValidSignature directly.
describe("personal_sign", () => {
  async function setup() {
    await deployMastercopies()

    const lib = await (
      await ethers.getContractFactory("SignTypedMessageLib")
    ).deploy()

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

  it("isValidSignature with off-chain EOA signature", async () => {
    const { owner, relayer, safe, lib } = await loadFixture(setup)

    const plainMessage = "hello sir"
    const { dataHash } = await computeSafeMessageHash(
      plainMessage,
      safe,
      owner
    )

    // EOA signs the SafeMessage typed data (normal ecrecover, v=27/28)
    const chainId = (await owner.provider.getNetwork()).chainId
    const signature = await owner.signTypedData(
      { chainId, verifyingContract: safe as `0x${string}` },
      { SafeMessage: [{ name: "message", type: "bytes" }] },
      { message: AbiCoder.defaultAbiCoder().encode(["bytes32"], [dataHash]) }
    )

    // viem verifyMessage targeting the Safe (EIP-1271)
    const client = createPublicClient({
      chain: hardhat,
      transport: custom(hre.network.provider),
    })
    const isValid = await client.verifyMessage({
      address: safe as `0x${string}`,
      message: plainMessage,
      signature: signature as `0x${string}`,
    })
    expect(isValid).to.be.true

    // isValidSignature directly via ethers
    const result = ifaceFallback.decodeFunctionResult(
      "isValidSignature(bytes32,bytes)",
      await relayer.call({
        to: safe,
        data: ifaceFallback.encodeFunctionData(
          "isValidSignature(bytes32,bytes)",
          [dataHash, signature]
        ),
      })
    )
    expect(result).to.deep.equal([EIP712_MAGIC_VALUE])
  })

  it("isValidSignature with on-chain signMessage", async () => {
    const { owner, relayer, safe, lib } = await loadFixture(setup)

    const plainMessage = "hello sir"
    const { dataHash } = await computeSafeMessageHash(
      plainMessage,
      safe,
      owner
    )

    // Before signing on-chain, isValidSignature with 0x should revert
    await expect(
      relayer.call({
        to: safe,
        data: ifaceFallback.encodeFunctionData(
          "isValidSignature(bytes32,bytes)",
          [dataHash, "0x"]
        ),
      })
    ).to.be.reverted

    // Safe calls signMessage("hello sir") via SignTypedMessageLib
    await owner.sendTransaction(
      await encodePersonalSign({ owner, safe, lib, message: plainMessage })
    )

    // Sanity check: ethers-based isValidSignature with 0x works
    const result = ifaceFallback.decodeFunctionResult(
      "isValidSignature(bytes32,bytes)",
      await relayer.call({
        to: safe,
        data: ifaceFallback.encodeFunctionData(
          "isValidSignature(bytes32,bytes)",
          [dataHash, "0x"]
        ),
      })
    )
    expect(result).to.deep.equal([EIP712_MAGIC_VALUE])

    // viem's verifyMessage throws on "0x" signature, so this returns false
    const client = createPublicClient({
      chain: hardhat,
      transport: custom(hre.network.provider),
    })
    const isValid = await client.verifyMessage({
      address: safe as `0x${string}`,
      message: plainMessage,
      signature: "0x",
    })
    expect(isValid).to.be.false
  })
})

async function computeSafeMessageHash(
  plainMessage: string,
  safe: string,
  caller: Signer
) {
  // EIP-191 personal_sign envelope
  const eip191Envelope = concat([
    toUtf8Bytes("\x19Ethereum Signed Message:\n"),
    toUtf8Bytes(String(toUtf8Bytes(plainMessage).length)),
    toUtf8Bytes(plainMessage),
  ])
  const dataHash = keccak256(eip191Envelope)

  // isValidSignature(bytes32 _dataHash, ...) internally computes
  // message = abi.encode(_dataHash) before wrapping with Safe's domain
  const message = AbiCoder.defaultAbiCoder().encode(["bytes32"], [dataHash])

  const domainSeparator = await caller.call({
    to: safe,
    data: ifaceSafe.encodeFunctionData("domainSeparator"),
  })

  const safeMessageHash = keccak256(
    solidityPacked(
      ["bytes1", "bytes1", "bytes32", "bytes32"],
      [
        "0x19",
        "0x01",
        domainSeparator,
        keccak256(
          AbiCoder.defaultAbiCoder().encode(
            ["bytes32", "bytes32"],
            [SAFE_MSG_TYPEHASH, keccak256(message)]
          )
        ),
      ]
    )
  )

  return { dataHash, safeMessageHash }
}

async function encodePersonalSign({
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
  const iface = Interface.from(["function personalSign(bytes message)"])

  const data = ifaceSafe.encodeFunctionData("execTransaction", [
    lib,
    0,
    iface.encodeFunctionData("personalSign", [toUtf8Bytes(message)]),
    1, // Delegatecall
    0n,
    0n,
    0n,
    ZeroAddress,
    ZeroAddress,
    createPreApprovedSignature(await owner.getAddress()),
  ])

  return { to: safe, data, value: 0n }
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
