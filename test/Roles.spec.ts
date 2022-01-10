import { expect } from "chai";
import hre, { deployments, waffle, ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers";
import { buildContractCall, buildMultiSendSafeTx } from "./utils";
import { AddressOne } from "@gnosis.pm/safe-contracts";

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
    const encodedParam_2 = ethers.utils.defaultAbiCoder.encode(
      ["uint256"],
      [99]
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
      encodedParam_1,
      encodedParam_2,
      encodedParam_3,
      encodedParam_4,
      encodedParam_5,
      encodedParam_6,
      encodedParam_7,
      encodedParam_8,
      encodedParam_9,
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
    it("should throw on length mismatch", async () => {
      const { modifier, owner } = await setupRolesWithOwnerAndInvoker();
      await expect(
        modifier.connect(owner).assignRoles(user1.address, [1, 2], [true])
      ).to.be.revertedWith("ArraysDifferentLength()");
    });
    it("reverts if not authorized", async () => {
      const { modifier } = await txSetup();
      await expect(
        modifier.assignRoles(user1.address, [1], [true])
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("assigns roles to a module", async () => {
      const ROLE_ID = 0;

      const { modifier, testContract, owner, invoker } =
        await setupRolesWithOwnerAndInvoker();

      // blank allow all calls to testContract from role 0
      await modifier
        .connect(owner)
        .allowTarget(ROLE_ID, testContract.address, false, false);

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
    });

    it("revokes roles to a module", async () => {
      const { modifier, testContract, owner, invoker } =
        await setupRolesWithOwnerAndInvoker();

      const ROLE_ID = 0;

      // blank allow all calls to testContract from role 0
      await modifier
        .connect(owner)
        .allowTarget(ROLE_ID, testContract.address, false, false);

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
    it("reverts if data is set and is not at least 4 bytes", async () => {
      const { modifier, testContract, owner, invoker } =
        await setupRolesWithOwnerAndInvoker();

      const ROLE_ID = 0;

      await modifier.assignRoles(invoker.address, [ROLE_ID], [true]);

      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModule(testContract.address, 0, "0xab", 0)
      ).to.be.revertedWith("FunctionSignatureTooShort()");
    });
    it("reverts if called from module not assigned any role", async () => {
      const { modifier, testContract, owner } =
        await setupRolesWithOwnerAndInvoker();

      const ROLE_ID = 0;

      await modifier
        .connect(owner)
        .allowTarget(ROLE_ID, testContract.address, false, false);

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

      const allowTargetAddress = await modifier.populateTransaction.allowTarget(
        1,
        testContract.address,
        false,
        false
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

      const allowTargetAddress = await modifier.populateTransaction.allowTarget(
        1,
        testContract.address,
        false,
        false
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
      const { avatar, modifier, testContract, encodedParam_1, encodedParam_2 } =
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
        await modifier.populateTransaction.allowTargetPartially(
          1,
          testContract.address,
          false,
          false
        );
      await avatar.exec(modifier.address, 0, functionScoped.data);

      const paramScoped = await modifier.populateTransaction.scopeFunction(
        1,
        testContract.address,
        "0x40c10f19",
        [true, true],
        [false, false],
        [0, 0],
        [encodedParam_1, encodedParam_2]
      );
      await avatar.exec(modifier.address, 0, paramScoped.data);

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

      const { avatar, modifier, testContract, encodedParam_1, encodedParam_2 } =
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
        await modifier.populateTransaction.allowTargetPartially(
          1,
          testContract.address,
          false,
          false
        );
      await avatar.exec(modifier.address, 0, functionScoped.data);

      const paramScoped = await modifier.populateTransaction.scopeFunction(
        1,
        testContract.address,
        "0x40c10f19",
        [true, true],
        [false, false],
        [0, 0],
        [encodedParam_1, encodedParam_2]
      );
      await avatar.exec(modifier.address, 0, paramScoped.data);

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
        encodedParam_3,
        encodedParam_4,
        encodedParam_5,
        encodedParam_6,
        encodedParam_7,
        encodedParam_8,
        encodedParam_9,
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
        await modifier.populateTransaction.allowTargetPartially(
          1,
          testContract.address,
          false,
          false
        );
      await avatar.exec(modifier.address, 0, functionScoped.data);

      const paramScoped = await modifier.populateTransaction.scopeFunction(
        1,
        testContract.address,
        "0x273454bf",
        [true, true, true, true, true, true, true],
        [true, false, true, false, false, true, true],
        [0, 0, 0, 0, 0, 0, 0],
        [
          encodedParam_3,
          encodedParam_4,
          encodedParam_5,
          encodedParam_6,
          encodedParam_7,
          encodedParam_8,
          encodedParam_9,
        ]
      );
      await avatar.exec(modifier.address, 0, paramScoped.data);

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
        encodedParam_3,
        encodedParam_4,
        encodedParam_5,
        encodedParam_6,
        encodedParam_7,
        encodedParam_8,
        encodedParam_9,
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
        await modifier.populateTransaction.allowTargetPartially(
          1,
          testContract.address,
          false,
          false
        );
      await avatar.exec(modifier.address, 0, functionScoped.data);

      const paramScoped = await modifier.populateTransaction.scopeFunction(
        1,
        testContract.address,
        "0x273454bf",
        [true, true, true, true, true, true, true],
        [true, false, true, false, false, true, true],
        [0, 0, 0, 0, 0, 0, 0],
        [
          encodedParam_3,
          encodedParam_4,
          encodedParam_5,
          encodedParam_6,
          encodedParam_7,
          encodedParam_8,
          encodedParam_9,
        ]
      );
      await avatar.exec(modifier.address, 0, paramScoped.data);

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
        encodedParam_1,
        encodedParam_2,
        encodedParam_3,
        encodedParam_4,
        encodedParam_5,
        encodedParam_6,
        encodedParam_7,
        encodedParam_8,
        encodedParam_9,
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

      const allowTargetPartially =
        await modifier.populateTransaction.allowTargetPartially(
          1,
          testContract.address,
          false,
          false
        );
      await avatar.exec(modifier.address, 0, allowTargetPartially.data);

      const paramScoped = await modifier.populateTransaction.scopeFunction(
        1,
        testContract.address,
        "0x40c10f19",
        [true, true],
        [false, false],
        [0, 0],
        [encodedParam_1, encodedParam_2]
      );
      await avatar.exec(modifier.address, 0, paramScoped.data);

      const paramScoped_2 = await modifier.populateTransaction.scopeFunction(
        1,
        testContract.address,
        "0x273454bf",
        [true, true, true, true, true, true, true],
        [true, false, true, false, false, true, true],
        [0, 0, 0, 0, 0, 0, 0],
        [
          encodedParam_3,
          encodedParam_4,
          encodedParam_5,
          encodedParam_6,
          encodedParam_7,
          encodedParam_8,
          encodedParam_9,
        ]
      );
      await avatar.exec(modifier.address, 0, paramScoped_2.data);

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
        encodedParam_1,
        encodedParam_2,
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
        await modifier.populateTransaction.allowTargetPartially(
          1,
          testContract.address,
          false,
          false
        );
      await avatar.exec(modifier.address, 0, functionScoped.data);

      const paramScoped = await modifier.populateTransaction.scopeFunction(
        1,
        testContract.address,
        "0x40c10f19",
        [true, true],
        [false, false],
        [0, 0],
        [encodedParam_1, encodedParam_2]
      );
      await avatar.exec(modifier.address, 0, paramScoped.data);

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
        encodedParam_1,
        encodedParam_2,
        encodedParam_3,
        encodedParam_4,
        encodedParam_5,
        encodedParam_6,
        encodedParam_7,
        encodedParam_8,
        encodedParam_9,
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

      const allowTargetPartially =
        await modifier.populateTransaction.allowTargetPartially(
          1,
          testContract.address,
          false,
          false
        );
      await avatar.exec(modifier.address, 0, allowTargetPartially.data);

      const paramScoped = await modifier.populateTransaction.scopeFunction(
        1,
        testContract.address,
        "0x40c10f19",
        [true, true],
        [false, false],
        [0, 0],
        [encodedParam_1, encodedParam_2]
      );
      await avatar.exec(modifier.address, 0, paramScoped.data);

      const paramScoped_2 = await modifier.populateTransaction.scopeFunction(
        1,
        testContract.address,
        "0x273454bf",
        [true, true, true, true, true, true, true],
        [true, false, true, false, false, true, true],
        [0, 0, 0, 0, 0, 0, 0],
        [
          encodedParam_3,
          encodedParam_4,
          encodedParam_5,
          encodedParam_6,
          encodedParam_7,
          encodedParam_8,
          encodedParam_9,
        ]
      );
      await avatar.exec(modifier.address, 0, paramScoped_2.data);

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
      const { avatar, modifier, testContract, encodedParam_1 } =
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

      const allowTargetPartially =
        await modifier.populateTransaction.allowTargetPartially(
          1,
          testContract.address,
          false,
          false
        );
      await avatar.exec(modifier.address, 0, allowTargetPartially.data);

      const encodedParam_2 = ethers.utils.defaultAbiCoder.encode(
        ["uint256"],
        [99]
      );

      const paramScoped = await modifier.populateTransaction.scopeFunction(
        1,
        testContract.address,
        "0x40c10f19",
        [true, true],
        [false, false],
        [0, 1],
        [encodedParam_1, encodedParam_2] // set param 2 to greater than
      );
      await avatar.exec(modifier.address, 0, paramScoped.data);

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
      const { avatar, modifier, testContract, encodedParam_1 } =
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
        await modifier.populateTransaction.allowTargetPartially(
          1,
          testContract.address,
          false,
          false
        );
      await avatar.exec(modifier.address, 0, functionScoped.data);

      const encodedParam_2 = ethers.utils.defaultAbiCoder.encode(
        ["uint256"],
        [99]
      );

      const paramScoped = await modifier.populateTransaction.scopeFunction(
        1,
        testContract.address,
        "0x40c10f19",
        [true, true],
        [false, false],
        [0, 1],
        [encodedParam_1, encodedParam_2] // set param 2 to greater than
      );
      await avatar.exec(modifier.address, 0, paramScoped.data);

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
      const { avatar, modifier, testContract, encodedParam_1 } =
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
        await modifier.populateTransaction.allowTargetPartially(
          1,
          testContract.address,
          false,
          false
        );
      await avatar.exec(modifier.address, 0, functionScoped.data);

      const encodedParam_2 = ethers.utils.defaultAbiCoder.encode(
        ["uint256"],
        [99]
      );

      const paramScoped = await modifier.populateTransaction.scopeFunction(
        1,
        testContract.address,
        "0x40c10f19",
        [true, true],
        [false, false],
        [0, 2],
        [encodedParam_1, encodedParam_2] // set param 2 to less than
      );
      await avatar.exec(modifier.address, 0, paramScoped.data);

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
      const { avatar, modifier, testContract, encodedParam_1 } =
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
        await modifier.populateTransaction.allowTargetPartially(
          1,
          testContract.address,
          false,
          false
        );
      await avatar.exec(modifier.address, 0, functionScoped.data);

      const encodedParam_2 = ethers.utils.defaultAbiCoder.encode(
        ["uint256"],
        [99]
      );

      const paramScoped = await modifier.populateTransaction.scopeFunction(
        1,
        testContract.address,
        "0x40c10f19",
        [true, true],
        [false, false],
        [0, 2],
        [encodedParam_1, encodedParam_2] // set param 2 to less than
      );
      await avatar.exec(modifier.address, 0, paramScoped.data);

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

    it.skip("reverts if inner tx reverted", async () => {
      const { modifier, testContract, owner, invoker } =
        await setupRolesWithOwnerAndInvoker();

      const ROLE_ID = 0;
      const fnThatReverts =
        await testContract.populateTransaction.fnThatReverts();

      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_ID], [true]);

      await modifier
        .connect(owner)
        .allowTarget(ROLE_ID, testContract.address, false, false);

      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            0,
            fnThatReverts.data,
            0
          )
      ).to.be.revertedWith("ModuleTransactionFailed()");
    });
  });

  describe("execTransactionFromModuleReturnData()", () => {
    it("reverts if called from module not assigned any role", async () => {
      const { avatar, modifier, testContract } = await txSetup();

      const allowTargetAddress = await modifier.populateTransaction.allowTarget(
        1,
        testContract.address,
        false,
        false
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

      const allowTargetAddress = await modifier.populateTransaction.allowTarget(
        1,
        testContract.address,
        false,
        false
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

      const allowTargetAddress = await modifier.populateTransaction.allowTarget(
        1,
        testContract.address,
        false,
        false
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
  describe("execTransactionWithRoleReturnData()", () => {
    it("reverts if called from module not assigned any role", async () => {
      const { modifier, testContract, owner, invoker } =
        await setupRolesWithOwnerAndInvoker();

      const mint = await testContract.populateTransaction.mint(
        user1.address,
        99
      );

      await expect(
        modifier
          .connect(invoker)
          .execTransactionWithRoleReturnData(
            testContract.address,
            0,
            mint.data,
            0,
            1
          )
      ).to.be.revertedWith("NoMembership()");
    });

    it("executes a call with multisend tx", async () => {
      const {
        avatar,
        modifier,
        testContract,
        encodedParam_1,
        encodedParam_2,
        encodedParam_3,
        encodedParam_4,
        encodedParam_5,
        encodedParam_6,
        encodedParam_7,
        encodedParam_8,
        encodedParam_9,
        tx_1,
        tx_2,
        tx_3,
      } = await txSetup();
      const MultiSend = await hre.ethers.getContractFactory("MultiSend");
      const multisend = await MultiSend.deploy();

      const ROLE_ID = 1;

      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [ROLE_ID],
        [true]
      );
      await avatar.exec(modifier.address, 0, assign.data);

      const multiSendTarget = await modifier.populateTransaction.setMultiSend(
        multisend.address
      );
      await avatar.exec(modifier.address, 0, multiSendTarget.data);

      const allowTargetPartially =
        await modifier.populateTransaction.allowTargetPartially(
          1,
          testContract.address,
          false,
          false
        );
      await avatar.exec(modifier.address, 0, allowTargetPartially.data);

      const paramScoped = await modifier.populateTransaction.scopeFunction(
        ROLE_ID,
        testContract.address,
        "0x40c10f19",
        [true, true],
        [false, false],
        [0, 0],
        [encodedParam_1, encodedParam_2]
      );
      await avatar.exec(modifier.address, 0, paramScoped.data);

      const paramScoped_2 = await modifier.populateTransaction.scopeFunction(
        ROLE_ID,
        testContract.address,
        "0x273454bf",
        [true, true, true, true, true, true, true],
        [true, false, true, false, false, true, true],
        [0, 0, 0, 0, 0, 0, 0],
        [
          encodedParam_3,
          encodedParam_4,
          encodedParam_5,
          encodedParam_6,
          encodedParam_7,
          encodedParam_8,
          encodedParam_9,
        ]
      );
      await avatar.exec(modifier.address, 0, paramScoped_2.data);

      const multiTx = buildMultiSendSafeTx(
        multisend,
        [tx_1, tx_2, tx_3, tx_1, tx_2, tx_3],
        0
      );

      await expect(
        modifier.execTransactionWithRoleReturnData(
          multisend.address,
          0,
          multiTx.data,
          1,
          ROLE_ID
        )
      ).to.emit(testContract, "TestDynamic");
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
      await avatar.exec(modifier.address, 0, tx.data);
      expect(await modifier.multiSend()).to.be.equals(AddressOne);
    });

    it("emits event with correct params", async () => {
      const { avatar, modifier } = await txSetup();
      const tx = await modifier.populateTransaction.setMultiSend(AddressOne);
      await expect(avatar.exec(modifier.address, 0, tx.data))
        .to.emit(modifier, "SetMulitSendAddress")
        .withArgs(AddressOne);
    });
  });

  describe("allowTarget()", () => {
    it("reverts if not authorized", async () => {
      const { modifier } = await txSetup();
      await expect(
        modifier.allowTarget(1, AddressOne, false, false)
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
          .allowTarget(ROLE_ID, testContract.address, false, false)
      )
        .to.emit(modifier, "AllowTarget")
        .withArgs(ROLE_ID, testContract.address, false, false);

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
          .allowTarget(ROLE_ID, testContract.address, false, false)
      );

      // this call should work
      await expect(
        modifier.connect(invoker).execTransactionWithRole(...execWithRoleArgs)
      ).to.emit(testContract, "DoNothing");

      // Revoke access
      await expect(
        modifier.connect(owner).revokeTarget(ROLE_ID, testContract.address)
      )
        .to.emit(modifier, "RevokeTarget")
        .withArgs(ROLE_ID, testContract.address);

      // fails after revoke
      await expect(
        modifier.connect(invoker).execTransactionWithRole(...execWithRoleArgs)
      ).to.be.revertedWith("TargetAddressNotAllowed()");
    });

    it("emits event with correct params", async () => {
      const { avatar, modifier } = await txSetup();
      const tx = await modifier.populateTransaction.allowTarget(
        1,
        AddressOne,
        false,
        false
      );
      await expect(avatar.exec(modifier.address, 0, tx.data))
        .to.emit(modifier, "AllowTarget")
        .withArgs(1, AddressOne, false, false);
    });
  });

  describe("allowTarget() canDelegate", () => {
    it("reverts if not authorized", async () => {
      const { modifier } = await txSetup();
      await expect(
        modifier.allowTarget(1, AddressOne, false, true)
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
        .allowTarget(ROLE_ID, testContract.address, false, false);

      // still getting the delegateCallNotAllowed error
      await expect(
        modifier.connect(invoker).execTransactionFromModule(...execArgs)
      ).to.be.revertedWith("DelegateCallNotAllowed()");

      // allow delegate calls to address
      await modifier
        .connect(owner)
        .allowTarget(ROLE_ID, testContract.address, false, true);

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

      await modifier
        .connect(owner)
        .allowTarget(ROLE_ID, testContract.address, false, true);

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
        .allowTarget(ROLE_ID, testContract.address, false, false);

      // still getting the delegateCallNotAllowed error
      await expect(
        modifier.connect(invoker).execTransactionFromModule(...execArgs)
      ).to.be.revertedWith("DelegateCallNotAllowed()");
    });

    it("emits event with correct params", async () => {
      const { avatar, modifier } = await txSetup();
      const tx = await modifier.populateTransaction.allowTarget(
        1,
        AddressOne,
        false,
        true
      );
      await expect(avatar.exec(modifier.address, 0, tx.data))
        .to.emit(modifier, "AllowTarget")
        .withArgs(1, AddressOne, false, true);
    });
  });

  describe("scopeFunction()", () => {
    it("reverts if not authorized", async () => {
      const { modifier } = await txSetup();
      await expect(
        modifier.scopeFunction(
          1,
          AddressOne,
          "0x12345678",
          [true, true],
          [true, true],
          [1, 1],
          ["0x", "0x"]
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
        .allowTarget(ROLE_ID, testContract.address, false, false);

      // works before making function parameter scoped
      await expect(
        modifier.connect(invoker).execTransactionFromModule(...EXEC_ARGS(1))
      ).to.not.be.reverted;

      await modifier
        .connect(owner)
        .allowTargetPartially(ROLE_ID, testContract.address, false, false);

      await modifier
        .connect(owner)
        .scopeFunction(
          ROLE_ID,
          testContract.address,
          SELECTOR,
          [true],
          [false],
          [COMP_TYPE_EQ],
          [ethers.utils.defaultAbiCoder.encode(["uint256"], [2])]
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

    it("emits event with correct params", async () => {
      const { avatar, modifier } = await txSetup();

      const tx = await modifier.populateTransaction.scopeFunction(
        1,
        AddressOne,
        "0x12345678",
        [true, true],
        [false, false],
        [1, 1],
        [
          ethers.utils.defaultAbiCoder.encode(["uint256"], [0]),
          ethers.utils.defaultAbiCoder.encode(["uint256"], [0]),
        ]
      );

      await expect(await avatar.exec(modifier.address, 0, tx.data))
        .to.emit(modifier, "ScopeFunction")
        .withArgs(
          1,
          AddressOne,
          "0x12345678",
          [true, true],
          [false, false],
          [1, 1],
          [
            ethers.utils.defaultAbiCoder.encode(["uint256"], [0]),
            ethers.utils.defaultAbiCoder.encode(["uint256"], [0]),
          ]
        );
    });
  });

  describe("allowTarget - canSend", () => {
    it("reverts if not authorized", async () => {
      const { modifier } = await txSetup();
      await expect(
        modifier.allowTarget(1, AddressOne, true, false)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("sets send allowed to true", async () => {
      const { modifier, testContract, owner, invoker } =
        await setupRolesWithOwnerAndInvoker();

      const ROLE_ID = 0;

      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_ID], [true]);

      await modifier
        .connect(owner)
        .allowTarget(ROLE_ID, testContract.address, false, false);

      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModuleReturnData(testContract.address, 1, "0x", 0)
      ).to.be.revertedWith("SendNotAllowed");

      await modifier
        .connect(owner)
        .allowTarget(ROLE_ID, testContract.address, true, false);

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
      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_ID], [true]);

      await modifier
        .connect(owner)
        .allowTarget(ROLE_ID, testContract.address, true, false);

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
        .allowTarget(ROLE_ID, testContract.address, false, false);

      // should work with sendAllowed false
      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModuleReturnData(testContract.address, 1, "0x", 0)
      ).to.be.revertedWith("SendNotAllowed");
    });

    it("emits event with correct params", async () => {
      const { avatar, modifier } = await txSetup();
      const tx = await modifier.populateTransaction.allowTarget(
        1,
        AddressOne,
        true,
        false
      );
      await expect(await avatar.exec(modifier.address, 0, tx.data))
        .to.emit(modifier, "AllowTarget")
        .withArgs(1, AddressOne, true, false);
    });
  });

  describe("scopeAllowFunction()", () => {
    it("reverts if not authorized", async () => {
      const { modifier } = await txSetup();
      await expect(
        modifier.scopeAllowFunction(1, AddressOne, "0x12345678")
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

      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_ID], [true]);

      await modifier
        .connect(owner)
        .allowTargetPartially(ROLE_ID, testContract.address, false, false);

      // allow the function
      await modifier
        .connect(owner)
        .scopeAllowFunction(ROLE_ID, testContract.address, SELECTOR);

      // gmi
      await expect(
        modifier.connect(invoker).execTransactionFromModule(...EXEC_ARGS)
      ).to.emit(testContract, "DoNothing");

      // revoke the function
      await modifier
        .connect(owner)
        .scopeRevokeFunction(ROLE_ID, testContract.address, SELECTOR);

      // ngmi again
      await expect(
        modifier.connect(invoker).execTransactionFromModule(...EXEC_ARGS)
      ).to.be.revertedWith("FunctionNotAllowed");
    });

    it("emits event with correct params", async () => {
      const { modifier, owner } = await setupRolesWithOwnerAndInvoker();

      await expect(
        modifier.connect(owner).scopeAllowFunction(1, AddressOne, "0x12345678")
      )
        .to.emit(modifier, "ScopeAllowFunction")
        .withArgs(1, AddressOne, "0x12345678");
    });
  });

  describe("setDefaultRole()", () => {
    it("reverts if not authorized", async () => {
      const { avatar, modifier } = await txSetup();
      await expect(modifier.setDefaultRole(AddressOne, 1)).to.be.revertedWith(
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
        .allowTarget(ROLE1, testContract.address, false, false);

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
});
