import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { AbiCoder, randomBytes } from "ethers"
import { Condition, ExecutionOptions } from "zodiac-roles-sdk"

import { moduleProxyFactory } from "./deploy-mastercopies/moduleProxyFactory"
import { rolesModMastercopy } from "./deploy-mastercopies/rolesMastercopy"
import { enableModuleInSafe } from "./safe"
import { ConditionFlatStruct } from "../../../../evm/typechain-types/contracts/test/MockTopology"

export async function deployRoles(
  {
    avatar,
    target,
    owner,
  }: {
    avatar: string
    target: string
    owner: string
  },
  relayer: HardhatEthersSigner
) {
  function encodeSetUp() {
    const initializer = AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "address"],
      [owner, avatar, target]
    )

    return rolesModMastercopy.iface.encodeFunctionData("setUp", [initializer])
  }

  const tx = {
    to: moduleProxyFactory.address,
    value: 0,
    data: moduleProxyFactory.iface.encodeFunctionData("deployModule", [
      rolesModMastercopy.address,
      encodeSetUp(),
      randomHash(),
    ]),
  }

  const result = await relayer.call(tx)
  const [address] = moduleProxyFactory.iface.decodeFunctionResult(
    "deployModule",
    result
  )

  await relayer.sendTransaction(tx)

  return address
}

export async function connectRolesSafeAndMember({
  owner,
  safe,
  roles,
  member,
}: {
  owner: HardhatEthersSigner
  safe: string
  roles: string
  member: string
}) {
  const roleKey = randomHash()
  await enableModuleInSafe({ safe, module: roles }, owner)

  await owner.sendTransaction({
    to: roles,
    data: rolesModMastercopy.iface.encodeFunctionData("enableModule", [member]),
  })

  await owner.sendTransaction({
    to: roles,
    data: rolesModMastercopy.iface.encodeFunctionData("assignRoles", [
      member,
      [roleKey],
      [true],
    ]),
  })

  return { roleKey }
}

export async function scopeTarget({
  owner,
  roles,
  roleKey,
  target,
}: {
  owner: HardhatEthersSigner
  roles: string
  roleKey: string
  target: string
}) {
  await owner.sendTransaction({
    to: roles,
    data: rolesModMastercopy.iface.encodeFunctionData("scopeTarget", [
      roleKey,
      target,
    ]),
  })
}

export async function scopeFunction({
  owner,
  roles,
  roleKey,
  target,
  selector,
  condition,
  executionOptions,
}: {
  owner: HardhatEthersSigner
  roles: string
  roleKey: string
  target: string
  selector: string
  condition: Condition
  executionOptions: ExecutionOptions
}) {
  await owner.sendTransaction({
    to: roles,
    data: rolesModMastercopy.iface.encodeFunctionData("scopeFunction", [
      roleKey,
      target,
      selector,
      flattenCondition(condition).map((c) => [
        c.parent,
        c.paramType,
        c.operator,
        c.compValue || "0x",
      ]),
      executionOptions,
    ]),
  })
}

export async function execTransactionWithRole({
  signer,
  roles,
  roleKey,
  to,
  data,
  operation,
}: {
  signer: HardhatEthersSigner
  roles: string
  roleKey: string
  to: string
  data: string
  operation: number
}) {
  return await signer.sendTransaction({
    to: roles,
    data: rolesModMastercopy.iface.encodeFunctionData(
      "execTransactionWithRole",
      [to, 0, data, operation, roleKey, true]
    ),
  })
}

function randomHash(): string {
  return (
    "0x" +
    Array.from(randomBytes(32))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  )
}

const flattenCondition = (root: any): ConditionFlatStruct[] => {
  const result: ConditionFlatStruct[] = []
  const queue = [{ condition: root, parent: 0 }]

  while (queue.length > 0) {
    const {
      condition: { children, ...conditionFlat },
      parent,
    } = queue.shift()!

    result.push({ compValue: "0x", ...conditionFlat, parent })
    const index = result.length - 1

    if (children) {
      for (const child of children) {
        queue.push({ condition: child, parent: index })
      }
    }
  }

  if (result.length > 256) {
    console.warn(
      "Condition tree has more than 256 nodes. It will not be possible to apply this permission to the Roles mod."
    )
  }

  return result
}
