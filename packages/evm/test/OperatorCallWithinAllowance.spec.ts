import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { BigNumberish } from "ethers";
import { defaultAbiCoder } from "ethers/lib/utils";

import { Operator, ExecutionOptions, ParameterType } from "./utils";

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

    const Modifier = await hre.ethers.getContractFactory("Roles");
    const modifier = await Modifier.deploy(
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
        testContract.interface.getFunction("doNothing")
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
            operator: Operator.CallWithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
          },
        ],
        ExecutionOptions.Send
      );

      async function invoke() {
        return modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            0,
            (await testContract.populateTransaction.doNothing()).data as string,
            0
          );
      }

      return { invoke };
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

  describe("CallWithinAllowance - Check", () => {
    it("passes a check from existing balance", async () => {
      const { setAllowance, setPermission, modifier } = await loadFixture(
        setup
      );

      const allowanceKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";

      await setAllowance(allowanceKey, {
        balance: 1,
        refillInterval: 0,
        refillAmount: 0,
        refillTimestamp: 0,
      });

      const { invoke } = await setPermission(allowanceKey);

      expect((await modifier.allowances(allowanceKey)).balance).to.equal(1);

      await expect(invoke())
        .to.emit(modifier, "ConsumeAllowance")
        .withArgs(allowanceKey, 1, 0);

      expect((await modifier.allowances(allowanceKey)).balance).to.equal(0);

      await expect(invoke())
        .to.be.revertedWithCustomError(modifier, `CallAllowanceExceeded`)
        .withArgs(allowanceKey);
    });
    it("passes multiple checks from existing balance", async () => {
      const { setAllowance, setPermission, modifier } = await loadFixture(
        setup
      );

      const allowanceKey =
        "0x0000000000000000000000000000ff0000000000000000000000000000000001";

      await setAllowance(allowanceKey, {
        balance: 2,
        refillInterval: 0,
        refillAmount: 0,
        refillTimestamp: 0,
      });

      const { invoke } = await setPermission(allowanceKey);

      expect((await modifier.allowances(allowanceKey)).balance).to.equal(2);

      await expect(invoke()).to.not.be.reverted;

      expect((await modifier.allowances(allowanceKey)).balance).to.equal(1);

      await expect(invoke()).to.not.be.reverted;

      expect((await modifier.allowances(allowanceKey)).balance).to.equal(0);

      await expect(invoke())
        .to.be.revertedWithCustomError(modifier, `CallAllowanceExceeded`)
        .withArgs(allowanceKey);
    });
    it("passes a check from balance 0 but enough refill pending", async () => {
      const { modifier, setAllowance, setPermission, timestamp } =
        await setup();

      const allowanceKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";

      await setAllowance(allowanceKey, {
        balance: 0,
        refillInterval: 1000,
        refillAmount: 1,
        refillTimestamp: timestamp - 1010,
      });

      const { invoke } = await setPermission(allowanceKey);

      await expect(invoke()).to.not.be.reverted;
      await expect(invoke())
        .to.be.revertedWithCustomError(modifier, `CallAllowanceExceeded`)
        .withArgs(allowanceKey);
    });
    it("fails a check, insufficient balance and not enough elapsed for next refill", async () => {
      const { modifier, setAllowance, setPermission, timestamp } =
        await loadFixture(setup);

      const allowanceKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      await setAllowance(allowanceKey, {
        balance: 0,
        refillInterval: 1000,
        refillAmount: 1,
        refillTimestamp: timestamp,
      });
      const { invoke } = await setPermission(allowanceKey);

      await expect(invoke())
        .to.be.revertedWithCustomError(modifier, `CallAllowanceExceeded`)
        .withArgs(allowanceKey);
    });
  });

  describe("CallWithinAllowance - Variants", () => {
    it("enforces different call allowances per variant", async () => {
      const { owner, invoker, modifier, testContract, setAllowance } =
        await loadFixture(setup);

      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("fnWithSingleParam")
      );

      const allowanceKey1 =
        "0x1000000000000000000000000000000000000000000000000000000000000001";
      const allowanceKey2 =
        "0x2000000000000000000000000000000000000000000000000000000000000002";
      const value1 = 100;
      const value2 = 200;
      const valueOther = 9999;

      await modifier.connect(owner).scopeTarget(ROLE_KEY, testContract.address);
      await setAllowance(allowanceKey1, {
        balance: 0,
        refillInterval: 0,
        refillAmount: 0,
        refillTimestamp: 0,
      });

      await setAllowance(allowanceKey2, {
        balance: 1,
        refillInterval: 0,
        refillAmount: 0,
        refillTimestamp: 0,
      });

      async function execute(p: BigNumberish) {
        return modifier
          .connect(invoker)
          .execTransactionFromModule(
            testContract.address,
            0,
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
            operator: Operator.CallWithinAllowance,
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
            operator: Operator.CallWithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey2]),
          },
        ],
        ExecutionOptions.Send
      );

      await expect(execute(valueOther)).to.be.revertedWithCustomError(
        modifier,
        "NoMatchingBranch"
      );

      await expect(execute(value1))
        .to.be.revertedWithCustomError(modifier, `CallAllowanceExceeded`)
        .withArgs(allowanceKey1);

      await expect(execute(value2)).not.to.be.reverted;
      await expect(execute(value2))
        .to.be.revertedWithCustomError(modifier, `CallAllowanceExceeded`)
        .withArgs(allowanceKey2);
    });
  });
});
