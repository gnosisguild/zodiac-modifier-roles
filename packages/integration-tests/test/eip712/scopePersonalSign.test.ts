import { expect } from "chai"
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { concat, randomBytes, toUtf8Bytes } from "ethers"
import hre, { ethers } from "hardhat"
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

    // EOA: dapp hashes the EIP-191 prefixed message and ecrecovers the signer.
    // Safe: dapp passes the prefixed message (not hashed) to isValidSignature,
    // which internally hashes it and checks signedMessages. "0x" means onchain
    const messageBytes = toUtf8Bytes(message)
    const preimage = concat([
      toUtf8Bytes("\x19Ethereum Signed Message:\n"),
      toUtf8Bytes(String(messageBytes.length)),
      messageBytes,
    ])

    // Before signing, isValidSignature should revert
    await expect(
      relayer.call({
        to: safe,
        data: ifaceFallback.encodeFunctionData(
          "isValidSignature(bytes,bytes)",
          [preimage, "0x"]
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
        preimage,
        "0x",
      ]),
    })

    const result = ifaceFallback.decodeFunctionResult(
      "isValidSignature(bytes,bytes)",
      resultData
    )

    expect(result).to.deep.equal([EIP712_MAGIC_VALUE])
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
