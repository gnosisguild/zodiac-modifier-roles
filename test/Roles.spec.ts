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
    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();
    return { Avatar, avatar, testContract };
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
    it("reverts if avatar is zero address", async () => {
      const Module = await hre.ethers.getContractFactory("Roles");
      await expect(
        Module.deploy(ZeroAddress, ZeroAddress, FirstAddress)
      ).to.be.revertedWith("Avatar can not be zero address");
    });

    it("reverts if target is zero address", async () => {
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
    it("reverts if not authorized", async () => {
      const { modifier } = await setupTestWithTestAvatar();
      await expect(
        modifier.disableModule(FirstAddress, user1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("reverts if module is null or sentinel", async () => {
      const { avatar, modifier } = await setupTestWithTestAvatar();
      const disable = await modifier.populateTransaction.disableModule(
        FirstAddress,
        FirstAddress
      );
      await expect(
        avatar.exec(modifier.address, 0, disable.data)
      ).to.be.revertedWith("Invalid module");
    });

    it("reverts if module is not added ", async () => {
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
    it("reverts if not authorized", async () => {
      const { modifier } = await setupTestWithTestAvatar();
      await expect(modifier.enableModule(user1.address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("reverts if module is already enabled", async () => {
      const { avatar, modifier } = await setupTestWithTestAvatar();
      const enable = await modifier.populateTransaction.enableModule(
        user1.address
      );

      await avatar.exec(modifier.address, 0, enable.data);
      await expect(
        avatar.exec(modifier.address, 0, enable.data)
      ).to.be.revertedWith("Module already enabled");
    });

    it("reverts if module is invalid ", async () => {
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

  describe("assignRoles()", () => {
    it("reverts if not authorized", async () => {
      const { modifier } = await setupTestWithTestAvatar();
      await expect(modifier.assignRoles(user1.address, [1])).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("assigns roles to a module", async () => {
      const { avatar, modifier } = await setupTestWithTestAvatar();
      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [1]
      );
      await avatar.exec(modifier.address, 0, assign.data);

      await expect(await modifier.isRoleMember(user1.address, 1)).to.be.equal(
        true
      );
    });

    it("it enables the module if necessary", async () => {
      const { avatar, modifier } = await setupTestWithTestAvatar();
      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [1]
      );
      await avatar.exec(modifier.address, 0, assign.data);

      await expect(await modifier.isModuleEnabled(user1.address)).to.equal(
        true
      );

      // it doesn't revert when assigning additional roles
      const assignSecond = await modifier.populateTransaction.assignRoles(
        user1.address,
        [1, 2]
      );
      await expect(avatar.exec(modifier.address, 0, assignSecond.data)).to.not
        .be.reverted;
    });

    it("emits the AssignRoles event", async () => {
      const { avatar, modifier } = await setupTestWithTestAvatar();
      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [1]
      );

      await expect(avatar.exec(modifier.address, 0, assign.data))
        .to.emit(modifier, "AssignRoles")
        .withArgs(user1.address, [1]);
    });
  });

  describe("execTransactionFromModule", () => {
    it("reverts if called from module not assigned any role", async () => {
      const signer = (await hre.ethers.getSigners())[0];

      const {
        avatar,
        modifier,
        testContract,
      } = await setupTestWithTestAvatar();

      const allowTarget = await modifier.populateTransaction.setTargetAllowed(
        1,
        testContract.address,
        true
      );
      await avatar.exec(modifier.address, 0, allowTarget.data);

      const mint = await testContract.populateTransaction.mint(
        user1.address,
        99
      );

      await expect(
        modifier.execTransactionFromModule(
          testContract.address,
          0,
          mint.data,
          0
        )
      ).to.be.revertedWith("Module not authorized");
    });

    it("reverts if the call is not an allowed target", async () => {
      const signer = (await hre.ethers.getSigners())[0];

      const {
        avatar,
        modifier,
        testContract,
      } = await setupTestWithTestAvatar();
      const assign = await modifier.populateTransaction.assignRoles(
        signer.address,
        [1]
      );
      await avatar.exec(modifier.address, 0, assign.data);

      const allowTarget = await modifier.populateTransaction.setTargetAllowed(
        1,
        testContract.address,
        true
      );
      await avatar.exec(modifier.address, 0, allowTarget.data);

      const mint = await testContract.populateTransaction.mint(
        user1.address,
        99
      );

      const someOtherAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
      await expect(
        modifier.execTransactionFromModule(someOtherAddress, 0, mint.data, 0)
      ).to.be.revertedWith("Not allowed");
    });

    it("executes a call to an allowed target", async () => {
      const signer = (await hre.ethers.getSigners())[0];

      const {
        avatar,
        modifier,
        testContract,
      } = await setupTestWithTestAvatar();
      const assign = await modifier.populateTransaction.assignRoles(
        signer.address,
        [1]
      );
      await avatar.exec(modifier.address, 0, assign.data);

      const allowTarget = await modifier.populateTransaction.setTargetAllowed(
        1,
        testContract.address,
        true
      );
      await avatar.exec(modifier.address, 0, allowTarget.data);

      const defaultRole = await modifier.populateTransaction.setDefaultRole(
        signer.address,
        1
      );

      await avatar.exec(modifier.address, 0, defaultRole.data);

      const mint = await testContract.populateTransaction.mint(
        user1.address,
        99
      );

      await expect(
        modifier.execTransactionFromModule(
          testContract.address,
          0,
          mint.data,
          0
        )
      ).to.emit(testContract, "Mint");
    });
  });

  describe("execTransactionFromModuleReturnData", () => {
    it("reverts if called from module not assigned any role", async () => {
      const signer = (await hre.ethers.getSigners())[0];

      const {
        avatar,
        modifier,
        testContract,
      } = await setupTestWithTestAvatar();

      const allowTarget = await modifier.populateTransaction.setTargetAllowed(
        1,
        testContract.address,
        true
      );
      await avatar.exec(modifier.address, 0, allowTarget.data);

      const mint = await testContract.populateTransaction.mint(
        user1.address,
        99
      );

      await expect(
        modifier.execTransactionFromModuleReturnData(
          testContract.address,
          0,
          mint.data,
          0
        )
      ).to.be.revertedWith("Module not authorized");
    });

    it("reverts if the call is not an allowed target", async () => {
      const signer = (await hre.ethers.getSigners())[0];

      const {
        avatar,
        modifier,
        testContract,
      } = await setupTestWithTestAvatar();
      const assign = await modifier.populateTransaction.assignRoles(
        signer.address,
        [1]
      );
      await avatar.exec(modifier.address, 0, assign.data);

      const allowTarget = await modifier.populateTransaction.setTargetAllowed(
        1,
        testContract.address,
        true
      );
      await avatar.exec(modifier.address, 0, allowTarget.data);

      const mint = await testContract.populateTransaction.mint(
        user1.address,
        99
      );

      const someOtherAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
      await expect(
        modifier.execTransactionFromModuleReturnData(
          someOtherAddress,
          0,
          mint.data,
          0
        )
      ).to.be.revertedWith("Not allowed");
    });

    it("executes a call to an allowed target", async () => {
      const signer = (await hre.ethers.getSigners())[0];

      const {
        avatar,
        modifier,
        testContract,
      } = await setupTestWithTestAvatar();
      const assign = await modifier.populateTransaction.assignRoles(
        signer.address,
        [1]
      );
      await avatar.exec(modifier.address, 0, assign.data);

      const allowTarget = await modifier.populateTransaction.setTargetAllowed(
        1,
        testContract.address,
        true
      );
      await avatar.exec(modifier.address, 0, allowTarget.data);

      const defaultRole = await modifier.populateTransaction.setDefaultRole(
        signer.address,
        1
      );

      await avatar.exec(modifier.address, 0, defaultRole.data);

      const mint = await testContract.populateTransaction.mint(
        user1.address,
        99
      );

      await expect(
        modifier.execTransactionFromModule(
          testContract.address,
          0,
          mint.data,
          0
        )
      ).to.emit(testContract, "Mint");
    });
  });
});
