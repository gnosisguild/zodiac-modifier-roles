import { expect } from "chai";
import hre, { deployments, waffle, ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers";
import { buildContractCall, buildMultiSendSafeTx } from "./utils";
import { AddressOne } from "@gnosis.pm/safe-contracts";
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
    const TransactionCheck = await hre.ethers.getContractFactory(
      "TransactionCheck"
    );
    const transactionCheck = await TransactionCheck.deploy();
    const Modifier = await hre.ethers.getContractFactory("Roles", {
      libraries: {
        TransactionCheck: transactionCheck.address,
      },
    });

    const modifier = await Modifier.deploy(
      base.avatar.address,
      base.avatar.address,
      base.avatar.address
    );
    return { ...base, Modifier, modifier };
  });

  const txSetup = deployments.createFixture(async () => {
    const baseAvatar = await setupTestWithTestAvatar();
    const encodedParam_1 = ethers.utils.defaultAbiCoder.encode(
      ["address"],
      [user1.address]
    );
    const paramAllowed_1 =
      await baseAvatar.modifier.populateTransaction.setParameterAllowedValue(
        1,
        baseAvatar.testContract.address,
        "0x40c10f19",
        0,
        encodedParam_1,
        "0x"
      );
    const encodedParam_2 = ethers.utils.defaultAbiCoder.encode(
      ["uint256"],
      [99]
    );
    const paramAllowed_2 =
      await baseAvatar.modifier.populateTransaction.setParameterAllowedValue(
        1,
        baseAvatar.testContract.address,
        "0x40c10f19",
        1,
        encodedParam_2,
        "0x"
      );
    const encodedParam_3 = ethers.utils.solidityPack(
      ["string"],
      ["This is a dynamic array"]
    );
    const encodedParam_4 = ethers.utils.defaultAbiCoder.encode(
      ["uint256"],
      [4]
    );
    const encodedParam_5 = ethers.utils.solidityPack(["string"], ["Test"]);
    const encodedParam_6 = ethers.utils.defaultAbiCoder.encode(
      ["bool"],
      [true]
    );
    const encodedParam_7 = ethers.utils.defaultAbiCoder.encode(["uint8"], [3]);
    const encodedParam_8 = ethers.utils.solidityPack(["string"], ["weeeeeeee"]);
    const encodedParam_9 = ethers.utils.solidityPack(
      ["string"],
      [
        "This is an input that is larger than 32 bytes and must be scanned for correctness",
      ]
    );
    const paramAllowed_3 =
      await baseAvatar.modifier.populateTransaction.setParameterAllowedValue(
        1,
        baseAvatar.testContract.address,
        "0x273454bf",
        0,
        encodedParam_3,
        "0x"
      );
    const paramAllowed_4 =
      await baseAvatar.modifier.populateTransaction.setParameterAllowedValue(
        1,
        baseAvatar.testContract.address,
        "0x273454bf",
        1,
        encodedParam_4,
        "0x"
      );
    const paramAllowed_5 =
      await baseAvatar.modifier.populateTransaction.setParameterAllowedValue(
        1,
        baseAvatar.testContract.address,
        "0x273454bf",
        2,
        encodedParam_5,
        "0x"
      );
    const paramAllowed_6 =
      await baseAvatar.modifier.populateTransaction.setParameterAllowedValue(
        1,
        baseAvatar.testContract.address,
        "0x273454bf",
        3,
        encodedParam_6,
        "0x"
      );
    const paramAllowed_7 =
      await baseAvatar.modifier.populateTransaction.setParameterAllowedValue(
        1,
        baseAvatar.testContract.address,
        "0x273454bf",
        4,
        encodedParam_7,
        "0x"
      );
    const paramAllowed_8 =
      await baseAvatar.modifier.populateTransaction.setParameterAllowedValue(
        1,
        baseAvatar.testContract.address,
        "0x273454bf",
        5,
        encodedParam_8,
        "0x"
      );
    const paramAllowed_9 =
      await baseAvatar.modifier.populateTransaction.setParameterAllowedValue(
        1,
        baseAvatar.testContract.address,
        "0x273454bf",
        6,
        encodedParam_9,
        "0x"
      );
    const mint = await baseAvatar.testContract.populateTransaction.mint(
      user1.address,
      99
    );
    const tx_1 = buildContractCall(
      baseAvatar.testContract,
      "mint",
      [user1.address, 99],
      0
    );
    const tx_2 = buildContractCall(
      baseAvatar.testContract,
      "mint",
      [user1.address, 99],
      0
    );
    const tx_3 = await buildContractCall(
      baseAvatar.testContract,
      "testDynamic",
      [
        "This is a dynamic array",
        4,
        "Test",
        true,
        3,
        "weeeeeeee",
        "This is an input that is larger than 32 bytes and must be scanned for correctness",
      ],
      0
    );
    return {
      ...baseAvatar,
      paramAllowed_1,
      paramAllowed_2,
      paramAllowed_3,
      paramAllowed_4,
      paramAllowed_5,
      paramAllowed_6,
      paramAllowed_7,
      paramAllowed_8,
      paramAllowed_9,
      tx_1,
      tx_2,
      tx_3,
    };
  });

  const [user1, user2] = waffle.provider.getWallets();

  describe("setUp()", async () => {
    it("should emit event because of successful set up", async () => {
      const TransactionCheck = await hre.ethers.getContractFactory(
        "TransactionCheck"
      );
      const transactionCheck = await TransactionCheck.deploy();
      const Modifier = await hre.ethers.getContractFactory("Roles", {
        libraries: {
          TransactionCheck: transactionCheck.address,
        },
      });

      const modifier = await Modifier.deploy(
        user1.address,
        user1.address,
        user1.address
      );
      await modifier.deployed();
      await expect(modifier.deployTransaction)
        .to.emit(modifier, "RolesModSetup")
        .withArgs(user1.address, user1.address, user1.address, user1.address);
    });
  });

  describe("disableModule()", async () => {
    it("reverts if not authorized", async () => {
      const { modifier } = await txSetup();
      await expect(
        modifier.disableModule(FirstAddress, user1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("reverts if module is null or sentinel", async () => {
      const { avatar, modifier } = await txSetup();
      const disable = await modifier.populateTransaction.disableModule(
        FirstAddress,
        FirstAddress
      );
      await expect(
        avatar.exec(modifier.address, 0, disable.data)
      ).to.be.revertedWith("Invalid module");
    });

    it("reverts if module is not added ", async () => {
      const { avatar, modifier } = await txSetup();
      const disable = await modifier.populateTransaction.disableModule(
        ZeroAddress,
        user1.address
      );
      await expect(
        avatar.exec(modifier.address, 0, disable.data)
      ).to.be.revertedWith("Module already disabled");
    });

    it("disables a module()", async () => {
      const { avatar, modifier } = await txSetup();
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
      const { modifier } = await txSetup();
      await expect(modifier.enableModule(user1.address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("reverts if module is already enabled", async () => {
      const { avatar, modifier } = await txSetup();
      const enable = await modifier.populateTransaction.enableModule(
        user1.address
      );

      await avatar.exec(modifier.address, 0, enable.data);
      await expect(
        avatar.exec(modifier.address, 0, enable.data)
      ).to.be.revertedWith("Module already enabled");
    });

    it("reverts if module is invalid ", async () => {
      const { avatar, modifier } = await txSetup();
      const enable = await modifier.populateTransaction.enableModule(
        FirstAddress
      );

      await expect(
        avatar.exec(modifier.address, 0, enable.data)
      ).to.be.revertedWith("Invalid module");
    });

    it("enables a module", async () => {
      const { avatar, modifier } = await txSetup();
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
      const { modifier } = await txSetup();
      await expect(
        modifier.assignRoles(user1.address, [1], [true])
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("assigns roles to a module", async () => {
      const { avatar, modifier } = await txSetup();
      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [1],
        [true]
      );
      await avatar.exec(modifier.address, 0, assign.data);

      await expect(await modifier.isRoleMember(1, user1.address)).to.be.equal(
        true
      );
    });

    it("revokes roles to a module", async () => {
      const { avatar, modifier } = await txSetup();
      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [1],
        [true]
      );
      await avatar.exec(modifier.address, 0, assign.data);
      const revoke = await modifier.populateTransaction.assignRoles(
        user1.address,
        [1],
        [false]
      );
      await avatar.exec(modifier.address, 0, revoke.data);

      await expect(await modifier.isRoleMember(1, user1.address)).to.be.equal(
        false
      );
    });

    it("it enables the module if necessary", async () => {
      const { avatar, modifier } = await txSetup();
      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [1],
        [true]
      );
      await avatar.exec(modifier.address, 0, assign.data);

      await expect(await modifier.isModuleEnabled(user1.address)).to.equal(
        true
      );

      // it doesn't revert when assigning additional roles
      const assignSecond = await modifier.populateTransaction.assignRoles(
        user1.address,
        [1, 2],
        [true, true]
      );
      await expect(avatar.exec(modifier.address, 0, assignSecond.data)).to.not
        .be.reverted;
    });

    it("emits the AssignRoles event", async () => {
      const { avatar, modifier } = await txSetup();
      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [1],
        [true]
      );

      await expect(avatar.exec(modifier.address, 0, assign.data))
        .to.emit(modifier, "AssignRoles")
        .withArgs(user1.address, [1]);
    });
  });

  describe("execTransactionFromModule()", () => {
    it("reverts if called from module not assigned any role", async () => {
      const { avatar, modifier, testContract } = await txSetup();

      const allowTargetAddress =
        await modifier.populateTransaction.setTargetAddressAllowed(
          1,
          testContract.address,
          true
        );
      await avatar.exec(modifier.address, 0, allowTargetAddress.data);

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
      const { avatar, modifier, testContract } = await txSetup();
      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [1],
        [true]
      );
      await avatar.exec(modifier.address, 0, assign.data);

      const allowTargetAddress =
        await modifier.populateTransaction.setTargetAddressAllowed(
          1,
          testContract.address,
          true
        );
      await avatar.exec(modifier.address, 0, allowTargetAddress.data);

      const defaultRole = await modifier.populateTransaction.setDefaultRole(
        user1.address,
        1
      );
      await avatar.exec(modifier.address, 0, defaultRole.data);

      const mint = await testContract.populateTransaction.mint(
        user1.address,
        99
      );

      const someOtherAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
      await expect(
        modifier.execTransactionFromModule(someOtherAddress, 0, mint.data, 0)
      ).to.be.revertedWith("TargetAddressNotAllowed()");
    });

    it("executes a call to an allowed target", async () => {
      const { avatar, modifier, testContract } = await txSetup();
      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [1],
        [true]
      );
      await avatar.exec(modifier.address, 0, assign.data);

      const allowTargetAddress =
        await modifier.populateTransaction.setTargetAddressAllowed(
          1,
          testContract.address,
          true
        );
      await avatar.exec(modifier.address, 0, allowTargetAddress.data);

      const defaultRole = await modifier.populateTransaction.setDefaultRole(
        user1.address,
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

    it("reverts if value parameter is not allowed", async () => {
      const { avatar, modifier, testContract, paramAllowed_1, paramAllowed_2 } =
        await txSetup();
      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [1],
        [true]
      );
      await avatar.exec(modifier.address, 0, assign.data);

      const allowTarget =
        await modifier.populateTransaction.setTargetAddressAllowed(
          1,
          testContract.address,
          true
        );
      await avatar.exec(modifier.address, 0, allowTarget.data);

      const defaultRole = await modifier.populateTransaction.setDefaultRole(
        user1.address,
        1
      );
      await avatar.exec(modifier.address, 0, defaultRole.data);

      const functionScoped =
        await modifier.populateTransaction.setTargetAddressScoped(
          1,
          testContract.address,
          true
        );
      await avatar.exec(modifier.address, 0, functionScoped.data);

      const functionAllowed =
        await modifier.populateTransaction.setAllowedFunction(
          1,
          testContract.address,
          "0x40c10f19",
          true
        );
      await avatar.exec(modifier.address, 0, functionAllowed.data);

      const paramScoped =
        await modifier.populateTransaction.setParametersScoped(
          1,
          testContract.address,
          "0x40c10f19",
          true,
          [true, true],
          [false, false],
          [0, 0]
        );
      await avatar.exec(modifier.address, 0, paramScoped.data);

      await avatar.exec(modifier.address, 0, paramAllowed_1.data);
      await avatar.exec(modifier.address, 0, paramAllowed_2.data);

      const mint = await testContract.populateTransaction.mint(
        user1.address,
        98
      );

      await expect(
        modifier.execTransactionFromModule(
          testContract.address,
          0,
          mint.data,
          0
        )
      ).to.be.revertedWith("ParameterNotAllowed()");
    });

    it("executes a call with allowed value parameter", async () => {
      const user1 = (await hre.ethers.getSigners())[0];

      const { avatar, modifier, testContract, paramAllowed_1, paramAllowed_2 } =
        await txSetup();
      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [1],
        [true]
      );
      await avatar.exec(modifier.address, 0, assign.data);

      const allowTarget =
        await modifier.populateTransaction.setTargetAddressAllowed(
          1,
          testContract.address,
          true
        );
      await avatar.exec(modifier.address, 0, allowTarget.data);

      const defaultRole = await modifier.populateTransaction.setDefaultRole(
        user1.address,
        1
      );
      await avatar.exec(modifier.address, 0, defaultRole.data);

      const functionScoped =
        await modifier.populateTransaction.setTargetAddressScoped(
          1,
          testContract.address,
          true
        );
      await avatar.exec(modifier.address, 0, functionScoped.data);

      const functionAllowed =
        await modifier.populateTransaction.setAllowedFunction(
          1,
          testContract.address,
          "0x40c10f19",
          true
        );
      await avatar.exec(modifier.address, 0, functionAllowed.data);

      const paramScoped =
        await modifier.populateTransaction.setParametersScoped(
          1,
          testContract.address,
          "0x40c10f19",
          true,
          [true, true],
          [false, false],
          [0, 0]
        );
      await avatar.exec(modifier.address, 0, paramScoped.data);

      await avatar.exec(modifier.address, 0, paramAllowed_1.data);
      await avatar.exec(modifier.address, 0, paramAllowed_2.data);

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

    it("reverts dynamic parameter is not allowed", async () => {
      const {
        avatar,
        modifier,
        testContract,
        paramAllowed_3,
        paramAllowed_4,
        paramAllowed_5,
        paramAllowed_6,
        paramAllowed_7,
        paramAllowed_8,
        paramAllowed_9,
      } = await txSetup();
      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [1],
        [true]
      );

      await avatar.exec(modifier.address, 0, assign.data);

      const allowTarget =
        await modifier.populateTransaction.setTargetAddressAllowed(
          1,
          testContract.address,
          true
        );
      await avatar.exec(modifier.address, 0, allowTarget.data);

      const defaultRole = await modifier.populateTransaction.setDefaultRole(
        user1.address,
        1
      );
      await avatar.exec(modifier.address, 0, defaultRole.data);

      const functionScoped =
        await modifier.populateTransaction.setTargetAddressScoped(
          1,
          testContract.address,
          true
        );
      await avatar.exec(modifier.address, 0, functionScoped.data);

      const functionAllowed =
        await modifier.populateTransaction.setAllowedFunction(
          1,
          testContract.address,
          "0x273454bf",
          true
        );
      await avatar.exec(modifier.address, 0, functionAllowed.data);

      const paramScoped =
        await modifier.populateTransaction.setParametersScoped(
          1,
          testContract.address,
          "0x273454bf",
          true,
          [true, true, true, true, true, true, true],
          [true, false, true, false, false, true, true],
          [0, 0, 0, 0, 0, 0, 0]
        );
      await avatar.exec(modifier.address, 0, paramScoped.data);

      await avatar.exec(modifier.address, 0, paramAllowed_3.data);
      await avatar.exec(modifier.address, 0, paramAllowed_4.data);
      await avatar.exec(modifier.address, 0, paramAllowed_5.data);
      await avatar.exec(modifier.address, 0, paramAllowed_6.data);
      await avatar.exec(modifier.address, 0, paramAllowed_7.data);
      await avatar.exec(modifier.address, 0, paramAllowed_8.data);
      await avatar.exec(modifier.address, 0, paramAllowed_9.data);

      const dynamic = await testContract.populateTransaction.testDynamic(
        "This is a dynamic array that is not allowed",
        4,
        "Test",
        true,
        3,
        "weeeeeeee",
        "This is an input that is larger than 32 bytes and must be scanned for correctness"
      );

      await expect(
        modifier.execTransactionFromModule(
          testContract.address,
          0,
          dynamic.data,
          0
        )
      ).to.be.revertedWith("ParameterNotAllowed()");
    });

    it("executes a call with allowed dynamic parameter", async () => {
      const {
        avatar,
        modifier,
        testContract,
        paramAllowed_3,
        paramAllowed_4,
        paramAllowed_5,
        paramAllowed_6,
        paramAllowed_7,
        paramAllowed_8,
        paramAllowed_9,
      } = await txSetup();
      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [1],
        [true]
      );

      await avatar.exec(modifier.address, 0, assign.data);

      const allowTarget =
        await modifier.populateTransaction.setTargetAddressAllowed(
          1,
          testContract.address,
          true
        );
      await avatar.exec(modifier.address, 0, allowTarget.data);

      const defaultRole = await modifier.populateTransaction.setDefaultRole(
        user1.address,
        1
      );
      await avatar.exec(modifier.address, 0, defaultRole.data);

      const functionScoped =
        await modifier.populateTransaction.setTargetAddressScoped(
          1,
          testContract.address,
          true
        );
      await avatar.exec(modifier.address, 0, functionScoped.data);

      const functionAllowed =
        await modifier.populateTransaction.setAllowedFunction(
          1,
          testContract.address,
          "0x273454bf",
          true
        );
      await avatar.exec(modifier.address, 0, functionAllowed.data);

      const paramScoped =
        await modifier.populateTransaction.setParametersScoped(
          1,
          testContract.address,
          "0x273454bf",
          true,
          [true, true, true, true, true, true, true],
          [true, false, true, false, false, true, true],
          [0, 0, 0, 0, 0, 0, 0]
        );
      await avatar.exec(modifier.address, 0, paramScoped.data);

      await avatar.exec(modifier.address, 0, paramAllowed_3.data);
      await avatar.exec(modifier.address, 0, paramAllowed_4.data);
      await avatar.exec(modifier.address, 0, paramAllowed_5.data);
      await avatar.exec(modifier.address, 0, paramAllowed_6.data);
      await avatar.exec(modifier.address, 0, paramAllowed_7.data);
      await avatar.exec(modifier.address, 0, paramAllowed_8.data);
      await avatar.exec(modifier.address, 0, paramAllowed_9.data);

      const dynamic = await testContract.populateTransaction.testDynamic(
        "This is a dynamic array",
        4,
        "Test",
        true,
        3,
        "weeeeeeee",
        "This is an input that is larger than 32 bytes and must be scanned for correctness"
      );

      await expect(
        modifier.execTransactionFromModule(
          testContract.address,
          0,
          dynamic.data,
          0
        )
      ).to.emit(testContract, "TestDynamic");
    });

    it("reverts a call with multisend tx", async () => {
      const {
        avatar,
        modifier,
        testContract,
        paramAllowed_1,
        paramAllowed_2,
        paramAllowed_3,
        paramAllowed_4,
        paramAllowed_5,
        paramAllowed_6,
        paramAllowed_7,
        paramAllowed_8,
        paramAllowed_9,
        tx_1,
        tx_2,
        tx_3,
      } = await txSetup();
      const MultiSend = await hre.ethers.getContractFactory("MultiSend");
      const multisend = await MultiSend.deploy();

      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [1],
        [true]
      );
      await avatar.exec(modifier.address, 0, assign.data);

      const allowTarget =
        await modifier.populateTransaction.setTargetAddressAllowed(
          1,
          testContract.address,
          true
        );
      await avatar.exec(modifier.address, 0, allowTarget.data);

      const multiSendTarget = await modifier.populateTransaction.setMultiSend(
        multisend.address
      );
      await avatar.exec(modifier.address, 0, multiSendTarget.data);

      const defaultRole = await modifier.populateTransaction.setDefaultRole(
        user1.address,
        1
      );
      await avatar.exec(modifier.address, 0, defaultRole.data);

      const functionScoped =
        await modifier.populateTransaction.setTargetAddressScoped(
          1,
          testContract.address,
          true
        );
      await avatar.exec(modifier.address, 0, functionScoped.data);

      const functionAllowed =
        await modifier.populateTransaction.setAllowedFunction(
          1,
          testContract.address,
          "0x40c10f19",
          true
        );
      await avatar.exec(modifier.address, 0, functionAllowed.data);

      const functionScoped_2 =
        await modifier.populateTransaction.setTargetAddressScoped(
          1,
          testContract.address,
          true
        );
      await avatar.exec(modifier.address, 0, functionScoped_2.data);

      const functionAllowed_2 =
        await modifier.populateTransaction.setAllowedFunction(
          1,
          testContract.address,
          "0x273454bf",
          true
        );
      await avatar.exec(modifier.address, 0, functionAllowed_2.data);

      const paramScoped =
        await modifier.populateTransaction.setParametersScoped(
          1,
          testContract.address,
          "0x40c10f19",
          true,
          [true, true],
          [false, false],
          [0, 0]
        );
      await avatar.exec(modifier.address, 0, paramScoped.data);

      const paramScoped_2 =
        await modifier.populateTransaction.setParametersScoped(
          1,
          testContract.address,
          "0x273454bf",
          true,
          [true, true, true, true, true, true, true],
          [true, false, true, false, false, true, true],
          [0, 0, 0, 0, 0, 0, 0]
        );
      await avatar.exec(modifier.address, 0, paramScoped_2.data);

      await avatar.exec(modifier.address, 0, paramAllowed_1.data);
      await avatar.exec(modifier.address, 0, paramAllowed_2.data);
      await avatar.exec(modifier.address, 0, paramAllowed_3.data);
      await avatar.exec(modifier.address, 0, paramAllowed_4.data);
      await avatar.exec(modifier.address, 0, paramAllowed_5.data);
      await avatar.exec(modifier.address, 0, paramAllowed_6.data);
      await avatar.exec(modifier.address, 0, paramAllowed_7.data);
      await avatar.exec(modifier.address, 0, paramAllowed_8.data);
      await avatar.exec(modifier.address, 0, paramAllowed_9.data);

      const tx_bad = buildContractCall(
        testContract,
        "mint",
        [user1.address, 98],
        0
      );

      const multiTx = buildMultiSendSafeTx(
        multisend,
        [tx_1, tx_2, tx_3, tx_bad, tx_2, tx_3],
        0
      );

      await expect(
        modifier.execTransactionFromModule(
          multisend.address,
          0,
          multiTx.data,
          1
        )
      ).to.be.revertedWith("ParameterNotAllowed()");
    });

    it("executes a call with multisend tx", async () => {
      const {
        avatar,
        modifier,
        testContract,
        paramAllowed_1,
        paramAllowed_2,
        paramAllowed_3,
        paramAllowed_4,
        paramAllowed_5,
        paramAllowed_6,
        paramAllowed_7,
        paramAllowed_8,
        paramAllowed_9,
        tx_1,
        tx_2,
        tx_3,
      } = await txSetup();
      const MultiSend = await hre.ethers.getContractFactory("MultiSend");
      const multisend = await MultiSend.deploy();

      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [1],
        [true]
      );
      await avatar.exec(modifier.address, 0, assign.data);

      const allowTarget =
        await modifier.populateTransaction.setTargetAddressAllowed(
          1,
          testContract.address,
          true
        );
      await avatar.exec(modifier.address, 0, allowTarget.data);

      const multiSendTarget = await modifier.populateTransaction.setMultiSend(
        multisend.address
      );
      await avatar.exec(modifier.address, 0, multiSendTarget.data);

      const defaultRole = await modifier.populateTransaction.setDefaultRole(
        user1.address,
        1
      );
      await avatar.exec(modifier.address, 0, defaultRole.data);

      const functionScoped =
        await modifier.populateTransaction.setTargetAddressScoped(
          1,
          testContract.address,
          true
        );
      await avatar.exec(modifier.address, 0, functionScoped.data);

      const functionAllowed =
        await modifier.populateTransaction.setAllowedFunction(
          1,
          testContract.address,
          "0x40c10f19",
          true
        );
      await avatar.exec(modifier.address, 0, functionAllowed.data);

      const functionScoped_2 =
        await modifier.populateTransaction.setTargetAddressScoped(
          1,
          testContract.address,
          true
        );
      await avatar.exec(modifier.address, 0, functionScoped_2.data);

      const functionAllowed_2 =
        await modifier.populateTransaction.setAllowedFunction(
          1,
          testContract.address,
          "0x273454bf",
          true
        );
      await avatar.exec(modifier.address, 0, functionAllowed_2.data);

      const paramScoped =
        await modifier.populateTransaction.setParametersScoped(
          1,
          testContract.address,
          "0x40c10f19",
          true,
          [true, true],
          [false, false],
          [0, 0]
        );
      await avatar.exec(modifier.address, 0, paramScoped.data);

      const paramScoped_2 =
        await modifier.populateTransaction.setParametersScoped(
          1,
          testContract.address,
          "0x273454bf",
          true,
          [true, true, true, true, true, true, true],
          [true, false, true, false, false, true, true],
          [0, 0, 0, 0, 0, 0, 0]
        );
      await avatar.exec(modifier.address, 0, paramScoped_2.data);

      await avatar.exec(modifier.address, 0, paramAllowed_1.data);
      await avatar.exec(modifier.address, 0, paramAllowed_2.data);
      await avatar.exec(modifier.address, 0, paramAllowed_3.data);
      await avatar.exec(modifier.address, 0, paramAllowed_4.data);
      await avatar.exec(modifier.address, 0, paramAllowed_5.data);
      await avatar.exec(modifier.address, 0, paramAllowed_6.data);
      await avatar.exec(modifier.address, 0, paramAllowed_7.data);
      await avatar.exec(modifier.address, 0, paramAllowed_8.data);
      await avatar.exec(modifier.address, 0, paramAllowed_9.data);

      const multiTx = buildMultiSendSafeTx(
        multisend,
        [tx_1, tx_2, tx_3, tx_1, tx_2, tx_3],
        0
      );

      await expect(
        modifier.execTransactionFromModule(
          multisend.address,
          0,
          multiTx.data,
          1
        )
      ).to.emit(testContract, "TestDynamic");
    });

    it("reverts if value parameter is less than allowed", async () => {
      const { avatar, modifier, testContract, paramAllowed_1, paramAllowed_2 } =
        await txSetup();
      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [1],
        [true]
      );
      await avatar.exec(modifier.address, 0, assign.data);

      const allowTarget =
        await modifier.populateTransaction.setTargetAddressAllowed(
          1,
          testContract.address,
          true
        );
      await avatar.exec(modifier.address, 0, allowTarget.data);

      const defaultRole = await modifier.populateTransaction.setDefaultRole(
        user1.address,
        1
      );
      await avatar.exec(modifier.address, 0, defaultRole.data);

      const functionScoped =
        await modifier.populateTransaction.setTargetAddressScoped(
          1,
          testContract.address,
          true
        );
      await avatar.exec(modifier.address, 0, functionScoped.data);

      const functionAllowed =
        await modifier.populateTransaction.setAllowedFunction(
          1,
          testContract.address,
          "0x40c10f19",
          true
        );
      await avatar.exec(modifier.address, 0, functionAllowed.data);

      const encodedParam_2 = ethers.utils.defaultAbiCoder.encode(
        ["uint256"],
        [99]
      );
      const paramAllowed_lessThan =
        await modifier.populateTransaction.setParameterCompValue(
          1,
          testContract.address,
          "0x40c10f19",
          1,
          encodedParam_2
        );

      const paramScoped =
        await modifier.populateTransaction.setParametersScoped(
          1,
          testContract.address,
          "0x40c10f19",
          true,
          [true, true],
          [false, false],
          [0, 1] // set param 2 to greater than
        );
      await avatar.exec(modifier.address, 0, paramScoped.data);

      await avatar.exec(modifier.address, 0, paramAllowed_1.data);
      await avatar.exec(modifier.address, 0, paramAllowed_lessThan.data);

      const mint = await testContract.populateTransaction.mint(
        user1.address,
        98
      );

      await expect(
        modifier.execTransactionFromModule(
          testContract.address,
          0,
          mint.data,
          0
        )
      ).to.be.revertedWith("ParameterLessThanAllowed");
    });

    it("executes if value parameter is greater than allowed", async () => {
      const { avatar, modifier, testContract, paramAllowed_1, paramAllowed_2 } =
        await txSetup();
      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [1],
        [true]
      );
      await avatar.exec(modifier.address, 0, assign.data);

      const allowTarget =
        await modifier.populateTransaction.setTargetAddressAllowed(
          1,
          testContract.address,
          true
        );
      await avatar.exec(modifier.address, 0, allowTarget.data);

      const defaultRole = await modifier.populateTransaction.setDefaultRole(
        user1.address,
        1
      );
      await avatar.exec(modifier.address, 0, defaultRole.data);

      const functionScoped =
        await modifier.populateTransaction.setTargetAddressScoped(
          1,
          testContract.address,
          true
        );
      await avatar.exec(modifier.address, 0, functionScoped.data);

      const functionAllowed =
        await modifier.populateTransaction.setAllowedFunction(
          1,
          testContract.address,
          "0x40c10f19",
          true
        );
      await avatar.exec(modifier.address, 0, functionAllowed.data);

      const encodedParam_2 = ethers.utils.defaultAbiCoder.encode(
        ["uint256"],
        [99]
      );
      const paramAllowed_lessThan =
        await modifier.populateTransaction.setParameterAllowedValue(
          1,
          testContract.address,
          "0x40c10f19",
          1,
          encodedParam_2,
          encodedParam_2
        );

      const paramScoped =
        await modifier.populateTransaction.setParametersScoped(
          1,
          testContract.address,
          "0x40c10f19",
          true,
          [true, true],
          [false, false],
          [0, 1] // set param 2 to greater than
        );
      await avatar.exec(modifier.address, 0, paramScoped.data);

      await avatar.exec(modifier.address, 0, paramAllowed_1.data);
      await avatar.exec(modifier.address, 0, paramAllowed_lessThan.data);

      const mint = await testContract.populateTransaction.mint(
        user1.address,
        100
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

    it("reverts if value parameter is greater than allowed", async () => {
      const { avatar, modifier, testContract, paramAllowed_1, paramAllowed_2 } =
        await txSetup();
      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [1],
        [true]
      );
      await avatar.exec(modifier.address, 0, assign.data);

      const allowTarget =
        await modifier.populateTransaction.setTargetAddressAllowed(
          1,
          testContract.address,
          true
        );
      await avatar.exec(modifier.address, 0, allowTarget.data);

      const defaultRole = await modifier.populateTransaction.setDefaultRole(
        user1.address,
        1
      );
      await avatar.exec(modifier.address, 0, defaultRole.data);

      const functionScoped =
        await modifier.populateTransaction.setTargetAddressScoped(
          1,
          testContract.address,
          true
        );
      await avatar.exec(modifier.address, 0, functionScoped.data);

      const functionAllowed =
        await modifier.populateTransaction.setAllowedFunction(
          1,
          testContract.address,
          "0x40c10f19",
          true
        );
      await avatar.exec(modifier.address, 0, functionAllowed.data);

      const encodedParam_2 = ethers.utils.defaultAbiCoder.encode(
        ["uint256"],
        [99]
      );
      const paramAllowed_lessThan =
        await modifier.populateTransaction.setParameterAllowedValue(
          1,
          testContract.address,
          "0x40c10f19",
          1,
          encodedParam_2,
          encodedParam_2
        );

      const paramScoped =
        await modifier.populateTransaction.setParametersScoped(
          1,
          testContract.address,
          "0x40c10f19",
          true,
          [true, true],
          [false, false],
          [0, 2] // set param 2 to less than
        );
      await avatar.exec(modifier.address, 0, paramScoped.data);

      await avatar.exec(modifier.address, 0, paramAllowed_1.data);
      await avatar.exec(modifier.address, 0, paramAllowed_lessThan.data);

      const mint = await testContract.populateTransaction.mint(
        user1.address,
        100
      );

      await expect(
        modifier.execTransactionFromModule(
          testContract.address,
          0,
          mint.data,
          0
        )
      ).to.be.revertedWith("ParameterGreaterThanAllowed");
    });

    it("executes if value parameter is less than allowed", async () => {
      const { avatar, modifier, testContract, paramAllowed_1, paramAllowed_2 } =
        await txSetup();
      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [1],
        [true]
      );
      await avatar.exec(modifier.address, 0, assign.data);

      const allowTarget =
        await modifier.populateTransaction.setTargetAddressAllowed(
          1,
          testContract.address,
          true
        );
      await avatar.exec(modifier.address, 0, allowTarget.data);

      const defaultRole = await modifier.populateTransaction.setDefaultRole(
        user1.address,
        1
      );
      await avatar.exec(modifier.address, 0, defaultRole.data);

      const functionScoped =
        await modifier.populateTransaction.setTargetAddressScoped(
          1,
          testContract.address,
          true
        );
      await avatar.exec(modifier.address, 0, functionScoped.data);

      const functionAllowed =
        await modifier.populateTransaction.setAllowedFunction(
          1,
          testContract.address,
          "0x40c10f19",
          true
        );
      await avatar.exec(modifier.address, 0, functionAllowed.data);

      const encodedParam_2 = ethers.utils.defaultAbiCoder.encode(
        ["uint256"],
        [99]
      );
      const paramAllowed_lessThan =
        await modifier.populateTransaction.setParameterCompValue(
          1,
          testContract.address,
          "0x40c10f19",
          1,
          encodedParam_2
        );

      const paramScoped =
        await modifier.populateTransaction.setParametersScoped(
          1,
          testContract.address,
          "0x40c10f19",
          true,
          [true, true],
          [false, false],
          [0, 2] // set param 2 to less than
        );
      await avatar.exec(modifier.address, 0, paramScoped.data);

      await avatar.exec(modifier.address, 0, paramAllowed_1.data);
      await avatar.exec(modifier.address, 0, paramAllowed_lessThan.data);

      const mint = await testContract.populateTransaction.mint(
        user1.address,
        98
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

  describe("execTransactionFromModuleReturnData()", () => {
    it("reverts if called from module not assigned any role", async () => {
      const { avatar, modifier, testContract } = await txSetup();

      const allowTargetAddress =
        await modifier.populateTransaction.setTargetAddressAllowed(
          1,
          testContract.address,
          true
        );
      await avatar.exec(modifier.address, 0, allowTargetAddress.data);

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
      const { avatar, modifier, testContract } = await txSetup();
      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [1],
        [true]
      );
      await avatar.exec(modifier.address, 0, assign.data);

      const allowTargetAddress =
        await modifier.populateTransaction.setTargetAddressAllowed(
          1,
          testContract.address,
          true
        );
      await avatar.exec(modifier.address, 0, allowTargetAddress.data);

      const defaultRole = await modifier.populateTransaction.setDefaultRole(
        user1.address,
        1
      );
      await avatar.exec(modifier.address, 0, defaultRole.data);

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
      ).to.be.revertedWith("TargetAddressNotAllowed()");
    });

    it("executes a call to an allowed target", async () => {
      const { avatar, modifier, testContract } = await txSetup();
      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [1],
        [true]
      );
      await avatar.exec(modifier.address, 0, assign.data);

      const allowTargetAddress =
        await modifier.populateTransaction.setTargetAddressAllowed(
          1,
          testContract.address,
          true
        );
      await avatar.exec(modifier.address, 0, allowTargetAddress.data);

      const defaultRole = await modifier.populateTransaction.setDefaultRole(
        user1.address,
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
  describe("setMultiSend()", () => {
    it("reverts if not authorized", async () => {
      const { avatar, modifier } = await txSetup();
      expect(modifier.setMultiSend(AddressOne, true)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("sets multisend address to true", async () => {
      const { avatar, modifier } = await txSetup();
      const tx = await modifier.populateTransaction.setMultiSend(AddressOne);
      expect(avatar.exec(modifier.address, 0, tx.data));
      expect(await modifier.multiSend()).to.be.equals(AddressOne);
    });

    it("emits event with correct params", async () => {
      const { avatar, modifier } = await txSetup();
      const tx = await modifier.populateTransaction.setMultiSend(AddressOne);
      expect(await avatar.exec(modifier.address, 0, tx.data))
        .to.emit(modifier, "SetMulitSendAddress")
        .withArgs(AddressOne);
    });
  });

  describe("setTargetAddressAllowed()", () => {
    it("reverts if not authorized", async () => {
      const { avatar, modifier } = await txSetup();
      expect(
        modifier.setTargetAddressAllowed(1, AddressOne, true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("sets allowed address to true", async () => {
      const { avatar, modifier } = await txSetup();
      const tx = await modifier.populateTransaction.setTargetAddressAllowed(
        1,
        AddressOne,
        true
      );
      expect(avatar.exec(modifier.address, 0, tx.data))
        .to.emit(modifier, "SetTargetAddressAllowed")
        .withArgs(1, AddressOne, true);
      expect(await modifier.isAllowedTargetAddress(1, AddressOne)).to.be.equals(
        true
      );
    });

    it("sets allowed address to false", async () => {
      const { avatar, modifier } = await txSetup();
      const txTrue = await modifier.populateTransaction.setTargetAddressAllowed(
        1,
        AddressOne,
        true
      );
      expect(avatar.exec(modifier.address, 0, txTrue.data));
      expect(await modifier.isAllowedTargetAddress(1, AddressOne)).to.be.equals(
        true
      );
      const txFalse =
        await modifier.populateTransaction.setTargetAddressAllowed(
          1,
          AddressOne,
          false
        );
      expect(avatar.exec(modifier.address, 0, txFalse.data));
      expect(await modifier.isAllowedTargetAddress(1, AddressOne)).to.be.equals(
        false
      );
    });

    it("emits event with correct params", async () => {
      const { avatar, modifier } = await txSetup();
      const tx = await modifier.populateTransaction.setTargetAddressAllowed(
        1,
        AddressOne,
        true
      );
      expect(await avatar.exec(modifier.address, 0, tx.data))
        .to.emit(modifier, "SetTargetAddressAllowed")
        .withArgs(1, AddressOne, true);
    });
  });

  describe("setDelegateCallAllowedOnTargetAddress()", () => {
    it("reverts if not authorized", async () => {
      const { avatar, modifier } = await txSetup();
      expect(
        modifier.setDelegateCallAllowedOnTargetAddress(1, AddressOne, true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("sets allowed address to true", async () => {
      const { avatar, modifier } = await txSetup();
      const tx =
        await modifier.populateTransaction.setDelegateCallAllowedOnTargetAddress(
          1,
          AddressOne,
          true
        );
      expect(avatar.exec(modifier.address, 0, tx.data));
      expect(
        await modifier.isAllowedToDelegateCall(1, AddressOne)
      ).to.be.equals(true);
    });

    it("sets allowed address to false", async () => {
      const { avatar, modifier } = await txSetup();
      const txTrue =
        await modifier.populateTransaction.setDelegateCallAllowedOnTargetAddress(
          1,
          AddressOne,
          true
        );
      expect(avatar.exec(modifier.address, 0, txTrue.data));
      expect(
        await modifier.isAllowedToDelegateCall(1, AddressOne)
      ).to.be.equals(true);
      const txFalse =
        await modifier.populateTransaction.setDelegateCallAllowedOnTargetAddress(
          1,
          AddressOne,
          false
        );
      expect(avatar.exec(modifier.address, 0, txFalse.data));
      expect(
        await modifier.isAllowedToDelegateCall(1, AddressOne)
      ).to.be.equals(false);
    });

    it("emits event with correct params", async () => {
      const { avatar, modifier } = await txSetup();
      const tx =
        await modifier.populateTransaction.setDelegateCallAllowedOnTargetAddress(
          1,
          AddressOne,
          true
        );
      expect(await avatar.exec(modifier.address, 0, tx.data))
        .to.emit(modifier, "SetDelegateCallAllowedOnTargetAddress")
        .withArgs(1, AddressOne, true);
    });
  });

  describe("setTargetAddressScoped()", () => {
    it("reverts if not authorized", async () => {
      const { avatar, modifier } = await txSetup();
      expect(
        modifier.setTargetAddressScoped(1, AddressOne, true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("sets address scoped to true", async () => {
      const { avatar, modifier } = await txSetup();
      const tx = await modifier.populateTransaction.setTargetAddressScoped(
        1,
        AddressOne,
        true
      );
      expect(avatar.exec(modifier.address, 0, tx.data));
      expect(await modifier.isScoped(1, AddressOne)).to.be.equals(true);
    });

    it("sets address scoped to false", async () => {
      const { avatar, modifier } = await txSetup();
      const txTrue = await modifier.populateTransaction.setTargetAddressScoped(
        1,
        AddressOne,
        true
      );
      expect(avatar.exec(modifier.address, 0, txTrue.data));
      expect(await modifier.isScoped(1, AddressOne)).to.be.equals(true);
      const txFalse = await modifier.populateTransaction.setTargetAddressScoped(
        1,
        AddressOne,
        false
      );
      expect(avatar.exec(modifier.address, 0, txFalse.data));
      expect(await modifier.isScoped(1, AddressOne)).to.be.equals(false);
    });

    it("emits event with correct params", async () => {
      const { avatar, modifier } = await txSetup();
      const tx = await modifier.populateTransaction.setTargetAddressScoped(
        1,
        AddressOne,
        true
      );
      expect(avatar.exec(modifier.address, 0, tx.data))
        .to.emit(modifier, "SetTargetAddressScoped")
        .withArgs(1, AddressOne, true);
    });
  });

  describe("setParametersScoped()", () => {
    it("reverts if not authorized", async () => {
      const { avatar, modifier } = await txSetup();
      expect(
        modifier.setParametersScoped(
          1,
          AddressOne,
          "0x12345678",
          true,
          [true, true],
          [true, true],
          [1, 1]
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("sets parameters scoped to true", async () => {
      const { avatar, modifier } = await txSetup();
      const txTrue = await modifier.populateTransaction.setParametersScoped(
        1,
        AddressOne,
        "0x12345678",
        true,
        [true, true],
        [true, true],
        [1, 1]
      );
      expect(avatar.exec(modifier.address, 0, txTrue.data));
      await expect(
        (
          await modifier.getParameterScopes(1, AddressOne, "0x12345678")
        ).toString()
      ).to.be.equals("true,true,true,true,true,1,1");
    });

    it("sets parameters scoped to false", async () => {
      const { avatar, modifier } = await txSetup();
      const txTrue = await modifier.populateTransaction.setParametersScoped(
        1,
        AddressOne,
        "0x12345678",
        true,
        [true, true],
        [true, true],
        [1, 1]
      );
      expect(avatar.exec(modifier.address, 0, txTrue.data));
      expect(
        (
          await modifier.getParameterScopes(1, AddressOne, "0x12345678")
        ).toString()
      ).to.be.equals("true,true,true,true,true,1,1");
      const txFalse = await modifier.populateTransaction.setParametersScoped(
        1,
        AddressOne,
        "0x12345678",
        false,
        [false, false],
        [false, false],
        [0, 0]
      );
      expect(avatar.exec(modifier.address, 0, txFalse.data));
      expect(
        (
          await modifier.getParameterScopes(1, AddressOne, "0x12345678")
        ).toString()
      ).to.be.equals("false,false,false,false,false,0,0");
    });

    it("emits event with correct params", async () => {
      const { avatar, modifier } = await txSetup();

      const tx = await modifier.populateTransaction.setParametersScoped(
        1,
        AddressOne,
        "0x12345678",
        true,
        [true, true],
        [true, true],
        [1, 1]
      );

      await expect(await avatar.exec(modifier.address, 0, tx.data))
        .to.emit(modifier, "SetParametersScoped")
        .withArgs(
          1,
          AddressOne,
          "0x12345678",
          true,
          [true, true],
          [true, true],
          [1, 1]
        );
    });
  });

  describe("setSendAllowedOnTargetAddress()", () => {
    it("reverts if not authorized", async () => {
      const { avatar, modifier } = await txSetup();
      expect(
        modifier.setSendAllowedOnTargetAddress(1, AddressOne, true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("sets allowed address to true", async () => {
      const { avatar, modifier } = await txSetup();
      const tx =
        await modifier.populateTransaction.setSendAllowedOnTargetAddress(
          1,
          AddressOne,
          true
        );
      expect(avatar.exec(modifier.address, 0, tx.data));
      expect(await modifier.isSendAllowed(1, AddressOne)).to.be.equals(true);
    });

    it("sets allowed address to false", async () => {
      const { avatar, modifier } = await txSetup();
      const txTrue =
        await modifier.populateTransaction.setSendAllowedOnTargetAddress(
          1,
          AddressOne,
          true
        );
      expect(avatar.exec(modifier.address, 0, txTrue.data));
      expect(await modifier.isSendAllowed(1, AddressOne)).to.be.equals(true);
      const txFalse =
        await modifier.populateTransaction.setSendAllowedOnTargetAddress(
          1,
          AddressOne,
          false
        );
      expect(avatar.exec(modifier.address, 0, txFalse.data));
      await expect(await modifier.isSendAllowed(1, AddressOne)).to.be.equals(
        false
      );
    });

    it("emits event with correct params", async () => {
      const { avatar, modifier } = await txSetup();
      const tx =
        await modifier.populateTransaction.setSendAllowedOnTargetAddress(
          1,
          AddressOne,
          true
        );
      await expect(await avatar.exec(modifier.address, 0, tx.data))
        .to.emit(modifier, "SetSendAllowedOnTargetAddress")
        .withArgs(1, AddressOne, true);
    });
  });

  describe("setAllowedFunction()", () => {
    it("reverts if not authorized", async () => {
      const { avatar, modifier } = await txSetup();
      expect(
        modifier.setAllowedFunction(1, AddressOne, "0x12345678", true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("sets allowed function to true", async () => {
      const { avatar, modifier } = await txSetup();
      const tx = await modifier.populateTransaction.setAllowedFunction(
        1,
        AddressOne,
        "0x12345678",
        true
      );
      expect(avatar.exec(modifier.address, 0, tx.data));
      expect(
        await modifier.isAllowedFunction(1, AddressOne, "0x12345678")
      ).to.be.equals(true);
    });

    it("sets allowed function to false", async () => {
      const { avatar, modifier } = await txSetup();
      const txTrue = await modifier.populateTransaction.setAllowedFunction(
        1,
        AddressOne,
        "0x12345678",
        true
      );
      expect(avatar.exec(modifier.address, 0, txTrue.data));
      expect(
        await modifier.isAllowedFunction(1, AddressOne, "0x12345678")
      ).to.be.equals(true);
      const txFalse = await modifier.populateTransaction.setAllowedFunction(
        1,
        AddressOne,
        "0x12345678",
        false
      );
      expect(avatar.exec(modifier.address, 0, txFalse.data));
      expect(
        await modifier.isAllowedFunction(1, AddressOne, "0x12345678")
      ).to.be.equals(false);
    });

    it("emits event with correct params", async () => {
      const { avatar, modifier } = await txSetup();
      const tx = await modifier.populateTransaction.setAllowedFunction(
        1,
        AddressOne,
        "0x12345678",
        true
      );
      expect(await avatar.exec(modifier.address, 0, tx.data))
        .to.emit(modifier, "SetFunctionAllowedOnTargetAddress")
        .withArgs(1, AddressOne, "0x12345678", true);
    });
  });

  describe("setParameterAllowedValue()", () => {
    it("reverts if not authorized", async () => {
      const { avatar, modifier } = await txSetup();
      expect(
        modifier.setParameterAllowedValue(
          1,
          AddressOne,
          "0x12345678",
          1,
          "0xabcd",
          true
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("sets allowed parameter value to true", async () => {
      const { avatar, modifier } = await txSetup();
      const tx = await modifier.populateTransaction.setParameterAllowedValue(
        1,
        AddressOne,
        "0x12345678",
        0,
        "0xabcd",
        true
      );
      const paramScoped =
        await modifier.populateTransaction.setParametersScoped(
          1,
          AddressOne,
          "0x12345678",
          true,
          [true],
          [false],
          [0]
        );
      await avatar.exec(modifier.address, 0, paramScoped.data);
      expect(
        await modifier.isAllowedValueForParam(
          1,
          AddressOne,
          "0x12345678",
          0,
          "0xabcd"
        )
      ).to.be.equals(false);
      expect(avatar.exec(modifier.address, 0, tx.data));
      expect(
        await modifier.isAllowedValueForParam(
          1,
          AddressOne,
          "0x12345678",
          0,
          "0xabcd"
        )
      ).to.be.equals(true);
    });

    it("sets allowed parameter value to false", async () => {
      const { avatar, modifier } = await txSetup();
      const txTrue =
        await modifier.populateTransaction.setParameterAllowedValue(
          1,
          AddressOne,
          "0x12345678",
          0,
          "0xabcd",
          true
        );
      const txFalse =
        await modifier.populateTransaction.setParameterAllowedValue(
          1,
          AddressOne,
          "0x12345678",
          0,
          "0xabcd",
          false
        );
      const paramScoped =
        await modifier.populateTransaction.setParametersScoped(
          1,
          AddressOne,
          "0x12345678",
          true,
          [true],
          [false],
          [0]
        );
      await avatar.exec(modifier.address, 0, paramScoped.data);
      expect(
        await modifier.isAllowedValueForParam(
          1,
          AddressOne,
          "0x12345678",
          0,
          "0xabcd"
        )
      ).to.be.equals(false);
      expect(avatar.exec(modifier.address, 0, txTrue.data));
      expect(
        await modifier.isAllowedValueForParam(
          1,
          AddressOne,
          "0x12345678",
          0,
          "0xabcd"
        )
      ).to.be.equals(true);
      await expect(avatar.exec(modifier.address, 0, txFalse.data))
        .to.emit(modifier, "SetParameterAllowedValue")
        .withArgs(1, AddressOne, "0x12345678", 0, "0xabcd", false);
      expect(
        await modifier.isAllowedValueForParam(
          1,
          AddressOne,
          "0x12345678",
          0,
          "0xabcd"
        )
      ).to.be.equals(false);
    });

    it("emits event with correct params", async () => {
      const { avatar, modifier } = await txSetup();
      const tx = await modifier.populateTransaction.setParameterAllowedValue(
        1,
        AddressOne,
        "0x12345678",
        1,
        "0xabcd",
        true
      );
      await expect(await avatar.exec(modifier.address, 0, tx.data))
        .to.emit(modifier, "SetParameterAllowedValue")
        .withArgs(1, AddressOne, "0x12345678", 1, "0xabcd", true);
    });
  });

  describe("setParameterCompValue()", () => {
    it("reverts if not authorized", async () => {
      const { avatar, modifier } = await txSetup();
      expect(
        modifier.setParameterCompValue(1, AddressOne, "0x12345678", 1, "0xabcd")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("sets compValue value to non-zero", async () => {
      const { avatar, modifier } = await txSetup();
      const tx = await modifier.populateTransaction.setParameterCompValue(
        1,
        AddressOne,
        "0x12345678",
        0,
        "0xabcd"
      );
      const paramScoped =
        await modifier.populateTransaction.setParametersScoped(
          1,
          AddressOne,
          "0x12345678",
          true,
          [true],
          [false],
          [0]
        );
      await avatar.exec(modifier.address, 0, paramScoped.data);
      expect(
        await modifier.getCompValue(1, AddressOne, "0x12345678", 0)
      ).to.be.equals("0x");
      expect(avatar.exec(modifier.address, 0, tx.data));
      expect(
        await modifier.getCompValue(1, AddressOne, "0x12345678", 0)
      ).to.be.equals("0xabcd");
    });

    it("sets compValue to zero", async () => {
      const { avatar, modifier } = await txSetup();
      const txTrue = await modifier.populateTransaction.setParameterCompValue(
        1,
        AddressOne,
        "0x12345678",
        0,
        "0xabcd"
      );
      const txFalse = await modifier.populateTransaction.setParameterCompValue(
        1,
        AddressOne,
        "0x12345678",
        0,
        "0x"
      );
      const paramScoped =
        await modifier.populateTransaction.setParametersScoped(
          1,
          AddressOne,
          "0x12345678",
          true,
          [true],
          [false],
          [0]
        );
      await avatar.exec(modifier.address, 0, paramScoped.data);
      expect(
        await modifier.getCompValue(1, AddressOne, "0x12345678", 0)
      ).to.be.equals("0x");
      expect(avatar.exec(modifier.address, 0, txTrue.data));
      expect(
        await modifier.getCompValue(1, AddressOne, "0x12345678", 0)
      ).to.be.equals("0xabcd");
      await expect(avatar.exec(modifier.address, 0, txFalse.data))
        .to.emit(modifier, "SetParameterCompValue")
        .withArgs(1, AddressOne, "0x12345678", 0, "0x");
      expect(
        await modifier.getCompValue(1, AddressOne, "0x12345678", 0)
      ).to.be.equals("0x");
    });

    it("emits event with correct params", async () => {
      const { avatar, modifier } = await txSetup();
      const tx = await modifier.populateTransaction.setParameterCompValue(
        1,
        AddressOne,
        "0x12345678",
        1,
        "0xabcd"
      );
      await expect(await avatar.exec(modifier.address, 0, tx.data))
        .to.emit(modifier, "SetParameterCompValue")
        .withArgs(1, AddressOne, "0x12345678", 1, "0xabcd");
    });
  });

  describe("setDefaultRole()", () => {
    it("reverts if not authorized", async () => {
      const { avatar, modifier } = await txSetup();
      expect(modifier.setDefaultRole(AddressOne, 1)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("sets default role", async () => {
      const { avatar, modifier } = await txSetup();
      const tx = await modifier.populateTransaction.setDefaultRole(
        AddressOne,
        1
      );
      await expect(await modifier.getDefaultRole(AddressOne)).to.be.equals(0);
      expect(await avatar.exec(modifier.address, 0, tx.data));
      await expect(await modifier.getDefaultRole(AddressOne)).to.be.equals(1);
    });

    it("emits event with correct params", async () => {
      const { avatar, modifier } = await txSetup();
      const tx = await modifier.populateTransaction.setDefaultRole(
        AddressOne,
        1
      );
      await expect(await modifier.getDefaultRole(AddressOne)).to.be.equals(0);
      await expect(await avatar.exec(modifier.address, 0, tx.data))
        .to.emit(modifier, "SetDefaultRole")
        .withArgs(AddressOne, 1);
      await expect(await modifier.getDefaultRole(AddressOne)).to.be.equals(1);
    });
  });

  describe("getDefaultRole()", () => {
    it("returns 0 if not set", async () => {
      const { avatar, modifier } = await txSetup();
      await expect(await modifier.getDefaultRole(AddressOne)).to.be.equals(0);
    });

    it("returns role if set", async () => {
      const { avatar, modifier } = await txSetup();
      const tx = await modifier.populateTransaction.setDefaultRole(
        AddressOne,
        1
      );
      await expect(await modifier.getDefaultRole(AddressOne)).to.be.equals(0);
      await expect(await avatar.exec(modifier.address, 0, tx.data));
      await expect(await modifier.getDefaultRole(AddressOne)).to.be.equals(1);
    });
  });

  describe("getParameterScopes()", () => {
    it("returns 0 if not set", async () => {
      const { avatar, modifier } = await txSetup();
      const result = (
        await modifier.getParameterScopes(1, AddressOne, "0x12345678")
      ).toString();
      await expect(result).to.be.equals("false,,,");
    });

    it("returns role if set", async () => {
      const { avatar, modifier } = await txSetup();
      const tx = await modifier.populateTransaction.setParametersScoped(
        1,
        AddressOne,
        "0x12345678",
        true,
        [true],
        [true],
        [1]
      );
      const resultFalse = (
        await modifier.getParameterScopes(1, AddressOne, "0x12345678")
      ).toString();
      await expect(resultFalse).to.be.equals("false,,,");
      await expect(await avatar.exec(modifier.address, 0, tx.data));
      const resultTrue = (
        await modifier.getParameterScopes(1, AddressOne, "0x12345678")
      ).toString();
      await expect(resultTrue).to.be.equals("true,true,true,1");
    });
  });

  describe("getDefaultRole()", () => {
    it("returns 0 if not set", async () => {
      const { avatar, modifier } = await txSetup();
      await expect(await modifier.getDefaultRole(AddressOne)).to.be.equals(0);
    });

    it("returns role if set", async () => {
      const { avatar, modifier } = await txSetup();
      await expect(await modifier.getDefaultRole(AddressOne)).to.be.equals(0);
      const tx = await modifier.populateTransaction.setDefaultRole(
        AddressOne,
        1
      );
      await expect(await avatar.exec(modifier.address, 0, tx.data));
      await expect(await modifier.getDefaultRole(AddressOne)).to.be.equals(1);
    });
  });

  describe("getCompType()", () => {
    it("returns 0 if not set", async () => {
      const { avatar, modifier } = await txSetup();
      const result = (
        await modifier.getCompValue(1, AddressOne, "0x12345678", 0)
      ).toString();
      await expect(result).to.be.equals("0x");
    });

    it("returns type if set", async () => {
      const { avatar, modifier } = await txSetup();
      const paramScoped =
        await modifier.populateTransaction.setParametersScoped(
          1,
          AddressOne,
          "0x12345678",
          true,
          [true],
          [true],
          [0]
        );
      await avatar.exec(modifier.address, 0, paramScoped.data);
      await expect(
        await modifier.getCompType(1, AddressOne, "0x12345678", 0)
      ).to.be.equals(0);
      const changeCompType =
        await modifier.populateTransaction.setParametersScoped(
          1,
          AddressOne,
          "0x12345678",
          true,
          [true],
          [true],
          [1]
        );
      await avatar.exec(modifier.address, 0, changeCompType.data);
      await expect(
        await modifier.getCompType(1, AddressOne, "0x12345678", 0)
      ).to.be.equals(1);
    });
  });

  describe("getCompValue()", () => {
    it("returns 0x if not set", async () => {
      const { avatar, modifier } = await txSetup();
      const result = (
        await modifier.getCompValue(1, AddressOne, "0x12345678", 0)
      ).toString();
      await expect(result).to.be.equals("0x");
    });

    it("returns role if set", async () => {
      const { avatar, modifier } = await txSetup();
      const tx = await modifier.populateTransaction.setParameterCompValue(
        1,
        AddressOne,
        "0x12345678",
        0,
        "0x1234"
      );
      const resultFalse = (
        await modifier.getCompValue(1, AddressOne, "0x12345678", 0)
      ).toString();
      await expect(resultFalse).to.be.equals("0x");
      await expect(await avatar.exec(modifier.address, 0, tx.data));
      const resultTrue = (
        await modifier.getCompValue(1, AddressOne, "0x12345678", 0)
      ).toString();
      await expect(resultTrue).to.be.equals("0x1234");
    });
  });

  describe("isRoleMember()", () => {
    it("returns false if not set", async () => {
      const { avatar, modifier } = await txSetup();
      await expect(await modifier.isRoleMember(1, AddressOne)).to.be.equals(
        false
      );
    });

    it("returns role if set", async () => {
      const { avatar, modifier } = await txSetup();
      const tx = await modifier.populateTransaction.assignRoles(
        user1.address,
        [1],
        [true]
      );
      await expect(await modifier.isRoleMember(1, user1.address)).to.be.equals(
        false
      );
      await expect(await avatar.exec(modifier.address, 0, tx.data));
      await expect(await modifier.isRoleMember(1, user1.address)).to.be.equals(
        true
      );
    });
  });

  describe("isAllowedTargetAddress()", () => {
    it("returns false if not set", async () => {
      const { avatar, modifier } = await txSetup();
      await expect(
        await modifier.isAllowedTargetAddress(1, AddressOne)
      ).to.be.equals(false);
    });

    it("returns true if set", async () => {
      const { avatar, modifier } = await txSetup();
      await expect(
        await modifier.isAllowedTargetAddress(1, AddressOne)
      ).to.be.equals(false);
      const tx = await modifier.populateTransaction.setTargetAddressAllowed(
        1,
        AddressOne,
        true
      );
      await expect(await avatar.exec(modifier.address, 0, tx.data));
      await expect(
        await modifier.isAllowedTargetAddress(1, AddressOne)
      ).to.be.equals(true);
    });
  });

  describe("isScoped()", () => {
    it("returns false if not set", async () => {
      const { avatar, modifier } = await txSetup();
      await expect(await modifier.isScoped(1, AddressOne)).to.be.equals(false);
    });

    it("returns true if set", async () => {
      const { avatar, modifier } = await txSetup();
      await expect(await modifier.isScoped(1, AddressOne)).to.be.equals(false);
      const tx = await modifier.populateTransaction.setTargetAddressScoped(
        1,
        AddressOne,
        true
      );
      await expect(await avatar.exec(modifier.address, 0, tx.data));
      await expect(await modifier.isScoped(1, AddressOne)).to.be.equals(true);
    });
  });

  describe("isSendAllowed()", () => {
    it("returns false if not set", async () => {
      const { avatar, modifier } = await txSetup();
      await expect(await modifier.isSendAllowed(1, AddressOne)).to.be.equals(
        false
      );
    });

    it("returns true if set", async () => {
      const { avatar, modifier } = await txSetup();
      await expect(await modifier.isSendAllowed(1, AddressOne)).to.be.equals(
        false
      );
      const tx =
        await modifier.populateTransaction.setSendAllowedOnTargetAddress(
          1,
          AddressOne,
          true
        );
      await expect(await avatar.exec(modifier.address, 0, tx.data));
      await expect(await modifier.isSendAllowed(1, AddressOne)).to.be.equals(
        true
      );
    });
  });

  describe("isAllowedFunction()", () => {
    it("returns false if not set", async () => {
      const { avatar, modifier } = await txSetup();
      await expect(
        await modifier.isAllowedFunction(1, AddressOne, "0x12345678")
      ).to.be.equals(false);
    });

    it("returns true if set", async () => {
      const { avatar, modifier } = await txSetup();
      await expect(
        await modifier.isAllowedFunction(1, AddressOne, "0x12345678")
      ).to.be.equals(false);
      const tx = await modifier.populateTransaction.setAllowedFunction(
        1,
        AddressOne,
        "0x12345678",
        true
      );
      await expect(await avatar.exec(modifier.address, 0, tx.data));
      await expect(
        await modifier.isAllowedFunction(1, AddressOne, "0x12345678")
      ).to.be.equals(true);
    });
  });

  describe("isAllowedToDelegateCall()", () => {
    it("returns false if not set", async () => {
      const { avatar, modifier } = await txSetup();
      await expect(
        await modifier.isAllowedToDelegateCall(1, AddressOne)
      ).to.be.equals(false);
    });

    it("returns true if set", async () => {
      const { avatar, modifier } = await txSetup();
      await expect(
        await modifier.isAllowedToDelegateCall(1, AddressOne)
      ).to.be.equals(false);
      const tx =
        await modifier.populateTransaction.setDelegateCallAllowedOnTargetAddress(
          1,
          AddressOne,
          true
        );
      await expect(await avatar.exec(modifier.address, 0, tx.data));
      await expect(
        await modifier.isAllowedToDelegateCall(1, AddressOne)
      ).to.be.equals(true);
    });
  });

  describe("isAllowedValueForParam()", () => {
    it("returns false if not set", async () => {
      const { avatar, modifier } = await txSetup();
      const paramScoped =
        await modifier.populateTransaction.setParametersScoped(
          1,
          AddressOne,
          "0x12345678",
          true,
          [true],
          [true],
          [0]
        );
      await avatar.exec(modifier.address, 0, paramScoped.data);
      await expect(
        await modifier.isAllowedValueForParam(
          1,
          AddressOne,
          "0x12345678",
          0,
          "0x1234"
        )
      ).to.be.equals(false);
    });

    it("returns true if set", async () => {
      const { avatar, modifier } = await txSetup();
      const paramScoped =
        await modifier.populateTransaction.setParametersScoped(
          1,
          AddressOne,
          "0x12345678",
          true,
          [true],
          [true],
          [0]
        );
      await avatar.exec(modifier.address, 0, paramScoped.data);
      await expect(
        await modifier.isAllowedValueForParam(
          1,
          AddressOne,
          "0x12345678",
          0,
          "0xabcd"
        )
      ).to.be.equals(false);
      const tx = await modifier.populateTransaction.setParameterAllowedValue(
        1,
        AddressOne,
        "0x12345678",
        0,
        "0xabcd",
        true
      );
      await expect(await avatar.exec(modifier.address, 0, tx.data));
      await expect(
        await modifier.isAllowedValueForParam(
          1,
          AddressOne,
          "0x12345678",
          0,
          "0xabcd"
        )
      ).to.be.equals(true);
    });
  });
});
