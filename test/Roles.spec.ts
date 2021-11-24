import { expect } from "chai";
import hre, { deployments, waffle, ethers } from "hardhat";
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

      const { avatar, modifier, testContract } =
        await setupTestWithTestAvatar();

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

      const { avatar, modifier, testContract } =
        await setupTestWithTestAvatar();
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
      ).to.be.revertedWith("NotAllowed");
    });

    it("executes a call to an allowed target", async () => {
      const signer = (await hre.ethers.getSigners())[0];

      const { avatar, modifier, testContract } =
        await setupTestWithTestAvatar();
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

    it("executes a call with allowed value parameter", async () => {
      const signer = (await hre.ethers.getSigners())[0];

      const { avatar, modifier, testContract } =
        await setupTestWithTestAvatar();
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

      const functionScoped = await modifier.populateTransaction.setFunctionScoped(
        1,
        testContract.address,
        true
      );
      await avatar.exec(modifier.address, 0, functionScoped.data);

      const functionAllowed = await modifier.populateTransaction.setAllowedFunction(
        1,
        testContract.address,
        "0x40c10f19",
        true
      );
      await avatar.exec(modifier.address, 0, functionAllowed.data);

      const paramScoped = await modifier.populateTransaction.setParametersScoped(
        1,
        testContract.address,
        "0x40c10f19",
        ["address", "uint256"],
        true
      );
      await avatar.exec(modifier.address, 0, paramScoped.data);

      const encodedParam_1 = ethers.utils.defaultAbiCoder.encode(
        ["address"],
        [user1.address]
      );
      console.log(encodedParam_1)

      const paramAllowed_1 = await modifier.populateTransaction.setParameterAllowedValue(
        1,
        testContract.address,
        "0x40c10f19",
        "address",
        encodedParam_1
      );
      await avatar.exec(modifier.address, 0, paramAllowed_1.data);

      const encodedParam_2 = ethers.utils.defaultAbiCoder.encode(
        ["uint256"],
        [99]
      );
      console.log(encodedParam_2)

      const paramAllowed_2 = await modifier.populateTransaction.setParameterAllowedValue(
        1,
        testContract.address,
        "0x40c10f19",
        "uint256",
        encodedParam_2
      );
      await avatar.exec(modifier.address, 0, paramAllowed_2.data);

      const mint = await testContract.populateTransaction.mint(
        user1.address,
        99
      );
      console.log(mint.data)

      await expect(
        modifier.execTransactionFromModule(
          testContract.address,
          0,
          mint.data,
          0
        )
      ).to.emit(testContract, "Mint");
      const test = await modifier.test()
      console.log(test.toString())
      console.log(user1.address)
    });

    it("executes a call with allowed dynamic parameter", async () => {
      const signer = (await hre.ethers.getSigners())[0];

      const { avatar, modifier, testContract } =
        await setupTestWithTestAvatar();
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

      const functionScoped = await modifier.populateTransaction.setFunctionScoped(
        1,
        testContract.address,
        true
      );
      await avatar.exec(modifier.address, 0, functionScoped.data);

      const functionAllowed = await modifier.populateTransaction.setAllowedFunction(
        1,
        testContract.address,
        "0xedad9b7e",
        true
      );
      await avatar.exec(modifier.address, 0, functionAllowed.data);

      const paramScoped = await modifier.populateTransaction.setParametersScoped(
        1,
        testContract.address,
        "0xedad9b7e",
        ["string"],
        true
      );
      await avatar.exec(modifier.address, 0, paramScoped.data);

      const encodedParam_1 = ethers.utils.defaultAbiCoder.encode(
        ["string"],
        ["This is a dynamic array"]
      );
      console.log('----')
      console.log(encodedParam_1)
      const removeDetails = "0x" + encodedParam_1.slice(130, encodedParam_1.length)
      console.log(removeDetails)

      const encodedParam_2 = ethers.utils.defaultAbiCoder.encode(
        ["string", "uint256", "string"],
        ["This is a dynamic array", 4, "Test"]
      );
      console.log('----')
      console.log(encodedParam_2)

      const paramAllowed_1 = await modifier.populateTransaction.setParameterAllowedValue(
        1,
        testContract.address,
        "0xedad9b7e",
        "string",
        removeDetails
      );

      await avatar.exec(modifier.address, 0, paramAllowed_1.data);

      const dynamic = await testContract.populateTransaction.testDynamic(
        "This is a dynamic array"
      );
      //console.log(dynamic.data)

      await expect(
        modifier.execTransactionFromModule(
          testContract.address,
          0,
          dynamic.data,
          0
        )
      ).to.emit(testContract, "TestDynamic");
      const test = await modifier.test()
      console.log(test.toString())
      const test2 = await modifier.test2()
      console.log(test2.toString())
      //0xedad9b7e000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000175468697320697320612064796e616d6963206172726179000000000000000000
      //0x00000000000000000000000000000000000000000000000000000000000000175468697320697320612064796e616d6963206172726179000000000000000000
    });
  });

  describe("execTransactionFromModuleReturnData", () => {
    it("reverts if called from module not assigned any role", async () => {
      const signer = (await hre.ethers.getSigners())[0];

      const { avatar, modifier, testContract } =
        await setupTestWithTestAvatar();

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

      const { avatar, modifier, testContract } =
        await setupTestWithTestAvatar();
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
      ).to.be.revertedWith("TargetNotAllowed()");
    });

    it("executes a call to an allowed target", async () => {
      const signer = (await hre.ethers.getSigners())[0];

      const { avatar, modifier, testContract } =
        await setupTestWithTestAvatar();
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
