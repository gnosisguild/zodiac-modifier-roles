import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { BigNumberish } from "ethers";
import { defaultAbiCoder } from "ethers/lib/utils";

import {
  Operator,
  ExecutionOptions,
  ParameterType,
  deployRolesMod,
} from "./utils";

const ROLE_KEY =
  "0x0000000000000000000000000000000000000000000000000000000000000001";

describe("Operator", async () => {
  const timestampNow = () => Math.floor(new Date().getTime() / 1000);

  async function setup() {
    const timestamp = timestampNow();

    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();

    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();

    const [owner, invoker] = await hre.ethers.getSigners();
    // fund avatar
    await invoker.sendTransaction({
      to: avatar.address,
      value: hre.ethers.utils.parseEther("1"),
    });
    const modifier = await deployRolesMod(
      hre,
      owner.address,
      avatar.address,
      avatar.address
    );
    await modifier.enableModule(invoker.address);

    async function setAllowance(
      allowanceKey: string,
      {
        balance,
        maxBalance,
        refillAmount,
        refillInterval,
        refillTimestamp,
      }: {
        balance: BigNumberish;
        maxBalance?: BigNumberish;
        refillAmount: BigNumberish;
        refillInterval: BigNumberish;
        refillTimestamp: BigNumberish;
      }
    ) {
      await modifier
        .connect(owner)
        .setAllowance(
          allowanceKey,
          balance,
          maxBalance || 0,
          refillAmount,
          refillInterval,
          refillTimestamp
        );
    }

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_KEY], [true]);

    await modifier.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);

    async function setPermission(allowanceKey: string) {
      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("receiveEthAndDoNothing")
      );

      // set it to true
      await modifier.connect(owner).scopeTarget(ROLE_KEY, testContract.address);
      await modifier.connect(owner).scopeFunction(
        ROLE_KEY,
        testContract.address,
        SELECTOR,
        [
          {
            parent: 0,
            paramType: ParameterType.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: ParameterType.None,
            operator: Operator.EtherWithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
          },
        ],
        ExecutionOptions.Send
      );

      async function executeSendingETH(value: BigNumberish) {
        return modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            value,
            (await testContract.populateTransaction.receiveEthAndDoNothing())
              .data as string,
            0
          );
      }

      return { executeSendingETH };
    }

    return {
      owner,
      invoker,
      modifier,
      testContract,
      timestamp,
      setAllowance,
      setPermission,
    };
  }

  describe("EtherWithinAllowance - Check", () => {
    it("passes a check from existing balance", async () => {
      const { modifier, setAllowance, setPermission } = await loadFixture(
        setup
      );

      const initialBalance = 10000;
      const allowanceKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";

      await setAllowance(allowanceKey, {
        balance: initialBalance,
        refillInterval: 0,
        refillAmount: 0,
        refillTimestamp: 0,
      });

      const { executeSendingETH } = await setPermission(allowanceKey);

      expect((await modifier.allowances(allowanceKey)).balance).to.equal(
        initialBalance
      );

      await expect(executeSendingETH(initialBalance + 1))
        .to.be.revertedWithCustomError(modifier, `EtherAllowanceExceeded`)
        .withArgs(allowanceKey);
      await expect(executeSendingETH(initialBalance)).to.not.be.reverted;
      await expect(executeSendingETH(1))
        .to.be.revertedWithCustomError(modifier, `EtherAllowanceExceeded`)
        .withArgs(allowanceKey);

      expect((await modifier.allowances(allowanceKey)).balance).to.equal(0);
    });

    it("passes a check from balance 0 but enough refill pending", async () => {
      const { modifier, setAllowance, setPermission, timestamp } =
        await loadFixture(setup);

      const allowanceKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";

      await setAllowance(allowanceKey, {
        balance: 250,
        refillInterval: 500,
        refillAmount: 100,
        refillTimestamp: timestamp - 750,
      });

      const { executeSendingETH } = await setPermission(allowanceKey);

      await expect(executeSendingETH(351))
        .to.be.revertedWithCustomError(modifier, `EtherAllowanceExceeded`)
        .withArgs(allowanceKey);
      await expect(executeSendingETH(350)).to.not.be.reverted;
      await expect(executeSendingETH(1))
        .to.be.revertedWithCustomError(modifier, `EtherAllowanceExceeded`)
        .withArgs(allowanceKey);
    });

    it("fails a check, insufficient balance and not enough elapsed for next refill", async () => {
      const { modifier, setAllowance, setPermission, timestamp } =
        await loadFixture(setup);

      const allowanceKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      await setAllowance(allowanceKey, {
        balance: 9,
        refillInterval: 1000,
        refillAmount: 1,
        refillTimestamp: timestamp - 50,
      });
      const { executeSendingETH } = await setPermission(allowanceKey);

      await expect(executeSendingETH(10))
        .to.be.revertedWithCustomError(modifier, `EtherAllowanceExceeded`)
        .withArgs(allowanceKey);
      await expect(executeSendingETH(9)).to.not.be.reverted;
      await expect(executeSendingETH(1))
        .to.be.revertedWithCustomError(modifier, `EtherAllowanceExceeded`)
        .withArgs(allowanceKey);
    });

    it("order doesn't matter", async () => {
      const { owner, invoker, modifier, testContract, setAllowance } =
        await loadFixture(setup);

      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("fnWithSingleParam")
      );

      const allowanceKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const allowanceAmount = 200;
      const value = 666;
      const valueOther = 678;

      await modifier.connect(owner).scopeTarget(ROLE_KEY, testContract.address);
      async function execute(value: BigNumberish, p: BigNumberish) {
        return modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            value,
            (await testContract.populateTransaction.fnWithSingleParam(p))
              .data as string,
            0
          );
      }

      await setAllowance(allowanceKey, {
        balance: allowanceAmount,
        refillInterval: 0,
        refillAmount: 0,
        refillTimestamp: 0,
      });
      await modifier.connect(owner).scopeFunction(
        ROLE_KEY,
        testContract.address,
        SELECTOR,
        [
          {
            parent: 0,
            paramType: ParameterType.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["uint256"], [value]),
          },
          {
            parent: 0,
            paramType: ParameterType.None,
            operator: Operator.EtherWithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
          },
        ],
        ExecutionOptions.Send
      );

      /*
       * First check valueOther which, hits no variant
       */
      await expect(
        execute(allowanceAmount, valueOther)
      ).to.be.revertedWithCustomError(modifier, "ParameterNotAllowed");
      await expect(execute(allowanceAmount, value)).to.not.be.reverted;

      await setAllowance(allowanceKey, {
        balance: allowanceAmount,
        refillInterval: 0,
        refillAmount: 0,
        refillTimestamp: 0,
      });
      await modifier.connect(owner).scopeFunction(
        ROLE_KEY,
        testContract.address,
        SELECTOR,
        [
          {
            parent: 0,
            paramType: ParameterType.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: ParameterType.None,
            operator: Operator.EtherWithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
          },
          {
            parent: 0,
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["uint256"], [value]),
          },
        ],
        ExecutionOptions.Send
      );
    });
  });

  describe("EtherWithinAllowance - Variants", () => {
    it("enforces different eth allowances per variant", async () => {
      const { owner, invoker, modifier, testContract, setAllowance } =
        await loadFixture(setup);

      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("fnWithSingleParam")
      );

      const allowanceKey1 =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const allowanceKey2 =
        "0x0000000000000000000000000000000000000000000000000000000000000002";
      const allowanceAmount1 = 200;
      const allowanceAmount2 = 100;
      const value1 = 777;
      const value2 = 888;
      const valueOther = 9999;

      await modifier.connect(owner).scopeTarget(ROLE_KEY, testContract.address);
      await setAllowance(allowanceKey1, {
        balance: allowanceAmount1,
        refillInterval: 0,
        refillAmount: 0,
        refillTimestamp: 0,
      });

      await setAllowance(allowanceKey2, {
        balance: allowanceAmount2,
        refillInterval: 0,
        refillAmount: 0,
        refillTimestamp: 0,
      });

      async function execute(value: BigNumberish, p: BigNumberish) {
        return modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            value,
            (await testContract.populateTransaction.fnWithSingleParam(p))
              .data as string,
            0
          );
      }

      await modifier.connect(owner).scopeFunction(
        ROLE_KEY,
        testContract.address,
        SELECTOR,
        [
          {
            parent: 0,
            paramType: ParameterType.None,
            operator: Operator.Or,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: ParameterType.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: ParameterType.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["uint256"], [value1]),
          },
          {
            parent: 1,
            paramType: ParameterType.None,
            operator: Operator.EtherWithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey1]),
          },
          {
            parent: 2,
            paramType: ParameterType.Static,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["uint256"], [value2]),
          },
          {
            parent: 2,
            paramType: ParameterType.None,
            operator: Operator.EtherWithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey2]),
          },
        ],
        ExecutionOptions.Send
      );

      /*
       * First check valueOther which, hits no variant
       */
      await expect(execute(1000, valueOther)).to.be.revertedWithCustomError(
        modifier,
        "OrViolation"
      );
      // Exceed value for Variant1
      await expect(execute(allowanceAmount1 + 1, value1))
        .to.be.revertedWithCustomError(modifier, `EtherAllowanceExceeded`)
        .withArgs(allowanceKey1);
      // Exceed value for Variant2
      await expect(execute(allowanceAmount2 + 1, value2))
        .to.be.revertedWithCustomError(modifier, `EtherAllowanceExceeded`)
        .withArgs(allowanceKey2);

      // Checks that both allowance balances still remain unchanged
      expect((await modifier.allowances(allowanceKey1)).balance).to.equal(
        allowanceAmount1
      );
      expect((await modifier.allowances(allowanceKey2)).balance).to.equal(
        allowanceAmount2
      );

      /*
       * Exhaust Allowance from Variant 1
       */
      await expect(execute(allowanceAmount1, value1)).to.not.be.reverted;
      // check that allowance 1 is updated to zero
      expect((await modifier.allowances(allowanceKey1)).balance).to.equal(0);
      // check that allowance 2 remains unchanged
      expect((await modifier.allowances(allowanceKey2)).balance).to.equal(
        allowanceAmount2
      );

      /*
       * Exhaust Allowance from Variant 2
       */
      await expect(execute(allowanceAmount2, value2)).to.not.be.reverted;
      // check that both balances are now zero
      expect((await modifier.allowances(allowanceKey1)).balance).to.equal(0);
      expect((await modifier.allowances(allowanceKey2)).balance).to.equal(0);

      // check that neither variant can now be executed
      await expect(execute(1, value1))
        .to.be.revertedWithCustomError(modifier, `EtherAllowanceExceeded`)
        .withArgs(allowanceKey1);
      await expect(execute(1, value2))
        .to.be.revertedWithCustomError(modifier, `EtherAllowanceExceeded`)
        .withArgs(allowanceKey2);
    });
  });
});
