import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder, Interface, solidityPacked, ZeroHash } from "ethers";

import { setupFallbacker } from "../setup";
import {
  Encoding,
  Operator,
  ExecutionOptions,
  ConditionViolationStatus,
  flattenCondition,
} from "../utils";

const abiCoder = AbiCoder.defaultAbiCoder();

// compValue layout: 2 bytes shift + 1 byte size
const encodeCompValue = (shift: number, size: number) =>
  solidityPacked(["uint16", "uint8"], [shift, size]);

describe("Operator - Slice", () => {
  describe("extraction", () => {
    it("extracts 2-byte shift from compValue", async () => {
      const iface = new Interface(["function fn(bytes)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupFallbacker);

      // Slice 4 bytes at shift 4 (skip first 4 bytes)
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Dynamic,
              operator: Operator.Slice,
              compValue: encodeCompValue(4, 4), // shift=4, size=4
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: abiCoder.encode(["uint256"], [0xdeadbeef]),
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // bytes: [4 bytes prefix][0xdeadbeef][suffix]
      // Slice extracts bytes 4-7 which should equal 0xdeadbeef
      const correctPayload = "0x00000000deadbeef00000000";
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [correctPayload]),
            0,
          ),
      ).to.not.be.reverted;

      // Wrong value at the slice position
      const wrongPayload = "0x00000000cafebabe00000000";
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [wrongPayload]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);

      // Value at wrong position (shift 0 instead of 4) - fails
      const wrongPositionPayload = "0xdeadbeef0000000000000000";
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [wrongPositionPayload]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);
    });

    it("extracts 1-byte size from compValue (size 1)", async () => {
      const iface = new Interface(["function fn(bytes)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupFallbacker);

      // Slice 1 byte at shift 0
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Dynamic,
              operator: Operator.Slice,
              compValue: encodeCompValue(0, 1), // shift=0, size=1
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  // Single byte 0xab right-aligned to 32 bytes
                  compValue: abiCoder.encode(["uint256"], [0xab]),
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // bytes starting with 0xab - passes
      const correctPayload = "0xab00000000000000";
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [correctPayload]),
            0,
          ),
      ).to.not.be.reverted;

      // bytes starting with 0xcd - fails
      const wrongPayload = "0xcd00000000000000";
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [wrongPayload]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);
    });

    it("extracts 1-byte size from compValue (size 32)", async () => {
      const iface = new Interface(["function fn(bytes)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupFallbacker);

      // Slice 32 bytes at shift 0 (full word)
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Dynamic,
              operator: Operator.Slice,
              compValue: encodeCompValue(0, 32), // shift=0, size=32
              children: [
                {
                  paramType: Encoding.Static,
                  operator: Operator.EqualTo,
                  compValue: abiCoder.encode(["uint256"], [12345]),
                },
              ],
            },
          ],
        }),
        ExecutionOptions.Both,
      );

      // 32 bytes encoding 12345 - passes
      const correctPayload = abiCoder.encode(["uint256"], [12345]);
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [correctPayload]),
            0,
          ),
      ).to.not.be.reverted;

      // 32 bytes encoding different value - fails
      const wrongPayload = abiCoder.encode(["uint256"], [12346]);
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [wrongPayload]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterNotAllowed, ZeroHash);
    });
  });

  describe("propagation", () => {
    it("propagates result from child", async () => {
      const iface = new Interface(["function fn(bytes)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupFallbacker);

      // Slice 4 bytes, child checks GreaterThan 100
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Dynamic,
              operator: Operator.Slice,
              compValue: encodeCompValue(0, 4), // shift=0, size=4
              children: [
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

      // Value 101 > 100 - child passes, Slice propagates success
      const passPayload = "0x00000065"; // 101 in 4 bytes
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [passPayload]),
            0,
          ),
      ).to.not.be.reverted;

      // Value 100 not > 100 - child fails with ParameterLessThanAllowed, Slice propagates
      const failPayload = "0x00000064"; // 100 in 4 bytes
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [failPayload]),
            0,
          ),
      )
        .to.be.revertedWithCustomError(roles, "ConditionViolation")
        .withArgs(ConditionViolationStatus.ParameterLessThanAllowed, ZeroHash);
    });

    it("propagates consumption from child", async () => {
      const iface = new Interface(["function fn(bytes)"]);
      const fn = iface.getFunction("fn")!;
      const { roles, member, testContractAddress, roleKey } =
        await loadFixture(setupFallbacker);

      const allowanceKey =
        "0x000000000000000000000000000000000000000000000000000000000000abcd";

      // Set up allowance of 100
      await roles.setAllowance(allowanceKey, 100, 0, 0, 0, 0);

      // Slice 32 bytes, child consumes via WithinAllowance
      await roles.allowFunction(
        roleKey,
        testContractAddress,
        fn.selector,
        flattenCondition({
          paramType: Encoding.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: Encoding.Dynamic,
              operator: Operator.Slice,
              compValue: encodeCompValue(0, 32), // shift=0, size=32
              children: [
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

      // Consume 30 from sliced value
      const payload30 = abiCoder.encode(["uint256"], [30]);
      await expect(
        roles
          .connect(member)
          .execTransactionFromModule(
            testContractAddress,
            0,
            iface.encodeFunctionData(fn, [payload30]),
            0,
          ),
      ).to.not.be.reverted;

      // Consumption propagated through Slice - remaining is 70
      const { balance } = await roles.accruedAllowance(allowanceKey);
      expect(balance).to.equal(70);
    });
  });
});
