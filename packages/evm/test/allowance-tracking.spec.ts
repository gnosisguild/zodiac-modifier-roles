import { expect } from "chai";
import hre from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

import {
  Encoding,
  ExecutionOptions,
  Operator,
  PermissionCheckerStatus,
  encodeMultisendPayload,
} from "./utils";
import { deployRolesMod } from "./setup";

/**
 * AllowanceTracking tests cover the allowance setup:
 * - setAllowance/updateAllowance APIs
 * - Accrual (refill) mechanics
 * - Settlement (persistence after execution)
 * - Multi-entrypoint consumption accumulation
 *
 * NOTE: Operator-specific behavior (WithinAllowance, CallWithinAllowance) is tested
 * in the corresponding operator test files (operators/28WithinAllowance.spec.ts,
 * operators/30CallWithinAllowance.spec.ts). This includes:
 * - Success/failure conditions for the operators
 * - Price conversion logic
 * - Consumption entry creation
 */
describe("AllowanceTracking", () => {
  async function setup() {
    const [owner, member] = await hre.ethers.getSigners();

    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();
    const avatarAddress = await avatar.getAddress();

    const roles = await deployRolesMod(
      hre,
      owner.address,
      avatarAddress,
      avatarAddress,
    );
    await roles.enableModule(member.address);

    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();
    const testContractAddress = await testContract.getAddress();

    const ROLE_KEY = hre.ethers.id("TEST_ROLE");
    const ALLOWANCE_KEY = hre.ethers.id("TEST_ALLOWANCE");

    await roles.connect(owner).grantRole(member.address, ROLE_KEY, 0, 0, 0);
    await roles.connect(owner).setDefaultRole(member.address, ROLE_KEY);
    await roles.connect(owner).scopeTarget(ROLE_KEY, testContractAddress);

    return {
      roles,
      owner,
      member,
      testContract,
      testContractAddress,
      ROLE_KEY,
      ALLOWANCE_KEY,
    };
  }

  describe("setAllowance", () => {
    describe("basic configuration", () => {
      it("sets balance to specified value", async () => {
        const { roles, owner, ALLOWANCE_KEY } = await loadFixture(setup);

        await roles
          .connect(owner)
          .setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

        const allowance = await roles.allowances(ALLOWANCE_KEY);
        expect(allowance.balance).to.equal(500);
      });

      it("sets refill to specified value", async () => {
        const { roles, owner, ALLOWANCE_KEY } = await loadFixture(setup);

        await roles
          .connect(owner)
          .setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

        const allowance = await roles.allowances(ALLOWANCE_KEY);
        expect(allowance.refill).to.equal(100);
      });

      it("sets period to specified value", async () => {
        const { roles, owner, ALLOWANCE_KEY } = await loadFixture(setup);

        await roles
          .connect(owner)
          .setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

        const allowance = await roles.allowances(ALLOWANCE_KEY);
        expect(allowance.period).to.equal(3600);
      });

      it("emits SetAllowance event with correct parameters", async () => {
        const { roles, owner, ALLOWANCE_KEY } = await loadFixture(setup);

        const tx = roles
          .connect(owner)
          .setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

        await expect(tx).to.emit(roles, "SetAllowance");
      });
    });

    describe("default values", () => {
      it("sets maxRefill to max uint128 when passed 0", async () => {
        const { roles, owner, ALLOWANCE_KEY } = await loadFixture(setup);

        await roles
          .connect(owner)
          .setAllowance(ALLOWANCE_KEY, 500, 0, 100, 3600, 0);

        const allowance = await roles.allowances(ALLOWANCE_KEY);
        expect(allowance.maxRefill).to.equal(
          BigInt("0xffffffffffffffffffffffffffffffff"),
        );
      });

      it("sets timestamp to current block.timestamp when passed 0", async () => {
        const { roles, owner, ALLOWANCE_KEY } = await loadFixture(setup);

        const tx = await roles
          .connect(owner)
          .setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

        const receipt = await tx.wait();
        const block = await hre.ethers.provider.getBlock(receipt!.blockNumber);

        const allowance = await roles.allowances(ALLOWANCE_KEY);
        expect(allowance.timestamp).to.equal(block!.timestamp);
      });
    });

    describe("overwriting", () => {
      it("overwrites all fields of existing allowance", async () => {
        const { roles, owner, ALLOWANCE_KEY } = await loadFixture(setup);

        await roles
          .connect(owner)
          .setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

        await roles
          .connect(owner)
          .setAllowance(ALLOWANCE_KEY, 999, 2000, 200, 7200, 0);

        const allowance = await roles.allowances(ALLOWANCE_KEY);
        expect(allowance.balance).to.equal(999);
        expect(allowance.maxRefill).to.equal(2000);
        expect(allowance.refill).to.equal(200);
        expect(allowance.period).to.equal(7200);
      });

      it("resets timestamp when overwriting", async () => {
        const { roles, owner, ALLOWANCE_KEY } = await loadFixture(setup);

        await roles
          .connect(owner)
          .setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

        const initialAllowance = await roles.allowances(ALLOWANCE_KEY);

        await time.increase(1000);

        const tx = await roles
          .connect(owner)
          .setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

        const receipt = await tx.wait();
        const block = await hre.ethers.provider.getBlock(receipt!.blockNumber);

        const newAllowance = await roles.allowances(ALLOWANCE_KEY);
        expect(newAllowance.timestamp).to.not.equal(initialAllowance.timestamp);
        expect(newAllowance.timestamp).to.equal(block!.timestamp);
      });
    });
  });

  describe("updateAllowance", () => {
    it("updates refill parameters only", async () => {
      const { roles, owner, ALLOWANCE_KEY } = await loadFixture(setup);

      await roles
        .connect(owner)
        .setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

      await roles
        .connect(owner)
        .updateAllowance(ALLOWANCE_KEY, 2000, 200, 7200);

      const allowance = await roles.allowances(ALLOWANCE_KEY);
      expect(allowance.maxRefill).to.equal(2000);
      expect(allowance.refill).to.equal(200);
      expect(allowance.period).to.equal(7200);
    });

    it("preserves existing balance", async () => {
      const { roles, owner, ALLOWANCE_KEY } = await loadFixture(setup);

      await roles
        .connect(owner)
        .setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

      await roles
        .connect(owner)
        .updateAllowance(ALLOWANCE_KEY, 2000, 200, 7200);

      const allowance = await roles.allowances(ALLOWANCE_KEY);
      expect(allowance.balance).to.equal(500);
    });

    it("preserves existing timestamp", async () => {
      const { roles, owner, ALLOWANCE_KEY } = await loadFixture(setup);

      await roles
        .connect(owner)
        .setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

      const initialAllowance = await roles.allowances(ALLOWANCE_KEY);

      await time.increase(1000);

      await roles
        .connect(owner)
        .updateAllowance(ALLOWANCE_KEY, 2000, 200, 7200);

      const allowance = await roles.allowances(ALLOWANCE_KEY);
      expect(allowance.timestamp).to.equal(initialAllowance.timestamp);
    });

    it("sets maxRefill to max uint128 when passed 0", async () => {
      const { roles, owner, ALLOWANCE_KEY } = await loadFixture(setup);

      await roles
        .connect(owner)
        .setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

      await roles.connect(owner).updateAllowance(ALLOWANCE_KEY, 0, 200, 7200);

      const allowance = await roles.allowances(ALLOWANCE_KEY);
      expect(allowance.maxRefill).to.equal(
        BigInt("0xffffffffffffffffffffffffffffffff"),
      );
    });

    it("emits SetAllowance event with preserved balance and timestamp", async () => {
      const { roles, owner, ALLOWANCE_KEY } = await loadFixture(setup);

      await roles
        .connect(owner)
        .setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

      const initialAllowance = await roles.allowances(ALLOWANCE_KEY);

      await expect(
        roles.connect(owner).updateAllowance(ALLOWANCE_KEY, 2000, 200, 7200),
      )
        .to.emit(roles, "SetAllowance")
        .withArgs(
          ALLOWANCE_KEY,
          500, // balance preserved
          2000,
          200,
          7200,
          initialAllowance.timestamp, // timestamp preserved
        );
    });
  });

  describe("Accrual (refill)", () => {
    async function setupAccrual() {
      const [owner] = await hre.ethers.getSigners();

      const Avatar = await hre.ethers.getContractFactory("TestAvatar");
      const avatar = await Avatar.deploy();
      const avatarAddress = await avatar.getAddress();

      const roles = await deployRolesMod(
        hre,
        owner.address,
        avatarAddress,
        avatarAddress,
      );

      const ALLOWANCE_KEY = hre.ethers.id("ACCRUAL_TEST");

      return { roles, owner, ALLOWANCE_KEY };
    }

    describe("period = 0 (no refill)", () => {
      it("never refills when period is 0", async () => {
        const { roles, owner, ALLOWANCE_KEY } = await loadFixture(setupAccrual);

        // Set allowance with period = 0 (no refill)
        await roles
          .connect(owner)
          .setAllowance(ALLOWANCE_KEY, 500, 10000, 100, 0, 0);

        // Advance time significantly
        await time.increase(9000);

        const { balance, timestamp: ts } =
          await roles.accruedAllowance(ALLOWANCE_KEY);

        // Balance should not change with period = 0
        expect(balance).to.equal(500);
        // Timestamp should be the original set timestamp
        const allowance = await roles.allowances(ALLOWANCE_KEY);
        expect(ts).to.equal(allowance.timestamp);
      });

      it("allowance is strictly decreasing", async () => {
        const {
          roles,
          owner,
          member,
          testContract,
          testContractAddress,
          ROLE_KEY,
          ALLOWANCE_KEY,
        } = await loadFixture(setup);

        await roles
          .connect(owner)
          .setAllowance(ALLOWANCE_KEY, 1000, 0, 0, 0, 0);

        const selector =
          testContract.interface.getFunction("oneParamStatic").selector;
        await roles.connect(owner).allowFunction(
          ROLE_KEY,
          testContractAddress,
          selector,
          [
            {
              parent: 0,
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              compValue: "0x",
            },
            {
              parent: 0,
              paramType: Encoding.Static,
              operator: Operator.WithinAllowance,
              compValue: ALLOWANCE_KEY,
            },
          ],
          ExecutionOptions.None,
        );

        const calldata = (
          await testContract.oneParamStatic.populateTransaction(100)
        ).data as string;

        await roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, calldata, 0);

        const { balance: balanceAfterFirst } =
          await roles.accruedAllowance(ALLOWANCE_KEY);
        expect(balanceAfterFirst).to.equal(900);

        await time.increase(10000);

        // Should still be 900 after time passes (no refill)
        await roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, calldata, 0);

        const { balance: balanceAfterSecond } =
          await roles.accruedAllowance(ALLOWANCE_KEY);
        expect(balanceAfterSecond).to.equal(800);
      });
    });

    describe("period-based accrual", () => {
      it("does not accrue when elapsed time < period, balance and timestamp unchanged", async () => {
        const { roles, owner, ALLOWANCE_KEY } = await loadFixture(setupAccrual);

        await roles
          .connect(owner)
          .setAllowance(ALLOWANCE_KEY, 500, 10000, 100, 600, 0);

        const initialAllowance = await roles.allowances(ALLOWANCE_KEY);

        // Advance time by 1 second less than one period
        await time.increase(599);

        const { balance, timestamp } =
          await roles.accruedAllowance(ALLOWANCE_KEY);

        expect(balance).to.equal(500);
        expect(timestamp).to.equal(initialAllowance.timestamp);
      });

      it("accrues one refill after exactly one period, updates timestamp", async () => {
        const { roles, owner, ALLOWANCE_KEY } = await loadFixture(setupAccrual);

        await roles
          .connect(owner)
          .setAllowance(ALLOWANCE_KEY, 500, 10000, 100, 600, 0);

        const initialAllowance = await roles.allowances(ALLOWANCE_KEY);

        await time.increase(600);

        const { balance, timestamp } =
          await roles.accruedAllowance(ALLOWANCE_KEY);

        expect(balance).to.equal(600); // 500 + 100
        expect(timestamp).to.equal(initialAllowance.timestamp + 600n);
      });

      it("accrues multiple refills after several full periods", async () => {
        const { roles, owner, ALLOWANCE_KEY } = await loadFixture(setupAccrual);

        await roles
          .connect(owner)
          .setAllowance(ALLOWANCE_KEY, 500, 10000, 100, 600, 0);

        const initialAllowance = await roles.allowances(ALLOWANCE_KEY);

        // Advance time by 5 periods (3000 seconds)
        await time.increase(3000);

        const { balance, timestamp } =
          await roles.accruedAllowance(ALLOWANCE_KEY);

        expect(balance).to.equal(1000); // 500 + 100 * 5
        expect(timestamp).to.equal(initialAllowance.timestamp + 3000n);
      });

      it("accrues only full periods, partial period ignored (3.5 periods)", async () => {
        const { roles, owner, ALLOWANCE_KEY } = await loadFixture(setupAccrual);

        await roles
          .connect(owner)
          .setAllowance(ALLOWANCE_KEY, 500, 10000, 100, 600, 0);

        const initialAllowance = await roles.allowances(ALLOWANCE_KEY);

        // Advance time by 3.5 periods (2100 seconds)
        await time.increase(2100);

        const { balance, timestamp } =
          await roles.accruedAllowance(ALLOWANCE_KEY);

        expect(balance).to.equal(800); // 500 + 100 * 3
        expect(timestamp).to.equal(initialAllowance.timestamp + 1800n); // 3 full periods
      });

      it("zero refill keeps balance unchanged, timestamp still advances", async () => {
        const { roles, owner, ALLOWANCE_KEY } = await loadFixture(setupAccrual);

        // refill = 0, but period > 0
        await roles
          .connect(owner)
          .setAllowance(ALLOWANCE_KEY, 500, 10000, 0, 600, 0);

        const initialAllowance = await roles.allowances(ALLOWANCE_KEY);

        await time.increase(3000); // 5 periods

        const { balance, timestamp } =
          await roles.accruedAllowance(ALLOWANCE_KEY);

        expect(balance).to.equal(500); // unchanged
        expect(timestamp).to.equal(initialAllowance.timestamp + 3000n); // still advances
      });
    });

    describe("maxRefill cap", () => {
      it("balance capped at maxRefill even after many periods", async () => {
        const { roles, owner, ALLOWANCE_KEY } = await loadFixture(setupAccrual);

        await roles
          .connect(owner)
          .setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 600, 0);

        // Advance time by 10 periods - would be 1500 uncapped
        await time.increase(6000);

        const { balance } = await roles.accruedAllowance(ALLOWANCE_KEY);
        expect(balance).to.equal(1000);
      });

      it("timestamp updates even when balance already at cap", async () => {
        const { roles, owner, ALLOWANCE_KEY } = await loadFixture(setupAccrual);

        await roles
          .connect(owner)
          .setAllowance(ALLOWANCE_KEY, 1000, 1000, 100, 600, 0);

        const initialAllowance = await roles.allowances(ALLOWANCE_KEY);

        // Advance time by 5 periods
        await time.increase(3000);

        const { balance, timestamp } =
          await roles.accruedAllowance(ALLOWANCE_KEY);
        expect(balance).to.equal(1000);
        expect(timestamp).to.equal(initialAllowance.timestamp + 3000n);
      });

      it("partial refill reaching cap, excess discarded", async () => {
        const { roles, owner, ALLOWANCE_KEY } = await loadFixture(setupAccrual);

        // Balance 900, maxRefill 1000, refill 100 per period
        // After 2 periods would be 1100, but caps at 1000
        await roles
          .connect(owner)
          .setAllowance(ALLOWANCE_KEY, 900, 1000, 100, 600, 0);

        await time.increase(1200);

        const { balance } = await roles.accruedAllowance(ALLOWANCE_KEY);
        expect(balance).to.equal(1000);
      });

      it("initial balance above maxRefill stays unchanged, timestamp advances", async () => {
        const { roles, owner, ALLOWANCE_KEY } = await loadFixture(setupAccrual);

        // Initial balance (1500) exceeds maxRefill (1000)
        await roles
          .connect(owner)
          .setAllowance(ALLOWANCE_KEY, 1500, 1000, 100, 600, 0);

        const initialAllowance = await roles.allowances(ALLOWANCE_KEY);

        await time.increase(3000); // 5 periods

        const { balance, timestamp } =
          await roles.accruedAllowance(ALLOWANCE_KEY);
        expect(balance).to.equal(1500); // unchanged, not capped down
        expect(timestamp).to.equal(initialAllowance.timestamp + 3000n);
      });
    });
  });

  describe("Multi-entrypoint allowance", () => {
    async function setupMultisend() {
      const base = await setup();

      const TestEncoder = await hre.ethers.getContractFactory("TestEncoder");
      const testEncoder = await TestEncoder.deploy();
      const testEncoderAddress = await testEncoder.getAddress();

      await base.roles
        .connect(base.owner)
        .scopeTarget(base.ROLE_KEY, testEncoderAddress);

      const MultiSend = await hre.ethers.getContractFactory("MultiSend");
      const multisend = await MultiSend.deploy();
      const multisendAddress = await multisend.getAddress();

      const MultiSendUnwrapper =
        await hre.ethers.getContractFactory("MultiSendUnwrapper");
      const adapter = await MultiSendUnwrapper.deploy();
      const adapterAddress = await adapter.getAddress();

      await base.roles
        .connect(base.owner)
        .setTransactionUnwrapper(
          multisendAddress,
          multisend.interface.getFunction("multiSend").selector,
          adapterAddress,
        );

      return {
        ...base,
        testEncoder,
        testEncoderAddress,
        multisend,
        multisendAddress,
      };
    }

    it("shares allowance across multiple entry points", async () => {
      const {
        roles,
        owner,
        member,
        testContract,
        testContractAddress,
        multisend,
        multisendAddress,
        ROLE_KEY,
        ALLOWANCE_KEY,
      } = await loadFixture(setupMultisend);

      await roles.connect(owner).setAllowance(ALLOWANCE_KEY, 200, 0, 0, 0, 0);

      const selector1 =
        testContract.interface.getFunction("oneParamStatic").selector;
      await roles.connect(owner).allowFunction(
        ROLE_KEY,
        testContractAddress,
        selector1,
        [
          {
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.WithinAllowance,
            compValue: ALLOWANCE_KEY,
          },
        ],
        ExecutionOptions.None,
      );

      const selector2 =
        testContract.interface.getFunction("twoParamsStatic").selector;
      await roles.connect(owner).allowFunction(
        ROLE_KEY,
        testContractAddress,
        selector2,
        [
          {
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.WithinAllowance,
            compValue: ALLOWANCE_KEY,
          },
          {
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: "0x",
          },
        ],
        ExecutionOptions.None,
      );

      const multisendCalldata = (
        await multisend.multiSend.populateTransaction(
          encodeMultisendPayload([
            {
              to: testContractAddress,
              value: 0,
              data: (await testContract.oneParamStatic.populateTransaction(50))
                .data as string,
              operation: 0,
            },
            {
              to: testContractAddress,
              value: 0,
              data: (
                await testContract.twoParamsStatic.populateTransaction(60, 999)
              ).data as string,
              operation: 0,
            },
          ]),
        )
      ).data as string;

      const { balance: balanceBefore } =
        await roles.accruedAllowance(ALLOWANCE_KEY);
      expect(balanceBefore).to.equal(200);

      await roles
        .connect(member)
        .execTransactionFromModule(multisendAddress, 0, multisendCalldata, 1);

      // Both consumed from same allowance: 200 - 50 - 60 = 90
      const { balance: balanceAfter } =
        await roles.accruedAllowance(ALLOWANCE_KEY);
      expect(balanceAfter).to.equal(90);
    });

    it("accumulates consumption from unwrapped transactions", async () => {
      const {
        roles,
        owner,
        member,
        testContract,
        testContractAddress,
        multisend,
        multisendAddress,
        ROLE_KEY,
        ALLOWANCE_KEY,
      } = await loadFixture(setupMultisend);

      await roles.connect(owner).setAllowance(ALLOWANCE_KEY, 75, 0, 0, 0, 0);

      const selector =
        testContract.interface.getFunction("oneParamStatic").selector;
      await roles.connect(owner).allowFunction(
        ROLE_KEY,
        testContractAddress,
        selector,
        [
          {
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.WithinAllowance,
            compValue: ALLOWANCE_KEY,
          },
        ],
        ExecutionOptions.None,
      );

      // 40 + 40 = 80 > 75, should fail
      const multisendCalldata = (
        await multisend.multiSend.populateTransaction(
          encodeMultisendPayload([
            {
              to: testContractAddress,
              value: 0,
              data: (await testContract.oneParamStatic.populateTransaction(40))
                .data as string,
              operation: 0,
            },
            {
              to: testContractAddress,
              value: 0,
              data: (await testContract.oneParamStatic.populateTransaction(40))
                .data as string,
              operation: 0,
            },
          ]),
        )
      ).data as string;

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(multisendAddress, 0, multisendCalldata, 1),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.AllowanceExceeded, ALLOWANCE_KEY);

      // Balance unchanged
      const { balance } = await roles.accruedAllowance(ALLOWANCE_KEY);
      expect(balance).to.equal(75);
    });

    it("persists total consumption after bundle", async () => {
      const {
        roles,
        owner,
        member,
        testContract,
        testContractAddress,
        multisend,
        multisendAddress,
        ROLE_KEY,
        ALLOWANCE_KEY,
      } = await loadFixture(setupMultisend);

      await roles.connect(owner).setAllowance(ALLOWANCE_KEY, 200, 0, 0, 0, 0);

      const selector =
        testContract.interface.getFunction("oneParamStatic").selector;
      await roles.connect(owner).allowFunction(
        ROLE_KEY,
        testContractAddress,
        selector,
        [
          {
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.WithinAllowance,
            compValue: ALLOWANCE_KEY,
          },
        ],
        ExecutionOptions.None,
      );

      const multisendCalldata = (
        await multisend.multiSend.populateTransaction(
          encodeMultisendPayload([
            {
              to: testContractAddress,
              value: 0,
              data: (await testContract.oneParamStatic.populateTransaction(30))
                .data as string,
              operation: 0,
            },
            {
              to: testContractAddress,
              value: 0,
              data: (await testContract.oneParamStatic.populateTransaction(50))
                .data as string,
              operation: 0,
            },
            {
              to: testContractAddress,
              value: 0,
              data: (await testContract.oneParamStatic.populateTransaction(20))
                .data as string,
              operation: 0,
            },
          ]),
        )
      ).data as string;

      await roles
        .connect(member)
        .execTransactionFromModule(multisendAddress, 0, multisendCalldata, 1);

      // 200 - 30 - 50 - 20 = 100
      const { balance } = await roles.accruedAllowance(ALLOWANCE_KEY);
      expect(balance).to.equal(100);
    });
  });

  describe("Settlement (persistence)", () => {
    describe("successful execution", () => {
      it("persists consumption to storage", async () => {
        const {
          roles,
          owner,
          member,
          testContract,
          testContractAddress,
          ROLE_KEY,
          ALLOWANCE_KEY,
        } = await loadFixture(setup);

        await roles
          .connect(owner)
          .setAllowance(ALLOWANCE_KEY, 1000, 0, 0, 0, 0);

        const selector =
          testContract.interface.getFunction("oneParamStatic").selector;
        await roles.connect(owner).allowFunction(
          ROLE_KEY,
          testContractAddress,
          selector,
          [
            {
              parent: 0,
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              compValue: "0x",
            },
            {
              parent: 0,
              paramType: Encoding.Static,
              operator: Operator.WithinAllowance,
              compValue: ALLOWANCE_KEY,
            },
          ],
          ExecutionOptions.None,
        );

        const calldata = (
          await testContract.oneParamStatic.populateTransaction(100)
        ).data as string;

        await roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, calldata, 0);

        const { balance } = await roles.accruedAllowance(ALLOWANCE_KEY);
        expect(balance).to.equal(900);
      });

      it("emits ConsumeAllowance event for each consumption", async () => {
        const {
          roles,
          owner,
          member,
          testContract,
          testContractAddress,
          ROLE_KEY,
          ALLOWANCE_KEY,
        } = await loadFixture(setup);

        await roles
          .connect(owner)
          .setAllowance(ALLOWANCE_KEY, 1000, 0, 0, 0, 0);

        const selector =
          testContract.interface.getFunction("oneParamStatic").selector;
        await roles.connect(owner).allowFunction(
          ROLE_KEY,
          testContractAddress,
          selector,
          [
            {
              parent: 0,
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              compValue: "0x",
            },
            {
              parent: 0,
              paramType: Encoding.Static,
              operator: Operator.WithinAllowance,
              compValue: ALLOWANCE_KEY,
            },
          ],
          ExecutionOptions.None,
        );

        const calldata = (
          await testContract.oneParamStatic.populateTransaction(100)
        ).data as string;

        await expect(
          roles
            .connect(member)
            .execTransactionFromModule(testContractAddress, 0, calldata, 0),
        ).to.emit(roles, "ConsumeAllowance");
      });
    });

    describe("failed execution", () => {
      it("does not persist consumptions on inner failure", async () => {
        const {
          roles,
          owner,
          member,
          testContract,
          testContractAddress,
          ROLE_KEY,
          ALLOWANCE_KEY,
        } = await loadFixture(setup);

        await roles
          .connect(owner)
          .setAllowance(ALLOWANCE_KEY, 1000, 0, 0, 0, 0);

        const selector =
          testContract.interface.getFunction("fnThatMaybeReverts").selector;
        await roles.connect(owner).allowFunction(
          ROLE_KEY,
          testContractAddress,
          selector,
          [
            {
              parent: 0,
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              compValue: "0x",
            },
            {
              parent: 0,
              paramType: Encoding.Static,
              operator: Operator.WithinAllowance,
              compValue: ALLOWANCE_KEY,
            },
            {
              parent: 0,
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
          ],
          ExecutionOptions.None,
        );

        // Call with shouldRevert = true
        const calldata = (
          await testContract.fnThatMaybeReverts.populateTransaction(100, true)
        ).data as string;

        await roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, calldata, 0);

        // Balance unchanged because inner call failed
        const { balance } = await roles.accruedAllowance(ALLOWANCE_KEY);
        expect(balance).to.equal(1000);
      });

      it("does not modify allowance state", async () => {
        const {
          roles,
          owner,
          member,
          testContract,
          testContractAddress,
          ROLE_KEY,
          ALLOWANCE_KEY,
        } = await loadFixture(setup);

        await roles
          .connect(owner)
          .setAllowance(ALLOWANCE_KEY, 1000, 2000, 100, 3600, 0);

        const initialAllowance = await roles.allowances(ALLOWANCE_KEY);

        const selector =
          testContract.interface.getFunction("fnThatMaybeReverts").selector;
        await roles.connect(owner).allowFunction(
          ROLE_KEY,
          testContractAddress,
          selector,
          [
            {
              parent: 0,
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              compValue: "0x",
            },
            {
              parent: 0,
              paramType: Encoding.Static,
              operator: Operator.WithinAllowance,
              compValue: ALLOWANCE_KEY,
            },
            {
              parent: 0,
              paramType: Encoding.Static,
              operator: Operator.Pass,
              compValue: "0x",
            },
          ],
          ExecutionOptions.None,
        );

        const calldata = (
          await testContract.fnThatMaybeReverts.populateTransaction(100, true)
        ).data as string;

        await roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, calldata, 0);

        const afterAllowance = await roles.allowances(ALLOWANCE_KEY);
        expect(afterAllowance.balance).to.equal(initialAllowance.balance);
        expect(afterAllowance.maxRefill).to.equal(initialAllowance.maxRefill);
        expect(afterAllowance.refill).to.equal(initialAllowance.refill);
        expect(afterAllowance.period).to.equal(initialAllowance.period);
      });
    });
  });

  describe("Edge cases", () => {
    it("handles balance above maxRefill getting consumed", async () => {
      const {
        roles,
        owner,
        member,
        testContract,
        testContractAddress,
        ROLE_KEY,
        ALLOWANCE_KEY,
      } = await loadFixture(setup);

      // Set balance (1300) > maxRefill (1000)
      await roles
        .connect(owner)
        .setAllowance(ALLOWANCE_KEY, 1300, 1000, 100, 3600, 0);

      const selector =
        testContract.interface.getFunction("oneParamStatic").selector;
      await roles.connect(owner).allowFunction(
        ROLE_KEY,
        testContractAddress,
        selector,
        [
          {
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.WithinAllowance,
            compValue: ALLOWANCE_KEY,
          },
        ],
        ExecutionOptions.None,
      );

      const calldata = (
        await testContract.oneParamStatic.populateTransaction(1200)
      ).data as string;

      await roles
        .connect(member)
        .execTransactionFromModule(testContractAddress, 0, calldata, 0);

      // 1300 - 1200 = 100
      const { balance } = await roles.accruedAllowance(ALLOWANCE_KEY);
      expect(balance).to.equal(100);
    });
  });

  describe("Event emissions", () => {
    it("emits SetAllowance on setAllowance", async () => {
      const { roles, owner, ALLOWANCE_KEY } = await loadFixture(setup);

      await expect(
        roles
          .connect(owner)
          .setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0),
      ).to.emit(roles, "SetAllowance");
    });

    it("emits SetAllowance on updateAllowance", async () => {
      const { roles, owner, ALLOWANCE_KEY } = await loadFixture(setup);

      await roles
        .connect(owner)
        .setAllowance(ALLOWANCE_KEY, 500, 1000, 100, 3600, 0);

      await expect(
        roles.connect(owner).updateAllowance(ALLOWANCE_KEY, 2000, 200, 7200),
      ).to.emit(roles, "SetAllowance");
    });

    it("emits ConsumeAllowance on successful consumption", async () => {
      const {
        roles,
        owner,
        member,
        testContract,
        testContractAddress,
        ROLE_KEY,
        ALLOWANCE_KEY,
      } = await loadFixture(setup);

      await roles.connect(owner).setAllowance(ALLOWANCE_KEY, 1000, 0, 0, 0, 0);

      const selector =
        testContract.interface.getFunction("oneParamStatic").selector;
      await roles.connect(owner).allowFunction(
        ROLE_KEY,
        testContractAddress,
        selector,
        [
          {
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.WithinAllowance,
            compValue: ALLOWANCE_KEY,
          },
        ],
        ExecutionOptions.None,
      );

      const calldata = (
        await testContract.oneParamStatic.populateTransaction(100)
      ).data as string;

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, calldata, 0),
      )
        .to.emit(roles, "ConsumeAllowance")
        .withArgs(ALLOWANCE_KEY, 100, 900);
    });

    it("ConsumeAllowance includes consumed amount and new balance", async () => {
      const {
        roles,
        owner,
        member,
        testContract,
        testContractAddress,
        ROLE_KEY,
        ALLOWANCE_KEY,
      } = await loadFixture(setup);

      await roles.connect(owner).setAllowance(ALLOWANCE_KEY, 500, 0, 0, 0, 0);

      const selector =
        testContract.interface.getFunction("oneParamStatic").selector;
      await roles.connect(owner).allowFunction(
        ROLE_KEY,
        testContractAddress,
        selector,
        [
          {
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.WithinAllowance,
            compValue: ALLOWANCE_KEY,
          },
        ],
        ExecutionOptions.None,
      );

      const calldata = (
        await testContract.oneParamStatic.populateTransaction(150)
      ).data as string;

      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(testContractAddress, 0, calldata, 0),
      )
        .to.emit(roles, "ConsumeAllowance")
        .withArgs(ALLOWANCE_KEY, 150, 350);
    });
  });
});
