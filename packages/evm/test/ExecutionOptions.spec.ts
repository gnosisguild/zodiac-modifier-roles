import { expect } from "chai";
import hre, { deployments, waffle, ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers";

import { ExecutionOptions } from "./utils";

const ROLE_KEY =
  "0x000000000000000000000000000000000000000000000000000000000000000f";

enum Operation {
  Call = 0,
  DelegateCall,
}

describe("ExecutionOptions", async () => {
  const setup = deployments.createFixture(async () => {
    await deployments.fixture();
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();
    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();

    const [owner, invoker] = waffle.provider.getWallets();

    const Modifier = await hre.ethers.getContractFactory("Roles");
    const modifier = await Modifier.deploy(
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
      value: ethers.utils.parseEther("10"),
    });

    return {
      Avatar,
      avatar,
      testContract,
      Modifier,
      modifier,
      owner,
      invoker,
    };
  });

  describe("sending eth", () => {
    describe("Target Allowed - aka Clearance.Target", () => {
      it("ExecutionOptions.NONE - FAILS sending eth to payable function", async () => {
        const { modifier, testContract, owner, invoker } = await setup();

        const value = ethers.utils.parseEther("1");

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
        ).to.be.revertedWith("SendNotAllowed()");
      });

      it("Options.NONE - FAILS sending eth to fallback", async () => {
        const { modifier, testContract, owner, invoker } = await setup();

        const value = ethers.utils.parseEther("1");

        await modifier
          .connect(owner)
          .allowTarget(ROLE_KEY, testContract.address, ExecutionOptions.None);

        await expect(
          modifier
            .connect(invoker)
            .execTransactionFromModule(testContract.address, value, "0x", 0)
        ).to.be.revertedWith("SendNotAllowed()");
      });

      it("ExecutionOptions.Send - OK sending eth to payable function", async () => {
        const { modifier, testContract, owner, invoker } = await setup();

        const value = ethers.utils.parseEther("1");

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
        const { modifier, testContract, owner, invoker } = await setup();

        const value = ethers.utils.parseEther("1");

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

      it("ExecutionOptions.DELEGATECALL - FAILS sending ETH to payable function", async () => {
        const { modifier, testContract, owner, invoker } = await setup();

        const value = ethers.utils.parseEther("1");

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
        ).to.be.revertedWith("SendNotAllowed()");
      });
      it("ExecutionOptions.DELEGATECALL - FAILS sending ETH to fallback", async () => {
        const { modifier, testContract, owner, invoker } = await setup();

        const value = ethers.utils.parseEther("1");

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
        ).to.be.revertedWith("SendNotAllowed()");
      });
      it("ExecutionOptions.BOTH - OK sending ETH to payable function", async () => {
        const { modifier, testContract, owner, invoker } = await setup();

        const value = ethers.utils.parseEther("1");

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

      it("ExecutionOptions.BOTH - OK sending ETH to fallback function", async () => {
        const { modifier, testContract, owner, invoker } = await setup();

        const value = ethers.utils.parseEther("1");

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

    describe("Target Scoped - aka Clearance.FUNCTION", () => {
      it("ExecutionOptions.None - Fails sending eth to payable function", async () => {
        const { modifier, testContract, owner, invoker } = await setup();

        const value = ethers.utils.parseEther("1");

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
        ).to.be.revertedWith("SendNotAllowed()");
      });

      it("ExecutionOptions.None - Fails sending eth to fallback", async () => {
        const { modifier, testContract, owner, invoker } = await setup();

        const value = ethers.utils.parseEther("1");

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
        ).to.be.revertedWith("SendNotAllowed()");
      });

      it("ExecutionOptions.Send - OK sending eth to payable function", async () => {
        const { modifier, testContract, owner, invoker } = await setup();

        const value = ethers.utils.parseEther("1.123");

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
        const { modifier, testContract, owner, invoker } = await setup();

        const value = ethers.utils.parseEther("1.123");
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
        const { modifier, testContract, owner, invoker } = await setup();

        const value = ethers.utils.parseEther("1");

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
        ).to.be.revertedWith("SendNotAllowed()");
      });
      it("ExecutionOptions.DelegateCall - Fails sending ETH to fallback", async () => {
        const { modifier, testContract, owner, invoker } = await setup();

        const value = ethers.utils.parseEther("1");

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
        ).to.be.revertedWith("SendNotAllowed()");
      });

      it("ExecutionOptions.Both - OK sending eth to payable function", async () => {
        const { modifier, testContract, owner, invoker } = await setup();

        const value = ethers.utils.parseEther("1.123");

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
        const { modifier, testContract, owner, invoker } = await setup();

        const value = ethers.utils.parseEther("1.123");
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
      const { modifier, testContract, owner, invoker } = await setup();

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
      const { modifier, testContract, owner, invoker } = await setup();

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
      ).to.be.revertedWith("DelegateCallNotAllowed()");
    });
    it("Target Scoped - can delegatecall", async () => {
      const { modifier, testContract, owner, invoker } = await setup();

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
      const { modifier, testContract, owner, invoker } = await setup();

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
      ).to.be.revertedWith("DelegateCallNotAllowed()");
    });
  });
});
