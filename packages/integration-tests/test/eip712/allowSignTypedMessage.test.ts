import { expect } from "chai"
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import {
  TypedDataEncoder,
  ZeroAddress,
  ZeroHash,
  keccak256,
  randomBytes,
} from "ethers"
import hre, { ethers } from "hardhat"
import {
  ExecutionOptions,
  allowSignTypedMessage,
  encodeSignTypedMessage,
  __integration,
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

const { toAbiTypes } = __integration

const SomeAddress =
  "0x7e2a2fa2a064f693f0a55c5639476d913ff12d05" as `0x${string}`
const AddressOne =
  "0x0000000000000000000000000000000000000001" as `0x${string}`

const EIP712_MAGIC_VALUE = "0x20c13b0b"

describe("allowSignTypedMessage()", () => {
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

    const domain = {
      name: "Array Test",
      version: "1",
      chainId: 1,
      verifyingContract:
        "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC" as `0x${string}`,
    }

    // Define the types for the EIP-712 structured data
    const types = {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      Person: [
        { name: "name", type: "string" },
        { name: "wallet", type: "address" },
        { name: "attachments", type: "Attachment[]" },
      ],
      Attachment: [{ name: "filename", type: "string" }],
    } as const

    // The actual data to be signed
    const message = {
      name: "Vitalik",
      wallet: SomeAddress,
      attachments: [
        {
          filename: "document.pdf",
        },
        {
          filename: "image.jpg",
        },
      ],
    }

    const { selector, condition } = allowSignTypedMessage({
      types,
      domain: {
        chainId: 1n,
        verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
      },
      message: {
        name: "Vitalik",
        wallet: SomeAddress,
      },
    })

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
      domain,
      message,
      types,
    }
  }

  it("correctly restricts some elements in domain", async () => {
    const { lib, roles, message, domain, types, execTransactionFromRoles } =
      await loadFixture(setup)

    await expect(
      execTransactionFromRoles({
        to: lib,
        data: encodeSignTypedMessage({
          domain,
          types,
          // Cast to bypass the compile-time check so we can verify the
          // on-chain condition also rejects the malformed value.
          message: { ...message, name: 1 } as any,
        }),
        operation: 1,
      })
    ).to.be.reverted

    await expect(
      execTransactionFromRoles({
        to: lib,
        data: encodeSignTypedMessage({
          domain: {
            ...domain,
            verifyingContract: ZeroAddress as `0x${string}`,
          },
          types,
          message,
        }),
        operation: 1,
      })
    ).to.be.reverted

    await expect(
      execTransactionFromRoles({
        to: lib,
        data: encodeSignTypedMessage({ domain, types, message }),
        operation: 1,
      })
    ).to.not.be.reverted

    // any name for the app
    await expect(
      execTransactionFromRoles({
        to: lib,
        data: encodeSignTypedMessage({ domain, types, message }),
        operation: 1,
      })
    ).to.not.be.reverted

    // any version for the app
    await expect(
      execTransactionFromRoles({
        to: lib,
        data: encodeSignTypedMessage({
          domain: {
            ...domain,
            version: "v3.4.5",
          },
          types,
          message,
        }),
        operation: 1,
      })
    ).to.not.be.reverted

    await expect(
      execTransactionFromRoles({
        to: lib,
        data: encodeSignTypedMessage({
          domain: {
            ...domain,
            name: "Our latest super release",
          },
          types,
          message,
        }),
        operation: 1,
      })
    ).to.not.be.reverted
  })

  it("correctly restricts some elements in message", async () => {
    const { lib, message, domain, types, execTransactionFromRoles } =
      await loadFixture(setup)

    await expect(
      execTransactionFromRoles({
        to: lib,
        data: encodeSignTypedMessage({
          domain,
          types,
          message: { ...message, name: "Alice" },
        }),
        operation: 1,
      })
    )

    await expect(
      execTransactionFromRoles({
        to: lib,
        data: encodeSignTypedMessage({
          domain,
          types,
          message: { ...message, wallet: AddressOne },
        }),
        operation: 1,
      })
    ).to.be.reverted

    await expect(
      execTransactionFromRoles({
        to: lib,
        data: encodeSignTypedMessage({
          domain,
          types,
          message: { ...message, attachments: [{ filename: "logs.csv" }] },
        }),
        operation: 1,
      })
    ).to.not.be.reverted

    // any name for the app
    await expect(
      execTransactionFromRoles({
        to: lib,
        data: encodeSignTypedMessage({ domain, types, message }),
        operation: 1,
      })
    ).to.not.be.reverted
  })

  it("correctly enforces exact type layout", async () => {
    const { lib, message, domain, types, execTransactionFromRoles } =
      await loadFixture(setup)

    const data = encodeSignTypedMessage({ domain, types, message })
    await expect(
      execTransactionFromRoles({
        to: lib,
        data: data,
        operation: 1,
      })
    ).to.not.be.reverted

    const aTypeHash = toAbiTypes({ domain, types })
      .map((n) => n.typeHash)
      .find((t) => t != ZeroHash)!

    // change one hash
    expect(data.includes(aTypeHash.slice(2))).to.be.true

    await expect(
      execTransactionFromRoles({
        to: lib,
        data: data.replace(aTypeHash.slice(2), keccak256(aTypeHash).slice(2)),
        operation: 1,
      })
    ).to.be.reverted
  })

  it("signs a message from a safe, through a roles mod", async () => {
    const {
      relayer,
      lib,
      safe,
      message,
      domain,
      types,
      execTransactionFromRoles,
    } = await loadFixture(setup)

    const { EIP712Domain, ...rest } = types
    const messageHashTypes = rest as any

    await expect(
      relayer.call({
        to: safe,
        data: ifaceFallback.encodeFunctionData(
          "isValidSignature(bytes,bytes)",
          [TypedDataEncoder.hash(domain, messageHashTypes, message), "0x"]
        ),
      })
    ).to.be.revertedWith("Hash not approved")

    await execTransactionFromRoles({
      to: lib,
      data: encodeSignTypedMessage({ domain, types, message }),
      operation: 1,
    })

    const resultData = await relayer.call({
      to: safe,
      data: ifaceFallback.encodeFunctionData("isValidSignature(bytes,bytes)", [
        TypedDataEncoder.hash(domain, messageHashTypes, message),
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
