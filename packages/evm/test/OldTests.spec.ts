import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import {
  ParameterType,
  ExecutionOptions,
  Operator,
  deployRolesMod,
  PermissionCheckerStatus,
  BYTES32_ZERO,
  encodeMultisendPayload,
} from "./utils";
import { defaultAbiCoder } from "ethers/lib/utils";

const ROLE_KEY =
  "0x000000000000000000000000000000000000000000000000000000000000000f";
const ROLE_KEY1 =
  "0x0000000000000000000000000000000000000000000000000000000000000001";

describe("OldTests", async () => {
  async function setupTestWithTestAvatar() {
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();
    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();

    const modifier = await deployRolesMod(
      hre,
      avatar.address,
      avatar.address,
      avatar.address
    );

    return { avatar, testContract, modifier };
  }

  async function setupRolesWithOwnerAndInvoker() {
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();
    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();

    const [owner, invoker] = await hre.ethers.getSigners();
    const modifier = await deployRolesMod(
      hre,
      owner.address,
      avatar.address,
      avatar.address
    );

    await modifier.enableModule(invoker.address);

    return {
      modifier,
      avatar,
      testContract,
      owner,
      invoker,
    };
  }

  async function txSetup() {
    const { avatar, modifier, testContract } = await setupTestWithTestAvatar();

    const MultiSend = await hre.ethers.getContractFactory("MultiSend");
    const multisend = await MultiSend.deploy();

    const MultiSendUnwrapper = await hre.ethers.getContractFactory(
      "MultiSendUnwrapper"
    );
    const adapter = await MultiSendUnwrapper.deploy();

    await avatar.exec(
      modifier.address,
      0,
      (
        await modifier.populateTransaction.setTransactionUnwrapper(
          multisend.address,
          "0x8d80ff0a",
          adapter.address
        )
      ).data as string,
      0
    );

    const [user1] = await hre.ethers.getSigners();
    const encodedParam_1 = ethers.utils.defaultAbiCoder.encode(
      ["address"],
      [user1.address]
    );
    const encodedParam_2 = ethers.utils.defaultAbiCoder.encode(
      ["uint256"],
      [99]
    );
    const encodedParam_3 = defaultAbiCoder.encode(
      ["string"],
      ["This is a dynamic array"]
    );
    const encodedParam_4 = ethers.utils.defaultAbiCoder.encode(
      ["uint256"],
      [4]
    );
    const encodedParam_5 = defaultAbiCoder.encode(["string"], ["Test"]);
    const encodedParam_6 = ethers.utils.defaultAbiCoder.encode(
      ["bool"],
      [true]
    );
    const encodedParam_7 = ethers.utils.defaultAbiCoder.encode(["uint8"], [3]);
    const encodedParam_8 = defaultAbiCoder.encode(["string"], ["weeeeeeee"]);
    const encodedParam_9 = defaultAbiCoder.encode(
      ["string"],
      [
        "This is an input that is larger than 32 bytes and must be scanned for correctness",
      ]
    );
    const tx_1 = {
      to: testContract.address,
      value: 0,
      data: (await testContract.populateTransaction.mint(user1.address, 99))
        .data as string,
      operation: 0,
    };

    const tx_3 = {
      to: testContract.address,
      value: 0,
      data: (
        await testContract.populateTransaction.testDynamic(
          "This is a dynamic array",
          4,
          "Test",
          true,
          3,
          "weeeeeeee",
          "This is an input that is larger than 32 bytes and must be scanned for correctness"
        )
      ).data as string,
      operation: 0,
    };

    const conditionTree = [
      {
        parent: 0,
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        compValue: "0x",
      },
      {
        parent: 0,
        paramType: ParameterType.Dynamic,
        operator: Operator.EqualTo,
        compValue: encodedParam_3,
      },
      {
        parent: 0,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: encodedParam_4,
      },
      {
        parent: 0,
        paramType: ParameterType.Dynamic,
        operator: Operator.EqualTo,
        compValue: encodedParam_5,
      },
      {
        parent: 0,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: encodedParam_6,
      },
      {
        parent: 0,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: encodedParam_7,
      },
      {
        parent: 0,
        paramType: ParameterType.Dynamic,
        operator: Operator.EqualTo,
        compValue: encodedParam_8,
      },
      {
        parent: 0,
        paramType: ParameterType.Dynamic,
        operator: Operator.EqualTo,
        compValue: encodedParam_9,
      },
    ];

    return {
      avatar,
      multisend,
      testContract,
      modifier,
      encodedParam_1,
      encodedParam_2,
      encodedParam_3,
      encodedParam_4,
      encodedParam_5,
      encodedParam_6,
      encodedParam_7,
      encodedParam_8,
      encodedParam_9,
      conditionTree,
      tx_1,
      tx_3,
    };
  }

  describe("execTransactionFromModule()", () => {
    it("reverts if data is set and is not at least 4 bytes", async () => {
      const { modifier, testContract, invoker } = await loadFixture(
        setupRolesWithOwnerAndInvoker
      );

      await modifier.assignRoles(invoker.address, [ROLE_KEY], [true]);
      await modifier.setDefaultRole(invoker.address, ROLE_KEY);

      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModule(testContract.address, 0, "0xab", 0)
      ).to.be.revertedWithCustomError(modifier, "FunctionSignatureTooShort");
    });

    it("reverts if called from module not assigned any role", async () => {
      const { modifier, testContract, owner } = await loadFixture(
        setupRolesWithOwnerAndInvoker
      );

      const [user1] = await hre.ethers.getSigners();

      await modifier
        .connect(owner)
        .allowTarget(ROLE_KEY, testContract.address, ExecutionOptions.None);

      const mint = await testContract.populateTransaction.mint(
        user1.address,
        99
      );

      await expect(
        modifier.execTransactionFromModule(
          testContract.address,
          0,
          mint.data as string,
          0
        )
      )
        .to.be.revertedWithCustomError(modifier, `NotAuthorized`)
        .withArgs(user1.address);
    });

    it("reverts if the call is not an allowed target", async () => {
      const { avatar, modifier, testContract } = await loadFixture(txSetup);
      const [user1] = await hre.ethers.getSigners();
      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [ROLE_KEY1],
        [true]
      );
      await avatar.exec(modifier.address, 0, assign.data || "", 0);

      const allowTargetAddress = await modifier.populateTransaction.allowTarget(
        ROLE_KEY1,
        testContract.address,
        ExecutionOptions.None
      );
      await avatar.exec(modifier.address, 0, allowTargetAddress.data || "", 0);

      const defaultRole = await modifier.populateTransaction.setDefaultRole(
        user1.address,
        ROLE_KEY1
      );
      await avatar.exec(modifier.address, 0, defaultRole.data || "", 0);

      const mint = await testContract.populateTransaction.mint(
        user1.address,
        99
      );

      const someOtherAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
      await expect(
        modifier.execTransactionFromModule(
          someOtherAddress,
          0,
          mint.data || "",
          0
        )
      )
        .to.be.revertedWithCustomError(modifier, "ConditionViolation")
        .withArgs(
          PermissionCheckerStatus.TargetAddressNotAllowed,
          BYTES32_ZERO
        );
    });

    it("executes a call to an allowed target", async () => {
      const { avatar, modifier, testContract } = await loadFixture(txSetup);
      const [user1] = await hre.ethers.getSigners();
      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [ROLE_KEY1],
        [true]
      );
      await avatar.exec(modifier.address, 0, assign.data || "", 0);

      const allowTargetAddress = await modifier.populateTransaction.allowTarget(
        ROLE_KEY1,
        testContract.address,
        ExecutionOptions.None
      );
      await avatar.exec(modifier.address, 0, allowTargetAddress.data || "", 0);

      const defaultRole = await modifier.populateTransaction.setDefaultRole(
        user1.address,
        ROLE_KEY1
      );

      await avatar.exec(modifier.address, 0, defaultRole.data || "", 0);

      const mint = await testContract.populateTransaction.mint(
        user1.address,
        99
      );

      await expect(
        modifier.execTransactionFromModule(
          testContract.address,
          0,
          mint.data || "",
          0
        )
      ).to.emit(testContract, "Mint");
    });

    it("reverts if value parameter is not allowed", async () => {
      const { avatar, modifier, testContract, encodedParam_1, encodedParam_2 } =
        await loadFixture(txSetup);
      const [user1] = await hre.ethers.getSigners();
      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [ROLE_KEY1],
        [true]
      );
      await avatar.exec(modifier.address, 0, assign.data || "", 0);

      const defaultRole = await modifier.populateTransaction.setDefaultRole(
        user1.address,
        ROLE_KEY1
      );
      await avatar.exec(modifier.address, 0, defaultRole.data || "", 0);

      const functionScoped = await modifier.populateTransaction.scopeTarget(
        ROLE_KEY1,
        testContract.address
      );
      await avatar.exec(modifier.address, 0, functionScoped.data || "", 0);

      const paramScoped = await modifier.populateTransaction.scopeFunction(
        ROLE_KEY1,
        testContract.address,
        testContract.interface.getSighash(
          testContract.interface.getFunction("mint")
        ),
        [
          {
            parent: 0,
            paramType: ParameterType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: encodedParam_1,
          },
          {
            parent: 0,
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: encodedParam_2,
          },
        ],
        ExecutionOptions.None
      );
      await avatar.exec(modifier.address, 0, paramScoped.data || "", 0);

      const mint = await testContract.populateTransaction.mint(
        user1.address,
        98
      );

      await expect(
        modifier.execTransactionFromModule(
          testContract.address,
          0,
          mint.data || "",
          0
        )
      )
        .to.be.revertedWithCustomError(modifier, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
    });

    it("executes a call with allowed value parameter", async () => {
      const [user1] = await hre.ethers.getSigners();

      const { avatar, modifier, testContract, encodedParam_1, encodedParam_2 } =
        await loadFixture(txSetup);
      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [ROLE_KEY1],
        [true]
      );
      await avatar.exec(modifier.address, 0, assign.data || "", 0);

      const defaultRole = await modifier.populateTransaction.setDefaultRole(
        user1.address,
        ROLE_KEY1
      );
      await avatar.exec(modifier.address, 0, defaultRole.data || "", 0);

      const functionScoped = await modifier.populateTransaction.scopeTarget(
        ROLE_KEY1,
        testContract.address
      );
      await avatar.exec(modifier.address, 0, functionScoped.data || "", 0);

      const paramScoped = await modifier.populateTransaction.scopeFunction(
        ROLE_KEY1,
        testContract.address,
        testContract.interface.getSighash(
          testContract.interface.getFunction("mint")
        ),
        [
          {
            parent: 0,
            paramType: ParameterType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: encodedParam_1,
          },
          {
            parent: 0,
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: encodedParam_2,
          },
        ],
        ExecutionOptions.None
      );
      await avatar.exec(modifier.address, 0, paramScoped.data || "", 0);

      const mint = await testContract.populateTransaction.mint(
        user1.address,
        99
      );

      await expect(
        modifier.execTransactionFromModule(
          testContract.address,
          0,
          mint.data || "",
          0
        )
      ).to.emit(testContract, "Mint");
    });

    it("reverts dynamic parameter is not allowed", async () => {
      const { avatar, modifier, testContract, conditionTree } =
        await loadFixture(txSetup);
      const [user1] = await hre.ethers.getSigners();
      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [ROLE_KEY1],
        [true]
      );

      await avatar.exec(modifier.address, 0, assign.data || "", 0);

      const defaultRole = await modifier.populateTransaction.setDefaultRole(
        user1.address,
        ROLE_KEY1
      );
      await avatar.exec(modifier.address, 0, defaultRole.data || "", 0);

      const functionScoped = await modifier.populateTransaction.scopeTarget(
        ROLE_KEY1,
        testContract.address
      );
      await avatar.exec(modifier.address, 0, functionScoped.data || "", 0);

      const paramScoped = await modifier.populateTransaction.scopeFunction(
        ROLE_KEY1,
        testContract.address,
        testContract.interface.getSighash(
          testContract.interface.getFunction("testDynamic")
        ),
        conditionTree,
        ExecutionOptions.None
      );
      await avatar.exec(modifier.address, 0, paramScoped.data || "", 0);

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
          dynamic.data || "",
          0
        )
      )
        .to.be.revertedWithCustomError(modifier, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
    });

    it("executes a call with allowed dynamic parameter", async () => {
      const { avatar, modifier, testContract, conditionTree } =
        await loadFixture(txSetup);
      const [user1] = await hre.ethers.getSigners();
      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [ROLE_KEY1],
        [true]
      );

      await avatar.exec(modifier.address, 0, assign.data || "", 0);

      const defaultRole = await modifier.populateTransaction.setDefaultRole(
        user1.address,
        ROLE_KEY1
      );
      await avatar.exec(modifier.address, 0, defaultRole.data || "", 0);

      const functionScoped = await modifier.populateTransaction.scopeTarget(
        ROLE_KEY1,
        testContract.address
      );
      await avatar.exec(modifier.address, 0, functionScoped.data || "", 0);

      const paramScoped = await modifier.populateTransaction.scopeFunction(
        ROLE_KEY1,
        testContract.address,
        "0x273454bf",
        conditionTree,
        ExecutionOptions.None
      );

      await avatar.exec(modifier.address, 0, paramScoped.data || "", 0);

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
          dynamic.data || "",
          0
        )
      ).to.emit(testContract, "TestDynamic");
    });

    it("reverts a call with multisend tx", async () => {
      const {
        avatar,
        modifier,
        testContract,
        multisend,
        encodedParam_1,
        encodedParam_2,
        conditionTree,
        tx_1,
        tx_3,
      } = await loadFixture(txSetup);
      const [user1] = await hre.ethers.getSigners();

      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [ROLE_KEY1],
        [true]
      );
      await avatar.exec(modifier.address, 0, assign.data || "", 0);

      const defaultRole = await modifier.populateTransaction.setDefaultRole(
        user1.address,
        ROLE_KEY1
      );
      await avatar.exec(modifier.address, 0, defaultRole.data || "", 0);

      const scopeTarget = await modifier.populateTransaction.scopeTarget(
        ROLE_KEY1,
        testContract.address
      );
      await avatar.exec(modifier.address, 0, scopeTarget.data || "", 0);

      const paramScoped = await modifier.populateTransaction.scopeFunction(
        ROLE_KEY1,
        testContract.address,
        testContract.interface.getSighash(
          testContract.interface.getFunction("mint")
        ),
        [
          {
            parent: 0,
            paramType: ParameterType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: encodedParam_1,
          },
          {
            parent: 0,
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: encodedParam_2,
          },
        ],
        ExecutionOptions.None
      );
      await avatar.exec(modifier.address, 0, paramScoped.data || "", 0);

      const paramScoped_2 = await modifier.populateTransaction.scopeFunction(
        ROLE_KEY1,
        testContract.address,
        "0x273454bf",
        conditionTree,
        ExecutionOptions.None
      );
      await avatar.exec(modifier.address, 0, paramScoped_2.data || "", 0);

      const tx_bad = {
        to: testContract.address,
        value: 0,
        data: (await testContract.populateTransaction.mint(user1.address, 98))
          .data as string,
        operation: 0,
      };

      await expect(
        modifier.execTransactionFromModule(
          multisend.address,
          0,
          (
            await multisend.populateTransaction.multiSend(
              encodeMultisendPayload([tx_1, tx_1, tx_3, tx_bad, tx_1, tx_3])
            )
          ).data as string,
          1
        )
      )
        .to.be.revertedWithCustomError(modifier, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.ParameterNotAllowed, BYTES32_ZERO);
    });

    it("reverts if multisend tx data offset is not 32 bytes", async () => {
      const {
        avatar,
        multisend,
        modifier,
        testContract,
        encodedParam_1,
        encodedParam_2,
        tx_1,
      } = await loadFixture(txSetup);
      const [user1] = await hre.ethers.getSigners();

      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [ROLE_KEY1],
        [true]
      );
      await avatar.exec(modifier.address, 0, assign.data || "", 0);

      const defaultRole = await modifier.populateTransaction.setDefaultRole(
        user1.address,
        ROLE_KEY1
      );
      await avatar.exec(modifier.address, 0, defaultRole.data || "", 0);

      const functionScoped = await modifier.populateTransaction.scopeTarget(
        ROLE_KEY1,
        testContract.address
      );
      await avatar.exec(modifier.address, 0, functionScoped.data || "", 0);

      const paramScoped = await modifier.populateTransaction.scopeFunction(
        ROLE_KEY1,
        testContract.address,
        testContract.interface.getSighash(
          testContract.interface.getFunction("mint")
        ),
        [
          {
            parent: 0,
            paramType: ParameterType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: encodedParam_1,
          },
          {
            parent: 0,
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: encodedParam_2,
          },
        ],
        ExecutionOptions.None
      );

      await avatar.exec(modifier.address, 0, paramScoped.data || "", 0);

      let multisendCalldata = (
        await multisend.populateTransaction.multiSend(
          encodeMultisendPayload([tx_1])
        )
      ).data as string;

      // setting offset to 0x21 bytes instead of 0x20
      multisendCalldata =
        multisendCalldata.slice(0, 73) + "1" + multisendCalldata.slice(74);

      await expect(
        modifier.execTransactionFromModule(
          multisend.address,
          0,
          multisendCalldata,
          1
        )
      ).to.be.revertedWithCustomError(modifier, "MalformedMultiEntrypoint");
    });

    it("executes a call with multisend tx", async () => {
      const {
        avatar,
        modifier,
        multisend,
        testContract,
        encodedParam_1,
        encodedParam_2,
        conditionTree,
        tx_1,
        tx_3,
      } = await loadFixture(txSetup);
      const [user1] = await hre.ethers.getSigners();

      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [ROLE_KEY1],
        [true]
      );
      await avatar.exec(modifier.address, 0, assign.data || "", 0);

      const defaultRole = await modifier.populateTransaction.setDefaultRole(
        user1.address,
        ROLE_KEY1
      );
      await avatar.exec(modifier.address, 0, defaultRole.data || "", 0);

      const scopeTarget = await modifier.populateTransaction.scopeTarget(
        ROLE_KEY1,
        testContract.address
      );
      await avatar.exec(modifier.address, 0, scopeTarget.data || "", 0);

      const paramScoped = await modifier.populateTransaction.scopeFunction(
        ROLE_KEY1,
        testContract.address,
        testContract.interface.getSighash(
          testContract.interface.getFunction("mint")
        ),
        [
          {
            parent: 0,
            paramType: ParameterType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: encodedParam_1,
          },
          {
            parent: 0,
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: encodedParam_2,
          },
        ],
        ExecutionOptions.None
      );
      await avatar.exec(modifier.address, 0, paramScoped.data || "", 0);

      const paramScoped_2 = await modifier.populateTransaction.scopeFunction(
        ROLE_KEY1,
        testContract.address,
        "0x273454bf",
        conditionTree,
        ExecutionOptions.None
      );
      await avatar.exec(modifier.address, 0, paramScoped_2.data || "", 0);

      const multisendCalldata = (
        await multisend.populateTransaction.multiSend(
          encodeMultisendPayload([tx_1, tx_3, tx_1, tx_3])
        )
      ).data as string;

      await expect(
        modifier.execTransactionFromModule(
          multisend.address,
          0,
          multisendCalldata,
          1
        )
      ).to.emit(testContract, "TestDynamic");
    });
  });

  describe("execTransactionFromModuleReturnData()", () => {
    it("reverts if called from module not assigned any role", async () => {
      const { avatar, modifier, testContract } = await loadFixture(txSetup);
      const [user1] = await hre.ethers.getSigners();
      const allowTargetAddress = await modifier.populateTransaction.allowTarget(
        ROLE_KEY1,
        testContract.address,
        ExecutionOptions.None
      );
      await avatar.exec(modifier.address, 0, allowTargetAddress.data || "", 0);

      const mint = await testContract.populateTransaction.mint(
        user1.address,
        99
      );

      await expect(
        modifier.execTransactionFromModuleReturnData(
          testContract.address,
          0,
          mint.data || "",
          0
        )
      )
        .to.be.revertedWithCustomError(modifier, `NotAuthorized`)
        .withArgs(user1.address);
    });

    it("reverts if the call is not an allowed target", async () => {
      const { avatar, modifier, testContract } = await loadFixture(txSetup);
      const [user1] = await hre.ethers.getSigners();
      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [ROLE_KEY1],
        [true]
      );
      await avatar.exec(modifier.address, 0, assign.data || "", 0);

      const allowTargetAddress = await modifier.populateTransaction.allowTarget(
        ROLE_KEY1,
        testContract.address,
        ExecutionOptions.None
      );
      await avatar.exec(modifier.address, 0, allowTargetAddress.data || "", 0);

      const defaultRole = await modifier.populateTransaction.setDefaultRole(
        user1.address,
        ROLE_KEY1
      );
      await avatar.exec(modifier.address, 0, defaultRole.data || "", 0);

      const mint = await testContract.populateTransaction.mint(
        user1.address,
        99
      );

      const someOtherAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
      await expect(
        modifier.execTransactionFromModuleReturnData(
          someOtherAddress,
          0,
          mint.data || "",
          0
        )
      )
        .to.be.revertedWithCustomError(modifier, "ConditionViolation")
        .withArgs(
          PermissionCheckerStatus.TargetAddressNotAllowed,
          BYTES32_ZERO
        );
    });

    it("executes a call to an allowed target", async () => {
      const { avatar, modifier, testContract } = await loadFixture(txSetup);
      const [user1] = await hre.ethers.getSigners();
      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [ROLE_KEY1],
        [true]
      );
      await avatar.exec(modifier.address, 0, assign.data || "", 0);

      const allowTargetAddress = await modifier.populateTransaction.allowTarget(
        ROLE_KEY1,
        testContract.address,
        ExecutionOptions.None
      );
      await avatar.exec(modifier.address, 0, allowTargetAddress.data || "", 0);

      const defaultRole = await modifier.populateTransaction.setDefaultRole(
        user1.address,
        ROLE_KEY1
      );

      await avatar.exec(modifier.address, 0, defaultRole.data || "", 0);

      const mint = await testContract.populateTransaction.mint(
        user1.address,
        99
      );

      await expect(
        modifier.execTransactionFromModule(
          testContract.address,
          0,
          mint.data || "",
          0
        )
      ).to.emit(testContract, "Mint");
    });
  });

  describe("execTransactionWithRole()", () => {
    it("reverts if inner tx reverted and shouldRevert true", async () => {
      const { modifier, testContract, owner, invoker } = await loadFixture(
        setupRolesWithOwnerAndInvoker
      );

      const SHOULD_REVERT = true;
      const fnThatReverts =
        await testContract.populateTransaction.fnThatReverts();

      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_KEY], [true]);

      await modifier
        .connect(owner)
        .allowTarget(ROLE_KEY, testContract.address, ExecutionOptions.None);

      await expect(
        modifier
          .connect(invoker)
          .execTransactionWithRole(
            testContract.address,
            0,
            fnThatReverts.data as string,
            0,
            ROLE_KEY,
            SHOULD_REVERT
          )
      ).to.be.revertedWithCustomError(modifier, "ModuleTransactionFailed");
    });
    it("does not revert if inner tx reverted and shouldRevert false", async () => {
      const { modifier, testContract, owner, invoker } = await loadFixture(
        setupRolesWithOwnerAndInvoker
      );

      const SHOULD_REVERT = true;
      const fnThatReverts =
        await testContract.populateTransaction.fnThatReverts();

      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_KEY], [true]);

      await modifier
        .connect(owner)
        .allowTarget(ROLE_KEY, testContract.address, ExecutionOptions.None);

      await expect(
        modifier
          .connect(invoker)
          .execTransactionWithRole(
            testContract.address,
            0,
            fnThatReverts.data as string,
            0,
            ROLE_KEY,
            !SHOULD_REVERT
          )
      ).to.not.be.reverted;
    });
  });

  describe("execTransactionWithRoleReturnData()", () => {
    it("reverts if called from module not assigned any role", async () => {
      const { modifier, testContract, invoker } = await loadFixture(
        setupRolesWithOwnerAndInvoker
      );
      const [user1] = await hre.ethers.getSigners();

      const SHOULD_REVERT = true;

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
            mint.data as string,
            0,
            ROLE_KEY,
            !SHOULD_REVERT
          )
      ).to.be.revertedWithCustomError(modifier, "NoMembership");
    });

    it("reverts if inner tx reverted and shouldRevert true", async () => {
      const { modifier, testContract, owner, invoker } = await loadFixture(
        setupRolesWithOwnerAndInvoker
      );

      const SHOULD_REVERT = true;
      const fnThatReverts =
        await testContract.populateTransaction.fnThatReverts();

      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_KEY], [true]);

      await modifier
        .connect(owner)
        .allowTarget(ROLE_KEY, testContract.address, ExecutionOptions.None);

      await expect(
        modifier
          .connect(invoker)
          .execTransactionWithRoleReturnData(
            testContract.address,
            0,
            fnThatReverts.data as string,
            0,
            ROLE_KEY,
            SHOULD_REVERT
          )
      ).to.be.revertedWithCustomError(modifier, "ModuleTransactionFailed");
    });

    it("does not revert if inner tx reverted and shouldRevert false", async () => {
      const { modifier, testContract, owner, invoker } = await loadFixture(
        setupRolesWithOwnerAndInvoker
      );

      const SHOULD_REVERT = true;
      const fnThatReverts =
        await testContract.populateTransaction.fnThatReverts();

      await modifier
        .connect(owner)
        .assignRoles(invoker.address, [ROLE_KEY], [true]);

      await modifier
        .connect(owner)
        .allowTarget(ROLE_KEY, testContract.address, ExecutionOptions.None);

      await expect(
        modifier
          .connect(invoker)
          .execTransactionWithRoleReturnData(
            testContract.address,
            0,
            fnThatReverts.data as string,
            0,
            ROLE_KEY,
            !SHOULD_REVERT
          )
      ).to.be.not.be.reverted;
    });

    it("executes a call with multisend tx", async () => {
      const {
        avatar,
        multisend,
        modifier,
        testContract,
        encodedParam_1,
        encodedParam_2,
        conditionTree,
        tx_1,
        tx_3,
      } = await loadFixture(txSetup);
      const [user1] = await hre.ethers.getSigners();

      const SHOULD_REVERT = true;

      const assign = await modifier.populateTransaction.assignRoles(
        user1.address,
        [ROLE_KEY],
        [true]
      );
      await avatar.exec(modifier.address, 0, assign.data || "", 0);

      const scopeTarget = await modifier.populateTransaction.scopeTarget(
        ROLE_KEY,
        testContract.address
      );
      await avatar.exec(modifier.address, 0, scopeTarget.data || "", 0);

      const paramScoped = await modifier.populateTransaction.scopeFunction(
        ROLE_KEY,
        testContract.address,
        testContract.interface.getSighash(
          testContract.interface.getFunction("mint")
        ),
        [
          {
            parent: 0,
            paramType: ParameterType.Calldata,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: encodedParam_1,
          },
          {
            parent: 0,
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: encodedParam_2,
          },
        ],
        ExecutionOptions.None
      );
      await avatar.exec(modifier.address, 0, paramScoped.data || "", 0);

      const paramScoped_2 = await modifier.populateTransaction.scopeFunction(
        ROLE_KEY,
        testContract.address,
        "0x273454bf",
        conditionTree,
        ExecutionOptions.None
      );

      await avatar.exec(modifier.address, 0, paramScoped_2.data || "", 0);

      const multisendCalldata = (
        await multisend.populateTransaction.multiSend(
          encodeMultisendPayload([tx_1, tx_3, tx_1, tx_3])
        )
      ).data as string;

      await expect(
        modifier.execTransactionWithRoleReturnData(
          multisend.address,
          0,
          multisendCalldata,
          1,
          ROLE_KEY,
          !SHOULD_REVERT
        )
      ).to.emit(testContract, "TestDynamic");
    });
  });
});
