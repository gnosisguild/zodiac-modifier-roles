import { expect } from "chai"
import { fetchRole } from "zodiac-roles-deployments"

describe("fetchRole", () => {
  it("allows fetching historic role states", async () => {
    const role = await fetchRole({
      address: "0x13c61a25db73e7a94a244bd2205adba8b4a60f4a",
      chainId: 1,
      roleKey:
        "0x4d414e4147455200000000000000000000000000000000000000000000000000",
      blockNumber: 19790837,
    })
    expect(role).to.deep.equal({
      key: "0x4d414e4147455200000000000000000000000000000000000000000000000000",
      members: ["0x60716991acda9e990bfb3b1224f1f0fb81538267"],
      targets: [],
      annotations: [],
      lastUpdate: "19790837",
    })
  })
})
