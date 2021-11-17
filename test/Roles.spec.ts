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

  const setupTestWithRoles = async (roles: number[]) => {
    const { avatar, modifier } = await setupTestWithTestAvatar();
    await Promise.all(
      roles.map(async (role) => {
        const assign = await modifier.populateTransaction.assignRole(
          user1.address,
          role
        );
        return await avatar.exec(modifier.address, 0, assign.data);
      })
    );
    return { avatar, modifier };
  };

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

  describe("assignRole()", () => {
    it("throws if not authorized", async () => {
      const { modifier } = await setupTestWithTestAvatar();
      await expect(modifier.assignRole(user1.address, 1)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("throws if role is invalid", async () => {
      const { avatar, modifier } = await setupTestWithTestAvatar();
      const assign = await modifier.populateTransaction.assignRole(
        user1.address,
        0
      );
      await expect(
        avatar.exec(modifier.address, 0, assign.data)
      ).to.be.revertedWith("Invalid role");
    });

    it("throws if role is already assigned", async () => {
      const { avatar, modifier } = await setupTestWithTestAvatar();
      const assign = await modifier.populateTransaction.assignRole(
        user1.address,
        1
      );
      avatar.exec(modifier.address, 0, assign.data);

      await expect(
        avatar.exec(modifier.address, 0, assign.data)
      ).to.be.revertedWith("Role already assigned");
    });

    it("assigns a role to a module", async () => {
      const { avatar, modifier } = await setupTestWithTestAvatar();
      const assign = await modifier.populateTransaction.assignRole(
        user1.address,
        1
      );
      await avatar.exec(modifier.address, 0, assign.data);

      await expect(
        await modifier.getRolesPaginated(user1.address, 0, 10)
      ).to.be.deep.equal([[1], 0]);
    });

    it("it enables the module if necessary", async () => {
      const { avatar, modifier } = await setupTestWithTestAvatar();
      const assign = await modifier.populateTransaction.assignRole(
        user1.address,
        1
      );
      await avatar.exec(modifier.address, 0, assign.data);

      await expect(await modifier.isModuleEnabled(user1.address)).to.equal(
        true
      );

      // it doesn't revert when assigning additional roles
      const assignSecond = await modifier.populateTransaction.assignRole(
        user1.address,
        2
      );
      await expect(avatar.exec(modifier.address, 0, assignSecond.data)).to.not
        .be.reverted;
    });

    it("emits the AssignRole event", async () => {
      const { avatar, modifier } = await setupTestWithTestAvatar();
      const assign = await modifier.populateTransaction.assignRole(
        user1.address,
        1
      );

      await expect(avatar.exec(modifier.address, 0, assign.data))
        .to.emit(modifier, "AssignRole")
        .withArgs(user1.address, 1);
    });
  });

  describe("unassignRole()", () => {
    it("throws if not authorized", async () => {
      const { modifier } = await setupTestWithRoles([1]);
      await expect(
        modifier.unassignRole(user1.address, 0, 1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("throws if role is invalid", async () => {
      const { avatar, modifier } = await setupTestWithRoles([1]);
      const unassign = await modifier.populateTransaction.unassignRole(
        user1.address,
        0,
        0
      );
      await expect(
        avatar.exec(modifier.address, 0, unassign.data)
      ).to.be.revertedWith("Invalid role");
    });

    it("throws if role is not assigned", async () => {
      const { avatar, modifier } = await setupTestWithRoles([1]);
      const unassign = await modifier.populateTransaction.unassignRole(
        user1.address,
        0,
        2
      );

      await expect(
        avatar.exec(modifier.address, 0, unassign.data)
      ).to.be.revertedWith("Role already unassigned");
    });

    it("removes assignment of a role to a module", async () => {
      const { avatar, modifier } = await setupTestWithRoles([1, 2]);

      const assign = await modifier.populateTransaction.unassignRole(
        user1.address,
        0,
        2
      );
      await avatar.exec(modifier.address, 0, assign.data);

      await expect(
        await modifier.getRolesPaginated(user1.address, 0, 10)
      ).to.be.deep.equal([[1], 0]);
    });

    it("emits the UnassignRole event", async () => {
      const { avatar, modifier } = await setupTestWithRoles([1, 2]);
      const assign = await modifier.populateTransaction.unassignRole(
        user1.address,
        2,
        1
      );

      await expect(avatar.exec(modifier.address, 0, assign.data))
        .to.emit(modifier, "UnassignRole")
        .withArgs(user1.address, 1);
    });
  });
});
