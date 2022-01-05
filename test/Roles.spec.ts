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
    const Permissions = await hre.ethers.getContractFactory("Permissions");
    const permissions = await Permissions.deploy();
    const Modifier = await hre.ethers.getContractFactory("Roles", {
      libraries: {
        Permissions: permissions.address,
      },
    });

    const modifier = await Modifier.deploy(
      base.avatar.address,
      base.avatar.address,
      base.avatar.address
    );
    return { ...base, Modifier, modifier };
  });

  const setupRolesWithOwnerAndInvoker = deployments.createFixture(async () => {
    const base = await baseSetup();

    const [owner, invoker] = waffle.provider.getWallets();

    const Permissions = await hre.ethers.getContractFactory("Permissions");
    const permissions = await Permissions.deploy();
    const Modifier = await hre.ethers.getContractFactory("Roles", {
      libraries: {
        Permissions: permissions.address,
      },
    });

    const modifier = await Modifier.deploy(
      owner.address,
      base.avatar.address,
      base.avatar.address
    );

    await modifier.enableModule(invoker.address);

    return {
      ...base,
      Modifier,
      modifier,
      owner,
      invoker,
    };
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
        true
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
        true
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
        true
      );
    const paramAllowed_4 =
      await baseAvatar.modifier.populateTransaction.setParameterAllowedValue(
        1,
        baseAvatar.testContract.address,
        "0x273454bf",
        1,
        encodedParam_4,
        true
      );
    const paramAllowed_5 =
      await baseAvatar.modifier.populateTransaction.setParameterAllowedValue(
        1,
        baseAvatar.testContract.address,
        "0x273454bf",
        2,
        encodedParam_5,
        true
      );
    const paramAllowed_6 =
      await baseAvatar.modifier.populateTransaction.setParameterAllowedValue(
        1,
        baseAvatar.testContract.address,
        "0x273454bf",
        3,
        encodedParam_6,
        true
      );
    const paramAllowed_7 =
      await baseAvatar.modifier.populateTransaction.setParameterAllowedValue(
        1,
        baseAvatar.testContract.address,
        "0x273454bf",
        4,
        encodedParam_7,
        true
      );
    const paramAllowed_8 =
      await baseAvatar.modifier.populateTransaction.setParameterAllowedValue(
        1,
        baseAvatar.testContract.address,
        "0x273454bf",
        5,
        encodedParam_8,
        true
      );
    const paramAllowed_9 =
      await baseAvatar.modifier.populateTransaction.setParameterAllowedValue(
        1,
        baseAvatar.testContract.address,
        "0x273454bf",
        6,
        encodedParam_9,
        true
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

  const [user1] = waffle.provider.getWallets();

  describe("setUp()", async () => {
    it("should emit event because of successful set up", async () => {
      const Permissions = await hre.ethers.getContractFactory("Permissions");
      const permissions = await Permissions.deploy();
      const Modifier = await hre.ethers.getContractFactory("Roles", {
        libraries: {
          Permissions: permissions.address,
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
      // api doesn't have the function to check explicitly
      // lets assert implicitly

      const { modifier, testContract, owner, invoker } =
        await setupRolesWithOwnerAndInvoker();

      // blank allow all calls to testContract from role 0
      await modifier
        .connect(owner)
        .setTargetAddressAllowed(0, testContract.address, true);

      // expect it to fail, before assigning role
      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            0,
            testContract.interface.encodeFunctionData("doNothing()"),
            0
          )
      ).to.be.revertedWith("NoMembership()");

      await modifier.connect(owner).assignRoles(invoker.address, [0], [true]);

      // expect it to succeed, after assigning role
      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            0,
            testContract.interface.encodeFunctionData("doNothing()"),
            0
          )
      ).to.emit(testContract, "DoNothing");
    });

    it("revokes roles to a module", async () => {
      const { modifier, testContract, owner, invoker } =
        await setupRolesWithOwnerAndInvoker();

      const ROLE_ID = 0;

      // blank allow all calls to testContract from role 0
      await modifier
        .connect(owner)
        .setTargetAddressAllowed(ROLE_ID, testContract.address, true);

      //authorize
      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_ID], [true]);

      // expect it to succeed, after assigning role
      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            0,
            testContract.interface.encodeFunctionData("doNothing()"),
            0
          )
      ).to.emit(testContract, "DoNothing");

      //revoke
      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_ID], [false]);

      // expect it to fail, after revoking
      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            0,
            testContract.interface.encodeFunctionData("doNothing()"),
            0
          )
      ).to.be.revertedWith("NoMembership()");
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

      const paramScoped =
        await modifier.populateTransaction.setParametersScoped(
          1,
          testContract.address,
          "0x40c10f19",
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

      const paramScoped =
        await modifier.populateTransaction.setParametersScoped(
          1,
          testContract.address,
          "0x40c10f19",
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

      const paramScoped =
        await modifier.populateTransaction.setParametersScoped(
          1,
          testContract.address,
          "0x273454bf",
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

      const paramScoped =
        await modifier.populateTransaction.setParametersScoped(
          1,
          testContract.address,
          "0x273454bf",
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

    it("reverts if multisend tx data offset is not 32 bytes", async () => {
      const {
        avatar,
        modifier,
        testContract,
        paramAllowed_1,
        paramAllowed_2,
        tx_1,
      } = await txSetup();
      const MultiSend = await hre.ethers.getContractFactory("MultiSend");
      const multisend = await MultiSend.deploy();

      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [1],
        [true]
      );
      await avatar.exec(modifier.address, 0, assign.data);

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

      const paramScoped =
        await modifier.populateTransaction.setParametersScoped(
          1,
          testContract.address,
          "0x40c10f19",
          [true, true],
          [false, false],
          [0, 0]
        );
      await avatar.exec(modifier.address, 0, paramScoped.data);

      await avatar.exec(modifier.address, 0, paramAllowed_1.data);
      await avatar.exec(modifier.address, 0, paramAllowed_2.data);

      const multiTx = buildMultiSendSafeTx(multisend, [tx_1], 0);

      // setting offset to 0x21 bytes instead of 0x20
      multiTx.data = multiTx.data.substr(0, 73) + "1" + multiTx.data.substr(74);

      await expect(
        modifier.execTransactionFromModule(
          multisend.address,
          0,
          multiTx.data,
          1
        )
      ).to.be.revertedWith("UnacceptableMultiSendOffset()");
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

      const functionScoped_2 =
        await modifier.populateTransaction.setTargetAddressScoped(
          1,
          testContract.address,
          true
        );
      await avatar.exec(modifier.address, 0, functionScoped_2.data);

      const paramScoped =
        await modifier.populateTransaction.setParametersScoped(
          1,
          testContract.address,
          "0x40c10f19",
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
      await expect(modifier.setMultiSend(AddressOne)).to.be.revertedWith(
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
      const { modifier, testContract, owner, invoker } =
        await setupRolesWithOwnerAndInvoker();

      const ROLE_ID = 1;

      const doNothingArgs = [
        testContract.address,
        0,
        testContract.interface.encodeFunctionData("doNothing()"),
        0,
      ];

      // assign a role to invoker
      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_ID], [true]);

      // expect to fail due to no permissions
      await expect(
        modifier.connect(invoker).execTransactionFromModule(...doNothingArgs)
      ).to.be.revertedWith("NoMembership()");

      // allow testContract address for role
      await expect(
        modifier
          .connect(owner)
          .setTargetAddressAllowed(ROLE_ID, testContract.address, true)
      )
        .to.emit(modifier, "SetTargetAddressAllowed")
        .withArgs(ROLE_ID, testContract.address, true);

      // expect to fail with default role
      await expect(
        modifier.connect(invoker).execTransactionFromModule(...doNothingArgs)
      ).to.be.revertedWith("NoMembership()");

      // should work with the configured role
      await expect(
        modifier
          .connect(invoker)
          .execTransactionWithRole(...[...doNothingArgs, ROLE_ID])
      ).to.emit(testContract, "DoNothing");
    });

    it("sets allowed address to false", async () => {
      const { modifier, testContract, owner, invoker } =
        await setupRolesWithOwnerAndInvoker();

      const ROLE_ID = 1;

      const execWithRoleArgs = [
        testContract.address,
        0,
        testContract.interface.encodeFunctionData("doNothing()"),
        0,
        ROLE_ID,
      ];

      // assign a role to invoker
      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_ID], [true]);

      // allow testContract address for role
      await expect(
        modifier
          .connect(owner)
          .setTargetAddressAllowed(ROLE_ID, testContract.address, true)
      );

      // this call should work
      await expect(
        modifier.connect(invoker).execTransactionWithRole(...execWithRoleArgs)
      ).to.emit(testContract, "DoNothing");

      // Revoke access
      await expect(
        modifier
          .connect(owner)
          .setTargetAddressAllowed(ROLE_ID, testContract.address, false)
      )
        .to.emit(modifier, "SetTargetAddressAllowed")
        .withArgs(ROLE_ID, testContract.address, false);

      // fails after revoke
      await expect(
        modifier.connect(invoker).execTransactionWithRole(...execWithRoleArgs)
      ).to.be.revertedWith("TargetAddressNotAllowed()");
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
      const { modifier, testContract, owner, invoker } =
        await setupRolesWithOwnerAndInvoker();

      const ROLE_ID = 0;
      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_ID], [true]);

      const execArgs = [
        testContract.address,
        0,
        testContract.interface.encodeFunctionData("doNothing()"),
        1,
      ];

      // allow calls (but not delegate)
      await modifier
        .connect(owner)
        .setTargetAddressAllowed(ROLE_ID, testContract.address, true);

      // still getting the delegateCallNotAllowed error
      await expect(
        modifier.connect(invoker).execTransactionFromModule(...execArgs)
      ).to.be.revertedWith("DelegateCallNotAllowed()");

      // allow delegate calls to address
      await modifier
        .connect(owner)
        .setDelegateCallAllowedOnTargetAddress(
          ROLE_ID,
          testContract.address,
          true
        );

      // ok
      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            0,
            testContract.interface.encodeFunctionData("doNothing()"),
            1
          )
      ).to.not.be.reverted;
    });

    it("sets allowed address to false", async () => {
      const { modifier, testContract, owner, invoker } =
        await setupRolesWithOwnerAndInvoker();

      const ROLE_ID = 0;
      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_ID], [true]);

      const execArgs = [
        testContract.address,
        0,
        testContract.interface.encodeFunctionData("doNothing()"),
        1,
      ];

      // allow calls (but not delegate)
      await modifier
        .connect(owner)
        .setTargetAddressAllowed(ROLE_ID, testContract.address, true);

      // allow delegate calls to address
      await modifier
        .connect(owner)
        .setDelegateCallAllowedOnTargetAddress(
          ROLE_ID,
          testContract.address,
          true
        );

      // ok
      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            0,
            testContract.interface.encodeFunctionData("doNothing()"),
            1
          )
      ).to.not.be.reverted;

      // revoke delegate calls to address
      await modifier
        .connect(owner)
        .setDelegateCallAllowedOnTargetAddress(
          ROLE_ID,
          testContract.address,
          false
        );

      // still getting the delegateCallNotAllowed error
      await expect(
        modifier.connect(invoker).execTransactionFromModule(...execArgs)
      ).to.be.revertedWith("DelegateCallNotAllowed()");
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
      const { modifier, testContract, owner, invoker } =
        await setupRolesWithOwnerAndInvoker();

      const ROLE_ID = 0;
      const EXEC_ARGS = [
        testContract.address,
        0,
        testContract.interface.encodeFunctionData("doNothing()"),
        0,
      ];

      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_ID], [true]);

      await modifier
        .connect(owner)
        .setTargetAddressAllowed(ROLE_ID, testContract.address, true);

      await expect(
        modifier.connect(invoker).execTransactionFromModule(...EXEC_ARGS)
      ).to.not.be.reverted;

      await modifier
        .connect(owner)
        .setTargetAddressScoped(ROLE_ID, testContract.address, true);

      await expect(
        modifier.connect(invoker).execTransactionFromModule(...EXEC_ARGS)
      ).to.be.revertedWith("FunctionNotAllowed()");
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
      const { modifier } = await txSetup();
      expect(
        modifier.setParametersScoped(
          1,
          AddressOne,
          "0x12345678",
          [true, true],
          [true, true],
          [1, 1]
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("sets parameters scoped to true", async () => {
      const { modifier, testContract, owner, invoker } =
        await setupRolesWithOwnerAndInvoker();

      const ROLE_ID = 0;
      const COMP_TYPE_EQ = 0;
      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("fnWithSingleParam")
      );
      const EXEC_ARGS = (n: number) => [
        testContract.address,
        0,
        testContract.interface.encodeFunctionData(
          "fnWithSingleParam(uint256)",
          [n]
        ),
        0,
      ];

      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_ID], [true]);

      await modifier
        .connect(owner)
        .setTargetAddressAllowed(ROLE_ID, testContract.address, true);

      // works before making function parameter scoped
      await expect(
        modifier.connect(invoker).execTransactionFromModule(...EXEC_ARGS(1))
      ).to.not.be.reverted;

      await modifier
        .connect(owner)
        .setTargetAddressScoped(ROLE_ID, testContract.address, true);

      await modifier
        .connect(owner)
        .setParametersScoped(
          ROLE_ID,
          testContract.address,
          SELECTOR,
          [true],
          [false],
          [COMP_TYPE_EQ]
        );

      // turn scoping on
      await modifier
        .connect(owner)
        .setParameterAllowedValue(
          ROLE_ID,
          testContract.address,
          SELECTOR,
          0,
          ethers.utils.defaultAbiCoder.encode(["uint256"], [2]),
          true
        );

      // ngmi
      await expect(
        modifier.connect(invoker).execTransactionFromModule(...EXEC_ARGS(1))
      ).to.be.revertedWith("ParameterNotAllowed");

      // gmi
      await expect(
        modifier.connect(invoker).execTransactionFromModule(...EXEC_ARGS(2))
      ).to.not.be.reverted;
    });

    it("sets parameters scoped to false", async () => {
      const { modifier, testContract, owner, invoker } =
        await setupRolesWithOwnerAndInvoker();

      const ROLE_ID = 0;
      const COMP_TYPE_EQ = 0;
      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("fnWithSingleParam")
      );
      const EXEC_ARGS = (n: number) => [
        testContract.address,
        0,
        testContract.interface.encodeFunctionData(
          "fnWithSingleParam(uint256)",
          [n]
        ),
        0,
      ];

      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_ID], [true]);

      await modifier
        .connect(owner)
        .setAllowedFunction(ROLE_ID, testContract.address, SELECTOR, true);

      // works before making function parameter scoped
      await expect(
        modifier.connect(invoker).execTransactionFromModule(...EXEC_ARGS(1))
      ).to.not.be.reverted;

      await modifier
        .connect(owner)
        .setTargetAddressScoped(ROLE_ID, testContract.address, true);

      await modifier
        .connect(owner)
        .setParametersScoped(
          ROLE_ID,
          testContract.address,
          SELECTOR,
          [true],
          [false],
          [COMP_TYPE_EQ]
        );

      // turn scoping on
      await modifier
        .connect(owner)
        .setParameterAllowedValue(
          ROLE_ID,
          testContract.address,
          SELECTOR,
          0,
          ethers.utils.defaultAbiCoder.encode(["uint256"], [2]),
          true
        );

      // expects value to be 2, fails
      await expect(
        modifier.connect(invoker).execTransactionFromModule(...EXEC_ARGS(1))
      ).to.be.revertedWith("ParameterNotAllowed");

      await modifier
        .connect(owner)
        .setParametersScoped(
          ROLE_ID,
          testContract.address,
          SELECTOR,
          [false],
          [false],
          [COMP_TYPE_EQ]
        );

      // after disabling scoping, should work again
      await expect(
        modifier.connect(invoker).execTransactionFromModule(...EXEC_ARGS(2))
      ).to.not.be.reverted;
    });

    it("emits event with correct params", async () => {
      const { avatar, modifier } = await txSetup();

      const tx = await modifier.populateTransaction.setParametersScoped(
        1,
        AddressOne,
        "0x12345678",
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
          [true, true],
          [true, true],
          [1, 1]
        );
    });
  });

  describe("setSendAllowedOnTargetAddress()", () => {
    it("reverts if not authorized", async () => {
      const { modifier } = await txSetup();
      expect(
        modifier.setSendAllowedOnTargetAddress(1, AddressOne, true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("sets send allowed to true", async () => {
      const { modifier, testContract, owner, invoker } =
        await setupRolesWithOwnerAndInvoker();

      const ROLE_ID = 0;
      // blank allow all calls to testContract from role 0
      await modifier
        .connect(owner)
        .setTargetAddressAllowed(ROLE_ID, testContract.address, true);

      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_ID], [true]);

      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModuleReturnData(testContract.address, 1, "0x", 0)
      ).to.be.revertedWith("SendNotAllowed");

      await modifier
        .connect(owner)
        .setSendAllowedOnTargetAddress(ROLE_ID, testContract.address, true);

      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModuleReturnData(
            testContract.address,
            10000,
            "0x",
            0
          )
      ).to.not.be.reverted;
    });

    it("sets send allowed to false", async () => {
      const { modifier, testContract, owner, invoker } =
        await setupRolesWithOwnerAndInvoker();

      const ROLE_ID = 0;
      // blank allow all calls to testContract from role 0
      await modifier
        .connect(owner)
        .setTargetAddressAllowed(ROLE_ID, testContract.address, true);

      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_ID], [true]);

      await modifier
        .connect(owner)
        .setSendAllowedOnTargetAddress(ROLE_ID, testContract.address, true);

      // should work with sendAllowed true
      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModuleReturnData(
            testContract.address,
            10000,
            "0x",
            0
          )
      ).to.not.be.reverted;

      await modifier
        .connect(owner)
        .setSendAllowedOnTargetAddress(ROLE_ID, testContract.address, false);

      // should work with sendAllowed false
      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModuleReturnData(testContract.address, 1, "0x", 0)
      ).to.be.revertedWith("SendNotAllowed");
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
      const { modifier } = await txSetup();
      expect(
        modifier.setAllowedFunction(1, AddressOne, "0x12345678", true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("toggles allowed function false -> true -> false", async () => {
      const { modifier, testContract, owner, invoker } =
        await setupRolesWithOwnerAndInvoker();

      const ROLE_ID = 0;
      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("doNothing")
      );
      const EXEC_ARGS = [
        testContract.address,
        0,
        testContract.interface.encodeFunctionData("doNothing()"),
        0,
      ];

      const toggle = (allow: boolean) =>
        modifier
          .connect(owner)
          .setAllowedFunction(ROLE_ID, testContract.address, SELECTOR, allow);

      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_ID], [true]);

      // allow the function
      await toggle(true);

      // gmi
      await expect(
        modifier.connect(invoker).execTransactionFromModule(...EXEC_ARGS)
      ).to.emit(testContract, "DoNothing");

      // revoke the function
      await toggle(false);

      // ngmi again
      await expect(
        modifier.connect(invoker).execTransactionFromModule(...EXEC_ARGS)
      ).to.be.revertedWith("FunctionNotAllowed");
    });

    it("emits event with correct params", async () => {
      const { modifier, owner } = await setupRolesWithOwnerAndInvoker();

      await expect(
        modifier
          .connect(owner)
          .setAllowedFunction(1, AddressOne, "0x12345678", true)
      )
        .to.emit(modifier, "SetFunctionAllowedOnTargetAddress")
        .withArgs(1, AddressOne, "0x12345678", true);
    });
  });

  describe("setParameterAllowedValue()", () => {
    it("reverts if not authorized", async () => {
      const { modifier } = await txSetup();
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

    it("sets different allowed value parameters", async () => {
      const { modifier, testContract, owner, invoker } =
        await setupRolesWithOwnerAndInvoker();

      const ROLE_ID = 0;
      const COMP_TYPE_EQ = 0;
      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("fnWithTwoParams")
      );
      const EXEC_ARGS = (a: number, b: number) => [
        testContract.address,
        0,
        testContract.interface.encodeFunctionData(
          "fnWithTwoParams(uint256,uint256)",
          [a, b]
        ),
        0,
      ];

      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_ID], [true]);

      await modifier
        .connect(owner)
        .setTargetAddressScoped(ROLE_ID, testContract.address, true);

      await modifier
        .connect(owner)
        .setParametersScoped(
          ROLE_ID,
          testContract.address,
          SELECTOR,
          [false, true],
          [false, false],
          [COMP_TYPE_EQ, COMP_TYPE_EQ]
        );

      // should fail before setting an allowedValue -> compValue
      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModule(...EXEC_ARGS(10, 20))
      ).to.be.revertedWith("ParameterNotAllowed");

      await modifier
        .connect(owner)
        .setParameterAllowedValue(
          ROLE_ID,
          testContract.address,
          SELECTOR,
          1,
          ethers.utils.defaultAbiCoder.encode(["uint256"], [10]),
          true
        );

      // should fail because second param not allowed
      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModule(...EXEC_ARGS(20, 20))
      ).to.be.revertedWith("ParameterNotAllowed");

      // should succeed with allowed value
      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModule(...EXEC_ARGS(10, 10))
      ).to.not.be.reverted;
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
      const { modifier } = await txSetup();
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
          [true],
          [false],
          [0]
        );
      await avatar.exec(modifier.address, 0, paramScoped.data);
      expect(
        await modifier.getCompValue(1, AddressOne, "0x12345678", 0)
      ).to.be.equals(padToBytes32("0x"));
      expect(avatar.exec(modifier.address, 0, tx.data));
      expect(
        await modifier.getCompValue(1, AddressOne, "0x12345678", 0)
      ).to.be.equals(padToBytes32("0xabcd"));
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
          [true],
          [false],
          [0]
        );
      await avatar.exec(modifier.address, 0, paramScoped.data);
      expect(
        await modifier.getCompValue(1, AddressOne, "0x12345678", 0)
      ).to.be.equals(padToBytes32("0x"));
      expect(avatar.exec(modifier.address, 0, txTrue.data));
      expect(
        await modifier.getCompValue(1, AddressOne, "0x12345678", 0)
      ).to.be.equals(padToBytes32("0xabcd"));
      await expect(avatar.exec(modifier.address, 0, txFalse.data))
        .to.emit(modifier, "SetParameterCompValue")
        .withArgs(1, AddressOne, "0x12345678", 0, "0x");
      expect(
        await modifier.getCompValue(1, AddressOne, "0x12345678", 0)
      ).to.be.equals(padToBytes32("0x"));
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
      const { modifier, testContract, owner, invoker } =
        await setupRolesWithOwnerAndInvoker();

      const ROLE1 = 1;
      const ROLE2 = 2;

      // grant roles 1 and 2 to invoker
      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE1, ROLE2], [true, true]);

      // make ROLE2 the default for invoker
      await modifier.connect(owner).setDefaultRole(invoker.address, ROLE2);

      // allow all calls to testContract from ROLE1
      await modifier
        .connect(owner)
        .setTargetAddressAllowed(ROLE1, testContract.address, true);

      // expect it to fail
      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            0,
            testContract.interface.encodeFunctionData("doNothing()"),
            0
          )
      ).to.be.reverted;

      // make ROLE1 the default to invoker
      await modifier.connect(owner).setDefaultRole(invoker.address, ROLE1);

      // gmi
      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            0,
            testContract.interface.encodeFunctionData("doNothing()"),
            0
          )
      ).to.emit(testContract, "DoNothing");
    });

    it("emits event with correct params", async () => {
      const { modifier, owner, invoker } =
        await setupRolesWithOwnerAndInvoker();

      const ROLE_ID = 21;

      // grant roles 1 and 2 to invoker
      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_ID], [true]);

      await expect(
        modifier.connect(owner).setDefaultRole(invoker.address, ROLE_ID)
      )
        .to.emit(modifier, "SetDefaultRole")
        .withArgs(invoker.address, 21);
    });
  });

  describe("getCompType()", () => {
    it("returns 0 if not set", async () => {
      const { modifier } = await txSetup();
      const result = (
        await modifier.getCompValue(1, AddressOne, "0x12345678", 0)
      ).toString();
      await expect(result).to.be.equals(padToBytes32("0x"));
    });

    it("returns type if set", async () => {
      const { avatar, modifier } = await txSetup();
      const paramScoped =
        await modifier.populateTransaction.setParametersScoped(
          1,
          AddressOne,
          "0x12345678",
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
      const { modifier } = await txSetup();
      const result = (
        await modifier.getCompValue(1, AddressOne, "0x12345678", 0)
      ).toString();
      await expect(result).to.be.equals(padToBytes32("0x"));
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
      await expect(resultFalse).to.be.equals(padToBytes32("0x"));
      await expect(await avatar.exec(modifier.address, 0, tx.data));
      const resultTrue = (
        await modifier.getCompValue(1, AddressOne, "0x12345678", 0)
      ).toString();
      await expect(resultTrue).to.be.equals(padToBytes32("0x1234"));
    });
  });
});

function padToBytes32(s: string) {
  return s.padEnd(66, "0");
}
