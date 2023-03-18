import { expect } from "chai";
import { BigNumberish } from "ethers";
import { defaultAbiCoder } from "ethers/lib/utils";
import hre, { deployments, waffle } from "hardhat";

import "@nomiclabs/hardhat-ethers";

import { Comparison, ExecutionOptions, ParameterType } from "./utils";

describe("Comparison", async () => {
  const ROLE_ID = 0;

  const timestampNow = () => Math.floor(new Date().getTime() / 1000);

  const setup = deployments.createFixture(async () => {
    await deployments.fixture();
    const timestamp = timestampNow();

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

    async function setAllowance(
      allowanceId: number,
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
          allowanceId,
          balance,
          maxBalance || 0,
          refillAmount,
          refillInterval,
          refillTimestamp
        );
    }

    await modifier
      .connect(owner)
      .assignRoles(invoker.address, [ROLE_ID], [true]);

    async function setPermission(allowanceId: number) {
      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("doNothing")
      );

      // set it to true
      await modifier.connect(owner).scopeTarget(ROLE_ID, testContract.address);
      await modifier.connect(owner).scopeFunction(
        ROLE_ID,
        testContract.address,
        SELECTOR,
        [
          {
            parent: 0,
            _type: ParameterType.AbiEncoded,
            comp: Comparison.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            _type: ParameterType.None,
            comp: Comparison.CallWithinAllowance,
            compValue: defaultAbiCoder.encode(["uint16"], [allowanceId]),
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
  });

  describe("CallWithinAllowance - Check", () => {
    it("passes a check from existing balance", async () => {
      const { setAllowance, setPermission, modifier } = await setup();

      const allowanceId = 1234;

      await setAllowance(allowanceId, {
        balance: 1,
        refillInterval: 0,
        refillAmount: 0,
        refillTimestamp: 0,
      });

      const { invoke } = await setPermission(allowanceId);

      expect((await modifier.allowances(allowanceId)).balance).to.equal(1);

      await expect(invoke()).to.not.be.reverted;

      expect((await modifier.allowances(allowanceId)).balance).to.equal(0);

      await expect(invoke()).to.be.revertedWith("CallAllowanceExceeded()");
    });

    it("passes multiple checks from existing balance", async () => {
      const { setAllowance, setPermission, modifier } = await setup();

      const allowanceId = 987;

      await setAllowance(allowanceId, {
        balance: 2,
        refillInterval: 0,
        refillAmount: 0,
        refillTimestamp: 0,
      });

      const { invoke } = await setPermission(allowanceId);

      expect((await modifier.allowances(allowanceId)).balance).to.equal(2);

      await expect(invoke()).to.not.be.reverted;

      expect((await modifier.allowances(allowanceId)).balance).to.equal(1);

      await expect(invoke()).to.not.be.reverted;

      expect((await modifier.allowances(allowanceId)).balance).to.equal(0);

      await expect(invoke()).to.be.revertedWith("CallAllowanceExceeded()");
    });

    it("passes a check from balance 0 but enough refill pending", async () => {
      const { setAllowance, setPermission, timestamp } = await setup();

      const allowanceId = 1234;

      await setAllowance(allowanceId, {
        balance: 0,
        refillInterval: 100,
        refillAmount: 1,
        refillTimestamp: timestamp - 150,
      });

      const { invoke } = await setPermission(allowanceId);

      await expect(invoke()).to.not.be.reverted;
      await expect(invoke()).to.be.revertedWith("CallAllowanceExceeded()");
    });

    it("fails a check, insufficient balance and not enough elapsed for next refill", async () => {
      const { setAllowance, setPermission, timestamp } = await setup();

      const allowanceId = 1234;
      await setAllowance(allowanceId, {
        balance: 0,
        refillInterval: 1000,
        refillAmount: 1,
        refillTimestamp: timestamp,
      });
      const { invoke } = await setPermission(allowanceId);

      await expect(invoke()).to.be.revertedWith("CallAllowanceExceeded()");
    });
  });

  describe("CallWithinAllowance - Variants", () => {
    it("enforces different call allowances per variant", async () => {
      const { owner, invoker, modifier, testContract, setAllowance } =
        await setup();

      const SELECTOR = testContract.interface.getSighash(
        testContract.interface.getFunction("fnWithSingleParam")
      );

      const allowanceId1 = 0;
      const allowanceId2 = 1;
      const value1 = 100;
      const value2 = 200;
      const valueOther = 9999;

      await modifier.connect(owner).scopeTarget(ROLE_ID, testContract.address);
      await setAllowance(allowanceId1, {
        balance: 0,
        refillInterval: 0,
        refillAmount: 0,
        refillTimestamp: 0,
      });

      await setAllowance(allowanceId2, {
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
        ROLE_ID,
        testContract.address,
        SELECTOR,
        [
          {
            parent: 0,
            _type: ParameterType.None,
            comp: Comparison.Or,
            compValue: "0x",
          },
          {
            parent: 0,
            _type: ParameterType.AbiEncoded,
            comp: Comparison.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            _type: ParameterType.AbiEncoded,
            comp: Comparison.Matches,
            compValue: "0x",
          },
          {
            parent: 1,
            _type: ParameterType.Static,
            comp: Comparison.EqualTo,
            compValue: defaultAbiCoder.encode(["uint256"], [value1]),
          },
          {
            parent: 1,
            _type: ParameterType.None,
            comp: Comparison.CallWithinAllowance,
            compValue: defaultAbiCoder.encode(["uint16"], [allowanceId1]),
          },
          {
            parent: 2,
            _type: ParameterType.Static,
            comp: Comparison.EqualTo,
            compValue: defaultAbiCoder.encode(["uint256"], [value2]),
          },
          {
            parent: 2,
            _type: ParameterType.None,
            comp: Comparison.CallWithinAllowance,
            compValue: defaultAbiCoder.encode(["uint16"], [allowanceId2]),
          },
        ],
        ExecutionOptions.Send
      );

      await expect(execute(valueOther)).to.be.revertedWith(
        "ParameterNotOneOfAllowed()"
      );

      await expect(execute(value1)).to.be.revertedWith(
        "ParameterNotOneOfAllowed()"
      );

      await expect(execute(value2)).not.to.be.reverted;
      await expect(execute(value1)).to.be.revertedWith(
        "ParameterNotOneOfAllowed()"
      );
    });
  });
});
