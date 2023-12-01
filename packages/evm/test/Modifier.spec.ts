import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { deployRolesMod } from "./utils";

const AddressZero = "0x0000000000000000000000000000000000000000";
const AddressOne = "0x0000000000000000000000000000000000000001";

describe("Modifier", async () => {
  async function setup() {
    const [owner, invoker] = await hre.ethers.getSigners();
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();
    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();
    const roles = await deployRolesMod(
      hre,
      owner.address,
      avatar.address,
      avatar.address
    );
    return { owner, invoker, avatar, roles, testContract };
  }

  describe("disableModule()", async () => {
    it("reverts if not owner", async () => {
      const { roles, invoker } = await loadFixture(setup);
      await expect(
        roles.connect(invoker).disableModule(AddressOne, invoker.address)
      )
        .to.be.revertedWithCustomError(roles, "OwnableUnauthorizedAccount")
        .withArgs(invoker.address);
    });
    it("reverts if module is null or sentinel", async () => {
      const { roles, owner } = await loadFixture(setup);

      await expect(roles.connect(owner).disableModule(AddressOne, AddressOne))
        .to.be.revertedWithCustomError(roles, "InvalidModule")
        .withArgs("0x0000000000000000000000000000000000000001");
    });
    it("reverts if module is not enabled ", async () => {
      const { roles, owner, invoker } = await loadFixture(setup);
      await expect(
        roles.connect(owner).disableModule(AddressZero, invoker.address)
      )
        .to.be.revertedWithCustomError(roles, `AlreadyDisabledModule`)
        .withArgs(invoker.address);
    });
    it("disables a module", async () => {
      const { roles, owner, invoker } = await loadFixture(setup);

      await expect(await roles.isModuleEnabled(invoker.address)).to.equal(
        false
      );
      await roles.connect(owner).enableModule(invoker.address);
      await expect(await roles.isModuleEnabled(invoker.address)).to.equal(true);
      await roles.connect(owner).disableModule(AddressOne, invoker.address);
      await expect(await roles.isModuleEnabled(invoker.address)).to.equal(
        false
      );
    });
  });

  describe("enableModule()", async () => {
    it("reverts if not owner", async () => {
      const { roles, invoker } = await loadFixture(setup);
      await expect(roles.connect(invoker).enableModule(AddressOne))
        .to.be.revertedWithCustomError(roles, "OwnableUnauthorizedAccount")
        .withArgs(invoker.address);
    });
    it("reverts if module is already enabled", async () => {
      const { roles, owner, invoker } = await loadFixture(setup);

      await roles.connect(owner).enableModule(invoker.address);
      await expect(roles.connect(owner).enableModule(invoker.address))
        .to.be.revertedWithCustomError(roles, `AlreadyEnabledModule`)
        .withArgs(invoker.address);
    });
    it("reverts if module is invalid ", async () => {
      const { roles, owner, invoker } = await loadFixture(setup);

      await expect(roles.connect(owner).enableModule(AddressOne))
        .to.be.revertedWithCustomError(roles, "InvalidModule")
        .withArgs("0x0000000000000000000000000000000000000001");

      await expect(roles.connect(owner).enableModule(invoker.address)).to.not.be
        .reverted;
    });
    it("enables a module", async () => {
      const { roles, owner, invoker } = await loadFixture(setup);

      await roles.connect(owner).enableModule(invoker.address);
      await expect(await roles.isModuleEnabled(invoker.address)).to.be.equals(
        true
      );
      await expect(
        await roles.getModulesPaginated(AddressOne, 10)
      ).to.be.deep.equal([[invoker.address], AddressOne]);
    });
  });
});
