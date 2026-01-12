import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder, hexlify, Interface, randomBytes, ZeroHash } from "ethers";

import { setupTestContract } from "../setup";
import {
  Encoding,
  Operator,
  ExecutionOptions,
  ConditionViolationStatus,
  flattenCondition,
} from "../utils";

const abiCoder = AbiCoder.defaultAbiCoder();

describe("Operator - And", () => {
  describe("boolean logic", () => {
    const iface = new Interface(["function fn(uint256)"]);
    const fn = iface.getFunction("fn")!;

    it("passes when all children pass", async () => {
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      // And: GreaterThan(10) AND LessThan(20)
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.And,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.GreaterThan,
                  compValue: abiCoder.encode(["uint256"], [10]),
                },
                {
                  paramType: Encoding.Static,
                  operator: Operator.LessThan,
                  compValue: abiCoder.encode(["uint256"], [20]),
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // 15 satisfies both: >10 AND <20
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [15]),
            0,
          ),
      ).to.not.be.reverted;
    });

    it("fails on first child and short-circuits", async () => {
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      // And: GreaterThan(10) AND LessThan(20)
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.And,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.GreaterThan,
                  compValue: abiCoder.encode(["uint256"], [10]),
                },
                {
                  paramType: Encoding.Static,
                  operator: Operator.LessThan,
                  compValue: abiCoder.encode(["uint256"], [20]),
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // 5 fails first child (GreaterThan 10), never evaluates second
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [5]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterLessThanAllowed, ZeroHash);
    });

    it("fails on second child after first passes", async () => {
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      // And: GreaterThan(10) AND LessThan(20)
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.And,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.GreaterThan,
                  compValue: abiCoder.encode(["uint256"], [10]),
                },
                {
                  paramType: Encoding.Static,
                  operator: Operator.LessThan,
                  compValue: abiCoder.encode(["uint256"], [20]),
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // 25 passes first child (>10) but fails second (<20)
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [25]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(
          ConditionViolationStatus.ParameterGreaterThanAllowed,
          ZeroHash,
        );
    });
  });

  describe("payload routing", () => {
    it("passes same payload to structural children when non-variant", async () => {
      const iface = new Interface(["function fn(uint256)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      // Both children check the same parameter (non-variant: same payload to all)
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.And,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.GreaterThan,
                  compValue: abiCoder.encode(["uint256"], [10]),
                },
                {
                  paramType: Encoding.Static,
                  operator: Operator.LessThan,
                  compValue: abiCoder.encode(["uint256"], [100]),
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // 50 satisfies both conditions on same payload
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [50]),
            0,
          ),
      ).to.not.be.reverted;
    });

    it("passes individual child payloads when variant", async () => {
      const iface = new Interface(["function fn(bytes)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      // And has two variant children that interpret the bytes param differently:
      // - Child 1: AbiEncoded with one Dynamic (checks first bytes)
      // - Child 2: AbiEncoded with two Dynamics (checks both bytes)
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.And,
              children: [
                // Child 1: interpret as (bytes) - one dynamic
                {
                  paramType: Encoding.AbiEncoded,
                  operator: Operator.Matches,
                  compValue: "0x0000",
                  children: [
                    {
                      paramType: Encoding.Dynamic,
                      operator: Operator.EqualTo,
                      compValue: abiCoder.encode(["bytes"], ["0xaabbccdd"]),
                    },
                  ],
                },
                // Child 2: interpret as (bytes, bytes) - two dynamics
                {
                  paramType: Encoding.AbiEncoded,
                  operator: Operator.Matches,
                  compValue: "0x0000",
                  children: [
                    {
                      paramType: Encoding.Dynamic,
                      operator: Operator.EqualTo,
                      compValue: abiCoder.encode(["bytes"], ["0xaabbccdd"]),
                    },
                    {
                      paramType: Encoding.Dynamic,
                      operator: Operator.EqualTo,
                      compValue: abiCoder.encode(["bytes"], ["0x11223344"]),
                    },
                  ],
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Embedded bytes contains abi.encode(bytes, bytes)
      const embedded = abiCoder.encode(
        ["bytes", "bytes"],
        ["0xaabbccdd", "0x11223344"],
      );

      // Passes both children
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [embedded]),
            0,
          ),
      ).to.not.be.reverted;

      // Wrong first bytes - fails both children
      const wrongFirst = abiCoder.encode(
        ["bytes", "bytes"],
        ["0xffffffff", "0x11223344"],
      );
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [wrongFirst]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);

      // Wrong second bytes - fails child 2
      const wrongSecond = abiCoder.encode(
        ["bytes", "bytes"],
        ["0xaabbccdd", "0xffffffff"],
      );
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [wrongSecond]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);
    });

    it("passes empty payload to non-structural children", async () => {
      const iface = new Interface(["function fn(uint256)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      // And with: structural child (checks param) + non-structural (checks ether value)
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.None,
              operator: Operator.And,
              children: [
                // Structural: param must equal 42
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: abiCoder.encode(["uint256"], [42]),
                },
                // Non-structural: ether value must equal 123 (EtherValue -> empty payload)
                {
                  paramType: Encoding.EtherValue,
                  operator: Operator.EqualTo,
                  compValue: abiCoder.encode(["uint256"], [123]),
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Correct param + correct ether value
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            123,
            iface.encodeFunctionData(fn, [42]),
            0,
          ),
      ).to.not.be.reverted;

      // Wrong param value
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            123,
            iface.encodeFunctionData(fn, [99]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);

      // Wrong ether value
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            999,
            iface.encodeFunctionData(fn, [42]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);
    });
  });

  describe("consumption propagation", () => {
    it("accumulates consumptions from multiple children in AND operator", async () => {
      const iface = new Interface(["function fn(uint256,uint256)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupTestContract);

      const allowanceKey = hexlify(randomBytes(32));
      // Set up allowance of 100
      await roles.setAllowance(allowanceKey, 100, 0, 0, 0, 0);

      // Top-level AND combining two structural checks on the same payload
      // Child 1: Matches(arg0) -> WithinAllowance
      // Child 2: Matches(arg1) -> WithinAllowance
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
        flattenCondition({
          paramType: Encoding.None, // Top-level AND must be None
          operator: Operator.And,
          children: [
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.WithinAllowance,
                  compValue: allowanceKey,
                },
                {
                  paramType: Encoding.Static,
                  operator: Operator.Pass,
                },
              ],
            },
            {
              paramType: Encoding.AbiEncoded,
              operator: Operator.Matches,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.Pass,
                },
                {
                  paramType: Encoding.Static,
                  operator: Operator.WithinAllowance,
                  compValue: allowanceKey,
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Execute transaction with [30, 20].
      // Child 1 (Matches) consumes 30.
      // Child 2 (Matches) consumes 20.
      // Total consumption: 50.
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [30, 20]),
            0,
          ),
      ).to.not.be.reverted;

      // Verify balance: 100 - 50 = 50
      const { balance } = await roles.accruedAllowance(allowanceKey);
      expect(balance).to.equal(50);

      // Try to consume 30 + 30 = 60.
      // Available: 50.
      // Should fail.
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [30, 30]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.AllowanceExceeded, allowanceKey);
    });
  });
});
