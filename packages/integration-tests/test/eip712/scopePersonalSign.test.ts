import { expect } from "chai"
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import {
  AbiCoder,
  concat,
  hashMessage,
  keccak256,
  randomBytes,
  toUtf8Bytes,
} from "ethers"
import { ethers } from "hardhat"
import {
  ExecutionOptions,
  encodePersonalSign,
  scopePersonalSign,
} from "zodiac-roles-sdk"

import { iface as ifaceFallback } from "./setup/deploy-mastercopies/fallbackHandler"
import {
  connectRolesSafeAndMember,
  deployRoles,
  execTransactionWithRole,
  scopeFunction,
  scopeTarget,
} from "./setup/roles"
import { deploySafe } from "./setup/safe"
import deployMastercopies from "./setup/deploy-mastercopies"

const EIP712_MAGIC_VALUE = "0x20c13b0b"

describe("scopePersonalSign()", () => {
  async function setup() {
    await deployMastercopies()

    const lib = await (
      await ethers.getContractFactory("SignTypedMessageLib")
    ).deploy()

    const [owner, member, relayer] = await hre.ethers.getSigners()

    const safe = await deploySafe(
      {
        owners: [await owner.getAddress()],
        threshold: 1,
        creationNonce: BigInt(randomHash()),
      },
      relayer
    )

    const roles = await deployRoles(
      { avatar: safe, target: safe, owner: await owner.getAddress() },
      relayer
    )

    const { roleKey } = await connectRolesSafeAndMember({
      owner,
      safe,
      roles,
      member: await member.getAddress(),
    })

    await scopeTarget({
      owner,
      roles,
      roleKey,
      target: await lib.getAddress(),
    })

    const startsWith = "example.com wants you to sign in"

    const { selector, condition } = scopePersonalSign({ startsWith })

    await scopeFunction({
      owner,
      roles,
      roleKey,
      target: await lib.getAddress(),
      selector,
      condition,
      executionOptions: ExecutionOptions.Both,
    })


    return {
      relayer,
      safe,
      roles,
      lib: await lib.getAddress(),
      startsWith,
      execTransactionFromRoles: ({
        to,
        data,
        operation,
      }: {
        to: string
        data: string
        operation: number
      }) =>
        execTransactionWithRole({
          roles,
          roleKey,
          to,
          data,
          operation,
          signer: member,
        }),
    }
  }

  it("allows signing a message that starts with the allowed prefix", async () => {
    const { lib, startsWith, execTransactionFromRoles } =
      await loadFixture(setup)

    const message = startsWith + " with nonce 12345"

    await expect(
      execTransactionFromRoles({
        to: lib,
        data: encodePersonalSign({ message }),
        operation: 1,
      })
    ).to.not.be.reverted
  })

  it("allows signing a message that exactly matches the prefix", async () => {
    const { lib, startsWith, execTransactionFromRoles } =
      await loadFixture(setup)

    await expect(
      execTransactionFromRoles({
        to: lib,
        data: encodePersonalSign({ message: startsWith }),
        operation: 1,
      })
    ).to.not.be.reverted
  })

  it("rejects signing a message that does not start with the allowed prefix", async () => {
    const { lib, execTransactionFromRoles } = await loadFixture(setup)

    const message = "malicious.com wants you to sign in with nonce 12345"

    await expect(
      execTransactionFromRoles({
        to: lib,
        data: encodePersonalSign({ message }),
        operation: 1,
      })
    ).to.be.reverted
  })

  it("signs a message through roles and verifies via isValidSignature", async () => {
    const { relayer, lib, safe, startsWith, execTransactionFromRoles } =
      await loadFixture(setup)

    const message = startsWith + " with session abc"

    // The CompatibilityFallbackHandler bridges isValidSignature(bytes32,bytes)
    // to isValidSignature(bytes,bytes) by passing abi.encode(dataHash) as data.
    // So for the legacy bytes path, we pass abi.encode(keccak256(eip191Preimage))
    const messageBytes = toUtf8Bytes(message)
    const eip191Preimage = concat([
      toUtf8Bytes("\x19Ethereum Signed Message:\n"),
      toUtf8Bytes(String(messageBytes.length)),
      messageBytes,
    ])
    const messageData = AbiCoder.defaultAbiCoder().encode(
      ["bytes32"],
      [keccak256(eip191Preimage)]
    )

    // Before signing, isValidSignature should revert
    await expect(
      relayer.call({
        to: safe,
        data: ifaceFallback.encodeFunctionData(
          "isValidSignature(bytes,bytes)",
          [messageData, "0x"]
        ),
      })
    ).to.be.revertedWith("Hash not approved")

    // Sign the message through roles
    await execTransactionFromRoles({
      to: lib,
      data: encodePersonalSign({ message }),
      operation: 1,
    })

    // After signing, isValidSignature should return magic value
    const resultData = await relayer.call({
      to: safe,
      data: ifaceFallback.encodeFunctionData("isValidSignature(bytes,bytes)", [
        messageData,
        "0x",
      ]),
    })

    const result = ifaceFallback.decodeFunctionResult(
      "isValidSignature(bytes,bytes)",
      resultData
    )

    expect(result).to.deep.equal([EIP712_MAGIC_VALUE])
  })

  it("signs a message and verifies via isValidSignature(bytes32,bytes)", async () => {
    const { relayer, lib, safe, startsWith, execTransactionFromRoles } =
      await loadFixture(setup)

    const message = startsWith + " with session abc"
    const messageHash = hashMessage(message)

    // Before signing, isValidSignature(bytes32,bytes) should revert
    await expect(
      relayer.call({
        to: safe,
        data: ifaceFallback.encodeFunctionData("isValidSignature(bytes32,bytes)", [
          messageHash,
          "0x",
        ]),
      })
    ).to.be.revertedWith("Hash not approved")

    // Sign the message through roles
    await execTransactionFromRoles({
      to: lib,
      data: encodePersonalSign({ message }),
      operation: 1,
    })

    // After signing, isValidSignature(bytes32,bytes) should return magic value
    const resultData = await relayer.call({
      to: safe,
      data: ifaceFallback.encodeFunctionData("isValidSignature(bytes32,bytes)", [
        messageHash,
        "0x",
      ]),
    })

    const result = ifaceFallback.decodeFunctionResult(
      "isValidSignature(bytes32,bytes)",
      resultData
    )

    expect(result).to.deep.equal(["0x1626ba7e"])
  })
})

function randomHash(): string {
  return (
    "0x" +
    Array.from(randomBytes(32))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  )
}
