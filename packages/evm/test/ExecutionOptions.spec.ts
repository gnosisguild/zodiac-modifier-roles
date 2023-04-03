import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import {
  BYTES32_ZERO,
  deployRolesMod,
  ExecutionOptions,
  PermissionCheckerStatus,
} from "./utils";

const ROLE_KEY =
  "0x000000000000000000000000000000000000000000000000000000000000000f";

enum Operation {
  Call = 0,
  DelegateCall,
}

async function setup() {
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

  await modifier
    .connect(owner)
    .assignRoles(invoker.address, [ROLE_KEY], [true]);

  await modifier.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);

  // fund avatar
  await invoker.sendTransaction({
    to: avatar.address,
    value: hre.ethers.utils.parseEther("10"),
  });

  return {
    Avatar,
    avatar,
    testContract,
    modifier,
    owner,
    invoker,
  };
}

describe("ExecutionOptions", async () => {
  describe("send", () => {
    describe("Target Allowed - Clearance.Target", () => {
      it("ExecutionOptions.None - Fails sending eth to payable function", async () => {
        const { modifier, testContract, owner, invoker } = await loadFixture(
          setup
        );

        const value = hre.ethers.utils.parseEther("1");

        const { data } =
          await testContract.populateTransaction.receiveEthAndDoNothing();

        await modifier
          .connect(owner)
          .allowTarget(ROLE_KEY, testContract.address, ExecutionOptions.None);

        await expect(
          modifier
            .connect(invoker)
            .execTransactionFromModule(
              testContract.address,
              value,
              data as string,
              0
            )
        )
          .to.be.revertedWithCustomError(modifier, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.SendNotAllowed, BYTES32_ZERO);
      });
      it("ExecutionOptions.None - Fails sending eth to fallback", async () => {
        const { modifier, testContract, owner, invoker } = await loadFixture(
          setup
        );

        const value = hre.ethers.utils.parseEther("1");

        await modifier
          .connect(owner)
          .allowTarget(ROLE_KEY, testContract.address, ExecutionOptions.None);

        await expect(
          modifier
            .connect(invoker)
            .execTransactionFromModule(testContract.address, value, "0x", 0)
        )
          .to.be.revertedWithCustomError(modifier, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.SendNotAllowed, BYTES32_ZERO);
      });
      it("ExecutionOptions.Send - OK sending eth to payable function", async () => {
        const { modifier, testContract, owner, invoker } = await loadFixture(
          setup
        );

        const value = hre.ethers.utils.parseEther("1");

        const { data } =
          await testContract.populateTransaction.receiveEthAndDoNothing();

        await modifier
          .connect(owner)
          .allowTarget(ROLE_KEY, testContract.address, ExecutionOptions.Send);

        await expect(
          modifier
            .connect(invoker)
            .execTransactionFromModule(
              testContract.address,
              value,
              data as string,
              0
            )
        )
          .to.be.emit(testContract, "ReceiveEthAndDoNothing")
          .withArgs(value);
      });
      it("ExecutionOptions.Send - OK sending eth to fallback", async () => {
        const { modifier, testContract, owner, invoker } = await loadFixture(
          setup
        );

        const value = hre.ethers.utils.parseEther("1");

        await modifier
          .connect(owner)
          .allowTarget(ROLE_KEY, testContract.address, ExecutionOptions.Send);

        await expect(
          modifier
            .connect(invoker)
            .execTransactionFromModule(testContract.address, value, "0x", 0)
        )
          .to.be.emit(testContract, "ReceiveFallback")
          .withArgs(value);
      });
      it("ExecutionOptions.DelegateCall - Fails sending ETH to payable function", async () => {
        const { modifier, testContract, owner, invoker } = await loadFixture(
          setup
        );

        const value = hre.ethers.utils.parseEther("1");

        const { data } =
          await testContract.populateTransaction.receiveEthAndDoNothing();

        await modifier
          .connect(owner)
          .allowTarget(
            ROLE_KEY,
            testContract.address,
            ExecutionOptions.DelegateCall
          );

        await expect(
          modifier
            .connect(invoker)
            .execTransactionFromModule(
              testContract.address,
              value,
              data as string,
              0
            )
        )
          .to.be.revertedWithCustomError(modifier, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.SendNotAllowed, BYTES32_ZERO);
      });
      it("ExecutionOptions.DelegateCall - Fails sending ETH to fallback", async () => {
        const { modifier, testContract, owner, invoker } = await loadFixture(
          setup
        );

        const value = hre.ethers.utils.parseEther("1");

        await modifier
          .connect(owner)
          .allowTarget(
            ROLE_KEY,
            testContract.address,
            ExecutionOptions.DelegateCall
          );

        await expect(
          modifier
            .connect(invoker)
            .execTransactionFromModule(
              testContract.address,
              value,
              "0x",
              Operation.Call
            )
        )
          .to.be.revertedWithCustomError(modifier, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.SendNotAllowed, BYTES32_ZERO);
      });
      it("ExecutionOptions.Both - OK sending ETH to payable function", async () => {
        const { modifier, testContract, owner, invoker } = await loadFixture(
          setup
        );

        const value = hre.ethers.utils.parseEther("1");

        const { data } =
          await testContract.populateTransaction.receiveEthAndDoNothing();

        await modifier
          .connect(owner)
          .allowTarget(ROLE_KEY, testContract.address, ExecutionOptions.Both);

        await expect(
          modifier
            .connect(invoker)
            .execTransactionFromModule(
              testContract.address,
              value,
              data as string,
              0
            )
        )
          .to.be.emit(testContract, "ReceiveEthAndDoNothing")
          .withArgs(value);
      });
      it("ExecutionOptions.Both - OK sending ETH to fallback function", async () => {
        const { modifier, testContract, owner, invoker } = await loadFixture(
          setup
        );

        const value = hre.ethers.utils.parseEther("1");

        const { data } =
          await testContract.populateTransaction.receiveEthAndDoNothing();

        await modifier
          .connect(owner)
          .allowTarget(ROLE_KEY, testContract.address, ExecutionOptions.Both);

        await expect(
          modifier
            .connect(invoker)
            .execTransactionFromModule(
              testContract.address,
              value,
              data as string,
              Operation.Call
            )
        )
          .to.be.emit(testContract, "ReceiveEthAndDoNothing")
          .withArgs(value);
      });
    });

    describe("Target Scoped - Clearance.Function", () => {
      it("ExecutionOptions.None - Fails sending eth to payable function", async () => {
        const { modifier, testContract, owner, invoker } = await loadFixture(
          setup
        );

        const value = hre.ethers.utils.parseEther("1");

        const SELECTOR = testContract.interface.getSighash(
          testContract.interface.getFunction("receiveEthAndDoNothing")
        );

        const { data } =
          await testContract.populateTransaction.receiveEthAndDoNothing();

        await modifier
          .connect(owner)
          .scopeTarget(ROLE_KEY, testContract.address);

        await modifier
          .connect(owner)
          .allowFunction(
            ROLE_KEY,
            testContract.address,
            SELECTOR,
            ExecutionOptions.None
          );

        await expect(
          modifier
            .connect(invoker)
            .execTransactionFromModule(
              testContract.address,
              value,
              data as string,
              Operation.Call
            )
        )
          .to.be.revertedWithCustomError(modifier, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.SendNotAllowed, BYTES32_ZERO);
      });
      it("ExecutionOptions.None - Fails sending eth to fallback", async () => {
        const { modifier, testContract, owner, invoker } = await loadFixture(
          setup
        );

        const value = hre.ethers.utils.parseEther("1");

        await modifier
          .connect(owner)
          .scopeTarget(ROLE_KEY, testContract.address);

        await modifier
          .connect(owner)
          .allowFunction(
            ROLE_KEY,
            testContract.address,
            "0x00000000",
            ExecutionOptions.None
          );

        await expect(
          modifier
            .connect(invoker)
            .execTransactionFromModule(testContract.address, value, "0x", 0)
        )
          .to.be.revertedWithCustomError(modifier, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.SendNotAllowed, BYTES32_ZERO);
      });
      it("ExecutionOptions.Send - OK sending eth to payable function", async () => {
        const { modifier, testContract, owner, invoker } = await loadFixture(
          setup
        );

        const value = hre.ethers.utils.parseEther("1.123");

        const SELECTOR = testContract.interface.getSighash(
          testContract.interface.getFunction("receiveEthAndDoNothing")
        );

        const { data } =
          await testContract.populateTransaction.receiveEthAndDoNothing();

        await modifier
          .connect(owner)
          .scopeTarget(ROLE_KEY, testContract.address);

        await modifier
          .connect(owner)
          .allowFunction(
            ROLE_KEY,
            testContract.address,
            SELECTOR,
            ExecutionOptions.Send
          );

        await expect(
          modifier
            .connect(invoker)
            .execTransactionFromModule(
              testContract.address,
              value,
              data as string,
              Operation.Call
            )
        )
          .to.be.emit(testContract, "ReceiveEthAndDoNothing")
          .withArgs(value);
      });
      it("ExecutionOptions.Send - OK sending eth to fallback", async () => {
        const { modifier, testContract, owner, invoker } = await loadFixture(
          setup
        );

        const value = hre.ethers.utils.parseEther("1.123");
        await modifier
          .connect(owner)
          .scopeTarget(ROLE_KEY, testContract.address);

        await modifier
          .connect(owner)
          .allowFunction(
            ROLE_KEY,
            testContract.address,
            "0x00000000",
            ExecutionOptions.Send
          );

        await expect(
          modifier
            .connect(invoker)
            .execTransactionFromModule(testContract.address, value, "0x", 0)
        )
          .to.be.emit(testContract, "ReceiveFallback")
          .withArgs(value);
      });
      it("ExecutionOptions.DelegateCall - Fails sending ETH to payable function", async () => {
        const { modifier, testContract, owner, invoker } = await loadFixture(
          setup
        );

        const value = hre.ethers.utils.parseEther("1");

        const SELECTOR = testContract.interface.getSighash(
          testContract.interface.getFunction("receiveEthAndDoNothing")
        );

        const { data } =
          await testContract.populateTransaction.receiveEthAndDoNothing();

        await modifier
          .connect(owner)
          .scopeTarget(ROLE_KEY, testContract.address);

        await modifier
          .connect(owner)
          .allowFunction(
            ROLE_KEY,
            testContract.address,
            SELECTOR,
            ExecutionOptions.DelegateCall
          );

        await expect(
          modifier
            .connect(invoker)
            .execTransactionFromModule(
              testContract.address,
              value,
              data as string,
              Operation.Call
            )
        )
          .to.be.revertedWithCustomError(modifier, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.SendNotAllowed, BYTES32_ZERO);
      });
      it("ExecutionOptions.DelegateCall - Fails sending ETH to fallback", async () => {
        const { modifier, testContract, owner, invoker } = await loadFixture(
          setup
        );

        const value = hre.ethers.utils.parseEther("1");

        await modifier
          .connect(owner)
          .scopeTarget(ROLE_KEY, testContract.address);

        await modifier
          .connect(owner)
          .allowFunction(
            ROLE_KEY,
            testContract.address,
            "0x00000000",
            ExecutionOptions.DelegateCall
          );

        await expect(
          modifier
            .connect(invoker)
            .execTransactionFromModule(testContract.address, value, "0x", 0)
        )
          .to.be.revertedWithCustomError(modifier, "ConditionViolation")
          .withArgs(PermissionCheckerStatus.SendNotAllowed, BYTES32_ZERO);
      });
      it("ExecutionOptions.Both - OK sending eth to payable function", async () => {
        const { modifier, testContract, owner, invoker } = await loadFixture(
          setup
        );

        const value = hre.ethers.utils.parseEther("1.123");

        const SELECTOR = testContract.interface.getSighash(
          testContract.interface.getFunction("receiveEthAndDoNothing")
        );

        const { data } =
          await testContract.populateTransaction.receiveEthAndDoNothing();

        await modifier
          .connect(owner)
          .scopeTarget(ROLE_KEY, testContract.address);

        await modifier
          .connect(owner)
          .allowFunction(
            ROLE_KEY,
            testContract.address,
            SELECTOR,
            ExecutionOptions.Both
          );

        await expect(
          modifier
            .connect(invoker)
            .execTransactionFromModule(
              testContract.address,
              value,
              data as string,
              Operation.Call
            )
        )
          .to.be.emit(testContract, "ReceiveEthAndDoNothing")
          .withArgs(value);
      });
      it("ExecutionOptions.Both - OK sending eth to fallback", async () => {
        const { modifier, testContract, owner, invoker } = await loadFixture(
          setup
        );

        const value = hre.ethers.utils.parseEther("1.123");
        await modifier
          .connect(owner)
          .scopeTarget(ROLE_KEY, testContract.address);

        await modifier
          .connect(owner)
          .allowFunction(
            ROLE_KEY,
            testContract.address,
            "0x00000000",
            ExecutionOptions.Both
          );

        await expect(
          modifier
            .connect(invoker)
            .execTransactionFromModule(testContract.address, value, "0x", 0)
        )
          .to.be.emit(testContract, "ReceiveFallback")
          .withArgs(value);
      });
    });
  });

  describe("delegatecall", () => {
    it("Target Allowed - can delegatecall", async () => {
      const { modifier, testContract, owner, invoker } = await loadFixture(
        setup
      );

      const { data } = await testContract.populateTransaction.emitTheSender();

      await modifier
        .connect(owner)
        .allowTarget(
          ROLE_KEY,
          testContract.address,
          ExecutionOptions.DelegateCall
        );

      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            0,
            data as string,
            Operation.DelegateCall
          )
      ).to.not.be.reverted;
    });
    it("Target Allowed - cannot delegatecall", async () => {
      const { modifier, testContract, owner, invoker } = await loadFixture(
        setup
      );

      const { data } = await testContract.populateTransaction.emitTheSender();

      await modifier
        .connect(owner)
        .allowTarget(ROLE_KEY, testContract.address, ExecutionOptions.None);

      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            0,
            data as string,
            Operation.DelegateCall
          )
      )
        .to.be.revertedWithCustomError(modifier, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.DelegateCallNotAllowed, BYTES32_ZERO);
    });
    it("Target Scoped - can delegatecall", async () => {
      const { modifier, testContract, owner, invoker } = await loadFixture(
        setup
      );

      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("emitTheSender")
      );

      const { data } = await testContract.populateTransaction.emitTheSender();

      await modifier.connect(owner).scopeTarget(ROLE_KEY, testContract.address);

      await modifier
        .connect(owner)
        .allowFunction(
          ROLE_KEY,
          testContract.address,
          SELECTOR,
          ExecutionOptions.Both
        );

      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            0,
            data as string,
            Operation.DelegateCall
          )
      ).not.to.be.reverted;
    });
    it("Target Scoped - cannot delegatecall", async () => {
      const { modifier, testContract, owner, invoker } = await loadFixture(
        setup
      );

      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("emitTheSender")
      );

      const { data } = await testContract.populateTransaction.emitTheSender();

      await modifier.connect(owner).scopeTarget(ROLE_KEY, testContract.address);

      await modifier
        .connect(owner)
        .allowFunction(
          ROLE_KEY,
          testContract.address,
          SELECTOR,
          ExecutionOptions.None
        );

      await expect(
        modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            0,
            data as string,
            Operation.DelegateCall
          )
      )
        .to.be.revertedWithCustomError(modifier, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.DelegateCallNotAllowed, BYTES32_ZERO);
    });
  });
});
