import { expect } from "chai"
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import hre from "hardhat"

import { deploySignTypedMessageLib } from "./setup/deploySignTypedMessageLib"

describe.only("whats up", () => {
  async function setup2() {
    const lib = await deploySignTypedMessageLib()
    return { lib }
  }

  it.only("doesn't work", async () => {
    const { lib } = await loadFixture(setup2)

    const [signer] = await hre.ethers.getSigners()

    const thisReverts = async () =>
      signer.sendTransaction({
        to: await lib.getAddress(),
        data: lib.interface.encodeFunctionData("justReverts"),
      })

    await expect(thisReverts()).to.be.reverted
  })
})
