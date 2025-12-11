import { expect } from "chai";
import hre from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

import {
  AbiCoder,
  BigNumberish,
  parseEther,
  solidityPacked,
  ZeroHash,
} from "ethers";

const defaultAbiCoder = AbiCoder.defaultAbiCoder();

import {
  Encoding,
  Operator,
  ExecutionOptions,
  PermissionCheckerStatus,
  flattenCondition,
} from "../utils";
import { deployRolesMod } from "../setup";

const ROLE_KEY =
  "0x0000000000000000000000000000000000000000000000000000000000000001";

describe("Operator - EtherWithinAllowance", async () => {
  async function setup() {
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();

    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();

    const [owner, invoker] = await hre.ethers.getSigners();
    const testAddress = await testContract.getAddress();
    const avatarAddress = await avatar.getAddress();
    // fund avatar
    await invoker.sendTransaction({
      to: avatarAddress,
      value: parseEther("1"),
    });
    const roles = await deployRolesMod(
      hre,
      owner.address,
      avatarAddress,
      avatarAddress,
    );
    await roles.enableModule(invoker.address);

    async function setAllowance({
      key,
      balance,
      maxRefill,
      refill,
      period,
      timestamp,
    }: {
      key: string;
      balance: BigNumberish;
      maxRefill?: BigNumberish;
      refill: BigNumberish;
      period: BigNumberish;
      timestamp: BigNumberish;
    }) {
      await roles
        .connect(owner)
        .setAllowance(key, balance, maxRefill || 0, refill, period, timestamp);
    }

    await roles.connect(owner).grantRole(invoker.address, ROLE_KEY, 0, 0, 0);
    await roles.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);
    await roles.connect(owner).scopeTarget(ROLE_KEY, testAddress);

    const allowanceKey =
      "0x0000000000000000000000000000000000000000000000000000000000000001";

    const SELECTOR = testContract.interface.getFunction(
      "receiveEthAndDoNothing",
    ).selector;

    await roles.connect(owner).scopeFunction(
      ROLE_KEY,
      testAddress,
      SELECTOR,
      [
        {
          parent: 0,
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          compValue: "0x",
        },
        {
          parent: 0,
          paramType: Encoding.None,
          operator: Operator.EtherWithinAllowance,
          compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
        },
      ],
      ExecutionOptions.Send,
    );

    async function sendEthAndDoNothing(value: BigNumberish) {
      return roles
        .connect(invoker)
        .execTransactionFromModule(
          testAddress,
          value,
          (await testContract.receiveEthAndDoNothing.populateTransaction())
            .data as string,
          0,
        );
    }

    return {
      owner,
      invoker,
      roles,
      testContract,
      allowanceKey,
      setAllowance,
      sendEthAndDoNothing,
    };
  }

  describe("EtherWithinAllowance - Check", () => {
    it("success - from existing balance", async () => {
      const { roles, allowanceKey, setAllowance, sendEthAndDoNothing } =
        await loadFixture(setup);

      const initialBalance = 10000;

      await setAllowance({
        key: allowanceKey,
        balance: initialBalance,
        period: 0,
        refill: 0,
        timestamp: 0,
      });

      expect((await roles.allowances(allowanceKey)).balance).to.equal(
        initialBalance,
      );

      await expect(sendEthAndDoNothing(initialBalance + 1))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.EtherAllowanceExceeded, allowanceKey);

      await expect(sendEthAndDoNothing(initialBalance)).to.not.be.reverted;
      await expect(sendEthAndDoNothing(1))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.EtherAllowanceExceeded, allowanceKey);

      expect((await roles.allowances(allowanceKey)).balance).to.equal(0);
    });
    it("success - from balance 0 but enough refill pending", async () => {
      const { roles, allowanceKey, setAllowance, sendEthAndDoNothing } =
        await loadFixture(setup);

      const timestamp = await time.latest();
      await setAllowance({
        key: allowanceKey,
        balance: 250,
        period: 500,
        refill: 100,
        timestamp: timestamp - 750,
      });

      await expect(sendEthAndDoNothing(351))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.EtherAllowanceExceeded, allowanceKey);

      await expect(sendEthAndDoNothing(350)).to.not.be.reverted;
      await expect(sendEthAndDoNothing(1))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.EtherAllowanceExceeded, allowanceKey);
    });
    it("fail - insufficient balance and not enough elapsed for next refill", async () => {
      const { roles, allowanceKey, setAllowance, sendEthAndDoNothing } =
        await loadFixture(setup);

      const timestamp = await time.latest();
      await setAllowance({
        key: allowanceKey,
        balance: 9,
        period: 1000,
        refill: 1,
        timestamp: timestamp - 50,
      });

      await expect(sendEthAndDoNothing(10))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.EtherAllowanceExceeded, allowanceKey);

      await expect(sendEthAndDoNothing(9)).to.not.be.reverted;
      await expect(sendEthAndDoNothing(1))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.EtherAllowanceExceeded, allowanceKey);
    });
  });

  describe("EtherWithinAllowance - Variants", () => {
    it("enforces different eth allowances per variant", async () => {
      const { owner, invoker, roles, testContract, setAllowance } =
        await loadFixture(setup);
      const testAddress = await testContract.getAddress();
      const SELECTOR =
        testContract.interface.getFunction("oneParamStatic").selector;

      const allowanceKey1 =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const allowanceKey2 =
        "0x0000000000000000000000000000000000000000000000000000000000000002";
      const allowanceAmount1 = 200;
      const allowanceAmount2 = 100;
      const value1 = 777;
      const value2 = 888;
      const valueOther = 9999;

      await setAllowance({
        key: allowanceKey1,
        balance: allowanceAmount1,
        period: 0,
        refill: 0,
        timestamp: 0,
      });

      await setAllowance({
        key: allowanceKey2,
        balance: allowanceAmount2,
        period: 0,
        refill: 0,
        timestamp: 0,
      });

      await roles.connect(owner).scopeFunction(
        ROLE_KEY,
        testAddress,
        SELECTOR,
        [
          {
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.Or,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 1,
            paramType: Encoding.Static,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["uint256"], [value1]),
          },
          {
            parent: 1,
            paramType: Encoding.None,
            operator: Operator.EtherWithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey1]),
          },
          {
            parent: 2,
            paramType: Encoding.Static,
            operator: Operator.EqualTo,
            compValue: defaultAbiCoder.encode(["uint256"], [value2]),
          },
          {
            parent: 2,
            paramType: Encoding.None,
            operator: Operator.EtherWithinAllowance,
            compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey2]),
          },
        ],
        ExecutionOptions.Send,
      );

      async function invoke(value: BigNumberish, p: BigNumberish) {
        return roles
          .connect(invoker)
          .execTransactionFromModule(
            testAddress,
            value,
            (await testContract.oneParamStatic.populateTransaction(p))
              .data as string,
            0,
          );
      }

      /*
       * First check valueOther which, hits no variant
       */
      await expect(invoke(1000, valueOther))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.OrViolation, ZeroHash);

      // Exceed value for Variant1
      await expect(invoke(allowanceAmount1 + 1, value1))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.OrViolation, ZeroHash);

      // Exceed value for Variant2
      await expect(invoke(allowanceAmount2 + 1, value2))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.OrViolation, ZeroHash);

      // Checks that both allowance balances still remain unchanged
      expect((await roles.allowances(allowanceKey1)).balance).to.equal(
        allowanceAmount1,
      );
      expect((await roles.allowances(allowanceKey2)).balance).to.equal(
        allowanceAmount2,
      );

      /*
       * Exhaust Allowance from Variant 1
       */
      await expect(invoke(allowanceAmount1, value1)).to.not.be.reverted;
      // check that allowance 1 is updated to zero
      expect((await roles.allowances(allowanceKey1)).balance).to.equal(0);
      // check that allowance 2 remains unchanged
      expect((await roles.allowances(allowanceKey2)).balance).to.equal(
        allowanceAmount2,
      );

      /*
       * Exhaust Allowance from Variant 2
       */
      await expect(invoke(allowanceAmount2, value2)).to.not.be.reverted;
      // check that both balances are now zero
      expect((await roles.allowances(allowanceKey1)).balance).to.equal(0);
      expect((await roles.allowances(allowanceKey2)).balance).to.equal(0);

      // check that neither variant can now be invoked
      await expect(invoke(1, value1))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.OrViolation, ZeroHash);

      await expect(invoke(1, value2))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.OrViolation, ZeroHash);
    });
  });

  describe("EtherWithinAllowance - Logical Combinations", () => {
    it("AND(EtherWithinAllowance, SomeParamComparison)", async () => {
      const Avatar = await hre.ethers.getContractFactory("TestAvatar");
      const avatar = await Avatar.deploy();

      const TestContract = await hre.ethers.getContractFactory("TestContract");
      const testContract = await TestContract.deploy();

      const [owner, invoker] = await hre.ethers.getSigners();
      const testAddress = await testContract.getAddress();
      const avatarAddress = await avatar.getAddress();

      await invoker.sendTransaction({
        to: avatarAddress,
        value: parseEther("1"),
      });

      const roles = await deployRolesMod(
        hre,
        owner.address,
        avatarAddress,
        avatarAddress,
      );
      await roles.enableModule(invoker.address);
      await roles.connect(owner).grantRole(invoker.address, ROLE_KEY, 0, 0, 0);
      await roles.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);
      await roles.connect(owner).scopeTarget(ROLE_KEY, testAddress);

      const allowanceKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const allowedValue = 42;

      await roles.connect(owner).setAllowance(allowanceKey, 1000, 0, 0, 0, 0);

      const SELECTOR =
        testContract.interface.getFunction("fnWithSingleParam").selector;

      // Structure: And -> [Calldata -> Static, EtherWithinAllowance] (EtherWithinAllowance sibling of Calldata)
      await roles.connect(owner).scopeFunction(
        ROLE_KEY,
        testAddress,
        SELECTOR,
        flattenCondition({
          paramType: Encoding.None,
          operator: Operator.And,
          children: [
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: defaultAbiCoder.encode(
                    ["uint256"],
                    [allowedValue],
                  ),
                },
              ],
            },
            {
              paramType: Encoding.None,
              operator: Operator.EtherWithinAllowance,
              compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
            },
          ],
        }),
        ExecutionOptions.Send,
      );

      async function invoke(value: BigNumberish, p: BigNumberish) {
        return roles
          .connect(invoker)
          .execTransactionFromModule(
            testAddress,
            value,
            (await testContract.fnWithSingleParam.populateTransaction(p))
              .data as string,
            0,
          );
      }

      // Wrong param value - should fail
      await expect(invoke(100, 999))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.ParameterNotAllowed, ZeroHash);

      // Correct param but exceeds allowance - should fail
      await expect(invoke(1001, allowedValue))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.EtherAllowanceExceeded, allowanceKey);

      // Correct param and within allowance - should succeed
      await expect(invoke(500, allowedValue)).to.not.be.reverted;
      expect((await roles.allowances(allowanceKey)).balance).to.equal(500);

      // Exhaust remaining allowance
      await expect(invoke(500, allowedValue)).to.not.be.reverted;
      expect((await roles.allowances(allowanceKey)).balance).to.equal(0);

      // Now any call should fail due to exhausted allowance
      await expect(invoke(1, allowedValue))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.EtherAllowanceExceeded, allowanceKey);
    });

    it("AND(EtherWithinAllowance, OR(ParamA, ParamB))", async () => {
      const Avatar = await hre.ethers.getContractFactory("TestAvatar");
      const avatar = await Avatar.deploy();

      const TestContract = await hre.ethers.getContractFactory("TestContract");
      const testContract = await TestContract.deploy();

      const [owner, invoker] = await hre.ethers.getSigners();
      const testAddress = await testContract.getAddress();
      const avatarAddress = await avatar.getAddress();

      await invoker.sendTransaction({
        to: avatarAddress,
        value: parseEther("1"),
      });

      const roles = await deployRolesMod(
        hre,
        owner.address,
        avatarAddress,
        avatarAddress,
      );
      await roles.enableModule(invoker.address);
      await roles.connect(owner).grantRole(invoker.address, ROLE_KEY, 0, 0, 0);
      await roles.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);
      await roles.connect(owner).scopeTarget(ROLE_KEY, testAddress);

      const allowanceKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const allowedValueA = 100;
      const allowedValueB = 200;

      await roles.connect(owner).setAllowance(allowanceKey, 1000, 0, 0, 0, 0);

      const SELECTOR =
        testContract.interface.getFunction("fnWithSingleParam").selector;

      // Structure: And -> [Calldata -> Or, EtherWithinAllowance] (EtherWithinAllowance sibling of Calldata)
      await roles.connect(owner).scopeFunction(
        ROLE_KEY,
        testAddress,
        SELECTOR,
        flattenCondition({
          paramType: Encoding.None,
          operator: Operator.And,
          children: [
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.None,
                  operator: Operator.Or,
                  children: [
                    {
                      paramType: Encoding.Static,
                      operator: Operator.EqualTo,
                      compValue: defaultAbiCoder.encode(
                        ["uint256"],
                        [allowedValueA],
                      ),
                    },
                    {
                      paramType: Encoding.Static,
                      operator: Operator.EqualTo,
                      compValue: defaultAbiCoder.encode(
                        ["uint256"],
                        [allowedValueB],
                      ),
                    },
                  ],
                },
              ],
            },
            {
              paramType: Encoding.None,
              operator: Operator.EtherWithinAllowance,
              compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
            },
          ],
        }),
        ExecutionOptions.Send,
      );

      async function invoke(value: BigNumberish, p: BigNumberish) {
        return roles
          .connect(invoker)
          .execTransactionFromModule(
            testAddress,
            value,
            (await testContract.fnWithSingleParam.populateTransaction(p))
              .data as string,
            0,
          );
      }

      // Wrong param value (not A or B) - should fail
      await expect(invoke(100, 999))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.OrViolation, ZeroHash);

      // Allowed value A, within allowance - should succeed
      await expect(invoke(300, allowedValueA)).to.not.be.reverted;
      expect((await roles.allowances(allowanceKey)).balance).to.equal(700);

      // Allowed value B, within allowance - should succeed
      await expect(invoke(400, allowedValueB)).to.not.be.reverted;
      expect((await roles.allowances(allowanceKey)).balance).to.equal(300);

      // Allowed value A, exceeds remaining allowance - should fail
      await expect(invoke(500, allowedValueA))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.EtherAllowanceExceeded, allowanceKey);

      // Exhaust remaining allowance with value B
      await expect(invoke(300, allowedValueB)).to.not.be.reverted;
      expect((await roles.allowances(allowanceKey)).balance).to.equal(0);

      // Both values should now fail due to exhausted allowance
      await expect(invoke(1, allowedValueA))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.EtherAllowanceExceeded, allowanceKey);
      await expect(invoke(1, allowedValueB))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.EtherAllowanceExceeded, allowanceKey);
    });
  });

  describe("EtherWithinAllowance - Price Adapter", () => {
    it("works with PriceAdapter", async () => {
      const Avatar = await hre.ethers.getContractFactory("TestAvatar");
      const avatar = await Avatar.deploy();

      const TestContract = await hre.ethers.getContractFactory("TestContract");
      const testContract = await TestContract.deploy();

      const [owner, invoker] = await hre.ethers.getSigners();
      const testAddress = await testContract.getAddress();
      const avatarAddress = await avatar.getAddress();

      /*
       * ETH(18) → accrue USDC(6)
       */

      // fund avatar with 10 ETH
      await invoker.sendTransaction({
        to: avatarAddress,
        value: parseEther("10"),
      });

      const roles = await deployRolesMod(
        hre,
        owner.address,
        avatarAddress,
        avatarAddress,
      );
      await roles.enableModule(invoker.address);
      await roles.connect(owner).grantRole(invoker.address, ROLE_KEY, 0, 0, 0);
      await roles.connect(owner).setDefaultRole(invoker.address, ROLE_KEY);
      await roles.connect(owner).scopeTarget(ROLE_KEY, testAddress);

      const allowanceKey =
        "0x0000000000000000000000000000000000000000000000000000000000000001";

      // Deploy ETH/USD adapter: 1 ETH = 2000 USD
      const MockPriceAdapter =
        await hre.ethers.getContractFactory("MockPriceAdapter");
      const ethUsdAdapter = await MockPriceAdapter.deploy(2000n * 10n ** 18n);

      // Set allowance: 5000 USDC (6 decimals)
      await roles
        .connect(owner)
        .setAllowance(allowanceKey, 5000n * 10n ** 6n, 0, 0, 0, 0);

      const compValue = solidityPacked(
        ["bytes32", "address", "uint8", "uint8"],
        [allowanceKey, await ethUsdAdapter.getAddress(), 6, 18],
      );

      const SELECTOR = testContract.interface.getFunction(
        "receiveEthAndDoNothing",
      ).selector;

      await roles.connect(owner).scopeFunction(
        ROLE_KEY,
        testAddress,
        SELECTOR,
        [
          {
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: "0x",
          },
          {
            parent: 0,
            paramType: Encoding.None,
            operator: Operator.EtherWithinAllowance,
            compValue,
          },
        ],
        ExecutionOptions.Send,
      );

      async function sendEth(value: BigNumberish) {
        return roles
          .connect(invoker)
          .execTransactionFromModule(
            testAddress,
            value,
            (await testContract.receiveEthAndDoNothing.populateTransaction())
              .data as string,
            0,
          );
      }

      // Send 2 ETH → 2 * 2000 = 4000 USDC consumed
      await expect(sendEth(parseEther("2"))).to.not.be.reverted;

      let allowance = await roles.allowances(allowanceKey);
      expect(allowance.balance).to.equal(1000n * 10n ** 6n); // 5000 - 4000 = 1000 USDC

      // Send 0.5 ETH → 1000 USDC consumed, total 5000
      await expect(sendEth(parseEther("0.5"))).to.not.be.reverted;

      allowance = await roles.allowances(allowanceKey);
      expect(allowance.balance).to.equal(0);

      // Any more reverts (0.001 ETH = 2 USDC, but balance is 0)
      await expect(sendEth(parseEther("0.001")))
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(PermissionCheckerStatus.EtherAllowanceExceeded, allowanceKey);
    });
  });
});
