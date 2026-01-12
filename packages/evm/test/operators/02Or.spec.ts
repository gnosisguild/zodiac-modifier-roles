import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder, Interface, ZeroHash } from "ethers";

import { setupFallbacker } from "../setup";
import {
  Encoding,
  Operator,
  ExecutionOptions,
  ConditionViolationStatus,
  flattenCondition,
} from "../utils";

/**
 * Tests for Operator.Or handler in ConditionLogic.
 *
 * This test suite verifies the execution logic of the OR operator, focusing on:
 * 1. Short-circuiting behavior (boolean logic).
 * 2. Correct payload routing for variant vs non-variant conditions.
 * 3. Isolation of side-effects (consumptions) to the successful branch.
 *
 * Test Structure:
 * - Operator - Or
 *   - boolean logic
 *     - passes when first child passes
 *     - passes when second child passes after first fails
 *     - fails with OrViolation when all children fail
 *   - payload routing
 *     - passes same payload to structural children when non-variant
 *     - passes individual child payloads when variant
 *     - passes empty payload to non-structural children
 *   - consumption handling
 *     - returns consumptions only from the passing branch
 */

const abiCoder = AbiCoder.defaultAbiCoder();

describe("Operator - Or", () => {
  describe("boolean logic", () => {
    const iface = new Interface(["function fn(uint256)"]);
    const fn = iface.getFunction("fn")!;

    it("passes when first child passes", async () => {
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupFallbacker);

      // Or: EqualTo(10) OR EqualTo(20)
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
              operator: Operator.Or,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: abiCoder.encode(["uint256"], [10]),
                },
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: abiCoder.encode(["uint256"], [20]),
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // 10 matches first child - passes immediately
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [10]),
            0,
          ),
      ).to.not.be.reverted;
    });

    it("passes when second child passes after first fails", async () => {
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupFallbacker);

      // Or: EqualTo(10) OR EqualTo(20)
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
              operator: Operator.Or,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: abiCoder.encode(["uint256"], [10]),
                },
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: abiCoder.encode(["uint256"], [20]),
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // 20 fails first child, passes second child
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [20]),
            0,
          ),
      ).to.not.be.reverted;
    });

    it("fails with OrViolation when all children fail", async () => {
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupFallbacker);

      // Or: EqualTo(10) OR EqualTo(20)
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
              operator: Operator.Or,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: abiCoder.encode(["uint256"], [10]),
                },
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: abiCoder.encode(["uint256"], [20]),
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // 99 fails all children
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [99]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.OrViolation, ZeroHash);
    });
  });

  describe("payload routing", () => {
    it("passes same payload to structural children when non-variant", async () => {
      const iface = new Interface(["function fn(uint256)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupFallbacker);

      // Both children check the same parameter (non-variant: same payload to all)
      // Or: LessThan(10) OR GreaterThan(100)
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
              operator: Operator.Or,
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.LessThan,
                  compValue: abiCoder.encode(["uint256"], [10]),
                },
                {
                  paramType: Encoding.Static,
                  operator: Operator.GreaterThan,
                  compValue: abiCoder.encode(["uint256"], [100]),
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // 5 passes first child (<10)
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [5]),
            0,
          ),
      ).to.not.be.reverted;

      // 150 passes second child (>100)
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [150]),
            0,
          ),
      ).to.not.be.reverted;

      // 50 fails both (not <10 and not >100)
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [50]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.OrViolation, ZeroHash);
    });

    it("passes individual child payloads when variant", async () => {
      const iface = new Interface(["function fn(bytes)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupFallbacker);

      // Or has two variant children that interpret the bytes param differently:
      // - Child 1: AbiEncoded with one Dynamic (checks bytes == 0xaabbccdd)
      // - Child 2: AbiEncoded with two Dynamics (checks first == 0x11111111)
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
              operator: Operator.Or,
              children: [
                // Child 1: interpret as (bytes)
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
                // Child 2: interpret as (bytes, bytes)
                {
                  paramType: Encoding.AbiEncoded,
                  operator: Operator.Matches,
                  compValue: "0x0000",
                  children: [
                    {
                      paramType: Encoding.Dynamic,
                      operator: Operator.EqualTo,
                      compValue: abiCoder.encode(["bytes"], ["0x11111111"]),
                    },
                    {
                      paramType: Encoding.Dynamic,
                      operator: Operator.Pass,
                    },
                  ],
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Matches child 1: single bytes = 0xaabbccdd
      const matchChild1 = abiCoder.encode(["bytes"], ["0xaabbccdd"]);
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [matchChild1]),
            0,
          ),
      ).to.not.be.reverted;

      // Matches child 2: two bytes where first = 0x11111111
      const matchChild2 = abiCoder.encode(
        ["bytes", "bytes"],
        ["0x11111111", "0xffffffff"],
      );
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [matchChild2]),
            0,
          ),
      ).to.not.be.reverted;

      // Matches neither
      const matchNeither = abiCoder.encode(["bytes"], ["0xdeadbeef"]);
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [matchNeither]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.OrViolation, ZeroHash);
    });

    it("passes empty payload to non-structural children", async () => {
      const iface = new Interface(["function fn(uint256)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupFallbacker);

      // Or with: structural child (checks param) OR non-structural (checks ether value)
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
              operator: Operator.Or,
              children: [
                // Structural: param must equal 42
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: abiCoder.encode(["uint256"], [42]),
                },
                // Non-structural: ether value must equal 123
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

      // Correct param, any ether - passes via first child
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [42]),
            0,
          ),
      ).to.not.be.reverted;

      // Wrong param, correct ether - passes via second child
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            123,
            iface.encodeFunctionData(fn, [99]),
            0,
          ),
      ).to.not.be.reverted;

      // Wrong param, wrong ether - fails both
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            999,
            iface.encodeFunctionData(fn, [99]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.OrViolation, ZeroHash);
    });
  });

  describe("consumption handling", () => {
    it("returns consumptions only from the passing branch", async () => {
      const iface = new Interface(["function fn(uint256)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupFallbacker);

      const allowanceKeyA =
        "0x000000000000000000000000000000000000000000000000000000000000000a";
      const allowanceKeyB =
        "0x000000000000000000000000000000000000000000000000000000000000000b";

      // Set up two allowances of 100 each
      await roles.setAllowance(allowanceKeyA, 100, 0, 0, 0, 0);
      await roles.setAllowance(allowanceKeyB, 100, 0, 0, 0, 0);

      // Or with two branches, each consuming from different allowance
      // Child 1: value < 50 AND consume from allowanceA
      // Child 2: value >= 50 AND consume from allowanceB
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
              operator: Operator.Or,
              children: [
                {
                  paramType: Encoding.None,
                  operator: Operator.And,
                  children: [
                    {
                      paramType: Encoding.Static,
                      operator: Operator.LessThan,
                      compValue: abiCoder.encode(["uint256"], [50]),
                    },
                    {
                      paramType: Encoding.Static,
                      operator: Operator.WithinAllowance,
                      compValue: allowanceKeyA,
                    },
                  ],
                },
                {
                  paramType: Encoding.None,
                  operator: Operator.And,
                  children: [
                    {
                      paramType: Encoding.Static,
                      operator: Operator.GreaterThan,
                      compValue: abiCoder.encode(["uint256"], [49]),
                    },
                    {
                      paramType: Encoding.Static,
                      operator: Operator.WithinAllowance,
                      compValue: allowanceKeyB,
                    },
                  ],
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Call with value 30 - takes first branch, consumes from allowanceA
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [30]),
            0,
          ),
      ).to.not.be.reverted;

      // Verify only allowanceA was consumed
      const { balance: balanceA } = await roles.accruedAllowance(allowanceKeyA);
      const { balance: balanceB } = await roles.accruedAllowance(allowanceKeyB);
      expect(balanceA).to.equal(70); // 100 - 30
      expect(balanceB).to.equal(100); // unchanged

      // Call with value 60 - takes second branch, consumes from allowanceB
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [60]),
            0,
          ),
      ).to.not.be.reverted;

      // Verify only allowanceB was consumed this time
      const { balance: balanceA2 } =
        await roles.accruedAllowance(allowanceKeyA);
      const { balance: balanceB2 } =
        await roles.accruedAllowance(allowanceKeyB);
      expect(balanceA2).to.equal(70); // unchanged
      expect(balanceB2).to.equal(40); // 100 - 60
    });

    it("rolls back consumptions if a branch fails after consumption", async () => {
      const iface = new Interface(["function fn(uint256)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupFallbacker);

      const allowanceKeyA =
        "0x000000000000000000000000000000000000000000000000000000000000000a";
      const allowanceKeyB =
        "0x000000000000000000000000000000000000000000000000000000000000000b";

      await roles.setAllowance(allowanceKeyA, 100, 0, 0, 0, 0);
      await roles.setAllowance(allowanceKeyB, 100, 0, 0, 0, 0);

      // OR structure:
      // Branch 1: Consume 10 from A AND Fail (value > 999) -> Should rollback A
      // Branch 2: Consume 10 from B AND Pass (value > 0) -> Should commit B
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
              operator: Operator.Or,
              children: [
                {
                  paramType: Encoding.None,
                  operator: Operator.And,
                  children: [
                    {
                      paramType: Encoding.Static,
                      operator: Operator.WithinAllowance,
                      compValue: allowanceKeyA,
                    },
                    {
                      paramType: Encoding.Static,
                      operator: Operator.GreaterThan,
                      compValue: abiCoder.encode(["uint256"], [999]),
                    },
                  ],
                },
                {
                  paramType: Encoding.None,
                  operator: Operator.And,
                  children: [
                    {
                      paramType: Encoding.Static,
                      operator: Operator.WithinAllowance,
                      compValue: allowanceKeyB,
                    },
                    {
                      paramType: Encoding.Static,
                      operator: Operator.GreaterThan,
                      compValue: abiCoder.encode(["uint256"], [0]),
                    },
                  ],
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // Call with value 10
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [10]),
            0,
          ),
      ).to.not.be.reverted;

      // Allowance A should be untouched (rolled back)
      const { balance: balanceA } = await roles.accruedAllowance(allowanceKeyA);
      expect(balanceA).to.equal(100);

      // Allowance B should be consumed
      const { balance: balanceB } = await roles.accruedAllowance(allowanceKeyB);
      expect(balanceB).to.equal(90);
    });
  });
});
