import chai from "chai"
import chaiAsPromised from "chai-as-promised"
import { fetchRolesMod } from "zodiac-roles-deployments"

chai.use(chaiAsPromised)
const expect = chai.expect

describe.only("fetchRolesMod", () => {
  it("fetches the mod's base config, allowance, and unwrap adapter", async () => {
    const rolesMod = await fetchRolesMod({
      address: "0x13c61a25db73e7a94a244bd2205adba8b4a60f4a",
      chainId: 1,
      blockNumber: 21739074,
    })
    expect(rolesMod).to.have.property(
      "address",
      "0x13c61a25db73e7a94a244bd2205adba8b4a60f4a"
    )
    expect(rolesMod).to.have.property("owner")
    expect(rolesMod).to.have.property("avatar")
    expect(rolesMod).to.have.property("target")
    expect(rolesMod).to.have.property("allowances")
    expect(rolesMod).to.have.property("unwrapAdapters")
  })

  it("fetches all roles but omits conditions while indicating if the target function is wildcarded", async () => {
    const rolesMod = await fetchRolesMod({
      address: "0x13c61a25db73e7a94a244bd2205adba8b4a60f4a",
      chainId: 1,
      blockNumber: 21739074,
    })

    if (!rolesMod) throw new Error("rolesMod is null")

    expect(rolesMod).to.have.property("roles")
    const firstRole = rolesMod.roles[0]
    expect(firstRole).to.have.property("key")
    expect(firstRole).to.have.property("members")
    expect(firstRole).to.have.property("targets")

    const funcWithCondition = firstRole.targets[1].functions[0]
    expect(funcWithCondition).to.have.property("wildcarded", false)
    expect(funcWithCondition).to.not.have.property("condition")
  })
})
