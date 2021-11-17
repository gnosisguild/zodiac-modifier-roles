import { expect } from "chai";
import hre, { deployments, waffle } from "hardhat";
import "@nomiclabs/hardhat-ethers";

const ZeroState =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const ZeroAddress = "0x0000000000000000000000000000000000000000";
const FirstAddress = "0x0000000000000000000000000000000000000001";

describe("RolesModifier", async () => {
  const baseSetup = deployments.createFixture(async () => {
    await deployments.fixture();
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();
    const Mock = await hre.ethers.getContractFactory("MockContract");
    const mock = await Mock.deploy();
    return { Avatar, avatar, mock };
  });

  const setupTestWithTestAvatar = deployments.createFixture(async () => {
    const base = await baseSetup();
    const Modifier = await hre.ethers.getContractFactory("Roles");
    const modifier = await Modifier.deploy(
      base.avatar.address,
      base.avatar.address,
      base.avatar.address
    );
    return { ...base, Modifier, modifier };
  });

  const [user1] = waffle.provider.getWallets();

  describe("setUp()", async () => {
    it("throws if avatar is zero address", async () => {
      const Module = await hre.ethers.getContractFactory("Roles");
      await expect(
        Module.deploy(ZeroAddress, ZeroAddress, FirstAddress)
      ).to.be.revertedWith("Avatar can not be zero address");
    });

    it("throws if target is zero address", async () => {
      const Module = await hre.ethers.getContractFactory("Roles");
      await expect(
        Module.deploy(ZeroAddress, FirstAddress, ZeroAddress)
      ).to.be.revertedWith("Target can not be zero address");
    });

    it("should emit event because of successful set up", async () => {
      const Module = await hre.ethers.getContractFactory("Roles");
      const module = await Module.deploy(
        user1.address,
        user1.address,
        user1.address
      );
      await module.deployed();
      await expect(module.deployTransaction)
        .to.emit(module, "RolesSetup")
        .withArgs(user1.address, user1.address, user1.address, user1.address);
    });
  });

  describe("disableModule()", async () => {
    it("throws if not authorized", async () => {
      const { modifier } = await setupTestWithTestAvatar();
      await expect(
        modifier.disableModule(FirstAddress, user1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("throws if module is null or sentinel", async () => {
      const { avatar, modifier } = await setupTestWithTestAvatar();
      const disable = await modifier.populateTransaction.disableModule(
        FirstAddress,
        FirstAddress
      );
      await expect(
        avatar.exec(modifier.address, 0, disable.data)
      ).to.be.revertedWith("Invalid module");
    });

    it("throws if module is not added ", async () => {
      const { avatar, modifier } = await setupTestWithTestAvatar();
      const disable = await modifier.populateTransaction.disableModule(
        ZeroAddress,
        user1.address
      );
      await expect(
        avatar.exec(modifier.address, 0, disable.data)
      ).to.be.revertedWith("Module already disabled");
    });

    it("disables a module()", async () => {
      const { avatar, modifier } = await setupTestWithTestAvatar();
      const enable = await modifier.populateTransaction.enableModule(
        user1.address
      );
      const disable = await modifier.populateTransaction.disableModule(
        FirstAddress,
        user1.address
      );

      await avatar.exec(modifier.address, 0, enable.data);
      await expect(await modifier.isModuleEnabled(user1.address)).to.be.equals(
        true
      );
      await avatar.exec(modifier.address, 0, disable.data);
      await expect(await modifier.isModuleEnabled(user1.address)).to.be.equals(
        false
      );
    });
  });

  describe("enableModule()", async () => {
    it("throws if not authorized", async () => {
      const { modifier } = await setupTestWithTestAvatar();
      await expect(modifier.enableModule(user1.address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("throws because module is already enabled", async () => {
      const { avatar, modifier } = await setupTestWithTestAvatar();
      const enable = await modifier.populateTransaction.enableModule(
        user1.address
      );

      await avatar.exec(modifier.address, 0, enable.data);
      await expect(
        avatar.exec(modifier.address, 0, enable.data)
      ).to.be.revertedWith("Module already enabled");
    });

    it("throws because module is invalid ", async () => {
      const { avatar, modifier } = await setupTestWithTestAvatar();
      const enable = await modifier.populateTransaction.enableModule(
        FirstAddress
      );

      await expect(
        avatar.exec(modifier.address, 0, enable.data)
      ).to.be.revertedWith("Invalid module");
    });

    it("enables a module", async () => {
      const { avatar, modifier } = await setupTestWithTestAvatar();
      const enable = await modifier.populateTransaction.enableModule(
        user1.address
      );

      await avatar.exec(modifier.address, 0, enable.data);
      await expect(await modifier.isModuleEnabled(user1.address)).to.be.equals(
        true
      );
      await expect(
        await modifier.getModulesPaginated(FirstAddress, 10)
      ).to.be.deep.equal([[user1.address], FirstAddress]);
    });
  });
});
